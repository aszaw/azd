export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${process.env.REACT_APP_API_BASE}/upload`, {
    method: "POST",
    body: formData,
    // include credentials if you later add auth + cookies
    // credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed: ${res.status} ${text}`);
  }
  // API returns { url: "/uploads/<id-or-name>" }
  const { url } = await res.json();
  return `${process.env.REACT_APP_FILES_BASE}${url}`; // full URL to the file
}

export function fileUrl(filenameOrPath: string) {
  // If you store only a filename, prefix it. If you already store "/uploads/..", use as-is.
  const path = filenameOrPath.startsWith("/uploads/")
    ? filenameOrPath
    : `/uploads/${filenameOrPath}`;
  return `${process.env.REACT_APP_FILES_BASE}${path}`;
}
