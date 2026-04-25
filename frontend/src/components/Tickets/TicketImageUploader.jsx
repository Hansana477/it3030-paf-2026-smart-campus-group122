import React, { useEffect, useState } from "react";
import { ImagePlus, Trash2, UploadCloud } from "lucide-react";

const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function TicketImageUploader({ value = [], onChange, maxImages = 3 }) {
  const [previewItems, setPreviewItems] = useState([]);
  const [error, setError] = useState("");

  const canUploadMore = value.length < maxImages;

  useEffect(() => {
    const items = (value || []).map((file, index) => ({
      id: `${file.name}-${file.lastModified}-${index}`,
      url: URL.createObjectURL(file),
    }));

    setPreviewItems(items);

    return () => {
      items.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [value]);

  const handleFilesSelected = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (!files.length) {
      return;
    }

    if (value.length + files.length > maxImages) {
      setError(`You can upload up to ${maxImages} images only.`);
      return;
    }

    const invalidFile = files.find((file) => !ALLOWED_FILE_TYPES.includes(file.type));
    if (invalidFile) {
      setError("Only JPG, PNG, GIF, and WEBP images are allowed.");
      return;
    }

    const oversizedFile = files.find((file) => file.size > MAX_FILE_SIZE_BYTES);
    if (oversizedFile) {
      setError("Each image must be 5MB or smaller.");
      return;
    }

    setError("");
    onChange([...(value || []), ...files]);
  };

  const handleRemoveImage = (indexToRemove) => {
    setError("");
    onChange((value || []).filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-primary">Evidence Images</p>
          <p className="mt-1 text-xs text-slate-500">Upload up to {maxImages} images for damaged equipment or issue evidence.</p>
        </div>

        <label
          className={`inline-flex cursor-pointer items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold shadow-sm transition ${
            canUploadMore
              ? "bg-accent text-white hover:opacity-90"
              : "cursor-not-allowed bg-slate-200 text-slate-500"
          }`}
        >
          <UploadCloud className="h-4 w-4" />
          Add Images
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
            multiple
            className="hidden"
            disabled={!canUploadMore}
            onChange={handleFilesSelected}
          />
        </label>
      </div>

      {error ? (
        <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {!previewItems.length ? (
        <div className="mt-4 flex min-h-[120px] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white text-slate-400">
          <div className="flex flex-col items-center gap-2 py-8">
            <ImagePlus className="h-7 w-7" />
            <p className="text-sm">No images uploaded yet</p>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {previewItems.map((item, index) => (
            <div key={item.id} className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <img src={item.url} alt="Ticket evidence" className="h-40 w-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute right-3 top-3 inline-flex items-center justify-center rounded-full bg-white/95 p-2 text-rose-600 shadow transition hover:scale-105"
                title="Remove image"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TicketImageUploader;
