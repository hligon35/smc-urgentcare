import { Link, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { clinic, routes } from "../config/site";
import Brand from "./Brand";
import SocialLinks from "./SocialLinks";
import { NativeButton } from "./NativeUI";
import { colors } from "../styles/theme";
export default function Footer() {
  return (
    <View style={styles.footer}>
      <Brand />
      <Text style={styles.text}>Thoughtful care for the unexpected.</Text>
      <SocialLinks />
      <NativeButton label={`Call ${clinic.phone}`} href={clinic.phoneHref} />
      <NativeButton
        label="Patient portal ↗"
        href={clinic.portalUrl}
        secondary
      />
      <View style={styles.nav}>
        {routes.slice(5).map((route) => (
          <Link asChild key={route.id} href={route.path as Href}>
            <Pressable style={styles.link} accessibilityRole="link">
              <Text style={styles.label}>{route.label}</Text>
            </Pressable>
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
  text: { color: colors.muted, fontSize: 12, lineHeight: 20, marginBottom: 15 },
  nav: { flexDirection: "row", flexWrap: "wrap", columnGap: 24, rowGap: 8, marginVertical: 15 },
  link: { minHeight: 44, maxWidth: "100%", justifyContent: "center", paddingVertical: 10 },
  label: { color: colors.primary, fontSize: 14, flexShrink: 1 },
});
