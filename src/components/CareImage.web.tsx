import media from "../content/media.json";
export type CareImageName = keyof typeof media;
/** One source for photo dimensions and descriptions prevents mismatched or unlabelled images. */
export function CareImage({
  name,
  className,
  priority = false,
}: {
  name: CareImageName;
  className?: string;
  priority?: boolean;
}) {
  const photo = media[name];
  return (
    <img
      className={className}
      src={photo.src}
      width={photo.width}
      height={photo.height}
      alt={photo.alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
    />
  );
}
