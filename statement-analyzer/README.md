# Adit Pay — Statement Analyser

Internal tool for Adit team members. Upload a merchant/bank statement (PDF or scanned image)
and get an instant fee comparison against Adit Pay pricing.

## Access Control

- **Only @adit.com Google accounts** can log in
- Authentication via Google OAuth SSO
- All API endpoints are session-protected
- Non-Adit emails are rejected with a clear error message

See `GOOGLE_SSO_SETUP.md` for complete OAuth configuration steps.

## Pricing Logic

| Mode | Rate | Auth Fee |
|------|------|----------|
| Card Present | 2.25% | $0.20/trn |
| Online (Card Not Present) | 2.90% | $0.30/trn |

## Local Development

```bash
# Set env vars
export GOOGLE_CLIENT_ID=your_client_id
export GOOGLE_CLIENT_SECRET=your_client_secret
export APP_BASE_URL=http://localhost:8000
export SESSION_SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")

# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev   # http://localhost:5173
```

## Deploy to Railway

1. Push this folder to a GitHub repo
2. Railway → New Project → Deploy from GitHub → select repo
3. Add environment variables (see `GOOGLE_SSO_SETUP.md`)
4. Update Google OAuth redirect URI to `https://YOUR-APP.railway.app/auth/callback`
5. Deploy → live in ~2 minutes

## Project Structure

```
statement-analyzer/
├── backend/
│   ├── main.py              # FastAPI + Google OAuth + calculation logic
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Full UI with auth-gated pages
│   │   ├── main.jsx
│   │   └── index.css        # Adit brand CSS
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── Dockerfile
├── railway.toml
├── GOOGLE_SSO_SETUP.md      # Step-by-step OAuth setup
└── README.md
```
