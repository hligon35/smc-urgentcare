import { Text } from "react-native";
import { NativeButton, NativeSection, nativeStyles as s } from "../../components/NativeUI";
import { clinic } from "../../config/site";

// The native shell supplies safe areas and scrolling, including at large text sizes.
export default function Portal(_props: { screen?: string }) {
  return (
    <NativeSection title="SMC CareConnect">
      <Text style={s.body}>
        Patient authentication is currently available through the secure website.
        Clinical records are still accessed through the clinic’s existing patient portal.
      </Text>
      <NativeButton label="Open existing patient portal" href={clinic.portalUrl} />
      <NativeButton label="Return to SMC Urgent Care" href="/" secondary />
    </NativeSection>
  );
}
