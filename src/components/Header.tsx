import { Link, usePathname, type Href } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
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
            style={[styles.link, path === route.path && styles.active]}
          >
            {route.label}
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
    rowGap: 2,
    marginTop: 16,
  },
  link: { color: colors.ink, paddingVertical: 10, fontSize: 13 },
  active: { color: colors.accent, textDecorationLine: "underline" },
});
