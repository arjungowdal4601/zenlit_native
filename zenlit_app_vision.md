# app_vision.md — Zenlit (Expo + Supabase)

## One-liner  
Zenlit is a **location-first networking app** that helps you discover and connect with real people nearby — instantly and in real time.

## Product principle  
Prioritize **people around you** (≤ 1.5 km), not global content. Keep **consent, safety, and clarity** obvious at every step.

## Tech context (for UI assumptions only)  
- **Frontend:** Expo (iOS/Android).  
- **Backend:** Supabase (auth, DB, storage, realtime).  
- **Present code includes:** Radar, Feed, **Create Post**, Messaging, Profile flows, visibility controls, and storage uploads.  
- **Note on messaging schema docs:** Repo contains both a **conversation-based anonymity guide** and a **direct-messaging migration set**; treat anonymity as **server-resolved state** surfaced to the UI (no client heuristics).

---

## Global UX rules
- **Radius:** 1.5 km as the discovery envelope (server decides who’s “nearby” and whether a conversation is anonymous).  
- **Consent-first location:** Nothing proximity-based renders without “While Using the App” permission and in-app “visibility” ON. Provide clear toggles and states.  
- **Realtime feel:** Presence and anonymity changes apply smoothly, without jarring list jumps.  
- **Safety:** When either participant moves out of range, **identity switches to “Anonymous,”** avatars/social links hide, and chat history remains. When back in range, identity restores.

---

## Navigation
Bottom tab: **Radar | Feed | Create | Chat | Profile**  
- **Headers:** Gradient brand title; tap title = soft refresh where it makes sense (e.g., Radar/Feed).  
- **Back/Deep links:** Tapping a visible user opens their Profile; from Profile, “Message” opens the existing thread or creates one.

---

## Screens (UI requirements)

### 1) Radar
**Purpose:** See and search nearby users in real time.  
**UI:**
- Header with title, **Search toggle**, **Visibility** control.  
- **Search bar state** with debounced filtering by name/@handle.  
- **Card list** of people: avatar, display name, short bio/role, distance, compact social icons, **Message** CTA.  
- States:  
  - **Permission off**: friendly prompt to enable OS Location.  
  - **Visibility off**: explain “Radar visibility is off.”  
  - **Loading/Error**: centered feedback.  
  - **Empty**: “No nearby users.”  
**Behaviors:**  
- Pull/press to refresh.  
- **Message** from a user card creates/opens a thread (initiation happens from Radar, not the Chat list).

### 2) Feed
**Purpose:** Browse **nearby** posts only (within the radar radius).  
**UI:**  
- Header with title; tapping title triggers a gentle refresh.  
- **Post cards** show: author avatar + name, distance badge, time, text, optional image, compact social icons, **View Profile** and **Message** actions.  
- **Empty** state: “No nearby posts yet.”  
**Rules:**  
- Only show posts from currently in-range users.  
- Social links visible/tappable only if author is in range.

### 3) Create (Create Post)
**Purpose:** Compose and share an update to the nearby feed.  
**UI:**  
- Author row (avatar, display name).  
- **Composer**: multiline text (trim to validate non-empty), optional single image picker (JPG/PNG), character counter.  
- **Share** button; success toast and auto-navigate back to **Feed**.  
**Image rules:**  
- Compress/resize before upload; fail gracefully with clear toasts if upload/storage fails.  
- Uploads land in **post-images** storage; show progress affordance and final success state.

### 4) Chat
**Purpose:** 1:1 conversations with people discovered on Radar.  
**Chat list:**  
- Rows show avatar (or **Anonymous** placeholder), name (or “Anonymous”), last message snippet, and in-range status dot.  
- Sort by latest activity/unread.  
**Thread:**  
- **Header**: avatar + name or “Anonymous.”  
- **Message bubbles** with timestamps; delivery/read adornments if provided.  
- **Composer**: text + send; media affordance is optional/non-blocking.  
**Range/Identity rules:**  
- In range → show real identity and enable profile deep link from header.  
- Out of range → switch to **Anonymous**, hide socials and profile deep link; **chat history persists**.  
- Range returns → restore identity automatically.  
**Initiation rule:** New conversation starts **from Radar user card** only; the Chat list doesn’t create new threads.

### 5) Profile
**Viewer Profile:**  
- Avatar (zoom), display name, short bio, distance, social icons (in range only), **Message** CTA.  
- If out of range: show **Anonymous** placeholder; hide socials; **Message** continues the same thread (still anonymous).  
**My Profile / Edit Profile:**  
- Edit **Display Name**, **Bio**, and **Socials** (Instagram / X / LinkedIn).  
- **Avatar** and **Banner** set/remove with a clear preview and toasts; on Save, upload to **profile-images** storage; attempt cleanup for replaced assets; show non-blocking warnings if delete fails.

---

## System states & empty/error UX (design explicitly)
- **Location Off** → explain why and how to enable.  
- **Visibility Off** → clarify effect (“you won’t see others, others won’t see you”).  
- **No Nearby Users / Posts** → gentle, encouraging copy; never dead-end.  
- **Network errors** → soft toast + retry affordance; never block tab nav.  
- **Auth anomalies** → handle invalid sessions by clearing state and returning to entry flow without crashing.

---

## Visual language & accessibility
- **Brand gradient** headers (blue → purple), dark surface, high contrast text.  
- Tap targets ≥ 44 px; visible focus/press states.  
- Motion is subtle (icon pulses, gentle list refresh), never distracting.

---

## Analytics (names only; no implementation)
`radar_view`, `radar_refresh`, `radar_message_tap`, `feed_view`, `feed_refresh`, `post_create_open`, `post_share_success`, `chat_open_list`, `chat_open_thread`, `chat_send`, `profile_view`, `profile_edit_open`, `profile_save`, `visibility_toggle`, `location_permission_prompt_shown/granted/denied`, `anonymity_state_changed`.

---

## Acceptance criteria (UI)
- Radar/Feed **do not** render proximity data until OS permission & in-app visibility are satisfied.  
- Chat identity **toggles to Anonymous** immediately when out of range; **restores** on return; history never altered.  
- **Create Post** validates non-empty text, supports optional image, uploads to storage with compression, and navigates to Feed on success.  
- Feed shows **only nearby posts**; social icons are visible/tappable only when the author is in range.  
- New conversations can be **initiated only from Radar**.  
- Profile viewer state reflects range (real vs Anonymous) consistently across **Chat header, Profile, Feed cards**.

---

## Where agents often go wrong (Pitfalls)
- **Leaking identity while out of range** (e.g., showing initials or cached avatar anywhere).  
- **Creating threads from Chat list** (initiation must be from Radar).  
- **Breaking history** during anonymity flips (don’t delete, blur, or reorder messages).  
- **Showing socials when out of range** (disable/hide).  
- **Blocking the entire app** when location permission is denied (only proximity features should show gated states).  
- **Janky refresh** (hard reloads that jump lists instead of diffing + subtle status chips).  
- **Inconsistent restore** (not reverting “Anonymous” to real identity when users re-enter range).  
- **Ignoring Create Post** success path (must confirm and route to Feed).

---

## Don’ts (strict)
- Don’t reveal **any** identifier out of range (no initials, no stale avatars, no partial names).  
- Don’t allow new conversation creation from Chat list.  
- Don’t show or link **socials** when a user is Anonymous/out of range.  
- Don’t block tab navigation due to permissions or network errors.  
- Don’t add features beyond **Radar, Feed, Create, Chat, Profile** for this MVP.  
- Don’t surface or depend on backend column names in the UI (schema is in flux; UI reads server-computed states).

---

## Copy guide (examples)
- **Location Prompt:** “Share your location to discover people nearby.”  
- **Visibility Off:** “Radar visibility is off. Turn it on to appear on radar and see nearby users.”  
- **Out of Range Chip:** “Out of range · 1.5 km+”  
- **Anonymous Header:** “Anonymous”  
- **Create Post success:** “Post created successfully.”

---

**End of app_vision.md**