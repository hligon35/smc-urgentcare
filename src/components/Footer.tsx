import { Link, type Href } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { clinic, routes } from "../config/site";
import { NativeButton } from "./NativeUI";
import { colors } from "../styles/theme";
export default function Footer() {
  return (
    <View style={styles.footer}>
      <Text style={styles.name}>{clinic.name}</Text>
      <Text style={styles.text}>Thoughtful care for the unexpected.</Text>
      <NativeButton label={`Call ${clinic.phone}`} href={clinic.phoneHref} />
      <NativeButton
        label="Patient portal ↗"
        href={clinic.portalUrl}
        secondary
      />
      <View style={styles.nav}>
        {routes.slice(5).map((route) => (
          <Link style={styles.link} key={route.id} href={route.path as Href}>
            {route.label}
          </Link>
        ))}
      </View>
      <Text style={styles.text}>{clinic.emergencyNote}</Text>
      <NativeButton label="Emergency: Call 911" href="tel:911" secondary />
      <Text style={styles.text}>
        © {new Date().getFullYear()} {clinic.name}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    padding: 24,
    marginTop: 25,
  },
  name: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.green,
    marginBottom: 8,
  },
  text: { color: colors.muted, fontSize: 12, lineHeight: 20, marginBottom: 15 },
  nav: { flexDirection: "row", gap: 25, marginVertical: 15 },
  link: { color: colors.green, fontSize: 12, paddingVertical: 10 },
});
