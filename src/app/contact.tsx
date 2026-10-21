import Page from "../screens/Pages.web";
import { pageMetadata } from "../config/metadata";

export function generateMetadata() {
  return pageMetadata("contact");
}
export default function Route() {
  return <Page page="contact" />;
}
