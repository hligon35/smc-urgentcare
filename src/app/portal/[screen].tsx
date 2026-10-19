import Portal from "../../features/portal/Portal";
import { portalSections } from "../../features/portal/config";
export function generateStaticParams() { return portalSections.map(section => ({ screen: section.id })); }
export function generateMetadata() {
  return { title: "SMC CareConnect | Patient portal", description: "Private patient portal", robots: "noindex, nofollow" };
}
export default function PatientSection({ screen }: { screen?: string }) {
  // Expo Router passes the route param through useLocalSearchParams on the client.
  return <Portal screen={screen || "dashboard"}/>;
}
