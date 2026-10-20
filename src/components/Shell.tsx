import {
  useEffect,
  useRef,
  type ElementRef,
  type PropsWithChildren,
} from "react";
import { ScrollView, View } from "react-native";
import { usePathname } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Header from "./Header";
import Footer from "./Footer";
import { colors } from "../styles/theme";
export default function Shell({ children }: PropsWithChildren) {
  const path = usePathname();
  const scroll = useRef<ElementRef<typeof ScrollView>>(null);
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [path]);
  const isPortal = path === "/portal" || path.startsWith("/portal/");
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }}>
      <StatusBar style="dark" />
      <ScrollView ref={scroll} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ width: "100%", maxWidth: 720, alignSelf: "center" }}>
          {!isPortal && <Header />}
          <View style={{ padding: 24 }}>{children}</View>
          {!isPortal && <Footer />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
