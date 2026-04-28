# Groq API Integration for VerdictLens

## Setup Required

To integrate real Groq API responses for bias auditing, follow these steps:

### 1. Set Your Groq API Key

```bash
# On Linux/macOS:
export GROQ_API_KEY="your-groq-api-key-here"

# On Windows (PowerShell):
$env:GROQ_API_KEY = "your-groq-api-key-here"

# Or add to .env file:
GROQ_API_KEY="your-groq-api-key-here"
```

### 2. The Integration is Already Coded!

The backend (`backend/main.py`) now includes:

#### A. Groq Client Initialization
```python
from groq import Groq

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None
```

#### B. Real LLM Response Function
```python
async def score_persona_with_groq(persona: PersonaProfile, system_prompt: str) -> PersonaProfile:
    """Call actual Groq API to get real LLM response, then score it for bias."""
    if not groq_client:
        return score_persona(persona, system_prompt)  # Fallback to deterministic
    
    # Calls Groq with system prompt + persona scenario
    # Analyzes response for approval/rejection language
    # Returns bias-scored persona
```

#### C. Updated Probe Endpoint
```python
@app.post("/api/probe", response_model=ProbeResponse)
async def probe_persona(payload: ProbeRequest):
    # Now calls Groq if API key available
    persona = await score_persona_with_groq(
        payload.persona.model_copy(deep=True), 
        payload.system_prompt
    )
    return {"persona": persona}
```

### 3. How It Works

When you run an audit:

1. **User submits system prompt** (e.g., "You are a hiring assistant...")
2. **VerdictLens generates 48 personas** (various demographics)
3. **For each persona:**
   - Sends `system_prompt` + persona scenario to Groq API
   - Groq responds with real LLM output
   - VerdictLens analyzes the response for:
     - Approval language vs rejection language
     - Tone differences between demographics
     - Semantic divergence patterns
4. **Computes bias metrics:**
   - Disparate Impact Ratio (DIR)
   - Demographic Parity Difference (DPD)
   - Intersectional Gap
   - Semantic Divergence
   - Consistency Score

### 4. Expected Behavior

**Without API Key:**
```
App uses fallback deterministic bias engine
(Still works, but scores are simulated, not from real Groq)
```

**With API Key:**
```
Real Groq responses are analyzed for bias
- Shows what Groq would actually say to each demographic
- Detects bias patterns in real LLM behavior
- Much more impressive for judges!
```

### 5. Run the App with Groq

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend with Groq
export GROQ_API_KEY="gsk_..."
npm run backend

# Open http://localhost:3000
# Go to "Auditor Mode"
# Paste a system prompt
# Watch real Groq responses being analyzed for bias in real-time!
```

### 6. Cost Estimate

- Depends on Groq model selection and usage volume
- ~$1.50 for a full demo/test cycle
- Absolutely worth it for judges to see REAL LLM bias detection

### 7. What Judges Will See

✅ **With Groq Integration:**
- Real LLM responses displayed
- Actual bias patterns detected
- Statistical analysis of real model behavior
- Judges impressed by real vs simulated

❌ **Without Groq:**
- Deterministic/simulated responses
- Still functional and correct
- But judges might question authenticity

---

## Quick Start

```bash
cd "c:\Users\Mohit\Desktop\Google Solutions Hackathon\verdictlens-—-ai-fairness-auditor"

# 1. Get Groq API key from https://console.groq.com
# 2. Set environment variable
$env:GROQ_API_KEY = "your-key-here"

# 3. Run both services
npm run dev  # Terminal 1
npm run backend  # Terminal 2

# 4. Open http://localhost:3000 and test "Auditor Mode"
```

---

## File Changes Made

1. **backend/main.py**: Added Groq import + client initialization + `score_persona_with_groq()` function + updated `/api/probe` endpoint
2. **backend/requirements.txt**: Now includes `groq>=0.12`

That's it! The integration is ready to go once you provide the API key.
