import api from "../lib/axios";


export async function getConversations() {
  try {
    const { data } = await api.get("/chat/conversations");
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    throw error;
  }
}

export async function getMessages(conversationId: number) {
  const { data } = await api.get(`/chat/conversations/${conversationId}`);
  return data;
}

export async function sendMessage(conversationId: number, message: string) {
  const { data } = await api.post(
    `/chat/conversations/${conversationId}/messages`,
    { message }
  );
  return data;
}

export async function sendFileMessage(
  conversationId: number,
  files: File[],
  message?: string
) {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files[]", file);
  });

  if (message?.trim()) {
    formData.append("message", message.trim());
  }

  const { data } = await api.post(
    `/chat/conversations/${conversationId}/messages`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data;
}

export async function downloadChatFile(messageId: number, fileName?: string) {
  const response = await api.get(`/chat/messages/${messageId}/download`, {
    responseType: "blob",
  });

  const blob = new Blob([response.data]);
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName || "chat-file";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  window.URL.revokeObjectURL(url);
}