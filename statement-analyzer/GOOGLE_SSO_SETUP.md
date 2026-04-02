# Google SSO Setup Guide

Follow these steps to enable @adit.com Google SSO for the Statement Analyser.

---

## Step 1 — Create a Google OAuth App

1. Go to https://console.cloud.google.com/
2. Create a new project (or select an existing one)
3. Navigate to **APIs & Services → OAuth consent screen**
4. Choose **Internal** (restricts to your Google Workspace org — perfect for @adit.com only)
5. Fill in:
   - App name: `Adit Pay Statement Analyser`
   - User support email: your email
   - Authorized domain: `adit.com`
6. Click **Save and Continue** through the scopes page (no extra scopes needed)

---

## Step 2 — Create OAuth Credentials

1. Go to **APIs & Services → Credentials**
2. Click **+ Create Credentials → OAuth Client ID**
3. Application type: **Web application**
4. Name: `Statement Analyser`
5. Add Authorized redirect URIs:
   - For local dev: `http://localhost:8000/auth/callback`
   - For Railway: `https://YOUR-APP.railway.app/auth/callback`
6. Click **Create**
7. Copy your **Client ID** and **Client Secret**

---

## Step 3 — Set Environment Variables on Railway

In your Railway project dashboard → **Variables**, add:

| Variable              | Value                                    |
|-----------------------|------------------------------------------|
| `GOOGLE_CLIENT_ID`    | Your OAuth Client ID                     |
| `GOOGLE_CLIENT_SECRET`| Your OAuth Client Secret                 |
| `APP_BASE_URL`        | `https://YOUR-APP.railway.app`           |
| `SESSION_SECRET`      | Any long random string (32+ chars)       |

Generate a SESSION_SECRET with:
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

---

## Step 4 — Update the OAuth Redirect URI

After Railway gives you your deployment URL, go back to Google Cloud Console:
- **APIs & Services → Credentials → your OAuth client**
- Add `https://YOUR-RAILWAY-URL.railway.app/auth/callback` to Authorized redirect URIs

---

## How the restriction works

- Only users who sign in with a **@adit.com Google account** can access the app
- The backend checks `email.endswith("@adit.com")` after OAuth callback
- Any other email (Gmail, other orgs) gets redirected to `/?error=unauthorized_domain`
- The login page shows a clear error: *"Only @adit.com email addresses are allowed"*
- All API endpoints (`/api/upload`, `/api/calculate`) require an active session — no session = 401

---

## Local development (without Google OAuth)

If you want to run locally without setting up OAuth, you can temporarily bypass auth by
adding this to `backend/main.py` after the session middleware setup:

```python
# DEV ONLY — remove before deploying
@app.middleware("http")
async def dev_auth_bypass(request, call_next):
    if request.url.path.startswith("/api/") or request.url.path == "/":
        request.session["user"] = {"email": "dev@adit.com", "name": "Dev User", "picture": ""}
    return await call_next(request)
```
