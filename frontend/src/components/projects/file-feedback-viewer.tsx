import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  X, 
  Send, 
  Trash2, 
  MessageSquare, 
  Loader2, 
  Download, 
  Eye,
  FileText, 
  FileImage, 
  FileArchive, 
  File, 
  Calendar, 
  HardDrive,
  Paperclip
} from "lucide-react";
import { toast } from "sonner";
import api from "../../lib/axios";
import { handleFileDownload, handleFileOpen } from "../../lib/download";

type Comment = {
  id: number;
  project_file_id: number;
  user_id: number;
  x_pos: number;
  y_pos: number;
  comment: string;
  file_name?: string;
  file_path?: string;
  mime_type?: string;
  file_size?: number;
  download_url?: string;
  created_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
};

type Props = {
  file: {
    id: number;
    file_name: string;
    file_size: number;
    created_at: string;
    download_url: string;
    mime_type?: string;
  };
  onClose: () => void;
};

function formatFileSize(size?: number) {
  if (!size) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = size;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(1)} ${units[i]}`;
}

export default function FileFeedbackViewer({ file, onClose }: Props) {
  const queryClient = useQueryClient();
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  
  const [commentText, setCommentText] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);

  // Fetch comments for this file with fast polling for near real-time chat
  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: ["file-annotations", file.id],
    queryFn: async () => {
      const { data } = await api.get(`/project-files/${file.id}/annotations`);
      return data;
    },
    refetchInterval: 1500, // Poll every 1.5s for real-time live chat feel
  });

  // Get current user info to distinguish bubble alignment (left vs right) and deletions
  const { data: currentUser } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await api.get("/me");
      return data;
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (payload: { text: string; fileAttachment?: File }) => {
      const formData = new FormData();
      formData.append("x_pos", "0");
      formData.append("y_pos", "0");
      formData.append("comment", payload.text);
      if (payload.fileAttachment) {
        formData.append("file", payload.fileAttachment);
      }

      const { data } = await api.post(`/project-files/${file.id}/annotations`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return data;
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["file-annotations", file.id] });
      const previousComments = queryClient.getQueryData<Comment[]>(["file-annotations", file.id]);

      const optimisticComment: Comment = {
        id: Date.now(), // Temp ID
        project_file_id: file.id,
        user_id: currentUser?.id || 0,
        x_pos: 0,
        y_pos: 0,
        comment: payload.text,
        file_name: payload.fileAttachment?.name,
        mime_type: payload.fileAttachment?.type,
        file_size: payload.fileAttachment?.size,
        download_url: payload.fileAttachment && payload.fileAttachment.type.startsWith("image/") 
          ? URL.createObjectURL(payload.fileAttachment) 
          : undefined,
        created_at: new Date().toISOString(),
        user: {
          id: currentUser?.id || 0,
          name: currentUser?.name || "You",
          email: currentUser?.email || "",
          role: currentUser?.role || "",
        },
      };

      queryClient.setQueryData(["file-annotations", file.id], (old: Comment[] = []) => [
        ...old,
        optimisticComment,
      ]);

      setCommentText("");
      setAttachment(null);
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = "";
      }

      return { previousComments };
    },
    onError: (_err, _newTodo, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(["file-annotations", file.id], context.previousComments);
      }
      toast.error("Failed to post comment.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["file-annotations", file.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (commentId: number) => {
      await api.delete(`/project-annotations/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["file-annotations", file.id] });
      toast.success("Comment deleted.");
    },
    onError: () => {
      toast.error("Failed to delete comment.");
    },
  });

  // Automatically scroll to bottom of chat when new comments arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (sendMutation.isPending) return;
    if (!commentText.trim() && !attachment) return;

    sendMutation.mutate({
      text: commentText.trim(),
      fileAttachment: attachment || undefined,
    });
  };

  // Determine beautiful file type icon & style based on file name extension
  const getFileIconAndStyle = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")) {
      return {
        icon: <FileImage className="text-emerald-500 dark:text-emerald-400" size={32} />,
        bg: "bg-emerald-50/60 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-500/20",
        textClass: "text-emerald-700 dark:text-emerald-400",
        label: "Design / Image Asset",
      };
    }
    if (["pdf"].includes(ext || "")) {
      return {
        icon: <FileText className="text-rose-500 dark:text-rose-400" size={32} />,
        bg: "bg-rose-50/60 border-rose-200 dark:bg-rose-950/20 dark:border-rose-500/20",
        textClass: "text-rose-700 dark:text-rose-400",
        label: "PDF Document",
      };
    }
    if (["zip", "rar", "tar", "gz", "7z"].includes(ext || "")) {
      return {
        icon: <FileArchive className="text-amber-500 dark:text-amber-400" size={32} />,
        bg: "bg-amber-50/60 border-amber-200 dark:bg-amber-950/20 dark:border-amber-500/20",
        textClass: "text-amber-700 dark:text-amber-400",
        label: "Compressed Archive",
      };
    }
    return {
      icon: <File className="text-indigo-500 dark:text-indigo-400" size={32} />,
      bg: "bg-indigo-50/60 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-500/20",
      textClass: "text-indigo-700 dark:text-indigo-400",
      label: "Project Document",
    };
  };

  const fileStyle = getFileIconAndStyle(file.file_name);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white/95 dark:bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Upper Navigation Header */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-900/80 px-6 py-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="text-indigo-600 dark:text-indigo-400 animate-pulse" size={22} />
            File Discussion Thread
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md truncate">
            Reviewing: <span className="text-indigo-600 dark:text-indigo-300 font-semibold">{file.file_name}</span>
          </p>
        </div>

        <button
          onClick={onClose}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
          type="button"
        >
          <X size={20} />
        </button>
      </header>

      {/* Split Workspace Layout */}
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        
        {/* Left Pane: File Profile Summary */}
        <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20 p-6 flex flex-col justify-between shrink-0">
          <div className="space-y-6">
            <div className={`rounded-2xl border p-6 flex flex-col items-center text-center space-y-4 ${fileStyle.bg}`}>
              <div className="scale-125">{fileStyle.icon}</div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 max-w-[200px] truncate" title={file.file_name}>
                  {file.file_name}
                </h3>
                <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 mt-1 block">
                  {fileStyle.label}
                </span>
              </div>
            </div>

            {/* File Info Grid */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                <HardDrive size={16} className="text-indigo-500 dark:text-indigo-400" />
                <div>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase">Size</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{formatFileSize(file.file_size)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                <Calendar size={16} className="text-indigo-500 dark:text-indigo-400" />
                <div>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase">Uploaded At</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {new Date(file.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 lg:mt-0 space-y-2">
            <button
              onClick={() => handleFileOpen(file.download_url, file.file_name)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-800 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800 cursor-pointer shadow-sm"
              type="button"
            >
              <Eye size={16} />
              Open File
            </button>
            <button
              onClick={() => handleFileDownload(file.download_url, file.file_name)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 cursor-pointer"
              type="button"
            >
              <Download size={16} />
              Download File
            </button>
          </div>
        </div>

        {/* Right Pane: Live Chat / Discussion Room */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 overflow-hidden relative">
          
          {/* Scrollable Comments Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 dark:text-slate-500">
                <Loader2 className="animate-spin text-indigo-500 dark:text-indigo-400" size={24} />
                <span className="text-xs">Loading thread...</span>
              </div>
            ) : comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 dark:text-slate-500 max-w-sm mx-auto space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-indigo-500 dark:bg-slate-900 dark:border-slate-800 dark:text-indigo-400">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-300">No discussion yet</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Ask questions, request changes, or attach files/archives in feedback!
                  </p>
                </div>
              </div>
            ) : (
              comments.map((comm) => {
                const isMe = currentUser?.id === comm.user_id;
                const commentFileStyle = comm.file_name ? getFileIconAndStyle(comm.file_name) : null;
                const isImageAttachment = comm.mime_type?.startsWith("image/");
                
                return (
                  <div
                    key={comm.id}
                    className={`flex items-start gap-3 animate-in fade-in duration-200 ${
                      isMe ? "flex-row-reverse" : ""
                    }`}
                  >
                    {/* User Initials Avatar */}
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold border ${
                      isMe 
                        ? "bg-indigo-600 border-indigo-500 text-white" 
                        : "bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                    }`}>
                      {comm.user?.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Bubble Content */}
                    <div className={`flex flex-col max-w-[70%] space-y-1 ${
                      isMe ? "items-end" : "items-start"
                    }`}>
                      
                      {/* Name & Role */}
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="font-bold text-slate-600 dark:text-slate-300">{comm.user?.name}</span>
                        <span className="text-slate-400 dark:text-slate-500 font-semibold">•</span>
                        <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider scale-90 origin-left">
                          {comm.user?.role}
                        </span>
                      </div>

                      {/* Text Bubble & Attachment */}
                      <div className={`relative group rounded-2xl px-4 py-3 text-sm shadow-md leading-relaxed whitespace-pre-wrap ${
                        isMe
                          ? "bg-indigo-600 text-white rounded-tr-none"
                          : "bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-none dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800"
                      }`}>
                        
                        {/* Text comment body */}
                        {comm.comment && <div className="mb-2 last:mb-0">{comm.comment}</div>}                        {/* File Attachment Component */}
                        {comm.file_name && (
                          <div className="mt-2 animate-in slide-in-from-bottom-2 duration-150">
                            {isImageAttachment && comm.download_url ? (
                              // Direct beautiful inline Image Attachment preview
                              <div className="relative rounded-lg overflow-hidden border border-slate-200/50 dark:border-slate-800/80 bg-white dark:bg-slate-950 mt-1 max-w-[280px]">
                                <img
                                  src={comm.download_url}
                                  alt={comm.file_name}
                                  className="w-full max-h-48 object-cover cursor-pointer hover:opacity-95 transition"
                                  onClick={() => window.open(comm.download_url, "_blank")}
                                />
                                <div className="p-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/30">
                                  <span className="text-[11px] truncate block font-semibold text-slate-600 dark:text-slate-300">
                                    {comm.file_name}
                                  </span>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      onClick={() => handleFileOpen(comm.download_url!, comm.file_name!)}
                                      className="p-1 rounded-md text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 transition cursor-pointer"
                                      title="Open in new tab"
                                      type="button"
                                    >
                                      <Eye size={13} />
                                    </button>
                                    <button
                                      onClick={() => handleFileDownload(comm.download_url!, comm.file_name!)}
                                      className="p-1 rounded-md text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 transition cursor-pointer"
                                      title="Download"
                                      type="button"
                                    >
                                      <Download size={13} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              // Clean PDF, Zip, Excel Attachment card
                              <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 max-w-[280px] shadow-sm">
                                <div className="shrink-0">{commentFileStyle?.icon}</div>
                                <div className="min-w-0 flex-1">
                                  <span className="block text-xs font-bold truncate" title={comm.file_name}>
                                    {comm.file_name}
                                  </span>
                                  <span className="block text-[10px] text-slate-400 mt-0.5">
                                    {formatFileSize(comm.file_size)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => handleFileOpen(comm.download_url!, comm.file_name!)}
                                    className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-400 transition cursor-pointer"
                                    title="Open in new tab"
                                    type="button"
                                  >
                                    <Eye size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleFileDownload(comm.download_url!, comm.file_name!)}
                                    className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-400 transition cursor-pointer"
                                    title="Download"
                                    type="button"
                                  >
                                    <Download size={14} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Hover Trash Delete */}
                        {(isMe || currentUser?.role === "freelancer") && (
                          <button
                            onClick={() => deleteMutation.mutate(comm.id)}
                            disabled={deleteMutation.isPending}
                            className={`absolute top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition cursor-pointer bg-white border border-slate-200/80 text-slate-500 hover:text-red-500 dark:bg-slate-950/80 dark:border-slate-800/80 dark:text-slate-500 dark:hover:text-red-400 ${
                              isMe ? "right-full mr-2" : "left-full ml-2"
                            } opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-sm`}
                            title="Delete comment"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>

                      {/* Timestamp */}
                      <span className="text-[9px] text-slate-400 dark:text-slate-600">
                        {new Date(comm.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Floating Pre-upload Attachment Preview bar */}
          {attachment && (
            <div className="mx-6 mb-3 p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-3 duration-200 dark:border-slate-800 dark:bg-slate-900 shadow-md">
              <div className="flex items-center gap-2.5 min-w-0">
                <Paperclip className="text-indigo-600 dark:text-indigo-400 shrink-0" size={16} />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                    {attachment.name}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Ready to attach ({formatFileSize(attachment.size)})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Bottom Chat Message Input Bar */}
          <form 
            onSubmit={handleSend}
            className="p-4 border-t border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/40 flex items-center gap-3"
          >
            {/* Hidden Attachment input */}
            <input
              type="file"
              ref={attachmentInputRef}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setAttachment(f);
                }
              }}
            />
            
            <button
              type="button"
              onClick={() => attachmentInputRef.current?.click()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-slate-800 cursor-pointer shadow-sm"
              title="Attach a file or dossier"
            >
              <Paperclip size={18} />
            </button>

            <textarea
              rows={1}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder={attachment ? "Type a comment or send file..." : "Leave some feedback or attach a file..."}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 max-h-24 resize-none shadow-inner"
            />
            
            <button
              type="submit"
              disabled={(!commentText.trim() && !attachment)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-indigo-600/10"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
