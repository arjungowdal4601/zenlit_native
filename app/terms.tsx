import React from 'react';

import LegalDocumentScreen from '../src/components/LegalDocumentScreen';

const TERMS_SECTIONS = [
  {
    title: 'Using Zenlit',
    body: [
      'Zenlit is a browser-first social product for discovering nearby people, viewing profiles, sharing posts, and starting conversations.',
      'You are responsible for the information you add to your profile, posts, feedback, and messages. Do not use Zenlit to harass, impersonate, spam, threaten, or harm others.',
    ],
  },
  {
    title: 'Accounts and authentication',
    body: [
      'Zenlit uses email OTP sign-in. You should only use an email address you control, and you should not share verification codes with anyone.',
      'We may restrict or remove access if an account appears unsafe, abusive, fake, or harmful to the product or other users.',
    ],
  },
  {
    title: 'Location and Radar',
    body: [
      'Radar depends on browser location permission. You choose whether to enable location and whether your Radar visibility is on.',
      'Location-based discovery is approximate and should not be used for emergencies, safety-critical decisions, or exact tracking.',
    ],
  },
  {
    title: 'Content and conversations',
    body: [
      'Profiles, social links, posts, images, and messages should be lawful and respectful. You should only upload content you have the right to use.',
      'Messages and nearby visibility can change as users move, disable visibility, or update profile settings.',
    ],
  },
  {
    title: 'MVP availability',
    body: [
      'Zenlit is currently an MVP. Features may change, break, or be removed as the product is tested and improved.',
      'The service is provided as-is for early testing, without a guarantee of uninterrupted availability or perfect accuracy.',
    ],
  },
];

export default function TermsScreen() {
  return (
    <LegalDocumentScreen
      eyebrow="Zenlit Terms"
      title="Terms of Service"
      intro="These draft terms explain the basic rules for using Zenlit during the web-first MVP phase."
      sections={TERMS_SECTIONS}
    />
  );
}
