import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, Shield, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import api from "../lib/axios";

type InvoiceItem = {
  id: number;
  invoice_number: string;
  amount: string;
  notes?: string | null;
  due_date: string;
};

type ProjectItem = {
  id: number;
  title: string;
  budget: string | number;
};

export default function MockStripeCheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const sessionId = searchParams.get("session_id");
  const projectId = Number(searchParams.get("project_id"));
  const invoiceId = Number(searchParams.get("invoice_id"));

  const [cardNumber, setCardNumber] = useState("4242 •••• •••• 4242");
  const [expiry, setExpiry] = useState("12 / 29");
  const [cvc, setCvc] = useState("•••");
  const [name, setName] = useState("Test User");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // Fetch project and invoice details for display
  const { data: project } = useQuery<ProjectItem>({
    queryKey: ["client-project", projectId],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}`);
      return data;
    },
    enabled: !!projectId,
  });

  const { data: invoices = [] } = useQuery<InvoiceItem[]>({
    queryKey: ["invoices", projectId],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/invoices`);
      return data;
    },
    enabled: !!projectId,
  });

  const invoice = invoices.find((inv) => inv.id === invoiceId);

  useEffect(() => {
    if (!sessionId || !projectId || !invoiceId) {
      toast.error("Invalid checkout session.");
      navigate("/client-dashboard");
    }
  }, [sessionId, projectId, invoiceId, navigate]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Simulate Stripe processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Call our mock webhook
      await api.post("/webhooks/stripe-mock", {
        session_id: sessionId,
      });

      setIsProcessing(false);
      setIsDone(true);

      // Brief pause to show success checkmark
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Redirect to invoice success page
      navigate(`/client-projects/${projectId}?tab=invoices&payment=success`);
    } catch (err: any) {
      setIsProcessing(false);
      toast.error(err?.response?.data?.message || "Mock payment failed.");
    }
  };

  const amount = invoice ? Number(invoice.amount) : 0;

  if (isDone) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400 animate-bounce">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Payment Successful</h2>
          <p className="text-slate-500 dark:text-slate-400">Redirecting you back to your portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row">
      {/* Left panel (Dark Stripe style) */}
      <div className="w-full md:w-1/2 bg-slate-900 text-white p-8 md:p-16 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
        <div className="space-y-8">
          <button
            onClick={() => navigate(`/client-projects/${projectId}?tab=invoices&payment=cancel`)}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition text-sm cursor-pointer"
          >
            <ArrowLeft size={16} />
            Back to portal
          </button>

          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-indigo-200">
              MhFlow Checkout
            </span>
            <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-300">
              Demo Sandbox
            </span>
          </div>

          <div className="space-y-2">
            <p className="text-slate-400 font-medium text-sm">Pay MhFlow Portal</p>
            {invoice && (
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                ${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </h1>
            )}
          </div>

          <div className="border-t border-slate-800 pt-6 space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Invoice Number</span>
              <span className="font-mono text-slate-200">{invoice?.invoice_number || "INV-XXXXXX"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Project</span>
              <span className="text-slate-200">{project?.title || "Loading..."}</span>
            </div>
            {invoice?.notes && (
              <div className="flex justify-between text-sm gap-4">
                <span className="text-slate-400 shrink-0">Notes</span>
                <span className="text-slate-300 text-right line-clamp-2">{invoice.notes}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 md:mt-0 flex items-center gap-2 text-slate-500 text-xs">
          <Shield size={14} />
          <span>Powered by Stripe Sandbox Integration</span>
        </div>
      </div>

      {/* Right panel (Form payment) */}
      <div className="w-full md:w-1/2 p-8 md:p-16 flex items-center justify-center">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Payment Details</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Complete your payment securely. Any test card works.
            </p>
          </div>

          <form onSubmit={handlePay} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Card Details
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4242 4242 4242 4242"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 pl-11 pr-4 py-3 text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-sm"
                  />
                  <CreditCard className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Expiration
                  </label>
                  <input
                    type="text"
                    required
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    placeholder="MM / YY"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    CVC
                  </label>
                  <input
                    type="text"
                    required
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    placeholder="123"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-sm"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 py-3.5 font-bold text-white shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-base"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Processing secure payment...
                </>
              ) : (
                `Pay $${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
              )}
            </button>
          </form>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Shield size={14} className="text-green-600 dark:text-green-400" />
            <span>Mock Stripe integration. No real card details are charged.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
