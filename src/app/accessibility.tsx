import Page from "../screens/Pages";
import { pageMetadata } from "../config/metadata";

export function generateMetadata() {
  return pageMetadata("accessibility");
}
export default function Route() {
  return <Page page="accessibility" />;
}
