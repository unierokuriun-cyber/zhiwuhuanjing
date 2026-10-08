import { useState } from "react";
import { Upload, Camera } from "lucide-react";
export function PhotoUpload({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function upload(file?: File) {
    if (!file) return;
    setError("");
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setError("请选择不超过 5MB 的 JPG、PNG 或 WebP 图片。");
      return;
    }
    onChange("");
    setBusy(true);
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 800 / Math.max(bitmap.width, bitmap.height));
      canvas.width = bitmap.width * scale;
      canvas.height = bitmap.height * scale;
      canvas
        .getContext("2d")!
        .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      onChange(canvas.toDataURL("image/jpeg", 0.8));
      bitmap.close();
    } catch {
      setError("图片无法读取，请重新上传。");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="photo-upload">
      {value ? (
        <img src={value} alt="上传照片预览" />
      ) : (
        <div className="upload-empty">
          <Camera size={40} />
          <h3>留下一张植物的照片</h3>
          <p>照片仅用于界面演示，不会发送给识别模型。</p>
        </div>
      )}
      <label className="button secondary-button">
        <Upload size={16} />
        {busy ? "读取图片中…" : value ? "重新上传" : "上传植物照片"}
        <input
          type="file"
          aria-label="上传植物照片"
          disabled={disabled || busy}
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => void upload(e.target.files?.[0])}
        />
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
