import Page from "../screens/Pages";
import { pageMetadata } from "../config/metadata";

export function generateMetadata() {
  return pageMetadata("visit");
}
export default function Route() {
  return <Page page="visit" />;
}
