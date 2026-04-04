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

# ── CONSTANTS ──────────────────────────────────────────────────────────────────
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

# ── File Text Extraction ───────────────────────────────────────────────────────
def extract_text_from_file(data: bytes, filename: str) -> str:
    """Extract raw text from PDF or image file."""
    ext = (filename.split(".")[-1] if "." in filename else "").lower()

    # PDF path
    if ext == "pdf" or (not ext and data[:4] == b"%PDF"):
        try:
            text = ""
            with pdfplumber.open(io.BytesIO(data)) as pdf:
                for page in pdf.pages:
                    t = page.extract_text()
                    if t:
                        text += t + "\n"
            if text.strip():
                return text
        except Exception as e:
            print(f"pdfplumber failed: {e}")

    # Image path (PNG, JPG, TIFF, BMP, WebP) — also fallback for scanned PDFs
    try:
        img = Image.open(io.BytesIO(data))
        text = pytesseract.image_to_string(img)
        return text
    except Exception as e:
        print(f"OCR failed: {e}")

    return ""

# ── AI Extraction via Gemini ───────────────────────────────────────────────────
GEMINI_PROMPT = """You are an expert financial document parser specializing in merchant/credit card processing statements.

Your job is to extract key billing data from ANY type of processor statement — including but not limited to:
Square, Stripe, Chase Paymentech, First Data, TSYS, Heartland, Worldpay, Elavon, PayPal, Clover, Toast, Fiserv, Wells Fargo Merchant, Bank of America Merchant, and any other processor.

Extract these four fields. Each processor uses DIFFERENT terminology — use your judgment to find the right values:

1. merchant_name — The business/practice name (also called: DBA, Business Name, Account Name, Merchant Name, Customer Name)

2. total_amount_processed — The TOTAL dollar volume of transactions processed in the statement period (also called: Gross Sales, Total Volume, Total Processing Volume, Sales Amount, Total Transactions Amount, Total Gross, Gross Receipts, Total Activity, Total Credits)
   - This should be the GRAND TOTAL, not a subtotal for one card type
   - Strip any $ signs and commas — return a plain float

3. total_transactions_count — The TOTAL number of transactions/items (also called: Transaction Count, Number of Transactions, Item Count, # Items, Sales Count, Total Items, Num Transactions)
   - Return a plain integer or float

4. total_fees_paid — The TOTAL fees/charges billed for the period (also called: Total Fees, Total Service Charges, Total Discount, Total Deductions, Net Deduction, Processing Fees, Total Charges, Discount Amount, Service Fee, Total Cost)
   - This is what the merchant PAID the processor, not what customers paid
   - Strip any $ signs and commas — return a plain float

CRITICAL RULES:
- Return ONLY a raw JSON object with exactly these keys: merchant_name, total_amount_processed, total_transactions_count, total_fees_paid
- Do NOT include markdown, code fences, or any other text
- Look for SUMMARY/TOTAL rows — not individual line items for one card brand
- If a field genuinely cannot be found, use null
- All numeric values must be plain numbers (no $, no commas, no %)

Example output:
{"merchant_name": "Smith Dental Associates", "total_amount_processed": 125430.50, "total_transactions_count": 892, "total_fees_paid": 3762.91}

Now extract from this statement:
"""

async def parse_statement_with_ai(raw_text: str) -> dict:
    """Call Gemini to extract structured data from raw statement text."""
    extracted = {
        "merchant": "",
        "total_amount": "",
        "total_count": "",
        "total_fees": "",
    }

    if not raw_text or not raw_text.strip():
        return extracted

    api_key = os.getenv("GEMINI_API_KEY", "AIzaSyCJB3XbIbel0cot_SR24B59VtBWmp4ssh4")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"

    payload = {
        "contents": [{"parts": [{"text": GEMINI_PROMPT + "\n\n" + raw_text[:25000]}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.1
        }
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=payload, timeout=45.0)
            resp.raise_for_status()
            data = resp.json()

            text_resp = data["candidates"][0]["content"]["parts"][0]["text"]
            # Strip any accidental markdown fences
            text_resp = text_resp.strip().strip("```json").strip("```").strip()
            ai_data = json.loads(text_resp)

            if ai_data.get("merchant_name"):
                extracted["merchant"] = str(ai_data["merchant_name"]).strip()
            if ai_data.get("total_amount_processed") is not None:
                extracted["total_amount"] = str(ai_data["total_amount_processed"])
            if ai_data.get("total_transactions_count") is not None:
                extracted["total_count"] = str(int(float(str(ai_data["total_transactions_count"]))))
            if ai_data.get("total_fees_paid") is not None:
                extracted["total_fees"] = str(ai_data["total_fees_paid"])

    except Exception as e:
        print(f"Gemini AI Parsing failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"AI extraction failed: {str(e)}. Please check the file is a valid statement."
        )

    return extracted

# ── API Routes ─────────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"message": "Statement Analyzer API is running"}

@app.post("/api/upload")
async def upload_statement(file: UploadFile = File(...), user=Depends(get_current_user)):
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")

    raw_text = extract_text_from_file(data, file.filename or "upload.pdf")

    if not raw_text.strip():
        raise HTTPException(
            status_code=422,
            detail="Could not extract any text from this file. Please ensure it is a readable PDF or clear image."
        )

    extracted = await parse_statement_with_ai(raw_text)
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
    diff_pct = (monthly_savings / req.total_fees_paid) * 100 if req.total_fees_paid > 0 else 0
    merchant_display = req.existing_merchant.upper() if req.existing_merchant else "MERCHANT"

    ai_summary = (
        f"{merchant_display} currently pays ${req.total_fees_paid:,.2f}/month to their existing processor "
        f"at a {existing_avg_fee_pct:.2f}% effective rate. Switching to Adit Pay's flat-rate pricing brings "
        f"that down to ${adit_total:,.2f}/month — a {diff_pct:.1f}% reduction worth ${monthly_savings:,.2f}/month "
        f"in real cash back to the practice."
    )

    # Save to history DB
    conn = sqlite3.connect("db.sqlite")
    c = conn.cursor()
    c.execute(
        "INSERT INTO analysis_history (user_email, merchant, total_amount, total_fees_paid, savings, diff_pct) VALUES (?, ?, ?, ?, ?, ?)",
        (user.get("email", "anonymous"), req.existing_merchant or "Unnamed Merchant",
         req.total_amount, req.total_fees_paid, monthly_savings, diff_pct)
    )
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

# ── SPA Serve ──────────────────────────────────────────────────────────────────
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

if os.path.isdir(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def spa(full_path: str):
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
