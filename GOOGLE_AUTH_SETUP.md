# Google OAuth Setup Guide for Zenlit Expo App

This guide will help you configure Google OAuth authentication for your Zenlit app in both development and production environments.

## Overview

Your app uses **Expo EAS Development Builds** with Google OAuth through Supabase. This setup requires configuration in three places:
1. Google Cloud Console
2. Supabase Dashboard
3. Your Local Environment (already configured)

## Prerequisites

- EAS CLI installed: `npm install -g eas-cli`
- Access to Google Cloud Console
- Access to your Supabase project dashboard
- Physical device or emulator for testing (Expo Go does NOT support Google OAuth)

---

## Part 1: Get Your EAS Build Credentials

### For Android

1. Open terminal in your project directory
2. Run: `eas credentials`
3. Select **Android** platform
4. Choose "Select credentials source" or "Manage credentials"
5. You'll see output like:
   ```
   SHA-1 Fingerprint: AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12
   ```
6. **COPY THIS SHA-1 FINGERPRINT** - you'll need it for Google Cloud Console

### For iOS

Your bundle identifier is already configured: `com.arjungowdal4601.zenlit`

---

## Part 2: Configure Google Cloud Console

### Step 1: Android OAuth Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services > Credentials**
3. Find your Android OAuth 2.0 Client ID (ends with `...rduhjrif2gfpe6p0e0h080j6injbfdmh`)
4. Click to edit
5. Add the following:
   - **Package name**: `com.arjungowdal4601.zenlit`
   - **SHA-1 certificate fingerprint**: [The SHA-1 from EAS credentials above]
6. Click **Save**

### Step 2: iOS OAuth Client ID

1. Find your iOS OAuth 2.0 Client ID (ends with `...hl9n4q30e6tph4e3nc6hfm7jm53e9tk2`)
2. Click to edit
3. Verify **Bundle ID**: `com.arjungowdal4601.zenlit`
4. Click **Save**

### Step 3: Web OAuth Client ID (Used for Native Apps)

1. Find your Web OAuth 2.0 Client ID (ends with `...f7i33s5kasurtelsj79jte57fenbvsbh`)
2. Click to edit
3. Under **Authorized redirect URIs**, add:
   ```
   https://yxucgloawhbpjuweoipt.supabase.co/auth/v1/callback
   zenlit://
   com.arjungowdal4601.zenlit://
   ```
4. Under **Authorized JavaScript origins**, add:
   ```
   https://yxucgloawhbpjuweoipt.supabase.co
   ```
5. Click **Save**

### Important Notes:
- The redirect URIs must NOT have trailing slashes
- The scheme-based URIs are for native mobile apps
- The Supabase callback URL is for server-side token exchange

---

## Part 3: Configure Supabase Dashboard

### Step 1: Enable Google Provider

1. Go to your Supabase project: https://supabase.com/dashboard/project/yxucgloawhbpjuweoipt
2. Navigate to **Authentication > Providers**
3. Find **Google** and enable it
4. Configure the following:

   **Client ID (Web):**
   ```
   652862346862-f7i33s5kasurtelsj79jte57fenbvsbh.apps.googleusercontent.com
   ```

   **Client Secret:**
   [Get this from your Google Cloud Console OAuth Web Client]

   **Authorized Client IDs (Add all three):**
   ```
   652862346862-f7i33s5kasurtelsj79jte57fenbvsbh.apps.googleusercontent.com
   652862346862-rduhjrif2gfpe6p0e0h080j6injbfdmh.apps.googleusercontent.com
   652862346862-hl9n4q30e6tph4e3nc6hfm7jm53e9tk2.apps.googleusercontent.com
   ```

5. **Skip Nonce Check**:
   - For development: Enable this option
   - For production: Keep disabled for better security

6. Click **Save**

### Step 2: Configure Redirect URLs

1. Navigate to **Authentication > URL Configuration**
2. Under **Redirect URLs**, add:
   ```
   zenlit://
   com.arjungowdal4601.zenlit://
   ```
3. Keep the default site URL: `https://yxucgloawhbpjuweoipt.supabase.co`
4. Click **Save**

---

## Part 4: Build and Test

### Create Development Build

**For Android:**
```bash
eas build --profile development --platform android
```

**For iOS:**
```bash
eas build --profile development --platform ios
```

### Install and Test

1. Download the built APK/IPA to your device
2. Install it
3. Open the app
4. Tap "Continue with Google"
5. You should see:
   - Google sign-in screen opens
   - After signing in, you're redirected back to the app
   - You're logged in successfully

### Debugging Issues

If Google sign-in fails, check the Expo dev client logs:

```bash
npx expo start --dev-client
```

Look for log messages starting with `[Google OAuth]` which will show:
- Configuration validation status
- Redirect URI being used
- Authentication flow progress
- Detailed error messages

### Common Issues and Solutions

#### Issue: "Configuration Error" Alert
**Solution:** Check your .env file has all three Google client IDs set correctly

#### Issue: "Redirect URI mismatch"
**Solution:**
1. Check the logs to see what redirect URI is being generated
2. Make sure that exact URI is added to Google Cloud Console
3. Verify bundle identifier/package name matches exactly

#### Issue: "Nonces mismatch"
**Solution:**
1. In Supabase dashboard, temporarily enable "Skip nonce checks" for Google provider
2. If you need nonces enabled (recommended for production), ensure your Google OAuth client is properly configured

#### Issue: Authentication succeeds but no session created
**Solution:**
1. Check Supabase Auth logs in dashboard
2. Verify all three client IDs are in Supabase "Authorized Client IDs"
3. Check that the user's email domain isn't restricted

---

## Environment Variables Reference

Your `.env` file should have these variables (already configured):

```env
EXPO_PUBLIC_SUPABASE_URL=https://yxucgloawhbpjuweoipt.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=652862346862-hl9n4q30e6tph4e3nc6hfm7jm53e9tk2.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=652862346862-rduhjrif2gfpe6p0e0h080j6injbfdmh.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=652862346862-f7i33s5kasurtelsj79jte57fenbvsbh.apps.googleusercontent.com

EXPO_PUBLIC_REDIRECT_SCHEME=zenlit
```

---

## Testing Checklist

- [ ] SHA-1 fingerprint added to Google Cloud Console Android OAuth client
- [ ] Bundle ID verified in Google Cloud Console iOS OAuth client
- [ ] All redirect URIs added to Web OAuth client in Google Cloud Console
- [ ] Google provider enabled in Supabase with all three client IDs
- [ ] Redirect URLs added to Supabase URL configuration
- [ ] Development build created with EAS
- [ ] App installed on physical device (not Expo Go)
- [ ] Google sign-in button taps successfully
- [ ] Google sign-in screen appears
- [ ] After Google sign-in, app receives redirect
- [ ] User session created in Supabase
- [ ] User can access protected screens

---

## Production Deployment Notes

When deploying to production:

1. **Create production builds:**
   ```bash
   eas build --profile production --platform android
   eas build --profile production --platform ios
   ```

2. **Get production SHA-1** (for Android):
   - Production builds have different certificates
   - Run `eas credentials` and select production profile
   - Add production SHA-1 to Google Cloud Console

3. **Update Supabase settings:**
   - Disable "Skip nonce checks" for better security
   - Add production redirect URLs if different from development

4. **Test thoroughly:**
   - Test on multiple devices
   - Test with different Google accounts
   - Verify session persistence

---

## Support and Troubleshooting

If you encounter issues:

1. Check the console logs in your dev client for `[Google OAuth]` messages
2. Review Supabase Auth logs in the dashboard
3. Verify all credentials and URIs match exactly (case-sensitive)
4. Ensure you're testing on a physical device, not Expo Go
5. Try clearing app data and cache if authentication seems stuck

For more help:
- Expo Documentation: https://docs.expo.dev/guides/authentication/
- Supabase Docs: https://supabase.com/docs/guides/auth/social-login/auth-google
- Google OAuth Docs: https://developers.google.com/identity/protocols/oauth2

---

## Quick Reference: What Goes Where

| Configuration Item | Google Cloud Console | Supabase Dashboard |
|-------------------|---------------------|-------------------|
| Android Package Name | ✓ | |
| SHA-1 Fingerprint | ✓ | |
| iOS Bundle ID | ✓ | |
| Redirect URIs | ✓ | ✓ |
| Web Client ID | | ✓ |
| Android Client ID | | ✓ (Authorized list) |
| iOS Client ID | | ✓ (Authorized list) |
| Client Secret | ✓ | ✓ |

---

Last Updated: 2025-10-29
