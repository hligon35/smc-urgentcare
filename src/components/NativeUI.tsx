import type { PropsWithChildren } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Link, type Href } from "expo-router";
import { colors } from "../styles/theme";
import { openExternal } from "../services/openExternal";
export function NativeButton({
  label,
  href,
  secondary = false,
}: {
  label: string;
  href: string;
  secondary?: boolean;
}) {
  const content = (
    <View style={[styles.button, secondary && styles.secondary]}>
      <Text style={[styles.buttonText, secondary && styles.secondaryText]}>
        {label}
      </Text>
    </View>
  );
  return href.startsWith("/") ? (
    <Link href={href as Href} asChild>
      <Pressable accessibilityRole="link" accessibilityLabel={label}>
        {content}
      </Pressable>
    </Link>
  ) : (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={() => openExternal(href)}
    >
      {content}
    </Pressable>
  );
}
export function NativeSection({
  title,
  children,
}: PropsWithChildren<{ title: string }>) {
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.heading}>
        {title}
      </Text>
      {children}
    </View>
  );
}
export const nativeStyles = StyleSheet.create({
  title: {
    fontSize: 39,
    lineHeight: 45,
    fontWeight: "600",
    color: colors.ink,
    marginBottom: 18,
  },
  eyebrow: {
    color: colors.rust,
    textTransform: "uppercase",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 18,
  },
  body: { fontSize: 16, lineHeight: 26, color: colors.muted, marginBottom: 16 },
  subheading: {
    fontSize: 19,
    lineHeight: 26,
    fontWeight: "600",
    color: colors.ink,
    marginBottom: 10,
  },
  card: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 12,
    padding: 22,
    marginBottom: 15,
  },
  mutedCard: {
    backgroundColor: colors.sage,
    borderRadius: 12,
    padding: 22,
    marginVertical: 14,
  },
  image: { width: "100%", height: 200, borderRadius: 16, marginVertical: 22 },
});
const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.green,
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 6,
    borderColor: colors.green,
    borderWidth: 1,
    marginVertical: 5,
    minHeight: 48,
    alignItems: "center",
  },
  secondary: { backgroundColor: "transparent" },
  buttonText: {
    color: colors.paper,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  secondaryText: { color: colors.green },
  section: { marginVertical: 20 },
  heading: {
    fontSize: 27,
    lineHeight: 34,
    color: colors.ink,
    marginBottom: 20,
    fontWeight: "600",
  },
});
