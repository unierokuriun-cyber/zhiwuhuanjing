import { useState, useEffect } from "react";
import { Leaf } from "lucide-react";
export function PlantImage({
  src,
  alt,
  className = "",
  eager = false,
}: {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return failed ? (
    <div
      className={`image-fallback ${className}`}
      role="img"
      aria-label={`${alt}，图片暂时无法加载`}
    >
      <Leaf size={38} />
      <span>图片暂时无法加载</span>
    </div>
  ) : (
    <img
      className={className}
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
    />
  );
}
