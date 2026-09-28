/**
 * Client-side image compression utility.
 * Resizes images to reasonable web dimensions, preserves EXIF orientation,
 * and encodes to WebP with automatic fallback to JPEG.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  fallbackToJpeg?: boolean;
}

/**
 * Checks if the browser supports WebP canvas export.
 */
function isWebpSupported(): boolean {
  if (typeof document === "undefined") return false;
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0;
}

/**
 * Compresses and converts an image File to WebP (or JPEG fallback) with EXIF orientation handling.
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.82,
    fallbackToJpeg = true,
  } = options;

  // Don't process non-image files or SVGs
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return file;
  }

  // 1. Load the image with EXIF orientation support
  let sourceWidth = 0;
  let sourceHeight = 0;
  let drawable: CanvasImageSource;

  if (typeof createImageBitmap !== "undefined") {
    try {
      // Modern API with automatic EXIF orientation
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
      sourceWidth = bitmap.width;
      sourceHeight = bitmap.height;
      drawable = bitmap;
    } catch {
      // Fallback if createImageBitmap fails on specific format
      const img = await loadImageElement(file);
      sourceWidth = img.naturalWidth || img.width;
      sourceHeight = img.naturalHeight || img.height;
      drawable = img;
    }
  } else {
    const img = await loadImageElement(file);
    sourceWidth = img.naturalWidth || img.width;
    sourceHeight = img.naturalHeight || img.height;
    drawable = img;
  }

  // 2. Calculate target dimensions preserving aspect ratio
  let targetWidth = sourceWidth;
  let targetHeight = sourceHeight;

  if (targetWidth > maxWidth || targetHeight > maxHeight) {
    const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
    targetWidth = Math.round(targetWidth * ratio);
    targetHeight = Math.round(targetHeight * ratio);
  }

  // 3. Draw on canvas
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d", { alpha: true });

  if (!ctx) {
    return file; // If canvas context cannot be created, return original
  }

  // Use high-quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(drawable, 0, 0, targetWidth, targetHeight);

  // 4. Encode with WebP or JPEG fallback
  const supportsWebp = isWebpSupported();
  const primaryFormat = supportsWebp ? "image/webp" : "image/jpeg";
  const primaryExt = supportsWebp ? "webp" : "jpg";

  let blob = await getCanvasBlob(canvas, primaryFormat, quality);

  // Verify blob type or fallback to JPEG if WebP export failed
  if ((!blob || blob.type !== "image/webp") && supportsWebp && fallbackToJpeg) {
    blob = await getCanvasBlob(canvas, "image/jpeg", quality);
  }

  if (!blob) {
    return file;
  }

  const baseName = file.name.replace(/\.[^/.]+$/, "");
  const outputExt = blob.type === "image/webp" ? "webp" : "jpg";
  const outputName = `${baseName}.${outputExt}`;

  return new File([blob], outputName, {
    type: blob.type,
    lastModified: Date.now(),
  });
}

/**
 * Helper to load an HTMLImageElement from a File.
 */
function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };

    img.src = url;
  });
}

/**
 * Helper to wrap canvas.toBlob in a Promise.
 */
function getCanvasBlob(
  canvas: HTMLCanvasElement,
  format: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob),
      format,
      quality
    );
  });
}
