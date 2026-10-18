import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Shell from "../components/Shell";
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Shell>
        <Slot />
      </Shell>
    </SafeAreaProvider>
  );
}
