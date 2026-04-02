from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from authlib.integrations.starlette_client import OAuth
from pydantic import BaseModel
import pdfplumber, pytesseract
from PIL import Image
import io, re, os, secrets, sqlite3, json, httpx

def init_db():
    conn = sqlite3.connect("db.sqlite")
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS analysis_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_email TEXT,
                    merchant TEXT,
                    total_amount REAL,
                    total_fees_paid REAL,
                    savings REAL,
                    diff_pct REAL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )''')
    conn.commit()
    conn.close()

init_db()
app = FastAPI(title="Adit Pay Statement Analyser")

# ── CONSTANTS (HARDCODED FOR STABILITY) ────────────────────────────────────────
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://statement-analyzer-ap-1.onrender.com")
APP_BASE_URL = os.getenv("APP_BASE_URL", "https://statement-analyzer-ap.onrender.com")

SESSION_SECRET = os.getenv("SESSION_SECRET", secrets.token_hex(32))

GOOGLE_CLIENT_ID     = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
ALLOWED_DOMAIN       = "adit.com"

# ── Session Middleware ─────────────────────────────────────────────────────────
app.add_middleware(
    SessionMiddleware,
    secret_key=SESSION_SECRET,
    https_only=True,
    same_site="none"
)

# ── CORS ───────────────────────────────────────────────────────────────────────
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

# ── Auth Routes ────────────────────────────────────────────────────────────────

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
        "email": email,
        "name": user_info.get("name", email.split("@")[0]),
        "picture": user_info.get("picture", ""),
    }

    # ✅ FINAL REDIRECT FIX
    return RedirectResponse(url=FRONTEND_URL)


@app.get("/auth/logout")
async def logout(request: Request):
    request.session.clear()
    return RedirectResponse(url=FRONTEND_URL)


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
    af = count * ADIT_AUTH_CP
    return {"type": "Card Present", "amount": amount, "count": count,
            "trn_fee": round(tf, 2), "auth_fee": round(af, 2),
            "total_fee": round(tf + af, 2)}

def calc_online(amount, count):
    tf = amount * ADIT_RATE_ONL
    af = count * ADIT_AUTH_ONL
    return {"type": "Online", "amount": amount, "count": count,
            "trn_fee": round(tf, 2), "auth_fee": round(af, 2),
            "total_fee": round(tf + af, 2)}

def build_analysis(existing_merchant, total_amount, total_count, total_fees_paid, card_present_pct):
    cp = calc_cp(total_amount * card_present_pct, total_count * card_present_pct)
    op = calc_online(total_amount * (1 - card_present_pct), total_count * (1 - card_present_pct))
    adit_total = cp["total_fee"] + op["total_fee"]

    return {
        "existing_merchant": existing_merchant,
        "total_amount": total_amount,
        "total_fees_paid": total_fees_paid,
        "adit_total_fee": round(adit_total, 2),
        "savings": round(total_fees_paid - adit_total, 2),
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

async def parse_statement(raw):
    extracted = {
        "merchant": "",
        "total_amount": "",
        "total_count": "",
        "total_fees": "",
        "raw_text": raw[:2000]
    }

    api_key = os.getenv("GEMINI_API_KEY", "AIzaSyCJB3XbIbel0cot_SR24B59VtBWmp4ssh4")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    
    prompt = """
    You are a financial analyst OCR data extraction tool.
    Extract the following from this messy credit card processing statement text:
    - merchant_name (string)
    - total_amount_processed (float)
    - total_transactions_count (integer)
    - total_fees_paid (float)
    
    Return ONLY a raw JSON object. Do not include markdown formatting. 
    If a value is truly missing or impossible to find, use null.
    """
    
    payload = {
        "contents": [{"parts": [{"text": prompt + "\n\nTEXT:\n" + raw[:20000]}]}],
        "generationConfig": {"responseMimeType": "application/json"}
    }
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=payload, timeout=20.0)
            data = resp.json()
            
            text_resp = data["candidates"][0]["content"]["parts"][0]["text"]
            ai_data = json.loads(text_resp)
            
            if ai_data.get("merchant_name"): extracted["merchant"] = str(ai_data["merchant_name"])
            if ai_data.get("total_amount_processed") is not None: extracted["total_amount"] = str(ai_data["total_amount_processed"])
            if ai_data.get("total_transactions_count") is not None: extracted["total_count"] = str(ai_data["total_transactions_count"])
            if ai_data.get("total_fees_paid") is not None: extracted["total_fees"] = str(ai_data["total_fees_paid"])
    except Exception as e:
        print(f"Gemini AI Parsing failed: {e}")
        
    return extracted

# ── API Routes ─────────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"message": "Statement Analyzer API is running"}

@app.post("/api/upload")
async def upload_statement(file: UploadFile = File(...), user=Depends(get_current_user)):
    data = await file.read()
    raw = extract_pdf(data)
    extracted = await parse_statement(raw)
    return {"extracted": extracted}

class CalculateRequest(BaseModel):
    existing_merchant: str
    total_amount: float
    total_count: float
    total_fees_paid: float
    card_present_pct: float

@app.post("/api/calculate")
async def calculate_savings(req: CalculateRequest, user=Depends(get_current_user)):
    card_present_pct = req.card_present_pct / 100.0
    cp = calc_cp(req.total_amount * card_present_pct, req.total_count * card_present_pct)
    op = calc_online(req.total_amount * (1 - card_present_pct), req.total_count * (1 - card_present_pct))
    adit_total = cp["total_fee"] + op["total_fee"]
    
    existing_avg_fee_pct = (req.total_fees_paid / req.total_amount) * 100 if req.total_amount > 0 else 0
    adit_avg_fee_pct = (adit_total / req.total_amount) * 100 if req.total_amount > 0 else 0

    cp["rate_label"] = f"{ADIT_RATE_CP*100}% + ${ADIT_AUTH_CP}"
    op["rate_label"] = f"{ADIT_RATE_ONL*100}% + ${ADIT_AUTH_ONL}"

    monthly_savings = req.total_fees_paid - adit_total
    
    # Generate AI Summary text
    diff_pct = (monthly_savings / req.total_fees_paid) * 100 if req.total_fees_paid > 0 else 0
    merchant_display = req.existing_merchant.upper() if req.existing_merchant else "MERCHANT"
    ai_summary = f"{merchant_display} currently pays ${req.total_fees_paid:,.2f}/month to their existing processor at a {existing_avg_fee_pct:.2f}% effective rate. Switching to Adit Pay's flat-rate pricing brings that down to ${adit_total:,.2f}/month — a {diff_pct:.1f}% reduction worth ${monthly_savings:,.2f}/month in real cash back to the practice."

    # Save to history DB
    conn = sqlite3.connect("db.sqlite")
    c = conn.cursor()
    c.execute("INSERT INTO analysis_history (user_email, merchant, total_amount, total_fees_paid, savings, diff_pct) VALUES (?, ?, ?, ?, ?, ?)",
              (user.get("email", "anonymous"), req.existing_merchant or "Unnamed Merchant", req.total_amount, req.total_fees_paid, monthly_savings, diff_pct))
    conn.commit()
    conn.close()

    return {
        "existing_merchant": req.existing_merchant,
        "total_amount": req.total_amount,
        "total_count": req.total_count,
        "total_fees_paid": req.total_fees_paid,
        "existing_avg_fee_pct": existing_avg_fee_pct,
        "adit_total_fee": round(adit_total, 2),
        "adit_avg_fee_pct": adit_avg_fee_pct,
        "savings": round(monthly_savings, 2),
        "savings_1_yr": round(monthly_savings * 12, 2),
        "savings_3_yr": round(monthly_savings * 36, 2),
        "savings_5_yr": round(monthly_savings * 60, 2),
        "diff_pct": round(diff_pct, 2),
        "ai_summary": ai_summary,
        "adit_rows": [cp, op]
    }

@app.get("/api/history")
def get_history(request: Request):
    user = request.session.get("user")
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    conn = sqlite3.connect("db.sqlite")
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM analysis_history WHERE user_email = ? ORDER BY created_at DESC", (user["email"],))
    rows = [dict(row) for row in c.fetchall()]
    conn.close()
    return {"history": rows}

# ── SPA Serve (optional) ───────────────────────────────────────────────────────
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

if os.path.isdir(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def spa(full_path: str):
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
