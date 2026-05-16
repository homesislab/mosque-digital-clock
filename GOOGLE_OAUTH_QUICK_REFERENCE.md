# 📋 Google OAuth Quick Reference Card

Print this or save to browser for quick lookup!

---

## 🔗 Key URLs

| Purpose | URL |
|---------|-----|
| Admin Dashboard | http://localhost:3011 |
| Login Page | http://localhost:3011/login |
| Google OAuth Callback | http://localhost:3011/api/auth/google/callback |
| Google Cloud Console | https://console.cloud.google.com |
| Setup Guide | See `GOOGLE_OAUTH_SETUP.md` |
| Next Steps | See `GOOGLE_OAUTH_NEXT_STEPS.md` |

---

## 📁 Important Files (Google OAuth)

```
✅ Configuration:
   .env (CONTAINS SECRETS - NEVER COMMIT!)
   
✅ Code Files:
   apps/web-admin/app/api/auth/google/route.ts
   apps/web-admin/app/api/auth/google/callback/route.ts
   apps/web-admin/app/login/page.tsx
   apps/web-admin/lib/user-store.ts
   
✅ Database:
   schema-migration-google-oauth.sql
   migrate-google-oauth.sh
   
✅ Documentation:
   GOOGLE_OAUTH_SETUP.md (detailed setup)
   GOOGLE_OAUTH_IMPLEMENTATION.md (feature overview)
   GOOGLE_OAUTH_NEXT_STEPS.md (quick start)
   GOOGLE_OAUTH_QUICK_REFERENCE.md (THIS FILE)
```

---

## 🔐 Environment Variables Required

```bash
# MUST SET THESE:
GOOGLE_CLIENT_ID=XXXXXX
GOOGLE_CLIENT_SECRET=XXXXXX
NEXTAUTH_URL=http://localhost:3011

# Store in: /home/gie/workspace/mosque-digital-clock/.env
# ⚠️ NEVER commit .env to Git
```

---

## 🚀 Quick Start Commands

```bash
# 1. Database migration
cd /home/gie/workspace/mosque-digital-clock
bash migrate-google-oauth.sh

# 2. Rebuild Docker
docker compose down && docker compose up -d --build

# 3. Check if running
docker compose ps

# 4. View logs
docker compose logs web-admin

# 5. Access dashboard
# Open browser: http://localhost:3011/login
```

---

## 🧪 Test Cases

### Login Success
```
1. Click "Masuk dengan Google"
2. Log in with Google
3. Grant permissions
4. ✅ Redirected to dashboard
5. ✅ Mosque key in URL
```

### Permission Denied
```
1. Click "Masuk dengan Google"
2. At Google prompt, click Cancel
3. ✅ Error message shown
4. ✅ Redirected back to login
```

### Existing Email
```
1. First login: email/password
2. Later: click "Masuk dengan Google" with same email
3. ✅ Account linked
4. ✅ Can use either method
```

---

## 🗄️ Database Fields

### New Columns Added to `users` Table

```sql
ALTER TABLE users ADD COLUMN:
  - google_id VARCHAR(255) UNIQUE
  - google_name VARCHAR(255)
  - google_picture VARCHAR(500)
  - created_at TIMESTAMP
  - updated_at TIMESTAMP
```

### Check Migration Worked

```sql
mysql -h localhost -u mosque_user -p mosque_db
SHOW COLUMNS FROM users;
```

---

## 🔒 Security Summary

| Feature | Implemented |
|---------|------------|
| CSRF Protection (State Token) | ✅ |
| Secure Token Exchange | ✅ |
| HTTPOnly Cookies | ✅ |
| Secure Flag (HTTPS) | ✅ Production |
| SameSite Cookie Policy | ✅ Strict |
| Input Validation | ✅ |
| Error Messages Safe | ✅ |
| Rate Limiting Ready | ✅ (Not yet enabled) |

---

## 🐛 Debugging Commands

```bash
# Check environment variables
docker compose exec web-admin env | grep GOOGLE

# Check database connection
docker compose exec web-admin mysql -h mysql_host -u user -p -e "SELECT 1;"

# View full logs
docker compose logs web-admin -f

# Test API directly
curl http://localhost:3011/api/auth/google

# Check database for users
mysql -h localhost -u mosque_user -p -e "SELECT id, email, google_name FROM mosque_db.users;"

# Inspect session cookie
# (Browser DevTools → Application → Cookies → localhost:3011)
```

---

## ⚠️ Common Mistakes

| ❌ Mistake | ✅ Solution |
|-----------|-----------|
| Forgot to run migration | Run: `bash migrate-google-oauth.sh` |
| Docker not restarted | Run: `docker compose down && docker compose up -d` |
| Wrong redirect URI | Check Google Console exactly matches |
| .env not sourced | Restart Docker containers |
| Browser cache | Hard refresh: Ctrl+Shift+R |
| Secrets in Git | Use .gitignore, never commit .env |
| HTTP in production | Use HTTPS + set secure=true |

---

## 📞 Support Channels

### Before Asking for Help:

1. ✅ Check `GOOGLE_OAUTH_NEXT_STEPS.md` Section "Troubleshooting"
2. ✅ Check `GOOGLE_OAUTH_SETUP.md` Section 9 (Full troubleshooting)
3. ✅ Review Docker logs: `docker compose logs web-admin`
4. ✅ Verify .env has credentials: `grep GOOGLE .env`

### Info to Include When Asking:

```
- Error message (exact)
- Command run (exact)
- Expected vs actual output
- Last successful operation
- Docker logs (last 20 lines)
```

---

## 📊 Feature Comparison

### Before Implementing Google OAuth

```
Authentication Methods:    1 (email/password only)
Login Speed:              Medium (2 factor)
User Registration:        Manual form
Security Tokens:          Session-based
Password Reset Required:  Yes
Multi-Account:            No
```

### After Implementing Google OAuth

```
Authentication Methods:    2 (email + Google)
Login Speed:              Fast (Google remembers)
User Registration:        Automatic (Google provides data)
Security Tokens:          Session + OAuth tokens
Password Reset Required:  No (for Google accounts)
Multi-Account:            Yes (Google + email)
```

---

## 🎯 Success Criteria

You'll know it's working when:

- [x] Google button appears on login page
- [x] Clicking button redirects to Google
- [x] Can log in with Google account
- [x] Dashboard loads after login
- [x] User data in database (google_name, google_picture)
- [x] Logout works
- [x] Can log back in
- [x] Error messages display correctly
- [x] No console errors

---

## 🔄 Workflow Summary

```
Setup Phase (30 min)
├─ Step 1: Database migration
├─ Step 2: Google Cloud setup
├─ Step 3: Environment variables
├─ Step 4: Docker rebuild
└─ Step 5: Test login

Testing Phase (15 min)
├─ New user registration
├─ Existing user login
├─ Permission denied error
└─ Logout/re-login

Production Phase
├─ Set HTTPS URL
├─ Update Google Console
├─ Enable rate limiting
└─ Deploy with monitoring
```

---

## 📚 Related Docs

| Document | Purpose |
|----------|---------|
| GOOGLE_OAUTH_SETUP.md | Complete step-by-step setup |
| GOOGLE_OAUTH_NEXT_STEPS.md | Quick start guide |
| AUDIT_COMPREHENSIVE.md | Security audit (13 items) |
| IMPLEMENTATION_CHECKLIST.md | Feature roadmap (25 items) |

---

## ✨ That's It!

You now have everything you need. Start with `GOOGLE_OAUTH_NEXT_STEPS.md` and follow step-by-step.

**Time to deploy:** 30 minutes  
**Time to test:** 15 minutes  
**Complexity:** Moderate (all code done, just config)

Good luck! 🚀

---

**Created:** April 8, 2026  
**Status:** Complete  
**Version:** 1.0

