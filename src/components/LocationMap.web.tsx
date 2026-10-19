import { clinic } from "../config/site";

/** Share the exact map URL and accessible iframe settings across clinic location views. */
export default function LocationMap({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div className={`location-map${className ? ` ${className}` : ""}`}>
      <iframe
        src={clinic.mapEmbedUrl}
        title={`${clinic.name} location at ${clinic.address.street}, ${clinic.address.city}`}
        width={400}
        height={300}
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
