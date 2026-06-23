type Getter = (path: string, options?: RequestInit) => Promise<Response>;

export async function downloadPdf(
  get: Getter,
  path: string,
  filename: string,
): Promise<void> {
  const res = await get(path);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
