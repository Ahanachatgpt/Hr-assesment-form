/**
 * Client-side image compression utility.
 * Automatically downscales large camera photos to max 1600px and compresses to JPEG
 * to prevent payload timeout and size limit errors on mobile networks.
 */
export async function compressImage(file: File, maxDimension = 1600, quality = 0.82): Promise<File> {
  if (typeof window === "undefined" || !file || !file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return file;
  }
  // If already under 600 KB, no compression needed
  if (file.size < 600 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        try {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(file);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (!blob || blob.size >= file.size) {
                resolve(file);
                return;
              }
              const cleanName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
              const compressed = new File([blob], cleanName, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressed);
            },
            "image/jpeg",
            quality
          );
        } catch {
          resolve(file);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };
      img.src = url;
    } catch {
      resolve(file);
    }
  });
}
