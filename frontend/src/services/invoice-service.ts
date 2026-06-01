import api from "../lib/axios";

export type InvoiceItem = {
  id: number;
  project_id: number;
  invoice_number: string;
  amount: string;
  status: "pending" | "paid" | "overdue";
  due_date: string;
  notes?: string | null;
  created_at: string;
};

export async function getInvoices(projectId: number): Promise<InvoiceItem[]> {
  const { data } = await api.get(`/projects/${projectId}/invoices`);
  return data;
}

export async function createInvoice(
  projectId: number,
  payload: { amount: string; due_date: string; notes?: string }
): Promise<InvoiceItem> {
  const { data } = await api.post(`/projects/${projectId}/invoices`, payload);
  return data;
}

export async function updateInvoiceStatus(
  projectId: number,
  invoiceId: number,
  status: "paid" | "pending" | "overdue"
): Promise<InvoiceItem> {
  const { data } = await api.put(
    `/projects/${projectId}/invoices/${invoiceId}/status`,
    { status }
  );
  return data;
}

export async function downloadInvoice(
  projectId: number,
  invoiceId: number,
  invoiceNumber: string
) {
  const res = await api.get(
    `/projects/${projectId}/invoices/${invoiceId}/download`,
    { responseType: "blob" }
  );

  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `invoice-${invoiceNumber}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
}

export async function deleteInvoice(
  projectId: number,
  invoiceId: number
): Promise<{ message: string }> {
  const { data } = await api.delete(
    `/projects/${projectId}/invoices/${invoiceId}`
  );
  return data;
}

export async function createStripeSession(
  projectId: number,
  invoiceId: number
): Promise<{ id: string; url: string }> {
  const { data } = await api.post(
    `/projects/${projectId}/invoices/${invoiceId}/stripe-session`
  );
  return data;
}
