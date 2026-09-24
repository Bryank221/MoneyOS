"use client";

import { useEffect, useMemo, useRef } from "react";
import { ImagePlus, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAX_FILES = 6;

export function AttachmentPicker({
  files,
  onChange,
}: {
  files: File[];
  onChange: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrls = useMemo(
    () => files.map((file) => (file.type.startsWith("image/") ? URL.createObjectURL(file) : null)),
    [files],
  );

  // Revoking is a side effect on the external object-URL registry, not
  // derived state, so it belongs in an effect — it just never calls setState.
  useEffect(() => {
    return () => previewUrls.forEach((url) => url && URL.revokeObjectURL(url));
  }, [previewUrls]);

  function addFiles(newFiles: FileList | null) {
    if (!newFiles) return;
    const merged = [...files, ...Array.from(newFiles)].slice(0, MAX_FILES);
    onChange(merged);
  }

  function removeAt(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/heic,image/heif,application/pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {files.length === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed py-12 text-center text-muted-foreground transition-colors hover:bg-muted/50"
        >
          <ImagePlus className="size-6" />
          <span className="text-sm font-medium">
            Upload screenshots or a PDF bank/e-wallet statement
          </span>
          <span className="text-xs">
            PNG, JPEG, WEBP or PDF — up to {MAX_FILES} files, 10MB each
          </span>
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="group relative aspect-9/16 overflow-hidden rounded-lg border bg-muted"
            >
              {previewUrls[index] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrls[index]!} alt={file.name} className="size-full object-cover" />
              ) : (
                <div className="flex size-full flex-col items-center justify-center gap-1.5 p-2 text-center">
                  <FileText className="size-6 text-muted-foreground" />
                  <span className="line-clamp-2 break-all text-[10px] text-muted-foreground">
                    {file.name}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => removeAt(index)}
                className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
          {files.length < MAX_FILES ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex aspect-9/16 items-center justify-center rounded-lg border border-dashed text-muted-foreground hover:bg-muted/50"
            >
              <ImagePlus className="size-5" />
            </button>
          ) : null}
        </div>
      )}

      {files.length > 0 ? (
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange([])}>
          Clear all
        </Button>
      ) : null}
    </div>
  );
}
