import Page from "../screens/Pages.web";
import { pageMetadata } from "../config/metadata";

export function generateMetadata() {
  return pageMetadata("home");
}
export default function Route() {
  return <Page page="home" />;
}
