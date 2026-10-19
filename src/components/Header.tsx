import { Link, usePathname, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Brand from "./Brand";
import { clinic, routes } from "../config/site";
import { colors } from "../styles/theme";
export default function Header() {
  const path = usePathname();
  return (
    <View style={styles.header}>
      <Brand />
      <Text style={styles.hours}>{clinic.hoursNote}</Text>
      <View style={styles.nav}>
        {routes.slice(0, 5).map((route) => (
          <Link
            key={route.id}
            href={route.path as Href}
            accessibilityState={{ selected: path === route.path }}
            asChild
          >
            <Pressable style={styles.link} accessibilityRole="link">
              <Text style={[styles.label, path === route.path && styles.active]}>
                {route.label}
              </Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  header: { padding: 22, borderBottomWidth: 1, borderBottomColor: colors.line },
  hours: { fontSize: 12, color: colors.muted, marginTop: 7 },
  nav: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 18,
    rowGap: 6,
    marginTop: 16,
  },
  link: { minHeight: 44, justifyContent: "center", maxWidth: "100%", paddingVertical: 10 },
  label: { color: colors.ink, fontSize: 14, flexShrink: 1 },
  active: { color: colors.accent, textDecorationLine: "underline" },
});
