# Google OAuth Quick Start Guide

## 🚀 Quick Setup (5 Steps)

### Step 1: Get SHA-1 from EAS (Android Only)
```bash
eas credentials
# Select: Android
# Copy the SHA-1 fingerprint shown
```

### Step 2: Google Cloud Console
Visit: [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)

**Android Client** (ends with `...rduhjrif2gfpe6p0e0h080j6injbfdmh`):
- Add SHA-1 from Step 1
- Package: `com.arjungowdal4601.zenlit`

**Web Client** (ends with `...f7i33s5kasurtelsj79jte57fenbvsbh`):
- Authorized redirect URIs:
  ```
  https://yxucgloawhbpjuweoipt.supabase.co/auth/v1/callback
  zenlit://
  com.arjungowdal4601.zenlit://
  ```
- Authorized JavaScript origins:
  ```
  https://yxucgloawhbpjuweoipt.supabase.co
  ```

### Step 3: Supabase Dashboard
Visit: [Your Supabase Project](https://supabase.com/dashboard/project/yxucgloawhbpjuweoipt)

**Enable Google Provider** (Authentication > Providers > Google):
- Enable: ✓
- Client ID: `652862346862-f7i33s5kasurtelsj79jte57fenbvsbh.apps.googleusercontent.com`
- Client Secret: [From Google Cloud Console]
- Authorized Client IDs (add all 3):
  ```
  652862346862-f7i33s5kasurtelsj79jte57fenbvsbh.apps.googleusercontent.com
  652862346862-rduhjrif2gfpe6p0e0h080j6injbfdmh.apps.googleusercontent.com
  652862346862-hl9n4q30e6tph4e3nc6hfm7jm53e9tk2.apps.googleusercontent.com
  ```
- Skip nonce checks: ✓ (for development)

**Add Redirect URLs** (Authentication > URL Configuration):
```
zenlit://
com.arjungowdal4601.zenlit://
```

### Step 4: Build
```bash
# Android
eas build --profile development --platform android

# iOS
eas build --profile development --platform ios
```

### Step 5: Test
1. Install the built app on your device
2. Open the app
3. Tap "Continue with Google"
4. Sign in with Google
5. You should be redirected back and logged in

## 🐛 Debugging

Check console logs:
```bash
npx expo start --dev-client
```

Look for messages starting with `[Google OAuth]`

## ✅ Success Checklist

- [ ] SHA-1 added to Google Cloud Console
- [ ] Redirect URIs added to Google Web Client
- [ ] Google provider enabled in Supabase
- [ ] All 3 client IDs in Supabase authorized list
- [ ] Redirect URLs added to Supabase
- [ ] Development build created
- [ ] Tested on physical device

## 🆘 Common Issues

**"Configuration Error"**
→ Check .env file has all client IDs

**"Redirect URI mismatch"**
→ Verify exact URIs in Google Console match: `zenlit://` and `com.arjungowdal4601.zenlit://`

**"Nonces mismatch"**
→ Enable "Skip nonce checks" in Supabase Google provider settings

**Authentication succeeds but no session**
→ Check all 3 client IDs are in Supabase "Authorized Client IDs"

## 📚 Full Documentation

See `GOOGLE_AUTH_SETUP.md` for complete details.

---

**Important:** You must use a development build (EAS), not Expo Go, for Google OAuth to work.
