import { Text, View } from "react-native";
import { NativeButton } from "../../components/NativeUI";
import { clinic } from "../../config/site";
export default function Portal(_props: { screen?: string }) {
  return <View style={{ padding: 24, gap: 16 }}>
    <Text accessibilityRole="header" style={{ fontSize: 28, fontWeight: "700" }}>SMC CareConnect</Text>
    <Text>Patient authentication is currently available through the secure website. Clinical records are still accessed through the clinic's existing patient portal.</Text>
    <NativeButton label="Open existing patient portal" href={clinic.portalUrl} />
  </View>;
}
