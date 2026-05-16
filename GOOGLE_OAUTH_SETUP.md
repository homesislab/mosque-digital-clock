# 🔐 Google OAuth Setup Guide

**Version:** 1.0  
**Date:** April 8, 2026

---

## 📋 Overview

This guide explains how to set up Google OAuth 2.0 authentication for the Mosque Digital Clock Admin Dashboard. Users can now log in using their Google accounts instead of just email/password.

**Features:**
✅ Sign in with Google  
✅ One-click registration with Google account  
✅ Automatic user creation  
✅ CSRF protection with state tokens  
✅ Secure token exchange  

---

## 🔧 Prerequisites

- Google Cloud Project (free tier available)
- Admin access to Google Cloud Console
- Base application URL (for redirect URI)

---

## 📝 Step 1: Create Google Cloud Project

### 1.1 Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click the project dropdown at the top

### 1.2 Create New Project

1. Click **"NEW PROJECT"**
2. Enter project name: `Mosque Digital Clock`
3. Leave organization and location as default
4. Click **"CREATE"**
5. Wait for project to be created (about 1-2 minutes)

---

## 🔑 Step 2: Enable Google+ API

1. In the Cloud Console, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"**
3. Click on it and select **"ENABLE"**
4. Wait for it to enable (~30 seconds)

---

## 🎫 Step 3: Create OAuth 2.0 Credentials

### 3.1 Create OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** (for external users)
3. Click **"CREATE"**
4. Fill in the form:

**Application Information:**
```
App name:           Mosque Digital Clock
User support email: your-email@example.com
```

**Application Logo (Optional):**
- Upload your mosque logo or skip

**Developer Contact:**
```
Email: your-email@example.com
```

5. Click **"SAVE AND CONTINUE"**
6. On "Scopes" page, click **"ADD OR REMOVE SCOPES"**
7. Select these scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
8. Click **"UPDATE"** then **"SAVE AND CONTINUE"**
9. Click **"SAVE AND CONTINUE"** on "Test users" page

### 3.2 Create OAuth Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. Select **"Web application"**
4. Name: `Mosque Admin Dashboard`
5. Under **"Authorized redirect URIs"**, add:
   ```
   http://localhost:3011/api/auth/google/callback
   ```
   
   For production, also add:
   ```
   https://yourdomain.com/api/auth/google/callback
   ```

6. Click **"CREATE"**
7. A popup will show your credentials. Copy:
   - **Client ID**
   - **Client Secret**

⚠️ **IMPORTANT:** Store these securely! Never commit to version control.

---

## 🔐 Step 4: Configure Environment Variables

### 4.1 Add to `.env` file

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
NEXTAUTH_URL=http://localhost:3011
```

### 4.2 For Production

```bash
GOOGLE_CLIENT_ID=your_production_client_id
GOOGLE_CLIENT_SECRET=your_production_client_secret
NEXTAUTH_URL=https://yourapp.com
```

---

## 🗄️ Step 5: Update Database Schema

### 5.1 Run Migration Script

```bash
bash migrate-google-oauth.sh
```

This script will:
- Add `google_id` column (unique identifier from Google)
- Add `google_name` column (user's display name)
- Add `google_picture` column (profile picture URL)
- Add `created_at` timestamp column

### 5.2 Manual Migration (if script fails)

```sql
ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN google_name VARCHAR(255);
ALTER TABLE users ADD COLUMN google_picture VARCHAR(500);
ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
```

---

## 🚀 Step 6: Deploy & Test

### 6.1 Local Testing

1. Rebuild the application:
   ```bash
   npm install uuid  # If not already installed
   docker compose down
   docker compose up -d --build
   ```

2. Open `http://localhost:3011/login`
3. Click **"Masuk dengan Google"** button
4. Follow Google's permission prompt
5. You should be logged in!

### 6.2 Test Flows

**New User Registration:**
1. Click "Masuk dengan Google"
2. Use a Google account you haven't registered yet
3. System creates new account + mosque key automatically
4. Redirects to dashboard

**Existing User:**
1. Register first with email/password
2. Later log in with Google on same email
3. Account merges and Google OAuth is linked

**Error Handling:**
Test that error messages appear for:
- User denies permission (`access_denied`)
- Session expires (`state_mismatch`)
- Network errors

---

## 📊 Production Checklist

Before deploying to production:

```
[ ] Google OAuth credentials created
[ ] Credentials stored securely (not in git)
[ ] NEXTAUTH_URL set to production domain
[ ] Redirect URI whitelisted in Google Console
[ ] Database migrated with new columns
[ ] HTTPS enabled (required for production)
[ ] Rate limiting configured for auth endpoints
[ ] Error logging set up
[ ] User testing completed
[ ] Rollback plan documented
```

---

## 🔍 Troubleshooting

### Problem: "Redirect URI mismatch"

**Solution:**
1. Check exact URI in Google Console
2. Ensure it matches exactly (including trailing slash, http vs https)
3. Common mistake: forgetting `/api/auth/google/callback` suffix

### Problem: "Google OAuth not configured"

**Solution:**
1. Verify `.env` has `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
2. Restart Docker container: `docker compose restart web-admin`
3. Check Docker logs: `docker compose logs web-admin | grep -i google`

### Problem: "State mismatch" error

**Solution:**
1. This is a CSRF protection - likely means:
   - OAuth callback took too long (>10 min)
   - Multiple simultaneous login attempts
   - Browser cookies disabled
2. User should just try again

### Problem: "No email in OAuth profile"

**Solution:**
1. User didn't grant email permission
2. Have them log out of Google and try again
3. Or ask them to manage their Google account privacy settings

---

## 🔐 Security Notes

### What This Implementation Protects Against:

✅ **CSRF Attacks** - Uses state token validation  
✅ **Unauthorized Token Usage** - Tokens exchanged server-side  
✅ **Credential Exposure** - Client secret never sent to client  
✅ **Session Hijacking** - Secure HTTP-only cookies  
✅ **Man-in-the-Middle** - HTTPS required in production  

### Best Practices Implemented:

1. **State Token Generation:**
   ```typescript
   const state = crypto.randomBytes(32).toString('hex');
   // Stored in secure, HTTP-only cookie
   ```

2. **Server-side Token Exchange:**
   ```typescript
   // Only backend has access to client_secret
   // Never exposed to client/browser
   ```

3. **Secure Session:**
   ```typescript
   cookieStore.set('admin-session', userId, {
       httpOnly: true,      // Can't be accessed by JavaScript
       secure: true,        // Only sent over HTTPS
       sameSite: 'strict',  // CSRF protection
   });
   ```

---

## 📱 Supported Features

### Current

✅ Google Sign-In (login)  
✅ Google Sign-Up (registration)  
✅ Automatic account creation  
✅ Profile picture display (future UI enhancement)  
✅ Multi-mosque support per Google account  

### Future Enhancements

- [ ] Gmail integration for automated reminders
- [ ] Google Calendar sync for events
- [ ] Google Drive backup of configurations
- [ ] Multi-factor authentication requirement
- [ ] Session management dashboard

---

## 📞 Support

**For issues:**
1. Check logs: `docker compose logs web-admin`
2. Verify environment variables: `docker compose config | grep GOOGLE`
3. Test Google OAuth directly: https://developers.google.com/oauthplayground

**Common Resources:**
- [Google OAuth 2.0 Docs](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Web API Authentication Guide](https://developers.google.com/identity/protocols/oauth2/web-server-flow)

---

## ✅ Verification Checklist

After setup, verify everything works:

```sql
-- Check if new columns exist
SHOW COLUMNS FROM users;
-- Should show: google_id, google_name, google_picture, created_at

-- Check for test Google-authenticated user
SELECT id, email, google_id, google_name FROM users WHERE google_id IS NOT NULL;
```

---

**Next Steps:**
1. Follow all steps above
2. Test locally first
3. Create credentials for production
4. Deploy with full testing
5. Monitor error logs for first week

👍 **Ready to launch Google Sign-In!**

