import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  Download,
  FileText,
  Plus,
  CheckCircle2,
  Clock,
  Loader2,
  X,
  Trash2,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import {
  getInvoices,
  createInvoice,
  downloadInvoice,
  deleteInvoice,
  createStripeSession,
} from "../../services/invoice-service";
import type { InvoiceItem } from "../../services/invoice-service";
import api from "../../lib/axios";
import DatePicker from "../ui/date-picker";

export default function ProjectInvoicesManager({
  projectId,
  defaultAmount,
}: {
  projectId: number;
  defaultAmount?: string | number;
}) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState(defaultAmount ? String(defaultAmount) : "");
  const [dateObj, setDateObj] = useState<Date | null>(null);
  const [notes, setNotes] = useState("");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InvoiceItem | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "success") {
      toast.success("Payment succeeded! Thank you.", { id: "payment-success" });
      searchParams.delete("payment");
      setSearchParams(searchParams, { replace: true });
    } else if (payment === "cancel") {
      toast.error("Payment was cancelled.", { id: "payment-cancel" });
      searchParams.delete("payment");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await api.get("/me");
      return data;
    },
    staleTime: 30000,
  });

  const isClient = me?.role === "client";

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices", projectId],
    queryFn: () => getInvoices(projectId),
    refetchInterval: 30000, // Poll invoices every 30 seconds for real-time feel
    staleTime: 15000,
  });

  const createMutation = useMutation({
    mutationFn: (payload: {
      amount: string;
      due_date: string;
      notes?: string;
    }) => createInvoice(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", projectId] });
      toast.success("Invoice created successfully.");
      setShowForm(false);
      setAmount(defaultAmount ? String(defaultAmount) : "");
      setDateObj(null);
      setNotes("");
    },
    onError: () => {
      toast.error("Failed to create invoice.");
    },
  });



  const deleteMutation = useMutation({
    mutationFn: (invoiceId: number) => deleteInvoice(projectId, invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", projectId] });
      toast.success("Invoice deleted successfully.");
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error("Failed to delete invoice.");
    },
  });

  const payMutation = useMutation({
    mutationFn: (invoiceId: number) => createStripeSession(projectId, invoiceId),
    onSuccess: (data) => {
      if (data?.url) {
        toast.info("Redirecting to secure Stripe Checkout...");
        window.location.href = data.url;
      } else {
        toast.error("Stripe Checkout URL not returned.");
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to initiate Stripe Checkout.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !dateObj) {
      toast.error("Please fill in all required fields.");
      return;
    }

    // Format dateObj to YYYY-MM-DD
    const localDate = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000);
    const formattedDate = localDate.toISOString().split("T")[0];

    createMutation.mutate({
      amount,
      due_date: formattedDate,
      notes,
    });
  };

  const handleDownload = async (invoice: InvoiceItem) => {
    try {
      setDownloadingId(invoice.id);
      await downloadInvoice(projectId, invoice.id, invoice.invoice_number);
    } catch (error) {
      toast.error("Failed to download PDF.");
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center text-slate-500 dark:text-slate-400">
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Invoices
        </h2>
        {!isClient && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            <Plus size={16} />
            Create Invoice
          </button>
        )}
      </div>

      {showForm && !isClient && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/50"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              New Invoice
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg p-1 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500"
                placeholder="e.g. 500.00"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Due Date
              </label>
              <DatePicker
                value={dateObj}
                onChange={setDateObj}
                placeholder="Select date"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500"
              placeholder="Any additional notes for the client..."
              rows={2}
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Invoice"
              )}
            </button>
          </div>
        </form>
      )}

      {invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center dark:border-slate-800">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <FileText size={24} />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-slate-900 dark:text-white">
            No invoices yet
          </h3>
          <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
            {isClient
              ? "Your freelancer hasn't generated any invoices for this project yet."
              : "You haven't created any invoices for this project yet."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        invoice.status === "paid"
                          ? "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400"
                          : "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400"
                      }`}
                    >
                      {invoice.status === "paid" ? (
                        <CheckCircle2 size={20} />
                      ) : (
                        <Clock size={20} />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {invoice.invoice_number}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Due: {new Date(invoice.due_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-slate-900 dark:text-white">
                      ${Number(invoice.amount).toLocaleString()}
                    </p>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${
                        invoice.status === "paid"
                          ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                          : "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400"
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                </div>

                {invoice.notes && (
                  <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                    {invoice.notes}
                  </p>
                )}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-5 dark:border-slate-800">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(invoice)}
                    disabled={downloadingId === invoice.id}
                    className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    {downloadingId === invoice.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Download size={16} />
                    )}
                    Download PDF
                  </button>

                  {!isClient && (
                    <button
                      onClick={() => setDeleteTarget(invoice)}
                      disabled={deleteMutation.isPending}
                      className="flex items-center justify-center p-2 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/30 transition cursor-pointer"
                      title="Delete Invoice"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                {invoice.status === "pending" && isClient && (
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => payMutation.mutate(invoice.id)}
                      disabled={payMutation.isPending}
                      className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-70 dark:bg-indigo-500/20 dark:text-indigo-400 dark:hover:bg-indigo-500/30 cursor-pointer"
                    >
                      {payMutation.isPending ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <CreditCard size={16} />
                          Pay with Card
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-200">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Confirm Delete</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  You are about to delete this invoice. This action cannot be undone.
                </p>
              </div>

              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-850">
              <p className="font-semibold text-slate-900 dark:text-white">{deleteTarget.invoice_number}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Amount: ${Number(deleteTarget.amount).toLocaleString()}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Due Date: {new Date(deleteTarget.due_date).toLocaleDateString()}
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="cursor-pointer rounded-2xl border border-slate-300 px-4 py-2.5 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 font-medium"
              >
                Cancel
              </button>

              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="cursor-pointer rounded-2xl bg-red-600 px-4 py-2.5 font-medium text-white transition hover:bg-red-500 disabled:opacity-60 flex items-center gap-2"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Yes, delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
