import { useState, useEffect } from "react";

export default function ImageUpload({ onUpload, initialImage }: any) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (initialImage) {
      setPreview(initialImage);
    }
  }, [initialImage]);

  const openUpload = () => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (!file) return;

      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "doglife_upload");

      const res = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        setUploading(false);
        alert("Upload failed");
        return;
      }

      const data = await res.json();

      setUploading(false);
      setPreview(data.secure_url);
      onUpload(data.secure_url);
    };

    input.click();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={openUpload}
        className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-dashed hover:bg-gray-50 transition flex items-center justify-center"
      >
        {uploading ? (
          <span className="text-sm">Uploading...</span>
        ) : preview ? (
          <img
            src={preview}
            alt="Dog preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-2xl">📷</span>
        )}
      </button>

      {preview ? (
        <button
          type="button"
          onClick={openUpload}
          className="text-sm text-blue-600 hover:underline"
        >
          Change photo
        </button>
      ) : (
        <p className="text-sm text-gray-500">Upload dog photo</p>
      )}
    </div>
  );
}