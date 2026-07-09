export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export const getAssetUrl = (fileUrl) => {
  if (!fileUrl) return "";
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;

  return `${SERVER_BASE_URL}${fileUrl}`;
};
