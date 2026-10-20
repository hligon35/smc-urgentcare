import { Link } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { clinic } from "../config/site";
import { colors } from "../styles/theme";
export default function Brand() {
  return (
    <Link href="/" asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${clinic.name} home`}
        style={styles.brand}
      >
        <Image
          source={require("../../assets/brand-logo.png")}
          style={styles.logo}
          accessibilityIgnoresInvertColors
        />
        <View style={styles.wordmark}>
          <Text style={styles.name}>SMC</Text>
          <Text style={styles.description}>URGENT CARE</Text>
        </View>
      </Pressable>
    </Link>
  );
}
const styles = StyleSheet.create({
  brand: {
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  logo: { width: 70, height: 70, flexShrink: 0 },
  wordmark: { flexShrink: 1 },
  name: { fontSize: 27, fontWeight: "700", color: colors.primary },
  description: { color: colors.ink, fontSize: 11, letterSpacing: 1.5 },
});
