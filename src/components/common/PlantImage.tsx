import { communityPhotoTile } from "../../services/communityPhotos";
import { useState, useEffect } from "react";
import { Leaf } from "lucide-react";
import {
  botanicalAtlas,
  botanicalPhotos,
  resolvePlantPhoto,
} from "../../services/plantPhotos";
export function PlantImage({
  src,
  alt,
  className = "",
  eager = false,
  speciesId,
}: {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
  speciesId?: string;
}) {
  const resolved = resolvePlantPhoto(src, speciesId);
  const [failed, setFailed] = useState(false);
  const portrait = resolved.startsWith(`${botanicalAtlas}#`)
    ? botanicalPhotos.find((p) => p.id === resolved.split("#")[1])
    : undefined;
  const communityTile = communityPhotoTile(resolved);
  const tile =
    communityTile ||
    (portrait
      ? {
          src: botanicalAtlas,
          viewBox: `${portrait.column * 384} ${portrait.row * 512} 384 512`,
          width: 1536,
          height: 1024,
        }
      : undefined);
  const resource = tile?.src;
  useEffect(() => {
    setFailed(false);
    if (!resource) return;
    // HTMLImageElement reliably reports failures even when SVG image events race mounting.
    const probe = new Image();
    probe.onerror = () => setFailed(true);
    probe.src = resource;
    return () => {
      probe.onerror = null;
    };
  }, [resolved, resource]);
  return failed ? (
    <div
      className={`image-fallback ${className}`}
      role="img"
      aria-label={`${alt}，图片暂时无法加载`}
    >
      <Leaf size={38} />
      <span>图片暂时无法加载</span>
    </div>
  ) : tile ? (
    <svg
      className={`botanical-photo ${className}`}
      viewBox={tile.viewBox}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={alt}
      data-photo-species={portrait?.id}
      data-community-photo={communityTile?.key}
    >
      <image
        href={tile.src}
        width={tile.width}
        height={tile.height}
        onError={() => setFailed(true)}
      />
    </svg>
  ) : (
    <img
      className={className}
      src={resolved}
      alt={alt}
      onError={() => setFailed(true)}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
    />
  );
}
