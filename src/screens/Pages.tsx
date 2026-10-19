import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { clinic, routes } from "../config/site";
import SocialLinks from "../components/SocialLinks";
import { faqs, services, values, visitSteps } from "../content/care";
import {
  NativeButton,
  NativeSection,
  nativeStyles as s,
} from "../components/NativeUI";
function FAQs() {
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <NativeSection title="A few answers. A little reassurance.">
      {faqs.map((faq, i) => (
        <View key={faq.question} style={s.card}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: expanded === i }}
            onPress={() => setExpanded(expanded === i ? null : i)}
          >
            <Text style={s.subheading}>
              {faq.question} {expanded === i ? "−" : "+"}
            </Text>
          </Pressable>
          {expanded === i && (
            <>
              <Text style={s.body}>{faq.answer}</Text>
              {faq.link && (
                <NativeButton
                  label={
                    faq.link === "portal"
                      ? "Open patient portal ↗"
                      : "Clinic updates on Facebook ↗"
                  }
                  href={
                    faq.link === "portal"
                      ? clinic.portalUrl
                      : clinic.facebookUrl
                  }
                  secondary
                />
              )}
            </>
          )}
        </View>
      ))}
    </NativeSection>
  );
}
const nativePhotos = {
  illness: require("../../assets/care-illness.jpg"),
  injury: require("../../assets/care-injury.jpg"),
  physical: require("../../assets/care-physical.jpg"),
};
function Services() {
  return (
    <NativeSection title="Let’s help you feel better.">
      {services.map((service) => (
        <View style={s.card} key={service.id}>
          <Image
            style={s.image}
            source={nativePhotos[service.id]}
            accessibilityLabel={
              service.id === "physical"
                ? "Blood pressure examination supplies"
                : service.id === "injury"
                  ? "A clinician examines a patient’s upper arm"
                  : "A care professional checks an adult patient with a stethoscope"
            }
          />
          <Text style={s.subheading}>{service.title}</Text>
          <Text style={s.body}>{service.description}</Text>
          {service.items.map((item) => (
            <Text key={item} style={s.body}>
              • {item}
            </Text>
          ))}
          <Text style={s.body}>{service.note}</Text>
          <NativeButton
            label="Ask about this service"
            href={clinic.phoneHref}
            secondary
          />
        </View>
      ))}
    </NativeSection>
  );
}
function Visit() {
  return (
    <>
      <NativeSection title="Your visit, made a little easier.">
        <Image
          style={s.image}
          source={require("../../assets/care-visit.jpg")}
          accessibilityLabel="A care professional assists an older adult"
        />
        {visitSteps.map((step, i) => (
          <View style={s.card} key={step.title}>
            <Text style={s.subheading}>
              {i + 1}. {step.title}
            </Text>
            <Text style={s.body}>{step.text}</Text>
          </View>
        ))}
        <View style={s.mutedCard}>
          <Text style={s.subheading}>Questions about cost? Let’s talk.</Text>
          <Text style={s.body}>{clinic.paymentNote}</Text>
          <NativeButton
            label={`Call ${clinic.phone}`}
            href={clinic.phoneHref}
          />
        </View>
        <NativeButton
          label="Open patient portal ↗"
          href={clinic.portalUrl}
          secondary
        />
      </NativeSection>
      <FAQs />
    </>
  );
}
function About() {
  return (
    <NativeSection title="You deserve to feel heard, not hurried.">
      <Image
        style={s.image}
        source={require("../../assets/healthcare1.jpg")}
        accessibilityLabel="A care professional listens during a conversation"
      />
      <Text style={s.body}>
        Our person-centered approach puts your needs, questions, and preferences
        at the heart of your care.
      </Text>
      {values.map((value) => (
        <View key={value.title} style={s.card}>
          <Text style={s.subheading}>{value.title}</Text>
          <Text style={s.body}>{value.text}</Text>
        </View>
      ))}
      <NativeButton label="Plan your visit" href="/visit" />
    </NativeSection>
  );
}
function Contact() {
  return (
    <NativeSection title="A caring welcome starts here.">
      <Image
        style={s.image}
        source={require("../../assets/care-welcome.jpg")}
        accessibilityLabel="A care professional speaks with a patient"
      />
      <Text style={s.body}>
        {clinic.address.street}
        {"\n"}
        {clinic.address.city}, {clinic.address.region}{" "}
        {clinic.address.postalCode}
        {"\n"}
        {clinic.address.landmark}
      </Text>
      <Text style={s.body}>
        {clinic.hoursNote}. Please call before traveling.
      </Text>
      <NativeButton label={`Call ${clinic.phone}`} href={clinic.phoneHref} />
      <NativeButton
        label="Get directions ↗"
        href={clinic.directionsUrl}
        secondary
      />
      <NativeButton
        label="Open patient portal ↗"
        href={clinic.portalUrl}
        secondary
      />
      <Text style={s.subheading}>Clinic updates</Text>
      <SocialLinks />
      <View style={s.mutedCard}>
        <Text style={s.subheading}>
          Your health information deserves care, too.
        </Text>
        <Text style={s.body}>
          This app does not collect medical records. Call the clinic for
          guidance on the appropriate way to share information.
        </Text>
      </View>
    </NativeSection>
  );
}
export default function Page({ page }: { page: string }) {
  if (page === "home")
    return (
      <>
        <Text style={s.eyebrow}>Here for you. Close to home.</Text>
        <Text accessibilityRole="header" style={s.title}>
          A little care. A lot of comfort.
        </Text>
        <Text style={s.body}>
          A caring welcome for non-life-threatening illnesses and injuries in
          Indianapolis. No appointment necessary.
        </Text>
        <NativeButton label="Plan your visit" href="/visit" />
        <NativeButton label="Explore our care" href="/services" secondary />
        <Image
          style={s.image}
          source={require("../../assets/caring-visit.jpg")}
          accessibilityLabel="A clinician shares a reassuring smile with a young patient"
        />
        <About />
        <Contact />
      </>
    );
  if (page === "services") return <Services />;
  if (page === "about") return <About />;
  if (page === "visit") return <Visit />;
  if (page === "contact") return <Contact />;
  if (page === "privacy")
    return (
      <NativeSection title="Your privacy matters.">
        <Text style={s.body}>
          This informational app does not accept patient records, process
          payments, or store medical information. It has no advertising trackers
          or analytics integration.
        </Text>
        <Text style={s.body}>
          The website hosting provider processes technical request data to serve
          and protect web pages. The patient portal, maps, Facebook, and LinkedIn open
          separately and follow their own privacy practices.
        </Text>
        <Text style={s.body}>
          This statement is not the clinic’s Notice of Privacy Practices. Call
          the clinic to request its notice or discuss privacy and medical record
          questions.
        </Text>
        <NativeButton
          label="Call with privacy questions"
          href={clinic.phoneHref}
        />
      </NativeSection>
    );
  if (page === "accessibility")
    return (
      <NativeSection title="Care should feel within reach.">
        <Text style={s.body}>
          The app uses text that follows your device’s text-size settings,
          labeled controls, and a scrollable layout. If you need help using the
          app, website, or patient portal, call the clinic and tell the team
          what assistance would be useful.
        </Text>
        <Text style={s.body}>
          Accessibility is an ongoing effort. External services are operated
          separately.
        </Text>
        <NativeButton label="Call for assistance" href={clinic.phoneHref} />
      </NativeSection>
    );
  return (
    <NativeSection title="Let’s help you find your way.">
      <Text style={s.body}>
        This page isn’t here. Choose a page below or call the clinic.
      </Text>
      {routes.slice(0, 5).map((route) => (
        <NativeButton
          key={route.id}
          label={route.label}
          href={route.path}
          secondary
        />
      ))}
    </NativeSection>
  );
}
