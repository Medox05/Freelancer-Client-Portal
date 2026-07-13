import api from "./axios";
import { getToken } from "./auth";

/**
 * Normalizes any relative or absolute URL into an absolute Laravel backend API URL.
 */
function getAbsoluteUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  
  // Retrieve the configured Axios base URL (default: 'http://localhost:8000/api')
  const baseApi = api.defaults.baseURL || "http://localhost:8000/api";
  
  if (url.startsWith("/storage/")) {
    // Relative public storage: remove '/api' from base URL to get host
    const backendHost = baseApi.replace(/\/api$/, "");
    return `${backendHost}${url}`;
  }
  
  // Relative API route
  const relative = url.startsWith("/") ? url : `/${url}`;
  return `${baseApi}${relative}`;
}

/**
 * Downloads a file instantly using a hidden iframe to prevent memory buffering lag.
 * Guaranteed to NEVER open a new tab or navigate the main page.
 * 
 * @param downloadUrl Relative or absolute URL of the file
 * @param filename Original filename
 */
export function handleFileDownload(downloadUrl: string, filename: string) {
  try {
    const token = getToken();
    let targetUrl = getAbsoluteUrl(downloadUrl);
    
    // Append the auth token in the query parameters so Laravel can authenticate natively
    if (token) {
      const separator = targetUrl.includes("?") ? "&" : "?";
      targetUrl = `${targetUrl}${separator}token=${encodeURIComponent(token)}`;
    }
    
    // Create an invisible iframe to trigger the browser's native streaming download
    // This is 100% instant and does not block the UI or open a new window
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = targetUrl;
    document.body.appendChild(iframe);
    
    // Clean up the iframe from DOM after triggering the streaming download
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 5000);
    
  } catch (error) {
    console.error("Direct browser download failed:", error);
    // Absolute fallback: direct browser anchor trigger
    try {
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (fallbackError) {
      console.error("All download avenues failed:", fallbackError);
    }
  }
}

/**
 * Opens a file inline in a new browser tab using the frontend preview route.
 * This ensures that if the URL is copied and shared, it uses the viewer's own token.
 * 
 * @param fileUrl Relative or absolute URL of the file
 * @param filename Original filename
 */
export function handleFileOpen(fileUrl: string, filename: string) {
  try {
    // Navigate to the frontend /preview route, passing the fileUrl.
    // The PreviewPage component will automatically append the current user's token
    // and redirect to the backend URL to display the file.
    const previewUrl = `/preview?url=${encodeURIComponent(fileUrl)}&name=${encodeURIComponent(filename)}`;
    
    // Open natively and instantly in a new tab
    window.open(previewUrl, "_blank");
  } catch (error) {
    console.error("Failed to open file inline:", error);
  }
}
