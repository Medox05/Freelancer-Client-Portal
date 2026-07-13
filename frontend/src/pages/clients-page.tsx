import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import Modal from "../components/ui/modal";
import {
  createClient,
  deleteClient,
  getClients,
  resendInvitation,
  updateClient,
} from "../services/client-service";

type ClientItem = {
  id: number;
  user_id?: number | null;
  created_by?: number | null;
  name: string;
  email: string;
  company?: string | null;
  phone?: string | null;
  invitation_status?: "pending" | "accepted";
  user?: {
    id: number;
    name: string;
    email: string;
    invitation_token?: string | null;
    invitation_expires_at?: string | null;
    invitation_accepted_at?: string | null;
  } | null;
};

type FormState = {
  name: string;
  email: string;
  company: string;
  phone: string;
};

const emptyForm: FormState = {
  name: "",
  email: "",
  company: "",
  phone: "",
};

export default function ClientsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClientItem | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm);

  const { data: clients = [], isLoading } = useQuery<ClientItem[]>({
    queryKey: ["clients"],
    queryFn: getClients,
    refetchInterval: 5000, // 5s
  });

  const filteredClients = useMemo(() => {
    const term = search.toLowerCase().trim();

    if (!term) return clients;

    return clients.filter((client) => {
      return (
        client.name.toLowerCase().includes(term) ||
        client.email.toLowerCase().includes(term) ||
        (client.company || "").toLowerCase().includes(term) ||
        (client.phone || "").toLowerCase().includes(term)
      );
    });
  }, [clients, search]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingClient(null);
    setError("");
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const startEdit = (client: ClientItem) => {
    setEditingClient(client);
    setError("");
    setForm({
      name: client.name || "",
      email: client.email || "",
      company: client.company || "",
      phone: client.phone || "",
    });
    setModalOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      closeModal();
      toast.success("Client added successfully");
    },
    onError: (err: any) => {
      const errors = err?.response?.data?.errors;
      if (errors?.name?.[0]) return setError(errors.name[0]);
      if (errors?.email?.[0]) return setError(errors.email[0]);
      if (errors?.company?.[0]) return setError(errors.company[0]);
      if (errors?.phone?.[0]) return setError(errors.phone[0]);
      setError(err?.response?.data?.message || "Failed to add client");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: FormState;
    }) => updateClient(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      closeModal();
      toast.success("Client updated successfully");
    },
    onError: (err: any) => {
      const errors = err?.response?.data?.errors;
      if (errors?.name?.[0]) return setError(errors.name[0]);
      if (errors?.email?.[0]) return setError(errors.email[0]);
      if (errors?.company?.[0]) return setError(errors.company[0]);
      if (errors?.phone?.[0]) return setError(errors.phone[0]);
      setError(err?.response?.data?.message || "Failed to update client");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setDeleteTarget(null);
      toast.success("Client deleted successfully");
    },
    onError: () => {
      setDeleteTarget(null);
      toast.error("Failed to delete client");
    },
  });

  const resendMutation = useMutation({
    mutationFn: resendInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Invitation resent successfully");
    },
    onError: () => {
      toast.error("Failed to resend invitation");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      company: form.company.trim(),
      phone: form.phone.trim(),
    };

    if (editingClient) {
      updateMutation.mutate({
        id: editingClient.id,
        payload,
      });
    } else {
      createMutation.mutate(payload);
    }
  };

  const getInvitationStatus = (client: ClientItem) => {
    if (!client.user) return "No account";

    if (!client.user.invitation_accepted_at) {
      return "Invitation pending";
    }

    return "Invitation accepted";
  };

  const getInvitationClass = (client: ClientItem) => {
    if (!client.user) {
      return "border border-slate-400 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300";
    }

    if (!client.user.invitation_accepted_at) {
      return "border border-amber-500 bg-amber-100 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300";
    }

    return "border border-emerald-500 bg-emerald-100 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-bold">Clients</h2>
          <p className="text-slate-500 dark:text-slate-400">
            Manage your clients and invitation flow.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="cursor-pointer inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:opacity-90 dark:bg-white dark:text-slate-900"
        >
          <Plus size={18} />
          Add Client
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-100 p-3 dark:bg-slate-800">
              <Users size={22} />
            </div>
            <div>
              <h3 className="text-2xl font-semibold">Client List</h3>
              <p className="text-slate-500 dark:text-slate-400">
                All your clients in one place.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients..."
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-slate-900 outline-none placeholder:text-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 text-slate-500 dark:text-slate-400">
            Loading clients...
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="p-6 text-slate-500 dark:text-slate-400">
            No clients found.
          </div>
        ) : (
          <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:from-slate-900 dark:to-slate-800/70"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="truncate text-xl font-semibold" title={client.name}>
                      {client.name}
                    </h4>
                    <div className="mt-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <Mail size={14} />
                      <span className="truncate" title={client.email}>
                        {client.email}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${getInvitationClass(
                      client
                    )}`}
                  >
                    {getInvitationStatus(client)}
                  </span>
                </div>

                <div className="mt-5 space-y-2 rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-800/60">
                  <p>
                    <span className="font-medium">Company:</span>{" "}
                    {client.company || "—"}
                  </p>
                  <p>
                    <span className="font-medium">Phone:</span>{" "}
                    {client.phone || "—"}
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    onClick={() => startEdit(client)}
                    className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-blue-600 bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-200 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
                  >
                    <Pencil size={15} />
                    Edit
                  </button>

                  {client.user && !client.user.invitation_accepted_at && (
                    <button
                      onClick={() => resendMutation.mutate(client.id)}
                      disabled={resendMutation.isPending}
                      className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-amber-600 bg-amber-100 px-3 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-200 disabled:opacity-60 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
                    >
                      <RefreshCw size={15} />
                      Resend invitation
                    </button>
                  )}

                  <button
                    onClick={() => setDeleteTarget(client)}
                    className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-red-600 bg-red-100 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-200 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
      >
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {editingClient ? "Edit Client" : "Add Client"}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {editingClient
              ? "Update client information."
              : "Create a new client and send an invitation."}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm text-slate-600 dark:text-slate-300">
              Name *
            </label>
            <input
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              } required
              placeholder="Client Name"
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-600 dark:text-slate-300">
              Email *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
              required
              placeholder="client@email.com"
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-600 dark:text-slate-300">
              Company
            </label>
            <input
              value={form.company}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, company: e.target.value }))
              }
              placeholder="Company Name"
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-600 dark:text-slate-300">
              Phone
            </label>
            <input
              value={form.phone}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, phone: e.target.value }))
              }
              placeholder="Phone Number"
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-white"
            />
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="cursor-pointer w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-slate-900"
          >
            {editingClient
              ? updateMutation.isPending
                ? "Updating..."
                : "Update Client"
              : createMutation.isPending
              ? "Creating..."
              : "Add Client"}
          </button>
        </form>
      </Modal>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold">Confirm Delete</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  You are about to delete this client.
                </p>
              </div>

              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
              <p className="font-medium">{deleteTarget.name}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {deleteTarget.email}
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="cursor-pointer rounded-2xl border border-slate-300 px-4 py-2.5 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="cursor-pointer rounded-2xl bg-red-600 px-4 py-2.5 font-medium text-white transition hover:bg-red-500 disabled:opacity-60"
              >
                {deleteMutation.isPending ? "Deleting..." : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}