"use client";

import { useRef, useState } from "react";
import { ImagePlus, X, Loader2, UploadCloud } from "lucide-react";
import { showToast } from "@/components/ui/ToastContainer";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 4 * 1024 * 1024;

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  max?: number;
}

export default function ImageUpload({
  images,
  onChange,
  max = 6,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const remaining = max - images.length;

  const uploadFiles = async (files: File[]) => {
    if (remaining <= 0) {
      showToast(`Maximum of ${max} images reached`, "info");
      return;
    }
    const imagesToUpload = files
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, remaining);

    if (imagesToUpload.length === 0) {
      showToast("Please choose image files only", "info");
      return;
    }

    setUploading(true);
    const newUrls: string[] = [];

    for (const file of imagesToUpload) {
      if (file.size > MAX_FILE_SIZE) {
        showToast(`"${file.name}" is larger than 4MB — skipped`, "error");
        continue;
      }
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = (await res.json().catch(() => null)) as {
          url?: string;
          error?: string;
        } | null;
        if (!res.ok || !data?.url) {
          throw new Error(data?.error ?? "Upload failed");
        }
        newUrls.push(data.url);
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : "Upload failed",
          "error",
        );
      }
    }

    if (newUrls.length > 0) {
      onChange([...images, ...newUrls].slice(0, max));
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (uploading || remaining <= 0) return;
    void uploadFiles(Array.from(e.dataTransfer.files));
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload book photos"
        onDragOver={(e) => {
          e.preventDefault();
          if (!dragOver) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !uploading && remaining > 0 && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !uploading && remaining > 0) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all duration-200",
          dragOver
            ? "border-amber-400 bg-amber-50"
            : "border-amber-200 bg-amber-50/30 hover:border-amber-300 hover:bg-amber-50/60",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void uploadFiles(Array.from(e.target.files));
          }}
        />

        {uploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            <p className="text-sm font-medium text-stone-600">
              Uploading photos…
            </p>
          </>
        ) : remaining > 0 ? (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <UploadCloud className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-zinc-900">
              Drop photos here or click to browse
            </p>
            <p className="text-xs text-stone-400">
              JPG, PNG, WebP · up to 4MB each · {remaining} of {max} slots left
            </p>
          </>
        ) : (
          <p className="flex items-center gap-2 text-sm text-stone-500">
            <ImagePlus className="h-4 w-4 text-amber-500" />
            Maximum of {max} images reached
          </p>
        )}
      </div>

      {images.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((url, index) => (
            <div key={`${url}-${index}`} className="group relative">
              <img
                src={url}
                alt={`Book image ${index + 1}`}
                className="h-24 w-full rounded-xl border border-amber-100 object-cover shadow-sm"
              />
              <button
                type="button"
                onClick={() => onChange(images.filter((_, i) => i !== index))}
                aria-label="Remove image"
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
