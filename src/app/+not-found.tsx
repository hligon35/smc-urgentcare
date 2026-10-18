import Page from "../screens/Pages";
import { pageMetadata } from "../config/metadata";

export function generateMetadata() {
  return pageMetadata("not-found");
}
export default function Route() {
  return <Page page="not-found" />;
}
