<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Project;
use App\Models\Client;
use App\Models\Notification;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Stripe\Stripe;
use Stripe\Checkout\Session as StripeSession;

class InvoiceController extends Controller
{
    public function index(Request $request, Project $project)
    {
        $user = $request->user();

        // Get Client associated with the logged-in user
        $client = Client::where('user_id', $user->id)->first();
        $isFreelancer = $project->user_id === $user->id;
        $isClient = $client && $project->client_id === $client->id;

        // Check if user has access to this project
        if (!$isFreelancer && !$isClient) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($project->invoices()->orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request, Project $project)
    {
        $user = $request->user();

        // Only Freelancer can create invoices
        if ($project->user_id !== $user->id) {
            return response()->json(['message' => 'Only the freelancer can create invoices for this project.'], 403);
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'due_date' => 'required|date',
            'notes' => 'nullable|string'
        ]);

        $invoiceNumber = 'INV-' . strtoupper(substr(uniqid(), -6));

        $invoice = $project->invoices()->create([
            'invoice_number' => $invoiceNumber,
            'amount' => $validated['amount'],
            'status' => 'pending',
            'due_date' => $validated['due_date'],
            'notes' => $validated['notes']
        ]);

        // Notify client (using their user_id, not client_id)
        $client = Client::find($project->client_id);
        if ($client && $client->user_id) {
            Notification::create([
                'user_id' => $client->user_id,
                'title' => 'New Invoice Received',
                'message' => "An invoice for \${$validated['amount']} has been generated for project: {$project->title}",
                'type' => 'invoice_created',
                'project_id' => $project->id,
            ]);
        }

        return response()->json($invoice, 201);
    }

    public function updateStatus(Request $request, Project $project, Invoice $invoice)
    {
        $user = $request->user();

        $client = Client::where('user_id', $user->id)->first();
        $isFreelancer = $project->user_id === $user->id;
        $isClient = $client && $project->client_id === $client->id;

        if (!$isFreelancer && !$isClient) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:pending,paid,overdue'
        ]);

        $invoice->update(['status' => $validated['status']]);

        // If client paid the invoice, notify the freelancer
        if ($validated['status'] === 'paid' && $isClient) {
            Notification::create([
                'user_id' => $project->user_id,
                'title' => 'Invoice Paid',
                'message' => "Client has marked invoice {$invoice->invoice_number} as paid for project: {$project->title}.",
                'type' => 'invoice_paid',
                'project_id' => $project->id,
            ]);
        }

        return response()->json($invoice);
    }

    public function download(Request $request, Project $project, Invoice $invoice)
    {
        $user = $request->user();

        $client = Client::where('user_id', $user->id)->first();
        $isFreelancer = $project->user_id === $user->id;
        $isClient = $client && $project->client_id === $client->id;

        if (!$isFreelancer && !$isClient) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $project->load(['user', 'client']);
        
        $data = [
            'invoice' => $invoice,
            'project' => $project,
            'freelancer' => $project->user,
            'client' => $project->client,
        ];

        $pdf = Pdf::loadView('invoices.pdf', $data);

        return $pdf->download("invoice-{$invoice->invoice_number}.pdf");
    }

    public function destroy(Request $request, Project $project, Invoice $invoice)
    {
        $user = $request->user();

        // Only Freelancer can delete invoices
        if ($project->user_id !== $user->id) {
            return response()->json(['message' => 'Only the freelancer can delete invoices.'], 403);
        }

        $invoice->delete();

        return response()->json(['message' => 'Invoice deleted successfully.']);
    }

    public function createCheckoutSession(Request $request, Project $project, Invoice $invoice)
    {
        $user = $request->user();

        // Get Client associated with the logged-in user
        $client = Client::where('user_id', $user->id)->first();
        if (!$client || $project->client_id !== $client->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($invoice->project_id !== $project->id) {
            return response()->json(['message' => 'Invoice not found in this project'], 404);
        }

        if ($invoice->status === 'paid') {
            return response()->json(['message' => 'Invoice is already paid'], 400);
        }

        $stripeSecret = config('services.stripe.secret') ?? env('STRIPE_SECRET');
        $isDummy = empty($stripeSecret) || str_contains($stripeSecret, '7t6b') || str_contains($stripeSecret, 'dummy');

        $frontendUrl = config('app.frontend_url') ?? env('FRONTEND_URL', 'http://localhost:5173');

        if ($isDummy) {
            $mockSessionId = 'mock_cs_' . bin2hex(random_bytes(16));

            $invoice->update([
                'stripe_session_id' => $mockSessionId,
            ]);

            return response()->json([
                'id' => $mockSessionId,
                'url' => $frontendUrl . "/mock-stripe-checkout?session_id=" . $mockSessionId . "&project_id=" . $project->id . "&invoice_id=" . $invoice->id,
                'is_mock' => true
            ]);
        }

        Stripe::setApiKey($stripeSecret);

        $amountInCents = intval(round($invoice->amount * 100));

        try {
            $frontendUrl = config('app.frontend_url') ?? env('FRONTEND_URL', 'http://localhost:5173');

            $session = StripeSession::create([
                'payment_method_types' => ['card'],
                'line_items' => [[
                    'price_data' => [
                        'currency' => 'usd',
                        'product_data' => [
                            'name' => "Invoice " . $invoice->invoice_number,
                            'description' => "Project: " . $project->title . ($invoice->notes ? " - " . $invoice->notes : ""),
                        ],
                        'unit_amount' => $amountInCents,
                    ],
                    'quantity' => 1,
                ]],
                'mode' => 'payment',
                'success_url' => $frontendUrl . "/client-projects/" . $project->id . "?tab=invoices&payment=success",
                'cancel_url' => $frontendUrl . "/client-projects/" . $project->id . "?tab=invoices&payment=cancel",
                'metadata' => [
                    'invoice_id' => $invoice->id,
                    'project_id' => $project->id,
                ]
            ]);

            // Save session details to the invoice
            $invoice->update([
                'stripe_session_id' => $session->id,
            ]);

            return response()->json([
                'id' => $session->id,
                'url' => $session->url,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Stripe error: ' . $e->getMessage()
            ], 500);
        }
    }

    public function handleWebhook(Request $request)
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $endpointSecret = config('services.stripe.webhook.secret') ?? env('STRIPE_WEBHOOK_SECRET');

        $stripeSecret = config('services.stripe.secret') ?? env('STRIPE_SECRET');
        Stripe::setApiKey($stripeSecret);

        $event = null;

        try {
            if ($endpointSecret && $sigHeader && !str_starts_with($endpointSecret, 'whsec_dummy')) {
                $event = \Stripe\Webhook::constructEvent(
                    $payload, $sigHeader, $endpointSecret
                );
            } else {
                $data = json_decode($payload, true);
                if (isset($data['type'])) {
                    $event = \Stripe\Event::constructFrom($data);
                }
            }
        } catch (\UnexpectedValueException $e) {
            return response()->json(['error' => 'Invalid payload: ' . $e->getMessage()], 400);
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            return response()->json(['error' => 'Invalid signature: ' . $e->getMessage()], 400);
        }

        if ($event && $event->type === 'checkout.session.completed') {
            $session = $event->data->object;

            $invoice = Invoice::where('stripe_session_id', $session->id)->first();

            if (!$invoice && isset($session->metadata->invoice_id)) {
                $invoice = Invoice::find($session->metadata->invoice_id);
            }

            if ($invoice) {
                $invoice->update([
                    'status' => 'paid',
                    'stripe_payment_intent_id' => $session->payment_intent ?? null,
                ]);

                $project = Project::find($invoice->project_id);
                if ($project) {
                    Notification::create([
                        'user_id' => $project->user_id,
                        'title' => 'Invoice Paid via Stripe',
                        'message' => "Client has successfully paid invoice {$invoice->invoice_number} (\${$invoice->amount}) for project: {$project->title}.",
                        'type' => 'invoice_paid',
                        'project_id' => $project->id,
                    ]);
                }
            }
        }

        return response()->json(['status' => 'success']);
    }

    public function handleMockPayment(Request $request)
    {
        $validated = $request->validate([
            'session_id' => 'required|string',
        ]);

        $invoice = Invoice::where('stripe_session_id', $validated['session_id'])->first();

        if ($invoice) {
            if ($invoice->status !== 'paid') {
                $invoice->update([
                    'status' => 'paid',
                    'stripe_payment_intent_id' => 'mock_pi_' . bin2hex(random_bytes(16)),
                ]);

                $project = Project::find($invoice->project_id);
                if ($project) {
                    Notification::create([
                        'user_id' => $project->user_id,
                        'title' => 'Invoice Paid via Stripe (Mock)',
                        'message' => "Client has successfully paid invoice {$invoice->invoice_number} (\${$invoice->amount}) for project: {$project->title}.",
                        'type' => 'invoice_paid',
                        'project_id' => $project->id,
                    ]);
                }
            }

            return response()->json(['status' => 'success']);
        }

        return response()->json(['message' => 'Invoice not found'], 404);
    }
}
