import { Alert, Linking } from "react-native";

/** Keep device and third-party links behind one boundary with visible failure feedback. */
export async function openExternal(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert(
      "Unable to open this link",
      "Please try again or call the clinic using your phone.",
    );
  }
}
