<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice {{ $invoice->invoice_number }}</title>
    <style>
        body {
            font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
            color: #333;
            margin: 0;
            padding: 20px;
        }
        .invoice-box {
            max-width: 800px;
            margin: auto;
            padding: 30px;
            border: 1px solid #eee;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
            font-size: 16px;
            line-height: 24px;
        }
        .header {
            display: table;
            width: 100%;
            margin-bottom: 40px;
        }
        .header-col {
            display: table-cell;
            vertical-align: top;
        }
        .text-right {
            text-align: right;
        }
        .title {
            font-size: 45px;
            line-height: 45px;
            color: #333;
            font-weight: bold;
        }
        table {
            width: 100%;
            line-height: inherit;
            text-align: left;
            border-collapse: collapse;
        }
        table td {
            padding: 10px;
            vertical-align: top;
        }
        table tr.heading td {
            background: #eee;
            border-bottom: 1px solid #ddd;
            font-weight: bold;
        }
        table tr.item td {
            border-bottom: 1px solid #eee;
        }
        table tr.item.last td {
            border-bottom: none;
        }
        table tr.total td:nth-child(2) {
            border-top: 2px solid #eee;
            font-weight: bold;
            font-size: 18px;
        }
        .mt-4 { margin-top: 40px; }
        .text-muted { color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="invoice-box">
        <div class="header">
            <div class="header-col">
                <div class="title">INVOICE</div>
                <div class="mt-4">
                    <strong>Invoice #:</strong> {{ $invoice->invoice_number }}<br>
                    <strong>Created:</strong> {{ $invoice->created_at->format('M d, Y') }}<br>
                    <strong>Due:</strong> {{ \Carbon\Carbon::parse($invoice->due_date)->format('M d, Y') }}<br>
                    <strong>Status:</strong> <span style="text-transform: uppercase; color: {{ $invoice->status == 'paid' ? 'green' : 'red' }};">{{ $invoice->status }}</span>
                </div>
            </div>
            <div class="header-col text-right">
                <h2>{{ $freelancer->name }}</h2>
                {{ $freelancer->email }}<br>
                Freelancer
            </div>
        </div>

        <div class="header mt-4">
            <div class="header-col">
                <strong>Bill To:</strong><br>
                {{ $client->name }}<br>
                {{ $client->email }}
            </div>
            <div class="header-col text-right">
                <strong>Project:</strong><br>
                {{ $project->title }}
            </div>
        </div>

        <table class="mt-4">
            <tr class="heading">
                <td>Description</td>
                <td class="text-right">Amount</td>
            </tr>

            <tr class="item last">
                <td>{{ $project->title }} - Project Milestone/Service</td>
                <td class="text-right">${{ number_format($invoice->amount, 2) }}</td>
            </tr>

            <tr class="total">
                <td></td>
                <td class="text-right">Total: ${{ number_format($invoice->amount, 2) }}</td>
            </tr>
        </table>

        @if($invoice->notes)
        <div class="mt-4 text-muted">
            <strong>Notes:</strong><br>
            {{ $invoice->notes }}
        </div>
        @endif
    </div>
</body>
</html>
