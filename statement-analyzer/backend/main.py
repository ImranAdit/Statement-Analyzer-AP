from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from authlib.integrations.starlette_client import OAuth
from pydantic import BaseModel
import pdfplumber, pytesseract
from PIL import Image
import io, re, os, secrets

app = FastAPI(title="Adit Pay Statement Analyser")

# ── Environment Config ─────────────────────────────────────────────────────────
SESSION_SECRET = os.getenv("SESSION_SECRET", secrets.token_hex(32))

APP_BASE_URL = os.getenv("APP_BASE_URL")  # backend URL
FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "https://statement-analyzer-ap-1.onrender.com"
)

GOOGLE_CLIENT_ID     = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
ALLOWED_DOMAIN       = "adit.com"

# ── Session Middleware (FIXED FOR RENDER) ──────────────────────────────────────
app.add_middleware(
    SessionMiddleware,
    secret_key=SESSION_SECRET,
    https_only=True,
    same_site="none"
)

# ── CORS (FIXED) ───────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Google OAuth ───────────────────────────────────────────────────────────────
oauth = OAuth()
oauth.register(
    name="google",
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

def get_current_user(request: Request):
    user = request.session.get("user")
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

# ── Auth Routes (FIXED REDIRECTS) ──────────────────────────────────────────────

@app.get("/auth/login")
async def login(request: Request):
    redirect_uri = f"{APP_BASE_URL}/auth/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)

@app.get("/auth/callback")
async def auth_callback(request: Request):
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception:
        return RedirectResponse(url=f"{FRONTEND_URL}/?error=auth_failed")

    user_info = token.get("userinfo") or {}
    email: str = user_info.get("email", "")

    if not email.lower().endswith(f"@{ALLOWED_DOMAIN}"):
        return RedirectResponse(
            url=f"{FRONTEND_URL}/?error=unauthorized_domain&email={email}"
        )

    request.session["user"] = {
        "email":   email,
        "name":    user_info.get("name", email.split("@")[0]),
        "picture": user_info.get("picture", ""),
    }

    return RedirectResponse(url=f"{FRONTEND_URL}/")

@app.get("/auth/logout")
async def logout(request: Request):
    request.session.clear()
    return RedirectResponse(url=f"{FRONTEND_URL}/")

@app.get("/api/me")
async def me(request: Request):
    user = request.session.get("user")
    if not user:
        return JSONResponse({"authenticated": False})
    return JSONResponse({"authenticated": True, "user": user})

# ── Calculation Logic ──────────────────────────────────────────────────────────
ADIT_RATE_CP   = 0.0225
ADIT_AUTH_CP   = 0.20
ADIT_RATE_ONL  = 0.0290
ADIT_AUTH_ONL  = 0.30

def calc_cp(amount, count):
    tf = amount * ADIT_RATE_CP
    af = count  * ADIT_AUTH_CP
    return {"type": "Card Present", "amount": amount, "count": count,
            "trn_fee": round(tf,2), "auth_fee": round(af,2),
            "total_fee": round(tf+af,2), "rate_label": "2.25% + $0.20"}

def calc_online(amount, count):
    tf = amount * ADIT_RATE_ONL
    af = count  * ADIT_AUTH_ONL
    return {"type": "Online (Card Not Present)", "amount": amount, "count": count,
            "trn_fee": round(tf,2), "auth_fee": round(af,2),
            "total_fee": round(tf+af,2), "rate_label": "2.90% + $0.30"}

def build_analysis(existing_merchant, total_amount, total_count, total_fees_paid, card_present_pct, mode):
    if mode == "card_present_only":
        adit_row   = calc_cp(total_amount, total_count)
        adit_total = adit_row["total_fee"]
        rows = [adit_row]
    else:
        op = 1.0 - card_present_pct
        r_cp  = calc_cp(total_amount * card_present_pct, total_count * card_present_pct)
        r_on  = calc_online(total_amount * op, total_count * op)
        adit_total = r_cp["total_fee"] + r_on["total_fee"]
        rows = [r_cp, r_on]

    avg_pct  = adit_total / total_amount if total_amount else 0
    ex_pct   = total_fees_paid / total_amount if total_amount else 0
    return {
        "existing_merchant":    existing_merchant,
        "total_amount":         round(total_amount, 2),
        "total_count":          total_count,
        "total_fees_paid":      round(total_fees_paid, 2),
        "existing_avg_fee_pct": round(ex_pct * 100, 4),
        "card_present_pct":     round(card_present_pct * 100, 1),
        "online_pct":           round((1 - card_present_pct) * 100, 1),
        "mode":                 mode,
        "adit_rows":            rows,
        "adit_total_fee":       round(adit_total, 2),
        "adit_avg_fee_pct":     round(avg_pct * 100, 4),
        "savings":              round(total_fees_paid - adit_total, 2),
    }

# ── File Parsing ───────────────────────────────────────────────────────────────
def extract_pdf(data):
    text = ""
    with pdfplumber.open(io.BytesIO(data)) as pdf:
        for page in pdf.pages:
            t = page.extract_text()
            if t:
                text += t + "\n"
    return text

def extract_image(data):
    return pytesseract.image_to_string(Image.open(io.BytesIO(data)))

def parse_statement(raw):
    return {"raw_text": raw[:3000]}

# ── API Routes ─────────────────────────────────────────────────────────────────
@app.post("/api/upload")
async def upload_statement(file: UploadFile = File(...), user=Depends(get_current_user)):
    data = await file.read()
    raw = extract_pdf(data)
    return {"extracted": parse_statement(raw)}

@app.post("/api/calculate")
async def calculate(inp: BaseModel, user=Depends(get_current_user)):
    return {"message": "Calculation working"}

# ── Serve React SPA ────────────────────────────────────────────────────────────
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

if os.path.isdir(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def spa(full_path: str):
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
