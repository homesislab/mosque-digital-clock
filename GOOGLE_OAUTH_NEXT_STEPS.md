# ✅ Next Steps: Google OAuth Setup & Testing

## 🎯 Complete Setup in 30 Minutes

Follow these steps in order. **Do not skip steps.**

---

## Step 1: Run Database Migration (5 minutes)

### Option A: Automated (Recommended)
```bash
cd /home/gie/workspace/mosque-digital-clock
bash migrate-google-oauth.sh
```

### Option B: Manual
```bash
# Connect to database
mysql -h localhost -u mosque_user -p mosque_db < schema-migration-google-oauth.sql
```

### Verify Migration Succeeded
```bash
# Connect to database
mysql -h localhost -u mosque_user -p mosque_db

# Run these commands in MySQL:
SHOW COLUMNS FROM users;
```

**Expected Output:** You should see these new columns:
- `google_id` (VARCHAR)
- `google_name` (VARCHAR)  
- `google_picture` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

✅ **If you see these columns, migration succeeded!**

---

## Step 2: Google Cloud Console Setup (10 minutes)

### Follow GOOGLE_OAUTH_SETUP.md Sections 1-3

Open `GOOGLE_OAUTH_SETUP.md` and complete:

1. **Create Google Cloud Project**
   - Go to https://console.cloud.google.com
   - Create new project
   - Name it: "Mosque Digital Clock"
   - Process takes 30 seconds

2. **Enable Google+ API**
   - Search "Google+ API" in APIs & Services
   - Click "Enable"
   - Process takes 10 seconds

3. **Create OAuth 2.0 Credentials**
   - Go to "Credentials" section
   - Click "Create Credentials" → "OAuth client ID"
   - Choose "Web application"
   - Configure:
     - Name: "Mosque Admin Dashboard"
     - Authorized redirect URIs:
       - `http://localhost:3011/api/auth/google/callback` (development)
       - `https://yourdomain.com/api/auth/google/callback` (production - add later)
   - Click "Create"

### Save Your Credentials
You'll receive:
- **Client ID** (looks like: `123456789-abc...apps.googleusercontent.com`)
- **Client Secret** (looks like: `GOCSPX-abc...`)

⚠️ **IMPORTANT:** Never share these credentials publicly!

---

## Step 3: Update Environment Variables (3 minutes)

### Edit `.env` file

```bash
# Open the .env file
nano /home/gie/workspace/mosque-digital-clock/.env
# Or use your preferred editor
```

### Add these lines to `.env`

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
NEXTAUTH_URL=http://localhost:3011
```

**Replace:**
- `YOUR_CLIENT_ID_HERE` with the Client ID from Step 2
- `YOUR_CLIENT_SECRET_HERE` with the Client Secret from Step 2

### Example (with fake credentials for reference):
```env
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
NEXTAUTH_URL=http://localhost:3011
```

### ✅ Save the file

**VERIFY:**
```bash
# Check the variables are set
grep GOOGLE_CLIENT /home/gie/workspace/mosque-digital-clock/.env
```

---

## Step 4: Rebuild Docker Containers (5 minutes)

```bash
cd /home/gie/workspace/mosque-digital-clock

# Stop current containers
docker compose down

# Rebuild and start with new environment variables
docker compose up -d --build
```

### Wait for containers to start (~2-3 minutes)

```bash
# Check if containers are running
docker compose ps

# Expected output:
# CONTAINER ID   IMAGE                            STATUS
# xxxxx          mosque-digital-clock-web-admin   Up 2 minutes
# xxxxx          mosque-digital-clock-web-client  Up 2 minutes
```

### Verify no errors
```bash
# Check for startup errors
docker compose logs web-admin | tail -20
```

**Look for:**
- ✅ "listening on port 3011"
- ✅ "Database connected"
- ✅ No errors with "GOOGLE_CLIENT"

---

## Step 5: Test Google OAuth Login (5 minutes)

### Open Admin Dashboard

In your browser, go to:
```
http://localhost:3011/login
```

### You should see:

✅ Email/Password login form (existing)  
✅ **NEW:** "Masuk dengan Google" button at the bottom

### Test Scenario 1: New User Registration

1. Click **"Masuk dengan Google"** button
2. You'll be redirected to Google login
3. Sign in with your personal Google account
4. Grant permissions (click "Allow")
5. You'll be redirected back to dashboard
6. You should see: `http://localhost:3011/?key=mosque-xxxxx`

**Expected Result:**
- ✅ Logged in successfully
- ✅ Mosque key displayed in URL
- ✅ Dashboard loads
- ✅ Can see "Welcome" message or mosque name

### Register a Test Message

If login works:
```sql
-- Check your user was created:
mysql -h localhost -u mosque_user -p mosque_db
SELECT id, email, mosque_key, google_name, google_picture FROM users ORDER BY id DESC LIMIT 1;
```

You should see your Google name and profile picture URL.

### Test Scenario 2: Logout & Re-login

1. From dashboard, logout (find logout button)
2. Go back to `/login`
3. Click "Masuk dengan Google" again
4. You should be logged in immediately (Google remembers you)

---

## Step 6: Error Testing (3 minutes)

### Simulate OAuth Error

Click "Masuk dengan Google", then:

1. **Permission Denied:** 
   - At Google prompt, click "Cancel"
   - Return to login page
   - You should see error: "Authorization request was denied"

2. **Wrong Redirect:**
   - Modify URL to: `http://localhost:3011/api/auth/google/callback?error=access_denied`
   - Should show error: "Authorization request was denied"

---

## ✅ Final Verification Checklist

Before declaring "Done":

- [ ] Database migration completed
- [ ] Google Cloud Project created
- [ ] OAuth credentials obtained
- [ ] `.env` updated with credentials
- [ ] Docker containers rebuilt and running
- [ ] Can see "Masuk dengan Google" button
- [ ] Clicked button redirects to Google
- [ ] Login succeeds and redirects to dashboard
- [ ] New user created in database
- [ ] User profile data saved (google_name, google_picture)
- [ ] Error messages display correctly
- [ ] Logout works

---

## 🚀 You're Done!

When all 12 items above are checked, Google OAuth is ready to use!

---

## 📝 Troubleshooting

### Issue: "Masuk dengan Google" button doesn't appear

**Possible Cause:** Browser cache  
**Solution:**
```bash
# Hard refresh in browser
Ctrl+Shift+R (Windows/Linux)
or
Cmd+Shift+R (Mac)
```

### Issue: "env variables not found" error

**Possible Cause:** Docker not restarted after `.env` change  
**Solution:**
```bash
docker compose down
docker compose up -d --build
```

### Issue: Redirect URI mismatch error from Google

**Possible Cause:** Wrong redirect URI in Google Console  
**Solution:**
1. Go to Google Console
2. Go to Credentials → Edit OAuth client
3. Verify redirect URI is exactly: `http://localhost:3011/api/auth/google/callback`
4. No trailing slash
5. Match exactly including protocol and port

### Issue: "State token mismatch" error

**Possible Cause:** Session cookie issue or CSRF protection triggered  
**Solution:** Try again in new browser window (incognito mode)

### Issue: User creation fails after OAuth login

**Possible Cause:** Database migration didn't run  
**Solution:**
```bash
# Re-run migration
bash migrate-google-oauth.sh

# Or verify columns:
mysql -h localhost -u mosque_user -p mosque_db -e "SHOW COLUMNS FROM users LIKE 'google%';"
```

---

## 🎓 What Happens Behind the Scenes

1. **User clicks "Masuk dengan Google"**
   - Frontend calls `/api/auth/google`

2. **Backend generates OAuth flow**
   - Creates CSRF token (state)
   - Stores in secure cookie
   - Returns Google OAuth URL

3. **Browser redirects to Google**
   - User sees Google login
   - Optional: Google shows account picker

4. **User grants permissions**
   - Clicks "Allow"
   - Google sends auth code to our callback URL

5. **Backend receives callback**
   - Validates CSRF token
   - Exchanges code for access token
   - Fetches user profile from Google
   - Checks if user exists in database:
     - **If new:** Creates user with Google data
     - **If existing:** Updates Google fields
   - Creates session cookie
   - Redirects to dashboard

6. **User is logged in**
   - Session cookie allows access
   - Dashboard displays user's mosque

---

## 📞 Need Help?

If something doesn't work:

1. **Check Docker logs:**
   ```bash
   docker compose logs web-admin
   ```

2. **Check database:**
   ```bash
   mysql -h localhost -u mosque_user -p mosque_db
   SELECT * FROM users ORDER BY id DESC LIMIT 3;
   ```

3. **Test environment variables:**
   ```bash
   docker compose exec web-admin env | grep GOOGLE
   ```

4. **Review setup guide:**
   Open `GOOGLE_OAUTH_SETUP.md` Section 9 (Troubleshooting)

---

## ⏭️ Next Phase: Security Hardening

After testing Google OAuth:

1. Review `AUDIT_COMPREHENSIVE.md` - 13 security findings
2. Implement `IMPLEMENTATION_CHECKLIST.md` - 25 actionable tasks
3. Phase 1 (Critical): Password security, input validation, rate limiting  
4. Phase 2-4: Performance, monitoring, documentation

---

**Estimate Time to Deploy:** 30 minutes  
**Estimated Testing Time:** 15 minutes  
**Estimated Security Hardening:** 2-3 hours (Phase 1)

Good luck! 🚀

