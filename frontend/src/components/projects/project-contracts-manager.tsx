import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Printer,
  Send,
  Lock,
  FileSignature,
  FileEdit,
  X,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../lib/axios";

type Contract = {
  id: number;
  project_id: number;
  title: string;
  content: string;
  status: "draft" | "sent" | "signed";
  signed_at: string | null;
  client_signature_name: string | null;
  signature_ip: string | null;
  created_at: string;
  updated_at: string;
};

type Props = {
  projectId: number;
};

const getDefaultTemplate = (projectName: string, freelancerName: string, clientName: string) => {
  return `### STANDARD FREELANCE SERVICES AGREEMENT

This Agreement is made and entered into as of the date of signing, by and between the following parties:

Freelancer (Service Provider): ${freelancerName || "[Freelancer Name]"}
Client (Recipient of Services): ${clientName || "[Client Name]"}

Project Reference: ${projectName || "[Project Name]"}

---

1. SCOPE OF SERVICES
The Freelancer agrees to perform development, design, and related professional services for the Project as detailed in the agreed project roadmap, milestones, and scope specifications. Any revisions or additional features requested outside of the original specifications will be subject to a separate fee and written amendment.

2. FEES & PAYMENT TERMS
* All fees shall be invoiced and paid according to the project milestones specified in the platform's Milestones workspace.
* Payment is due immediately upon the completion and submission of each milestone.
* Invoices must be paid in full before work on the subsequent milestone begins.
* The Freelancer reserves the right to suspend or terminate services if any payment is delayed.

3. INTELLECTUAL PROPERTY & OWNERSHIP
* Upon final, full payment of all outstanding project fees and milestones, the Freelancer hereby transfers and assigns all intellectual property rights, source code, design assets, and work products developed under this Agreement to the Client.
* Until full payment is received and cleared, all developed assets, code, designs, and materials remain the sole and exclusive intellectual property of the Freelancer.

4. TERM & TERMINATION
* Either party may terminate this Agreement at any time by providing at least seven (7) days of written notice to the other party.
* Upon termination, the Client shall immediately pay the Freelancer for all milestones completed and any work performed up to the date of termination.

5. CONFIDENTIALITY & NON-DISCLOSURE
Both parties agree to treat all business plans, code, designs, proprietary information, and project-related discussions as strictly confidential. Neither party shall disclose any such information to any third parties without prior written consent from the other party.

6. ENTIRE AGREEMENT
This Agreement constitutes the entire agreement between the parties and supersedes any prior written or oral agreements. By signing digitally, the parties accept and agree to all terms and conditions herein.`;
};

function formatDate(dateString?: string | null) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ProjectContractsManager({ projectId }: Props) {
  const queryClient = useQueryClient();
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // Signature states
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [signatureName, setSignatureName] = useState("");

  // Get current user details
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await api.get("/me");
      return data;
    },
    staleTime: 30000,
  });

  const isFreelancer = me?.role === "freelancer";

  // Fetch project details for templates
  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}`);
      return data;
    },
  });

  // Fetch contracts list
  const { data: contracts = [], isLoading } = useQuery<Contract[]>({
    queryKey: ["project-contracts", projectId],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/contracts`);
      return data;
    },
    refetchInterval: 4000, // Dynamic real-time sync every 4s
  });

  // Auto-select first contract if none is selected and we have contracts
  useEffect(() => {
    if (contracts.length > 0 && !selectedContract && !isCreating) {
      setSelectedContract(contracts[0]);
    }
  }, [contracts, selectedContract, isCreating]);

  // Sync selected contract details to view
  useEffect(() => {
    if (selectedContract) {
      // Find the fresh version in contracts list to keep state in sync
      const fresh = contracts.find((c) => c.id === selectedContract.id);
      if (fresh) {
        setSelectedContract(fresh);
      }
    }
  }, [contracts]);

  const createMutation = useMutation({
    mutationFn: async (payload: { title: string; content: string }) => {
      const { data } = await api.post(`/projects/${projectId}/contracts`, payload);
      return data;
    },
    onSuccess: (newContract) => {
      queryClient.setQueryData(["project-contracts", projectId], (old: Contract[] = []) => {
        return [newContract, ...old];
      });
      queryClient.invalidateQueries({ queryKey: ["project-contracts", projectId] });
      toast.success("Contract draft created successfully.");
      setIsCreating(false);
      setSelectedContract(newContract);
    },
    onError: () => {
      toast.error("Failed to create contract draft.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: number; title: string; content: string; status: "draft" | "sent" }) => {
      const { data } = await api.put(`/contracts/${payload.id}`, {
        title: payload.title,
        content: payload.content,
        status: payload.status,
      });
      return data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["project-contracts", projectId], (old: Contract[] = []) => {
        return old.map((c) => (c.id === updated.id ? updated : c));
      });
      queryClient.invalidateQueries({ queryKey: ["project-contracts", projectId] });
      toast.success(updated.status === "sent" ? "Contract sent to client successfully!" : "Contract updated successfully.");
      setIsEditing(false);
      setSelectedContract(updated);
    },
    onError: () => {
      toast.error("Failed to update contract.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete(`/contracts/${id}`);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData(["project-contracts", projectId], (old: Contract[] = []) => {
        return old.filter((c) => c.id !== id);
      });
      queryClient.invalidateQueries({ queryKey: ["project-contracts", projectId] });
      toast.success("Contract deleted successfully.");
      setSelectedContract(null);
    },
    onError: () => {
      toast.error("Failed to delete contract.");
    },
  });

  const signMutation = useMutation({
    mutationFn: async (payload: { id: number; client_signature_name: string }) => {
      const { data } = await api.post(`/contracts/${payload.id}/sign`, {
        client_signature_name: payload.client_signature_name,
      });
      return data;
    },
    onSuccess: (signed) => {
      queryClient.setQueryData(["project-contracts", projectId], (old: Contract[] = []) => {
        return old.map((c) => (c.id === signed.id ? signed : c));
      });
      queryClient.invalidateQueries({ queryKey: ["project-contracts", projectId] });
      toast.success("Contract signed successfully!");
      setSelectedContract(signed);
      setAcceptTerms(false);
      setSignatureName("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to sign contract.");
    },
  });

  const handleLoadTemplate = () => {
    if (!project) return;
    const freelancerName = project.user?.name || me?.name || "";
    const clientName = project.client?.name || "";
    setContent(getDefaultTemplate(project.title, freelancerName, clientName));
    setTitle(`Freelance Agreement - ${project.title}`);
  };

  const handleStartCreate = () => {
    setIsCreating(true);
    setIsEditing(false);
    setSelectedContract(null);
    setTitle("");
    setContent("");
  };

  const handleStartEdit = (contract: Contract) => {
    setIsEditing(true);
    setIsCreating(false);
    setTitle(contract.title);
    setContent(contract.content);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setIsEditing(false);
    if (contracts.length > 0) {
      setSelectedContract(contracts[0]);
    }
  };

  const handleSaveDraft = () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required.");
      return;
    }
    if (isCreating) {
      createMutation.mutate({ title, content });
    } else if (selectedContract) {
      updateMutation.mutate({
        id: selectedContract.id,
        title,
        content,
        status: "draft",
      });
    }
  };

  const handleSendToClient = () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required.");
      return;
    }
    if (isCreating) {
      // Create first, then send
      createMutation.mutate(
        { title, content },
        {
          onSuccess: (newContract) => {
            updateMutation.mutate({
              id: newContract.id,
              title: newContract.title,
              content: newContract.content,
              status: "sent",
            });
          },
        }
      );
    } else if (selectedContract) {
      updateMutation.mutate({
        id: selectedContract.id,
        title,
        content,
        status: "sent",
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this contract?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract) return;
    if (!acceptTerms) {
      toast.error("You must accept the terms of the agreement.");
      return;
    }
    if (!signatureName.trim()) {
      toast.error("Signature name is required.");
      return;
    }
    signMutation.mutate({
      id: selectedContract.id,
      client_signature_name: signatureName.trim(),
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: Contract["status"]) => {
    switch (status) {
      case "signed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300">
            <CheckCircle2 size={12} />
            Signed & Locked
          </span>
        );
      case "sent":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
            <Send size={12} />
            Sent to Client
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Clock size={12} />
            Draft
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center text-slate-500 dark:text-slate-400">
        <Clock className="animate-spin mr-2" size={20} />
        Loading contracts workspace...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header (hidden on print) */}
      <div className="no-print flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Contracts Builder</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Draft, review, and legally sign work agreements.
          </p>
        </div>

        {isFreelancer && !isCreating && !isEditing && (
          <button
            type="button"
            onClick={handleStartCreate}
            className="cursor-pointer inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            <Plus size={16} />
            New Contract
          </button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Left Column: Contracts List (hidden on print) */}
        <div className="no-print lg:col-span-1 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
            <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Documents
            </h4>

            {contracts.length === 0 && !isCreating ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-400 dark:border-slate-700">
                <FileText className="mx-auto mb-2 text-slate-300" size={32} />
                <p className="text-sm">No agreements prepared yet.</p>
                {isFreelancer && (
                  <button
                    type="button"
                    onClick={handleStartCreate}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Draft your first contract
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {contracts.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setIsCreating(false);
                      setIsEditing(false);
                      setSelectedContract(c);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition flex flex-col gap-2 ${
                      selectedContract?.id === c.id && !isCreating && !isEditing
                        ? "border-slate-900 bg-white shadow-sm dark:border-white dark:bg-slate-900"
                        : "border-transparent bg-transparent hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 w-full">
                      <p className="font-semibold text-sm line-clamp-1 text-slate-900 dark:text-white">
                        {c.title}
                      </p>
                    </div>

                    <div className="flex items-center justify-between w-full">
                      <span className="text-[11px] text-slate-400">
                        {formatDate(c.created_at).split(" at")[0]}
                      </span>
                      {getStatusBadge(c.status)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Workspace (takes full screen on print) */}
        <div className="lg:col-span-2">
          {isCreating || isEditing ? (
            /* Contract Editor Form (hidden on print) */
            <div className="no-print rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  {isCreating ? "Draft New Contract" : "Edit Contract Draft"}
                </h4>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleLoadTemplate}
                  className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <FileEdit size={12} />
                  Load Standard Freelancer Template
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Contract Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Standard Web Development Services Agreement"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-slate-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Agreement Terms & Legal Content
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write or customize the formal terms of the contract..."
                    rows={16}
                    className="w-full font-mono text-xs md:text-sm rounded-xl border border-slate-300 bg-white p-4 text-slate-900 outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-slate-500 leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={handleSendToClient}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="cursor-pointer rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  Send to Client
                </button>
              </div>
            </div>
          ) : selectedContract ? (
            /* Contract Viewing and Signing Space */
            <div className="space-y-6">
              {/* Toolbar Actions (hidden on print) */}
              <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedContract.status)}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Printer size={14} />
                    Print / Save PDF
                  </button>

                  {isFreelancer && selectedContract.status !== "signed" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(selectedContract)}
                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        Edit draft
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(selectedContract.id)}
                        className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-950/20"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* The Formal White Paper Contract Container */}
              <div
                id="printable-contract-area"
                className="printable-contract-page rounded-3xl border border-slate-200 bg-white p-8 md:p-12 shadow-sm dark:border-slate-800 dark:bg-slate-900/40 relative overflow-hidden"
              >
                {/* Background Watermark/Seal if Signed */}
                {selectedContract.status === "signed" && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[15deg] select-none pointer-events-none opacity-[0.03] dark:opacity-[0.02]">
                    <div className="border-[12px] border-green-600 text-green-600 text-6xl md:text-8xl font-black uppercase p-8 rounded-full tracking-wider">
                      Signed
                    </div>
                  </div>
                )}

                {/* Contract Body Document */}
                <div className="max-w-none prose prose-slate dark:prose-invert">
                  <div className="border-b-2 border-slate-900 dark:border-slate-700 pb-4 mb-6 text-center">
                    <h2 className="text-xl md:text-2xl font-black font-serif uppercase tracking-wider text-slate-900 dark:text-white m-0">
                      {selectedContract.title}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-mono uppercase">
                      Contract Ref: CF-2026-{selectedContract.id.toString().padStart(4, "0")}
                    </p>
                  </div>

                  <div className="font-serif text-sm md:text-base leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                    {selectedContract.content}
                  </div>
                </div>

                {/* Signature Blocks in Document */}
                <div className="mt-12 border-t border-slate-300 dark:border-slate-800 pt-8">
                  <div className="grid gap-8 sm:grid-cols-2">
                    {/* Freelancer Signature Block */}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                        Freelancer / Service Provider
                      </p>
                      <div className="h-12 flex items-end">
                        <span className="font-serif italic text-lg text-slate-700 dark:text-slate-300 border-b border-dashed border-slate-400 pb-1 w-full max-w-[200px]">
                          {project?.user?.name || me?.name || "Service Provider"}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">Digitally authorized partner</p>
                    </div>

                    {/* Client Signature Block */}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                        Client / Recipient of Services
                      </p>
                      <div className="h-12 flex items-end">
                        {selectedContract.status === "signed" ? (
                          <div className="flex flex-col border-b border-dashed border-slate-400 pb-1 w-full max-w-[240px]">
                            <span className="font-serif italic text-lg text-green-700 dark:text-green-300">
                              ✍️ {selectedContract.client_signature_name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic border-b border-dashed border-slate-400 pb-1 w-full max-w-[200px] block">
                            Awaiting Client Signature
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        {selectedContract.status === "signed"
                          ? `Digitally signed via IP ${selectedContract.signature_ip}`
                          : "Awaiting legal signature validation"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Digital Signing Area for Client (hidden on print) */}
              {selectedContract.status === "sent" && !isFreelancer && (
                <div className="no-print rounded-3xl border border-slate-200 bg-gradient-to-tr from-slate-50 to-indigo-50/30 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-indigo-950/10 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
                      <Lock size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Digital Signature Verification Required
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Please review all terms carefully. To legally execute this agreement, select the acceptance box and type your full legal name below.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSignSubmit} className="space-y-4 pt-2">
                    <label className="flex items-start gap-3 select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        I hereby agree to be legally bound by all terms, conditions, and payment schedules outlined in this Freelance Services Agreement.
                      </span>
                    </label>

                    <div className="grid gap-4 sm:grid-cols-3 items-end">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                          Type Legal Signature Name
                        </label>
                        <input
                          type="text"
                          value={signatureName}
                          onChange={(e) => setSignatureName(e.target.value)}
                          placeholder="e.g. Johnathan Doe"
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-500 text-sm font-serif italic"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={signMutation.isPending}
                        className="cursor-pointer rounded-xl bg-green-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-green-700 shadow-sm flex items-center justify-center gap-1.5 w-full"
                      >
                        <FileSignature size={14} />
                        Sign Contract
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Signed & Locked Metadata Banner for Both Parties (hidden on print) */}
              {selectedContract.status === "signed" && (
                <div className="no-print rounded-3xl border border-green-200 bg-green-50/50 p-6 dark:border-green-500/20 dark:bg-green-950/10 flex items-start gap-3">
                  <div className="rounded-xl bg-green-100 p-2 text-green-600 dark:bg-green-950/40 dark:text-green-400">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-green-900 dark:text-green-300">
                      Agreement Digitally Executed
                    </h4>
                    <p className="text-xs text-green-700/80 dark:text-green-400/80 mt-1 leading-relaxed">
                      This contract is legally binding and locked from further edits. Signed by client{" "}
                      <span className="font-bold">{selectedContract.client_signature_name}</span> from IP address{" "}
                      <span className="font-mono bg-green-100/50 dark:bg-green-950/60 px-1 rounded">
                        {selectedContract.signature_ip}
                      </span>{" "}
                      on <span className="font-bold">{formatDate(selectedContract.signed_at)}</span>.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Empty State Details Workspace (hidden on print) */
            <div className="no-print rounded-3xl border border-dashed border-slate-300 p-12 text-center text-slate-500 dark:border-slate-800">
              <FileText className="mx-auto mb-4 text-slate-300" size={48} />
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">Contracts Workspace</h4>
              <p className="mt-2 text-sm max-w-sm mx-auto text-slate-400">
                {isFreelancer
                  ? "Select an agreement from the sidebar to review, print or edit it. Or create a new one to send to your client."
                  : "Awaiting sent contracts from your freelancer partner. Once sent, you can legally sign them here."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
