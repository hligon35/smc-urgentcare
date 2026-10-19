import Portal from "../../features/portal/Portal";
export function generateMetadata() {
  return { title: "Patient sign in | SMC CareConnect", description: "CareConnect patient account sign-in", robots: "noindex, nofollow" };
}
export default function Login() { return <Portal screen="login"/>; }
