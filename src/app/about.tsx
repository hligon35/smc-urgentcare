import Page from "../screens/Pages.web";
import { pageMetadata } from "../config/metadata";

export function generateMetadata() {
  return pageMetadata("about");
}
export default function Route() {
  return <Page page="about" />;
}
