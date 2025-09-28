# Google OAuth Setup Guide for CareSync

## Overview
This guide will help you set up Google OAuth authentication for your CareSync application. After completing these steps, users will be able to sign in with their Google accounts and choose their role (Patient or Healthcare Provider).

## Prerequisites
- Google Cloud Console account
- Supabase project set up
- CareSync application running

## Step 1: Google Cloud Console Setup

### 1.1 Create a New Project (or use existing)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name it "CareSync" and create

### 1.2 Enable Google+ API
1. Go to "APIs & Services" → "Library"
2. Search for "Google+ API" 
3. Click and enable it

### 1.3 Configure OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type
3. Fill in the application details:
   - **App name**: CareSync
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Add scopes:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
5. Save and continue

### 1.4 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Configure:
   - **Name**: CareSync Web Client
   - **Authorized JavaScript origins**: 
     - `http://localhost:5175` (for development)
     - `https://your-domain.com` (for production)
   - **Authorized redirect URIs**:
     - `https://your-supabase-project.supabase.co/auth/v1/callback`
5. Save and note down:
   - **Client ID**
   - **Client Secret**

## Step 2: Supabase Configuration

### 2.1 Enable Google Provider
1. Go to your Supabase project dashboard
2. Navigate to "Authentication" → "Providers"
3. Find "Google" and click "Enable"

### 2.2 Configure Google Settings
1. Enter the **Client ID** and **Client Secret** from Step 1.4
2. Set the redirect URL to: `https://your-supabase-project.supabase.co/auth/v1/callback`
3. Save the configuration

## Step 3: Update Your Application

### 3.1 Environment Variables (if needed)
Create a `.env.local` file in your project root:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3.2 Test the Authentication Flow

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open your app at `http://localhost:5175`

3. Click "Get Started" or "Sign In"

4. Click "Continue with Google" in the auth modal

5. Complete Google authentication

6. You should see the Role Selection Modal

7. Choose your role (Patient or Healthcare Provider)

8. You should be redirected to the appropriate dashboard

## Expected Authentication Flow

1. **Landing Page**: User clicks "Get Started" or "Sign In"
2. **Auth Modal**: User can choose email/password OR Google sign-in
3. **Google OAuth**: If Google is chosen, user is redirected to Google
4. **Google Consent**: User grants permissions to CareSync
5. **Role Selection**: New users choose Patient or Healthcare Provider role
6. **Dashboard Redirect**: User is automatically redirected to their dashboard

## Troubleshooting

### Common Issues:

1. **"OAuth client not found"**
   - Check that your Client ID is correct in Supabase
   - Ensure the OAuth consent screen is published

2. **"Redirect URI mismatch"**
   - Verify redirect URIs in Google Console match Supabase callback URL
   - Check for typos in the URLs

3. **Users redirected to landing page after Google sign-in**
   - This was the original issue - now fixed!
   - Users without profiles will see role selection
   - Users with profiles will be redirected to their dashboard

4. **"This app hasn't been verified"**
   - Add your own email as a test user in Google Console
   - For production, submit for verification

### Testing Tips:
- Use an incognito window to test the full flow
- Clear cookies/localStorage if authentication seems stuck
- Check browser console for any error messages

## Production Deployment

When deploying to production:

1. Update Google Console authorized origins and redirect URIs
2. Update Supabase redirect URLs
3. Ensure HTTPS is enabled
4. Test the complete authentication flow

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify all URLs match between Google Console and Supabase
3. Ensure the Google+ API is enabled
4. Test with a fresh incognito session

---

Your CareSync application now supports:
✅ Email/password authentication
✅ Google OAuth authentication
✅ Role-based user profiles
✅ Automatic dashboard redirection
✅ Secure, HIPAA-compliant data handling
