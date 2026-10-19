import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { clinic } from "../config/site";
import { openExternal } from "../services/openExternal";
import { colors } from "../styles/theme";

// Match the web social destinations while respecting native link handling.
const profiles = [
  {
    name: "Facebook",
    href: clinic.facebookUrl,
    icon: require("../../assets/facebook.png"),
  },
  {
    name: "LinkedIn",
    href: clinic.linkedinUrl,
    icon: require("../../assets/linkedIN.png"),
  },
];

export default function SocialLinks() {
  return (
    <View style={styles.links}>
      {profiles.map(({ name, href, icon }) => (
        <Pressable
          key={name}
          style={styles.link}
          accessibilityRole="link"
          accessibilityLabel={`${clinic.name} on ${name}`}
          onPress={() => openExternal(href)}
        >
          <Image
            source={icon}
            style={styles.icon}
            resizeMode="contain"
            accessible={false}
          />
          <Text style={styles.label}>{name}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  links: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginVertical: 14 },
  link: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 24,
    backgroundColor: colors.paper,
  },
  icon: { width: 24, height: 24 },
  label: { color: colors.primary, fontWeight: "600", fontSize: 13 },
});
