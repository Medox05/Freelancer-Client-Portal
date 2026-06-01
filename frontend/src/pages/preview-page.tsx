import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import { getToken } from "../lib/auth";
import api from "../lib/axios";

export default function PreviewPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  
  const filename = searchParams.get("name") || "";
  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filename);

  useEffect(() => {
    const url = searchParams.get("url");
    if (!url) {
      navigate("/");
      return;
    }

    const token = getToken();
    if (!token) {
      navigate(`/login`);
      return;
    }

    // Construct the backend URL
    const baseApi = api.defaults.baseURL || "http://localhost:8000/api";
    let targetUrl = url;
    
    try {
      // Normalize the host just in case the backend sent backend.test or an IP
      const urlObj = new URL(targetUrl, window.location.origin);
      const baseApiObj = new URL(baseApi);
      
      if (urlObj.pathname.startsWith('/api/')) {
        urlObj.protocol = baseApiObj.protocol;
        urlObj.host = baseApiObj.host;
        targetUrl = urlObj.toString();
      }
    } catch(e) {}

    if (!targetUrl.startsWith("http")) {
      // Remove leading /api if present so it doesn't duplicate with baseApi
      let relative = targetUrl.startsWith("/") ? targetUrl : `/${targetUrl}`;
      if (relative.startsWith("/api/")) {
        relative = relative.substring(4); // Remove "/api"
      }
      targetUrl = `${baseApi}${relative}`;
    }

    // Pass ?inline=true so Laravel serves the file inline instead of as attachment
    if (!targetUrl.includes("inline=true")) {
      const separator = targetUrl.includes("?") ? "&" : "?";
      targetUrl = `${targetUrl}${separator}inline=true`;
    }
    
    // Pass the token
    const separator2 = targetUrl.includes("?") ? "&" : "?";
    targetUrl = `${targetUrl}${separator2}token=${encodeURIComponent(token)}`;

    // Set the final URL to be rendered in the iframe instantly
    setFileUrl(targetUrl);
  }, [searchParams, navigate]);

  if (fileUrl) {
    return (
      <div className="flex h-screen w-full flex-col bg-slate-900">
        <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.close()}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
            >
              <ArrowLeft size={16} />
              Close Preview
            </button>
            <h1 className="text-sm font-medium text-slate-200">
              {filename || "File Preview"}
            </h1>
          </div>
          <a
            href={fileUrl.replace('inline=true', 'inline=false')}
            download
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            <Download size={16} />
            Download
          </a>
        </header>
        <div className="flex flex-1 items-center justify-center overflow-hidden bg-slate-100 dark:bg-slate-900 p-4">
          {isImage ? (
            <img 
              src={fileUrl} 
              alt={filename || "Preview"} 
              className="max-h-full max-w-full rounded-md object-contain shadow-sm"
            />
          ) : (
            <iframe 
              src={fileUrl} 
              className="h-full w-full border-none" 
              title={filename || "File Preview"}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-950">
      <div className="flex flex-col items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        <p className="mt-4 text-slate-500 dark:text-slate-400">Loading preview...</p>
      </div>
    </div>
  );
}
