import { Slot } from "expo-router";
import Shell from "../components/Shell.web";
export default function RootLayout() {
  return <Shell><Slot /></Shell>;
}
