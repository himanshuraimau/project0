/**
 * Upload a file to a presigned URL with progress reporting.
 * Uses XMLHttpRequest so we can report upload progress (fetch does not support it).
 */
export function uploadWithProgress(
  url: string,
  file: File | Blob,
  contentType: string,
  onProgress: (percent: number) => void
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const body = file instanceof File ? file : new File([file], "upload", { type: contentType });

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const percent = Math.min(100, Math.round((e.loaded / e.total) * 100));
        onProgress(percent);
      }
    });

    xhr.addEventListener("load", () => {
      const response = new Response(xhr.response, {
        status: xhr.status,
        statusText: xhr.statusText,
        headers: (() => {
          const h = new Headers();
          const lines = xhr.getAllResponseHeaders().trim().split(/[\r\n]+/);
          for (const line of lines) {
            const [key, ...parts] = line.split(":");
            if (key) h.set(key.trim(), parts.join(":").trim());
          }
          return h;
        })(),
      });
      resolve(response);
    });

    xhr.addEventListener("error", () => reject(new Error("Upload failed")));
    xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));

    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.send(body);
  });
}
