# Zenlit Roadmap

## Direction

Zenlit is web-first and native-ready. The immediate job is to make the browser product good enough for real users, then use traction to decide when native apps deserve attention.

## Now: Web MVP hardening

- Ship the Expo web build through Vercel.
- Polish landing, auth, onboarding, Radar, feed, messaging, profile, and legal/trust basics.
- Test mobile Safari, mobile Chrome, and desktop browser flows.
- Keep Supabase access behind service files and keep validation/routing logic platform-neutral.
- Use Vercel Web Analytics and Speed Insights for first-pass web telemetry.

## Next: Web polish

- Improve first-use Radar education and empty states.
- Tighten responsive spacing across mobile and desktop browsers.
- Make Terms/Privacy final before public launch.
- Add deeper analytics or error tracking only when launch traffic justifies it.

## Later: Native preparation

- Consider iOS/Android only after repeat usage, messaging activity, profile sharing, or user demand proves traction.
- Reuse Supabase services, validation, onboarding rules, and portable React Native UI where practical.
- Add native-specific permission, notification, camera/image, store asset, and release-pipeline work only when mobile becomes a real product bet.
