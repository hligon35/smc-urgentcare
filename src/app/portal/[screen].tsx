import Portal from "../../features/portal/Portal";
import { useLocalSearchParams } from "expo-router";
import { portalSections } from "../../features/portal/config";
export function generateStaticParams() { return portalSections.map(section => ({ screen: section.id })); }
export function generateMetadata() {
  return { title: "SMC CareConnect | Patient portal", description: "Private patient portal", robots: "noindex, nofollow" };
}
export default function PatientSection() {
  const { screen } = useLocalSearchParams<{ screen: string }>();
  return <Portal screen={screen || "dashboard"}/>;
}
