import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  FileText,
  MessageCircle,
  Paperclip,
  Search,
  Send,
  X,
  ArrowLeft,
} from "lucide-react";
import { useLocation, useSearchParams } from "react-router-dom";
import {
  downloadChatFile,
  getConversations,
  getMessages,
  sendFileMessage,
  sendMessage,
} from "../services/chat-service";
import api from "../lib/axios";

type Conversation = {
  id: number;
  name: string;
  email?: string | null;
  roleLabel: string;
  lastMessage: string;
  lastTime?: string | null;
  unreadCount: number;
  is_online?: boolean;
  last_seen_at?: string | null;
};

type MessageItem = {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name: string;
  message?: string | null;
  message_type: "text" | "file";
  file_name?: string | null;
  file_path?: string | null;
  file_url?: string | null;
  download_url?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
  is_read: boolean;
  created_at: string;
};

type OtherUser = {
  id: number;
  name: string;
  email?: string | null;
  is_online?: boolean;
  last_seen_at?: string | null;
};

type MessagesResponse = {
  current_user_id: number;
  messages: MessageItem[];
  other_user: OtherUser | null;
};

type MeResponse = {
  id: number;
  name: string;
  email: string;
  role: "freelancer" | "client";
};

function formatConversationTime(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function formatMessageTime(value: string) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(value?: number | null) {
  if (!value) return "";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function isUserOnline(lastSeen?: string | null) {
  if (!lastSeen) return false;

  const diff = Date.now() - new Date(lastSeen).getTime();
  // Ping fires every 20s; 65s threshold gives a safe 3-ping buffer
  return diff < 65000;
}

function formatLastSeen(value?: string | null) {
  if (!value) return "Offline";

  const diff = Math.floor((Date.now() - new Date(value).getTime()) / 1000);

  if (diff < 60) return "Last seen just now";
  if (diff < 3600) return `Last seen ${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `Last seen ${Math.floor(diff / 3600)} h ago`;

  return `Last seen ${new Date(value).toLocaleDateString()}`;
}

export default function ChatPage() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const didOpenConversationRef = useRef<number | null>(null);

  const isClient =
    location.pathname === "/client/chat" ||
    location.pathname.startsWith("/client/chat");

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const conversationIdFromUrl = Number(searchParams.get("conversation")) || null;

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await api.get<MeResponse>("/me");
      return data;
    },
    staleTime: 30000,
  });

  const {
    data: conversations = [],
    isError: conversationsIsError,
  } = useQuery<Conversation[]>({
    queryKey: ["chat-conversations"],
    queryFn: getConversations,
    refetchInterval: 45000,
    staleTime: 5000,
  });

  const filteredConversations = useMemo(() => {
    const term = search.toLowerCase().trim();

    const sortedConversations = [...conversations].sort((a, b) => {
      const timeA = a.lastTime ? new Date(a.lastTime).getTime() : 0;
      const timeB = b.lastTime ? new Date(b.lastTime).getTime() : 0;
      return timeB - timeA;
    });

    if (!term) return sortedConversations;

    return sortedConversations.filter(
      (conversation) =>
        conversation.name.toLowerCase().includes(term) ||
        (conversation.lastMessage || "").toLowerCase().includes(term)
    );
  }, [conversations, search]);

  useEffect(() => {
    if (
      conversationIdFromUrl &&
      conversations.some((c) => c.id === conversationIdFromUrl)
    ) {
      setSelectedId(conversationIdFromUrl);
      return;
    }

    if (!conversationIdFromUrl) {
      setSelectedId(null);
      didOpenConversationRef.current = null;
    }
  }, [conversationIdFromUrl, conversations]);

  const selectedConversation =
    filteredConversations.find((c) => c.id === selectedId) ||
    conversations.find((c) => c.id === selectedId) ||
    null;

  const { data: messagesData, isLoading: messagesLoading } =
    useQuery<MessagesResponse>({
      queryKey: ["chat-messages", selectedConversation?.id],
      queryFn: () => getMessages(selectedConversation!.id),
      enabled: !!selectedConversation?.id,
      refetchInterval: selectedConversation?.id ? 30000 : false,
      staleTime: 3000,
    });

  const messages = messagesData?.messages ?? [];
  const otherUser = messagesData?.other_user ?? null;
  const currentUserId = messagesData?.current_user_id ?? me?.id ?? null;

  const resetComposer = () => {
    setMessage("");
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const sendMutation = useMutation({
    mutationFn: ({
      conversationId,
      text,
    }: {
      conversationId: number;
      text: string;
    }) => sendMessage(conversationId, text),
    onMutate: async (newMsg) => {
      await queryClient.cancelQueries({ queryKey: ["chat-messages", selectedConversation?.id] });
      const previousMessages = queryClient.getQueryData(["chat-messages", selectedConversation?.id]);
      
      resetComposer();

      if (previousMessages) {
        queryClient.setQueryData(["chat-messages", selectedConversation?.id], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            messages: [
              ...old.messages,
              {
                id: Date.now(),
                conversation_id: newMsg.conversationId,
                sender_id: currentUserId,
                sender_name: "You",
                message: newMsg.text,
                message_type: "text",
                is_read: false,
                created_at: new Date().toISOString(),
              }
            ]
          };
        });
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
          }
        }, 50);
      }
      return { previousMessages };
    },
    onError: (_err, _newMsg, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(["chat-messages", selectedConversation?.id], context.previousMessages);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["chat-messages", selectedConversation?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
    },
  });

  const sendFileMutation = useMutation({
    mutationFn: ({
      conversationId,
      files,
      text,
    }: {
      conversationId: number;
      files: File[];
      text?: string;
    }) => sendFileMessage(conversationId, files, text),
    onMutate: async (newMsg) => {
      await queryClient.cancelQueries({ queryKey: ["chat-messages", selectedConversation?.id] });
      const previousMessages = queryClient.getQueryData(["chat-messages", selectedConversation?.id]);
      
      resetComposer();

      if (previousMessages) {
        queryClient.setQueryData(["chat-messages", selectedConversation?.id], (old: any) => {
          if (!old) return old;
          
          const newMessages = [];
          if (newMsg.text) {
             newMessages.push({
                id: Date.now(),
                conversation_id: newMsg.conversationId,
                sender_id: currentUserId,
                sender_name: "You",
                message: newMsg.text,
                message_type: "text",
                is_read: false,
                created_at: new Date().toISOString(),
             });
          }
          
          newMsg.files.forEach((file, index) => {
             newMessages.push({
                id: Date.now() + index + 1,
                conversation_id: newMsg.conversationId,
                sender_id: currentUserId,
                sender_name: "You",
                message: "",
                message_type: "file",
                file_name: file.name,
                file_size: file.size,
                is_read: false,
                created_at: new Date().toISOString(),
             });
          });

          return {
            ...old,
            messages: [...old.messages, ...newMessages]
          };
        });
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
          }
        }, 50);
      }
      return { previousMessages };
    },
    onError: (_err, _newMsg, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(["chat-messages", selectedConversation?.id], context.previousMessages);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["chat-messages", selectedConversation?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
    },
  });

  useEffect(() => {
    if (!selectedConversation?.id || messages.length === 0) return;

    if (didOpenConversationRef.current !== selectedConversation.id) {
      didOpenConversationRef.current = selectedConversation.id;

      requestAnimationFrame(() => {
        const el = containerRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
      });

      return;
    }

    const el = containerRef.current;
    if (!el) return;

    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;

    if (nearBottom) {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  }, [selectedConversation?.id, messages.length]);

  const handleSelectConversation = (conversationId: number) => {
    setSelectedId(conversationId);
    setSearchParams({ conversation: String(conversationId) });
    resetComposer();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleSend = () => {
    if (!selectedConversation) return;

    const text = message.trim();

    if (selectedFiles.length > 0) {
      sendFileMutation.mutate({
        conversationId: selectedConversation.id,
        files: selectedFiles,
        text: text || undefined,
      });
      return;
    }

    if (!text) return;

    sendMutation.mutate({
      conversationId: selectedConversation.id,
      text,
    });
  };

  const handleDownload = async (msg: MessageItem) => {
    try {
      setDownloadingId(msg.id);
      await downloadChatFile(msg.id, msg.file_name || "chat-file");
    } catch (error) {
      // Download failed
    } finally {
      setDownloadingId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isSending = sendMutation.isPending || sendFileMutation.isPending;

  return (
    <div className="grid h-[calc(100vh-140px)] gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <div className={`flex h-full min-h-0 flex-col rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${
        selectedConversation ? "hidden xl:flex" : "flex"
      }`}>
        <div className="border-b border-slate-200 px-5 py-5 dark:border-slate-800">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
              <MessageCircle
                size={22}
                className="text-slate-700 dark:text-slate-200"
              />
            </div>

            <div>
              <h2 className="text-xl font-semibold">Chat</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isClient ? "Chat with your freelancer." : "Chat with your clients."}
              </p>
            </div>
          </div>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversation..."
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-slate-900 outline-none placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {conversationsIsError ? (
            <div className="px-4 py-8 text-center text-red-500">
              Failed to load conversations.
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
              No conversations found.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredConversations.map((conversation) => {
                const isActive = selectedConversation?.id === conversation.id;
                const online = isUserOnline(conversation.last_seen_at);

                return (
                  <button
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation.id)}
                    className={`w-full rounded-2xl px-4 py-4 text-left transition ${
                      isActive
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-semibold">{conversation.name}</p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] ${
                              isActive
                                ? "bg-white/20 text-white dark:bg-slate-200 dark:text-slate-900"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                          >
                            {conversation.roleLabel}
                          </span>
                        </div>

                        {conversation.email && (
                          <p
                            className={`mt-1 truncate text-xs ${
                              isActive
                                ? "text-white/70 dark:text-slate-500"
                                : "text-slate-400 dark:text-slate-500"
                            }`}
                          >
                            {conversation.email}
                          </p>
                        )}

                        <div className="mt-1 flex items-center gap-2">
                          <span
                            className={`inline-block h-2.5 w-2.5 rounded-full ${
                              online ? "bg-emerald-500" : "bg-slate-400"
                            }`}
                          />
                          <span
                            className={`text-xs ${
                              isActive
                                ? online
                                  ? "text-emerald-300 dark:text-emerald-500"
                                  : "text-white/70 dark:text-slate-500"
                                : online
                                ? "text-emerald-500"
                                : "text-slate-400 dark:text-slate-500"
                            }`}
                          >
                            {online
                              ? "Online"
                              : formatLastSeen(conversation.last_seen_at)}
                          </span>
                        </div>

                        <p
                          className={`mt-1 truncate text-sm ${
                            isActive
                              ? "text-white/80 dark:text-slate-600"
                              : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {conversation.lastMessage || "No messages yet"}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p
                          className={`text-xs ${
                            isActive
                              ? "text-white/80 dark:text-slate-600"
                              : "text-slate-400 dark:text-slate-500"
                          }`}
                        >
                          {formatConversationTime(conversation.lastTime)}
                        </p>

                        {conversation.unreadCount > 0 && (
                          <span className="mt-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className={`flex h-full min-h-0 flex-col rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${
        selectedConversation ? "flex" : "hidden xl:flex"
      }`}>
        {selectedConversation ? (
          <>
            <div className="border-b border-slate-200 bg-white px-6 py-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(null);
                    setSearchParams({});
                  }}
                  className="mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-100 active:scale-95 xl:hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <ArrowLeft size={18} />
                </button>

                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold dark:bg-slate-800">
                  {(otherUser?.name || selectedConversation.name)
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <h3 className="text-lg font-semibold">
                    {otherUser?.name || selectedConversation.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <span
                      className={`inline-block h-2.5 w-2.5 rounded-full ${
                        isUserOnline(otherUser?.last_seen_at)
                          ? "bg-emerald-500"
                          : "bg-slate-400"
                      }`}
                    />
                    <span
                      className={
                        isUserOnline(otherUser?.last_seen_at)
                          ? "text-emerald-500"
                          : ""
                      }
                    >
                      {isUserOnline(otherUser?.last_seen_at)
                        ? "Online"
                        : formatLastSeen(otherUser?.last_seen_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div
              ref={containerRef}
              className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 px-6 py-6"
            >
              {messagesLoading ? (
                <div className="text-slate-500 dark:text-slate-400">
                  Loading messages...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-slate-500 dark:text-slate-400">
                  No messages yet. Start the conversation.
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isMine = msg.sender_id === currentUserId;

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-sm ${
                            isMine
                              ? "rounded-br-sm bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                              : "rounded-bl-sm bg-white text-slate-900 dark:bg-slate-800 dark:text-white"
                          }`}
                        >
                          <p
                            className={`mb-1 text-xs font-semibold ${
                              isMine
                                ? "text-right text-white/80 dark:text-slate-500"
                                : "text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {isMine
                              ? "You"
                              : otherUser?.name || msg.sender_name || "User"}
                          </p>

                          {msg.message_type === "file" ? (
                            <div className="space-y-2">
                              {msg.message && (
                                <p className="whitespace-pre-wrap break-words text-sm leading-6">
                                  {msg.message}
                                </p>
                              )}

                              <div
                                className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                                  isMine
                                    ? "border-white/20 bg-white/10 dark:border-slate-300 dark:bg-slate-100"
                                    : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <FileText size={18} />
                                  <div className="min-w-0">
                                    <div className="truncate">
                                      {msg.file_name || "File"}
                                    </div>
                                    <div className="mt-1 text-xs opacity-70">
                                      {formatFileSize(msg.file_size)}
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-3 flex gap-2">
                                  {msg.file_url && (
                                    <a
                                      href={msg.file_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                                        isMine
                                          ? "bg-white/20 hover:bg-white/30 dark:bg-slate-200 dark:hover:bg-slate-300"
                                          : "bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700"
                                      }`}
                                    >
                                      Open
                                    </a>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleDownload(msg)}
                                    disabled={downloadingId === msg.id}
                                    className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                                      isMine
                                        ? "bg-white/20 hover:bg-white/30 disabled:opacity-60 dark:bg-slate-200 dark:hover:bg-slate-300"
                                        : "bg-slate-200 hover:bg-slate-300 disabled:opacity-60 dark:bg-slate-800 dark:hover:bg-slate-700"
                                    }`}
                                  >
                                    <Download size={14} />
                                    {downloadingId === msg.id
                                      ? "Downloading..."
                                      : "Download"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap break-words text-sm leading-6">
                              {msg.message}
                            </p>
                          )}

                          <div
                            className={`mt-2 flex items-center ${
                              isMine ? "justify-end" : "justify-start"
                            } gap-2 text-[11px] ${
                              isMine
                                ? "text-white/70 dark:text-slate-500"
                                : "text-slate-400 dark:text-slate-500"
                            }`}
                          >
                            <span>{formatMessageTime(msg.created_at)}</span>

                            {isMine && (
                              <span className="font-medium">
                                {msg.is_read ? "✓✓ Seen" : "✓ Sent"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 px-6 py-4 dark:border-slate-800">
              {selectedFiles.length > 0 && (
                <div className="mb-3 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                          {file.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatFileSize(file.size)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFiles((prev) =>
                            prev.filter((_, i) => i !== index)
                          );
                        }}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFiles([]);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="mt-2 text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                  >
                    Remove all
                  </button>
                </div>
              )}

              {sendFileMutation.isPending && (
                <div className="mb-3 text-sm text-slate-500 dark:text-slate-400">
                  Uploading files...
                </div>
              )}

              <div className="flex items-end gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSending}
                  className="inline-flex h-[72px] w-[72px] cursor-pointer items-center justify-center rounded-2xl border border-slate-300 bg-slate-50 text-slate-700 transition hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <Paperclip size={20} />
                </button>

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    selectedFiles.length > 0
                      ? "Add a message with your files (optional)..."
                      : "Write a message..."
                  }
                  rows={2}
                  className="min-h-[72px] w-full resize-none rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                />

                <button
                  onClick={handleSend}
                  disabled={
                    isSending || (!message.trim() && selectedFiles.length === 0)
                  }
                  className="inline-flex h-[72px] min-w-[110px] cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 font-medium text-white transition hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-slate-900"
                >
                  <Send size={18} />
                  {isSending
                    ? "Sending..."
                    : selectedFiles.length > 0
                    ? "Send Files"
                    : "Send"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
            <MessageCircle size={44} />
            <p>Select a conversation to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}