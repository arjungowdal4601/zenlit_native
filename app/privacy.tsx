import React from 'react';

import LegalDocumentScreen from '../src/components/LegalDocumentScreen';

const PRIVACY_SECTIONS = [
  {
    title: 'Information Zenlit uses',
    body: [
      'Zenlit uses your email for OTP authentication, your profile basics for onboarding, optional profile details for your public profile, and social links if you add them.',
      'When you enable Radar, Zenlit uses your browser-provided location to help show nearby people and nearby posts. You can turn visibility off from the app.',
    ],
  },
  {
    title: 'Content you create',
    body: [
      'Posts, profile images, banner images, feedback attachments, and messages are stored so the app can show profiles, feeds, feedback, and conversations.',
      'Some content is public or visible to nearby users depending on the feature. Direct messages are intended for the people in that conversation.',
    ],
  },
  {
    title: 'Service providers',
    body: [
      'Zenlit currently uses Supabase for authentication, database, storage, realtime features, and edge functions.',
      'Zenlit is prepared for Vercel web deployment and may use Vercel Web Analytics and Speed Insights to understand traffic and performance without adding Sentry or another error-tracking vendor in this pass.',
    ],
  },
  {
    title: 'Browser and device data',
    body: [
      'Like most web apps, Zenlit may receive basic browser, device, network, and performance data when you use the product.',
      'Location permission, file upload, camera, and notification behavior can depend on your browser and operating system settings.',
    ],
  },
  {
    title: 'Your choices',
    body: [
      'You can choose not to enable location, turn Radar visibility off, edit profile details, skip optional profile details, or sign out.',
      'For deletion, export, or correction requests, use the app feedback flow while this MVP is being prepared for public launch.',
    ],
  },
];

export default function PrivacyScreen() {
  return (
    <LegalDocumentScreen
      eyebrow="Zenlit Privacy"
      title="Privacy Policy"
      intro="This draft privacy policy describes what Zenlit expects to collect and use for the browser-first MVP."
      sections={PRIVACY_SECTIONS}
    />
  );
}
