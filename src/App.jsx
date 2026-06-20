import { useState, useRef, useEffect } from "react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

const G = {
  bg: "#07080d", surface: "#0e1018", border: "#1c1f2e",
  accent: "#f59e0b", accentDim: "rgba(245,158,11,0.12)", accentBorder: "rgba(245,158,11,0.3)",
  green: "#22c55e", red: "#ef4444", muted: "rgba(255,255,255,0.35)",
  text: "#e8eaf0", subtext: "rgba(255,255,255,0.5)",
  purple: "#8b5cf6",
  fontMono: "'JetBrains Mono', 'Fira Code', monospace",
  fontDisplay: "'Playfair Display', Georgia, serif",
  fontBody: "'DM Sans', sans-serif",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #2a2d3e; border-radius: 2px; }
  .card { background: ${G.surface}; border: 1px solid ${G.border}; border-radius: 12px; }
  .chip { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; letter-spacing:0.04em; font-family:${G.fontMono}; }
  .sel { background:${G.accentDim}; border:1px solid ${G.accentBorder}; color:${G.accent}; }
  .unsel { background:rgba(255,255,255,0.04); border:1px solid ${G.border}; color:${G.muted}; cursor:pointer; transition:all 0.15s; }
  .unsel:hover { border-color:rgba(255,255,255,0.15); color:${G.text}; }
  .inp { background:rgba(255,255,255,0.04); border:1px solid ${G.border}; border-radius:10px; padding:12px 14px; color:${G.text}; font-size:14px; font-family:${G.fontBody}; width:100%; outline:none; transition:border 0.2s; }
  .inp:focus { border-color:${G.accentBorder}; background:rgba(245,158,11,0.04); }
  .inp::placeholder { color:${G.muted}; }
  .btn { background:linear-gradient(135deg,#d97706,#f59e0b); color:#07080d; border:none; border-radius:9px; padding:13px 24px; font-size:14px; font-weight:700; cursor:pointer; font-family:${G.fontBody}; letter-spacing:0.02em; transition:all 0.2s; }
  .btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 20px rgba(245,158,11,0.35); }
  .btn:disabled { opacity:0.35; cursor:not-allowed; }
  .btn-ghost { background:rgba(255,255,255,0.05); color:${G.text}; border:1px solid ${G.border}; border-radius:9px; padding:9px 16px; font-size:12px; font-weight:500; cursor:pointer; font-family:${G.fontBody}; transition:all 0.2s; }
  .btn-ghost:hover { background:rgba(255,255,255,0.09); }
  .spin { animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }
  .pulse { animation: pulse 2s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
  .slide-in { animation: slideIn 0.3s ease-out; }
  .chart-wrapper { -webkit-transform: translateZ(0); transform: translateZ(0); }
  @keyframes slideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }
  @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  .dropdown { position:absolute; top:calc(100% + 6px); left:0; right:0; background:#12141f; border:1px solid ${G.border}; border-radius:10px; z-index:100; overflow:hidden; box-shadow:0 8px 32px rgba(0,0,0,0.5); }
  .dropdown-item { padding:12px 14px; cursor:pointer; transition:background 0.1s; border-bottom:1px solid ${G.border}; }
  .dropdown-item:last-child { border-bottom:none; }
  .dropdown-item:hover { background:rgba(245,158,11,0.08); }
  .search-wrap { position:relative; flex:1; min-width:180px; }
  .skeleton { background:linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:8px; }
  .dh-card { background:${G.surface}; border:1px solid ${G.border}; border-radius:12px; padding:16px; transition:border-color 0.2s; }
  .dh-card:hover { border-color:rgba(139,92,246,0.4); }
`;

const API_BASE = "https://stockwise-backend-production-3527.up.railway.app";

// ── Advisor stock data ────────────────────────────────────────────────────────
const NIFTY_STOCKS = {
  conservative: {
    short: [
      { ticker:"HDFCBANK", name:"HDFC Bank", sector:"Banking", price:"₹1,642", change:"+0.8%", pe:"19.2", roe:"16.4%", mcap:"₹12.4L Cr", reason:"India's largest private bank by assets. Stable NIM, low NPA ratio, and consistent earnings growth make it a safe near-term hold." },
      { ticker:"TCS", name:"Tata Consultancy Services", sector:"IT", price:"₹3,841", change:"+0.6%", pe:"28.1", roe:"52.3%", mcap:"₹13.9L Cr", reason:"Consistent dividend payer, defensive IT giant with large-cap stability. Minimal downside risk in volatile markets." },
      { ticker:"ITC", name:"ITC Limited", sector:"FMCG", price:"₹458", change:"+1.1%", pe:"26.4", roe:"28.7%", mcap:"₹5.7L Cr", reason:"FMCG moat + hotel recovery + growing agribusiness. High dividend yield cushions downside." },
    ],
    medium: [
      { ticker:"HDFCBANK", name:"HDFC Bank", sector:"Banking", price:"₹1,642", change:"+0.8%", pe:"19.2", roe:"16.4%", mcap:"₹12.4L Cr", reason:"Post-merger integration with HDFC Ltd nearing completion. Re-rating expected as ROE normalises over 3–5 years." },
      { ticker:"NESTLEIND", name:"Nestlé India", sector:"FMCG", price:"₹2,381", change:"+0.5%", pe:"71.2", roe:"112.4%", mcap:"₹2.3L Cr", reason:"Premium FMCG brand with pricing power. Rural penetration still in early innings — long runway ahead." },
      { ticker:"POWERGRID", name:"Power Grid Corporation", sector:"Utilities", price:"₹312", change:"+1.3%", pe:"17.6", roe:"20.1%", mcap:"₹2.9L Cr", reason:"Regulated returns, strong dividend history, and India's grid expansion capex are reliable compounding drivers." },
    ],
    long: [
      { ticker:"TCS", name:"Tata Consultancy Services", sector:"IT", price:"₹3,841", change:"+0.6%", pe:"28.1", roe:"52.3%", mcap:"₹13.9L Cr", reason:"A decade of free cash flow compounding + rising global IT spends. One of India's most durable wealth creators." },
      { ticker:"HDFCBANK", name:"HDFC Bank", sector:"Banking", price:"₹1,642", change:"+0.8%", pe:"19.2", roe:"16.4%", mcap:"₹12.4L Cr", reason:"India's financialisation story over 10+ years. Credit penetration is still low — massive runway." },
      { ticker:"POWERGRID", name:"Power Grid Corporation", sector:"Utilities", price:"₹312", change:"+1.3%", pe:"17.6", roe:"20.1%", mcap:"₹2.9L Cr", reason:"India needs 500GW renewable capacity by 2030. Power Grid is the transmission backbone — guaranteed revenue stream." },
    ],
  },
  moderate: {
    short: [
      { ticker:"RELIANCE", name:"Reliance Industries", sector:"Conglomerate", price:"₹2,912", change:"+1.4%", pe:"24.7", roe:"9.8%", mcap:"₹19.7L Cr", reason:"Jio Financial Services demerger + Retail IPO pipeline as near-term catalysts. Biggest weight in Nifty 50." },
      { ticker:"INFY", name:"Infosys", sector:"IT", price:"₹1,742", change:"+0.9%", pe:"22.8", roe:"32.6%", mcap:"₹7.2L Cr", reason:"Revenue guidance revision upward + GenAI services traction driving positive sentiment in the near term." },
      { ticker:"BAJFINANCE", name:"Bajaj Finance", sector:"NBFC", price:"₹7,124", change:"+2.1%", pe:"31.4", roe:"22.8%", mcap:"₹4.3L Cr", reason:"India's premier consumer lending NBFC. AUM growth accelerating with rural and semi-urban expansion." },
    ],
    medium: [
      { ticker:"RELIANCE", name:"Reliance Industries", sector:"Conglomerate", price:"₹2,912", change:"+1.4%", pe:"24.7", roe:"9.8%", mcap:"₹19.7L Cr", reason:"Retail + Jio as separate listed entities (expected in 2–3 years) will unlock massive hidden value." },
      { ticker:"LTIM", name:"LTIMindtree", sector:"IT", price:"₹5,241", change:"+1.7%", pe:"29.3", roe:"26.1%", mcap:"₹1.5L Cr", reason:"Post-merger synergies playing out. Strong deal wins in BFSI and manufacturing verticals." },
      { ticker:"AXISBANK", name:"Axis Bank", sector:"Banking", price:"₹1,087", change:"+1.2%", pe:"14.6", roe:"17.9%", mcap:"₹3.3L Cr", reason:"Consistent improvement in ROA + CASA franchise growing. Trades at discount to HDFC Bank on P/B." },
    ],
    long: [
      { ticker:"RELIANCE", name:"Reliance Industries", sector:"Conglomerate", price:"₹2,912", change:"+1.4%", pe:"24.7", roe:"9.8%", mcap:"₹19.7L Cr", reason:"Energy transition + digital + retail = multi-decade compounding machine. India's most powerful corporate." },
      { ticker:"BAJFINANCE", name:"Bajaj Finance", sector:"NBFC", price:"₹7,124", change:"+2.1%", pe:"31.4", roe:"22.8%", mcap:"₹4.3L Cr", reason:"India's credit card and EMI culture is nascent. Bajaj Finance is the dominant player riding this secular shift." },
      { ticker:"INFY", name:"Infosys", sector:"IT", price:"₹1,742", change:"+0.9%", pe:"22.8", roe:"32.6%", mcap:"₹7.2L Cr", reason:"AI-augmented IT services is a decade-long theme. Infosys is the clearest pure-play beneficiary in India." },
    ],
  },
  aggressive: {
    short: [
      { ticker:"ADANIPORTS", name:"Adani Ports & SEZ", sector:"Infrastructure", price:"₹1,342", change:"+3.1%", pe:"28.6", roe:"14.2%", mcap:"₹2.9L Cr", reason:"Cargo volumes at record highs. Vizhinjam port nearing operational status is a near-term re-rating trigger." },
      { ticker:"ZOMATO", name:"Zomato", sector:"Consumer Tech", price:"₹231", change:"+4.2%", pe:"—", roe:"3.1%", mcap:"₹2.1L Cr", reason:"Quick commerce (Blinkit) growing 80% YoY. Path to profitability clearer than the market is pricing." },
      { ticker:"PAYTM", name:"One97 Communications", sector:"Fintech", price:"₹682", change:"+5.8%", pe:"—", roe:"-14%", mcap:"₹0.4L Cr", reason:"High risk, high reward. Regulatory headwinds easing + merchant payments recovery — speculative play only." },
    ],
    medium: [
      { ticker:"ZOMATO", name:"Zomato", sector:"Consumer Tech", price:"₹231", change:"+4.2%", pe:"—", roe:"3.1%", mcap:"₹2.1L Cr", reason:"India's food delivery and quick commerce market is still in early growth phase. 3-year earnings inflection ahead." },
      { ticker:"DIXON", name:"Dixon Technologies", sector:"Electronics Mfg", price:"₹14,821", change:"+3.6%", pe:"88.4", roe:"28.3%", mcap:"₹0.9L Cr", reason:"PLI scheme beneficiary. Apple, Samsung vendor + expanding into wearables and laptops." },
      { ticker:"IRFC", name:"Indian Railway Finance Corp", sector:"PSU Finance", price:"₹198", change:"+2.4%", pe:"29.1", roe:"13.2%", mcap:"₹2.6L Cr", reason:"100% government-backed borrowing with guaranteed spread. India's railway capex is ₹2.5L Cr/year." },
    ],
    long: [
      { ticker:"DIXON", name:"Dixon Technologies", sector:"Electronics Mfg", price:"₹14,821", change:"+3.6%", pe:"88.4", roe:"28.3%", mcap:"₹0.9L Cr", reason:"India's Make-in-India electronics manufacturing story. Dixon is the anchor — 10x opportunity in a decade." },
      { ticker:"ZOMATO", name:"Zomato", sector:"Consumer Tech", price:"₹231", change:"+4.2%", pe:"—", roe:"3.1%", mcap:"₹2.1L Cr", reason:"Blinkit + food delivery building an everyday habit. Long-term moat if execution holds." },
      { ticker:"ADANIGREEN", name:"Adani Green Energy", sector:"Renewable Energy", price:"₹1,624", change:"+4.8%", pe:"—", roe:"—", mcap:"₹2.6L Cr", reason:"India's largest renewable energy company. 50GW target by 2030 = massive contracted revenue growth." },
    ],
  },
};

const SECTOR_COLORS = { Banking:"#3b82f6",IT:"#8b5cf6",FMCG:"#f59e0b",Conglomerate:"#06b6d4",NBFC:"#10b981","Consumer Tech":"#ec4899",Fintech:"#f97316","Renewable Energy":"#22c55e","Electronics Mfg":"#a78bfa","PSU Finance":"#64748b",Utilities:"#0ea5e9",Infrastructure:"#d97706" };

const SUGGESTIONS = [
  { ticker:"RELIANCE", name:"Reliance Industries" },
  { ticker:"TCS", name:"Tata Consultancy Services" },
  { ticker:"HDFCBANK", name:"HDFC Bank" },
  { ticker:"INFY", name:"Infosys" },
  { ticker:"ZOMATO", name:"Zomato" },
  { ticker:"BAJFINANCE", name:"Bajaj Finance" },
  { ticker:"DIXON", name:"Dixon Technologies" },
  { ticker:"WIPRO", name:"Wipro" },
  { ticker:"ADANIPORTS", name:"Adani Ports" },
  { ticker:"NESTLEIND", name:"Nestlé India" },
];

// ── Chart helpers ─────────────────────────────────────────────────────────────
function buildChartFromHistory(history, ticker) {
  if (!history || history.length === 0) return generateFallbackChart(ticker);
  const historical = history.map(h => ({ month: h.date, price: h.close, historical: true }));
  const last = historical[historical.length - 1].price;
  const first = historical[0].price;
  const trendPct = (last - first) / first / historical.length;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const now = new Date();
  for (let i = 1; i <= 6; i++) {
    const fp = last * (1 + trendPct * i * 20);
    const spread = fp * (0.03 + i * 0.015);
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    historical.push({ month: months[d.getMonth()] + " '" + String(d.getFullYear()).slice(2), price: Math.round(fp), upper: Math.round(fp + spread), lower: Math.round(fp - spread), historical: false, forecast: true });
  }
  const step = Math.max(1, Math.floor((historical.length - 6) / 30));
  return historical.filter((_, i) => i % step === 0 || i >= historical.length - 6);
}

function generateFallbackChart(ticker) {
  const seed = ticker.split("").reduce((a,c) => a + c.charCodeAt(0), 0);
  const rng = i => Math.sin(seed * i * 0.31 + i * 1.7) * 0.5 + 0.5;
  const base = 800 + rng(1) * 3200, trend = (rng(2) - 0.3) * 0.002, vol = 0.015 + rng(3) * 0.025;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const data = []; let price = base;
  for (let i = 0; i < 24; i++) { price *= (1 + trend + (rng(i*7+1) - 0.48) * vol); data.push({ month: months[i%12]+(i<12?" '24":" '25"), price: Math.round(price), historical: true }); }
  const fp0 = data[data.length-1].price * (trend > 0 ? 1.08 : 0.95);
  for (let i = 0; i < 6; i++) { const fp = fp0*(1+trend*(i+1)*30); const s=fp*(0.04+i*0.02); data.push({ month: months[(18+i)%12]+" '26", price:Math.round(fp), upper:Math.round(fp+s), lower:Math.round(fp-s), historical:false, forecast:true }); }
  return data;
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{ background:"#12141f", border:`1px solid ${G.border}`, borderRadius:8, padding:"10px 14px", fontFamily:G.fontMono, fontSize:12 }}>
      <div style={{ color:G.muted, marginBottom:4 }}>{label}</div>
      <div style={{ color:d?.forecast?G.accent:G.green, fontWeight:600 }}>₹{payload[0]?.value?.toLocaleString("en-IN")}</div>
      {d?.forecast && d?.upper && <div style={{ color:G.muted, fontSize:11 }}>Range: ₹{d.lower?.toLocaleString("en-IN")} – ₹{d.upper?.toLocaleString("en-IN")}</div>}
      {d?.forecast && <div style={{ color:G.accent, fontSize:10, marginTop:2 }}>▲ AI Forecast</div>}
    </div>
  );
};

// ── Auth helpers ─────────────────────────────────────────────────────────────
const TOKEN_KEY = "stockwise_token";
const TOKEN_USER_KEY = "stockwise_user";
const TOKEN_EXPIRY_KEY = "stockwise_token_expiry";

function saveAuth(token, username) {
  const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_USER_KEY, username);
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toString());
}

function getStoredAuth() {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  const username = localStorage.getItem(TOKEN_USER_KEY);
  if (!token || !expiry) return null;
  if (Date.now() > parseInt(expiry)) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_USER_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    return null;
  }
  return { token, username };
}

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_USER_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
}


// ── Login Gate ────────────────────────────────────────────────────────────────
function LoginGate({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Invalid username or password");
        setLoading(false);
        return;
      }
      saveAuth(data.token, data.username);
      onLogin(data.token, data.username);
    } catch (e) {
      setError("Connection error — please try again");
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 360, margin: "40px auto", padding: "0 20px" }}>
      <div className="card" style={{ padding: 28 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 44, height: 44, background: `linear-gradient(135deg,#d97706,${G.accent})`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, margin: "0 auto 12px" }}>🐴</div>
          <div style={{ fontFamily: G.fontDisplay, fontSize: 20, marginBottom: 4 }}>Dark Horses Access</div>
          <div style={{ fontSize: 12, color: G.muted, fontFamily: G.fontMono }}>India 🐴 &amp; US 🇺🇸 · Whitelisted users only</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 11, color: G.muted, fontFamily: G.fontMono, letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>USERNAME</label>
            <input
              className="inp"
              placeholder="your username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: G.muted, fontFamily: G.fontMono, letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>PASSWORD</label>
            <input
              className="inp"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
          </div>
        </div>

        {error && (
          <div style={{ marginBottom: 14, padding: "8px 12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, fontSize: 12, color: G.red, fontFamily: G.fontMono }}>
            ⚠ {error}
          </div>
        )}

        <button
          className="btn"
          style={{ width: "100%" }}
          disabled={!username.trim() || !password.trim() || loading}
          onClick={handleLogin}
        >
          {loading ? "Signing in…" : "Sign In →"}
        </button>

        <div style={{ marginTop: 16, fontSize: 11, color: "rgba(255,255,255,0.2)", textAlign: "center", fontFamily: G.fontMono, lineHeight: 1.6 }}>
          Access is by invitation only.<br/>
          Sessions last 7 days.
        </div>
      </div>
    </div>
  );
}


// ── Dark Horses Tab ───────────────────────────────────────────────────────────
const CONVICTION_COLORS = { HIGH: "#22c55e", MEDIUM: "#f59e0b", SPECULATIVE: "#8b5cf6" };

const REGIME_CONFIG = {
  HEALTHY:  { color: "#22c55e", bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.25)",  icon: "🟢", label: "Market Healthy",  subtext: "Conditions are favourable for momentum picks." },
  CAUTIOUS: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)", icon: "🟡", label: "Market Cautious",  subtext: "Early weakness detected. Picks are more selective — size positions carefully." },
  BEARISH:  { color: "#ef4444", bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.25)",  icon: "🔴", label: "Market Caution Mode", subtext: "Market is in a downtrend. Momentum picks underperform in falling markets. High risk of loss." },
};

function DarkHorses({ market = "india" }) {
  // ── Auth state ──────────────────────────────────────────────────────────────
  const [auth, setAuth] = useState(() => getStoredAuth());

  const handleLogin = (token, username) => setAuth({ token, username });
  const handleLogout = () => { clearAuth(); setAuth(null); };

  // Show login gate if not authenticated
  if (!auth) return <LoginGate onLogin={handleLogin} />;

  return <DarkHorsesInner auth={auth} onLogout={handleLogout} market={market} />;
}


function DarkHorsesInner({ auth, onLogout, market = "india" }) {
  const isUS = market === "us";
  const currency = isUS ? "$" : "₹";
  const benchmark = isUS ? "S&P 500" : "Nifty";
  const marketLabel = isUS ? "🇺🇸 US Dark Horses" : "🐴 Dark Horses";
  const stockCount = isUS ? 600 : 150;
  const endpoint = isUS ? "dark-horses-us" : "dark-horses";
  const authHeader = auth?.token ? { "Authorization": `Bearer ${auth.token}` } : {};
  const [picks, setPicks] = useState([]);
  const [yoyoPicks, setYoyoPicks] = useState([]);
  const [showYoyo, setShowYoyo] = useState(false);
  const [crowdedPicks, setCrowdedPicks] = useState([]);
  const [showCrowded, setShowCrowded] = useState(false);
  const [marketNote, setMarketNote] = useState("");
  const [regime, setRegime] = useState(null);
  const [stocksScanned, setStocksScanned] = useState(stockCount);
  const [loading, setLoading] = useState(true);
  const [nextRefresh, setNextRefresh] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAnyway, setShowAnyway] = useState(false);
  const [bestOfBatch, setBestOfBatch] = useState([]);
  const [waitSignal, setWaitSignal] = useState(false);
  const [waitReason, setWaitReason] = useState("");
  const [defensiveNote, setDefensiveNote] = useState("");
  const [heldTickers, setHeldTickers] = useState(new Set());
  const [buyingTicker, setBuyingTicker] = useState(null);
  const [buySuccess, setBuySuccess] = useState(null);

  // Load held tickers from portfolio on mount (India only)
  const portfolioEndpoint = isUS ? "portfolio-us" : "portfolio";

  const loadHeldTickers = async () => {
    if (!auth?.token) return;
    try {
      const res = await fetch(`${API_BASE}/${portfolioEndpoint}/positions`, {
        headers: { "Authorization": `Bearer ${auth.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHeldTickers(new Set((data.positions || []).map(p => p.ticker)));
      }
    } catch (e) {}
  };

  const handleBuy = async (pick, benchmarkPrice) => {
    if (!auth?.token) return;
    setBuyingTicker(pick.ticker);
    try {
      const entryPrice = parseFloat(String(pick.price).replace(/[₹$,]/g, ""));
      const bodyData = isUS ? {
        ticker:       pick.ticker,
        company_name: pick.name,
        entry_price:  entryPrice,
        entry_signal: pick.flag,
        entry_flag:   pick.flag,
        entry_spy:    benchmarkPrice || 0,
        sector:       pick.sector,
      } : {
        ticker:       pick.ticker,
        company_name: pick.name,
        entry_price:  entryPrice,
        entry_signal: pick.flag,
        entry_flag:   pick.flag,
        entry_nifty:  benchmarkPrice || 0,
        sector:       pick.sector,
      };
      const res = await fetch(`${API_BASE}/${portfolioEndpoint}/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${auth.token}` },
        body: JSON.stringify(bodyData)
      });
      const data = await res.json();
      if (res.ok) {
        setHeldTickers(prev => new Set([...prev, pick.ticker]));
        setBuySuccess(pick.ticker);
        setTimeout(() => setBuySuccess(null), 3000);
      } else {
        alert(data.detail || "Could not record buy");
      }
    } catch (e) {
      alert("Network error — could not record buy");
    } finally {
      setBuyingTicker(null);
    }
  };

  useEffect(() => { loadHeldTickers(); }, []);

  const fetchPicks = async (forceRefresh = false) => {
    forceRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const url = forceRefresh ? `${API_BASE}/${endpoint}?refresh=true` : `${API_BASE}/${endpoint}`;
      const res = await fetch(url, { headers: authHeader });
      const data = await res.json();
      if (data.error && (!data.picks || data.picks.length === 0)) throw new Error(data.error);
      setPicks(data.picks || []);
      setYoyoPicks(data.yoyo_picks || []);
      setCrowdedPicks(data.crowded_picks || []);
      setMarketNote(data.market_note || "");
      setRegime(data.regime || null);
      setStocksScanned(data.stocks_scanned || 150);
      setNextRefresh(data.next_refresh_mins || 240);
      setLastUpdated(new Date());
      setShowAnyway(false);
      setBestOfBatch(data.best_of_batch || []);
      setWaitSignal(data.wait_signal || false);
      setWaitReason(data.wait_reason || "");
      setDefensiveNote(data.defensive_note || "");
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchPicks(); }, []);
  useEffect(() => {
    const interval = setInterval(() => fetchPicks(), 4 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const regimeName = regime?.regime || "HEALTHY";
  const rc = REGIME_CONFIG[regimeName] || REGIME_CONFIG.HEALTHY;
  const isBearish = regimeName === "BEARISH";
  const showPicks = !isBearish || showAnyway;

  if (loading) return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: G.fontDisplay, fontSize: "clamp(22px,5vw,32px)", marginBottom: 6 }}>{marketLabel}</div>
        <div style={{ color: G.muted, fontSize: 13 }}>Scanning {stockCount} {isUS ? "US" : "NSE"} stocks for early momentum signals…</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="card" style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div className="skeleton" style={{ width: 120, height: 18 }} />
              <div className="skeleton" style={{ width: 60, height: 18 }} />
            </div>
            <div className="skeleton" style={{ width: "100%", height: 14, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: "70%", height: 14 }} />
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: G.muted, fontFamily: G.fontMono }}>
        This takes ~{isUS ? "3–4 minutes" : "60–90 seconds"} — Claude is analysing {stockCount} stocks 🔍
      </div>
    </div>
  );

  if (error) return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
      <div style={{ fontFamily: G.fontDisplay, fontSize: 20, marginBottom: 8 }}>Scan failed</div>
      <div style={{ color: G.muted, fontSize: 13, marginBottom: 20 }}>{error}</div>
      <button className="btn" onClick={() => fetchPicks(true)}>Try Again</button>
    </div>
  );

  return (
    <div className="slide-in">
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontFamily: G.fontDisplay, fontSize: "clamp(22px,5vw,32px)", marginBottom: 4 }}>{marketLabel}</div>
            <div style={{ color: G.muted, fontSize: 13 }}>AI-spotted early momentum signals · Relative strength vs {benchmark}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-ghost" onClick={() => fetchPicks(true)} disabled={refreshing} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ display: "inline-block" }} className={refreshing ? "spin" : ""}>↻</span>
              {refreshing ? "Scanning…" : "Refresh"}
            </button>
            <button className="btn-ghost" onClick={onLogout} style={{ fontSize: 11, color: G.muted }}>
              Sign out
            </button>
          </div>
        </div>

        {/* Market Regime Banner */}
        {regime && (
          <div style={{ marginTop: 14, padding: "14px 16px", background: rc.bg, border: `1px solid ${rc.border}`, borderRadius: 10 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14 }}>{rc.icon}</span>
                  <span style={{ fontFamily: G.fontMono, fontWeight: 700, fontSize: 12, color: rc.color }}>{rc.label.toUpperCase()}</span>
                </div>
                <div style={{ fontSize: 13, color: G.text, lineHeight: 1.6, marginBottom: isBearish ? 6 : 0 }}>{rc.subtext}</div>
                {regime.nifty_ret_5d !== undefined && (
                  <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
                    {[
                      ["Nifty 5D", `${regime.nifty_ret_5d > 0 ? "+" : ""}${regime.nifty_ret_5d}%`, regime.nifty_ret_5d >= 0],
                      ["Nifty vs 20MA", regime.signals?.nifty_below_ma20 ? "Below ⚠" : "Above ✓", !regime.signals?.nifty_below_ma20],
                      ["VIX", regime.vix, regime.vix < 18],
                    ].map(([label, val, isGood]) => (
                      <div key={label}>
                        <div style={{ fontSize: 10, color: G.muted, fontFamily: G.fontMono, marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, fontFamily: G.fontMono, color: isGood ? G.green : G.red }}>{val}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* BEARISH toggle */}
              {isBearish && (
                <div style={{ flexShrink: 0 }}>
                  <button
                    onClick={() => setShowAnyway(v => !v)}
                    style={{
                      background: showAnyway ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)",
                      border: `1px solid ${showAnyway ? "rgba(239,68,68,0.4)" : G.border}`,
                      borderRadius: 8, padding: "8px 14px", cursor: "pointer",
                      fontSize: 12, fontFamily: G.fontMono, fontWeight: 600,
                      color: showAnyway ? G.red : G.muted, transition: "all 0.2s",
                    }}
                  >
                    {showAnyway ? "🔓 Showing picks" : "🔒 Show anyway"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bearish locked screen */}
        {isBearish && !showAnyway && (
          <div style={{ marginTop: 16, padding: "40px 20px", textAlign: "center", background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 12 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🛑</div>
            <div style={{ fontFamily: G.fontDisplay, fontSize: 20, marginBottom: 8, color: G.text }}>Market Caution Mode Active</div>
            <div style={{ fontSize: 13, color: G.muted, lineHeight: 1.7, maxWidth: 380, margin: "0 auto 20px" }}>
              The market is in a downtrend. Historically, momentum picks lose money in falling markets as even strong stocks get dragged down.
              <br /><br />
              Caution mode is on by default to protect you. You can still view the picks if you understand the risk.
            </div>
            <button
              onClick={() => setShowAnyway(true)}
              style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 9, padding: "11px 20px", cursor: "pointer", fontSize: 13, fontFamily: G.fontBody, fontWeight: 600, color: G.red }}
            >
              I understand the risk — show picks anyway
            </button>
          </div>
        )}

        {/* Wait signal — show prominently when Claude says wait */}
        {waitSignal && showPicks && (
          <div style={{ marginTop: 14, padding: "14px 16px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 16 }}>⏸</span>
              <span style={{ fontFamily: G.fontMono, fontWeight: 700, fontSize: 11, color: G.red }}>CONSIDER WAITING</span>
            </div>
            <div style={{ fontSize: 13, color: G.text, lineHeight: 1.6 }}>{waitReason}</div>
          </div>
        )}

        {/* Defensive note — shown in cautious/bearish */}
        {defensiveNote && showPicks && (
          <div style={{ marginTop: 10, padding: "10px 14px", background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 10, fontSize: 12, color: "rgba(147,197,253,0.9)", lineHeight: 1.6, fontFamily: G.fontBody }}>
            <span style={{ fontFamily: G.fontMono, fontWeight: 700, fontSize: 10, color: "#60a5fa", display: "inline-block", marginBottom: 3 }}>🛡 DEFENSIVE ALTERNATIVE</span><br/>
            {defensiveNote}
          </div>
        )}

        {/* Market note — only in non-bearish or if override on */}
        {marketNote && showPicks && (
          <div style={{ marginTop: 10, padding: "12px 16px", background: G.accentDim, border: `1px solid ${G.accentBorder}`, borderRadius: 10, fontSize: 13, color: G.text, lineHeight: 1.6 }}>
            <span style={{ color: G.accent, fontWeight: 700, fontFamily: G.fontMono, fontSize: 11, display: "block", marginBottom: 4 }}>📡 TODAY'S MARKET THEME</span>
            {marketNote}
          </div>
        )}

        {/* Meta info */}
        {showPicks && (
          <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
            {lastUpdated && <span style={{ fontSize: 11, color: G.muted, fontFamily: G.fontMono }}>Last scan: {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>}
            {nextRefresh && <span style={{ fontSize: 11, color: G.muted, fontFamily: G.fontMono }}>Next refresh in: {nextRefresh}m</span>}
            <span style={{ fontSize: 11, color: G.muted, fontFamily: G.fontMono }}>Stocks scanned: {stocksScanned}</span>
          </div>
        )}
      </div>

      {/* Conviction legend */}
      {showPicks && (
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        {Object.entries(CONVICTION_COLORS).map(([k, c]) => (
          <span key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontFamily: G.fontMono, color: G.muted }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: c, display: "inline-block" }} />
            {k}
          </span>
        ))}
      </div>
      )}

      {/* Picks grid — only shown when not locked */}
      {showPicks && (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Bearish override warning banner */}
        {isBearish && showAnyway && (
          <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, fontSize: 13, color: G.red, lineHeight: 1.6, fontFamily: G.fontMono }}>
            ⚠ CAUTION MODE OVERRIDDEN — You are viewing picks in a bearish market. All conviction ratings have been forced to SPECULATIVE. Do not size positions normally.
          </div>
        )}

        {picks.map((pick, i) => {
          const convColor = CONVICTION_COLORS[pick.conviction] || G.accent;
          const rs5dPos = (pick.rs_5d ?? pick.ret_5d) >= 0;
          const ret1mPos = pick.ret_1m >= 0;
          const isBestOfBatch = bestOfBatch.includes(pick.ticker);
          return (
            <div key={pick.ticker} className="dh-card slide-in" style={{
              animationDelay: `${i * 0.05}s`,
              borderColor: isBestOfBatch ? "rgba(245,158,11,0.5)" : isBearish ? "rgba(239,68,68,0.2)" : undefined,
              background: isBestOfBatch ? "rgba(245,158,11,0.03)" : undefined,
            }}>

              {/* Best of batch crown */}
              {isBestOfBatch && (
                <div style={{ marginBottom: 10, padding: "5px 10px", background: "rgba(245,158,11,0.1)", borderRadius: 6, fontSize: 11, color: G.accent, fontFamily: G.fontMono, fontWeight: 700 }}>
                  👑 BEST OF BATCH — strongest signal in this scan
                </div>
              )}

              {/* Per-card bearish warning */}
              {isBearish && (
                <div style={{ marginBottom: 8, padding: "6px 10px", background: "rgba(239,68,68,0.08)", borderRadius: 6, fontSize: 11, color: G.red, fontFamily: G.fontMono }}>
                  {isBestOfBatch ? "⚠ Best pick in bearish market — still elevated risk" : "⚠ High risk — bearish market conditions"}
                </div>
              )}

              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                {/* Left: rank + name */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontFamily: G.fontMono, fontSize: 11, color: "rgba(255,255,255,0.2)", minWidth: 20 }}>#{i + 1}</span>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: G.fontMono, fontWeight: 700, fontSize: 14, color: G.accent }}>{pick.ticker}</span>
                      <span style={{ fontSize: 13, color: G.text, fontWeight: 500 }}>{pick.name}</span>
                    </div>
                    <div style={{ fontSize: 11, color: G.muted, marginTop: 2, fontFamily: G.fontMono }}>{pick.sector}</div>
                  </div>
                </div>

                {/* Right: price + conviction */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: G.fontMono, fontWeight: 700, fontSize: 15, color: G.green }}>{pick.price}</span>
                  <span style={{ background: convColor + "18", border: `1px solid ${convColor}40`, color: convColor, borderRadius: 6, padding: "3px 8px", fontSize: 10, fontFamily: G.fontMono, fontWeight: 700 }}>{pick.conviction}</span>
                </div>
              </div>

              {/* Momentum metrics — now shows relative strength */}
              <div style={{ display: "flex", gap: 14, marginTop: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
                {[
                  ["5D Return", pick.ret_5d, pick.ret_5d >= 0],
                  ["vs Nifty 5D", pick.rs_5d != null ? pick.rs_5d : "—", rs5dPos],
                  ["1M Return", pick.ret_1m, ret1mPos],
                  ["Vol Spike", `${pick.vol_spike}x`, pick.vol_spike > 1.5],
                ].map(([label, val, isPos]) => (
                  <div key={label}>
                    <div style={{ fontSize: 10, color: G.muted, fontFamily: G.fontMono, marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, fontFamily: G.fontMono, color: typeof isPos === "boolean" ? (isPos ? G.green : G.red) : G.text }}>
                      {typeof val === "number" ? `${val > 0 ? "+" : ""}${val}%` : val}
                    </div>
                  </div>
                ))}

                {/* Signal strength bar */}
                {pick.signal_strength != null && (
                  <div style={{ marginLeft: "auto" }}>
                    <div style={{ fontSize: 10, color: G.muted, fontFamily: G.fontMono, marginBottom: 4 }}>SIGNAL STRENGTH</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 80, height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{
                          width: `${(pick.signal_strength / 10) * 100}%`,
                          height: "100%",
                          borderRadius: 3,
                          background: pick.signal_strength >= 7 ? G.green : pick.signal_strength >= 4 ? G.accent : G.red,
                          transition: "width 0.4s ease",
                        }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, fontFamily: G.fontMono, color: pick.signal_strength >= 7 ? G.green : pick.signal_strength >= 4 ? G.accent : G.red }}>
                        {pick.signal_strength}/10
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Flag badge — all 5 flag types */}
              {pick.flag && pick.flag !== "FRESH" && (() => {
                const flagConfig = {
                  LAST_LEGS:    { icon: "⚠",  color: G.accent,  bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.3)",  text: "LAST LEGS",    desc: "move is maturing, risk elevated" },
                  EXHAUSTED:    { icon: "🛑", color: G.red,     bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.3)",   text: "EXHAUSTED",    desc: "ran too hard, poor risk/reward" },
                  HARD_CAP:     { icon: "🚫", color: G.red,     bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.3)",   text: "CROWDED",      desc: "10+ consecutive picks — crowd has noticed, move is late" },
                  DOWNTREND:    { icon: "📉", color: "#f97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.3)",  text: "DOWNTREND",    desc: "price below 20-day MA — structural weakness" },
                  DISTRIBUTION: { icon: "⬇",  color: G.red,     bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.3)",   text: "DISTRIBUTION", desc: "more volume on down days — selling pressure building" },
                  BOUNCE:       { icon: "↩",  color: "#f97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.3)",  text: "BOUNCE",       desc: "5d spike without 1m trend — mean reversion risk" },
                };
                const fc = flagConfig[pick.flag];
                if (!fc) return null;
                return (
                  <div style={{ marginTop: 10, padding: "6px 10px", borderRadius: 6, fontSize: 11, fontFamily: G.fontMono, fontWeight: 700,
                    background: fc.bg, border: `1px solid ${fc.border}`, color: fc.color,
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    {fc.icon} {fc.text}
                    <span style={{ fontWeight: 400, color: G.muted, fontSize: 10 }}>— {fc.desc}</span>
                  </div>
                );
              })()}

              {/* Policy / Crypto tags */}
              {(pick.is_policy_driven || pick.is_crypto_driven) && (
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {pick.is_policy_driven && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 4, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", fontSize: 10, fontFamily: G.fontMono, fontWeight: 700, color: "#60a5fa" }}>
                        🏛️ POLICY-DRIVEN
                      </span>
                    )}
                    {pick.is_crypto_driven && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 4, background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", fontSize: 10, fontFamily: G.fontMono, fontWeight: 700, color: "#fbbf24" }}>
                        ₿ CRYPTO-DRIVEN
                      </span>
                    )}
                  </div>
                  {pick.recent_headlines && pick.recent_headlines[0] && (
                    <div style={{ padding: "6px 10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, fontSize: 11, color: G.muted, fontFamily: G.fontMono, lineHeight: 1.5 }}>
                      📰 {pick.recent_headlines[0]}
                    </div>
                  )}
                </div>
              )}

              {/* AI signal */}
              <div style={{ marginTop: 8, padding: "10px 12px", background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: 8, fontSize: 13, color: G.subtext, lineHeight: 1.6 }}>
                <span style={{ color: G.purple, fontFamily: G.fontMono, fontSize: 10, fontWeight: 700 }}>◈ AI SIGNAL  </span>
                {pick.signal}
              </div>

              {/* Buy button */}
              {(
                <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
                  {heldTickers.has(pick.ticker) ? (
                    <span style={{ fontSize: 11, fontFamily: G.fontMono, color: G.green, display: "flex", alignItems: "center", gap: 4 }}>
                      ✓ IN PORTFOLIO
                    </span>
                  ) : buySuccess === pick.ticker ? (
                    <span style={{ fontSize: 11, fontFamily: G.fontMono, color: G.green }}>
                      ✓ Recorded!
                    </span>
                  ) : (
                    <button
                      onClick={() => handleBuy(pick, isUS ? (regime?.spy_price || 0) : (regime?.nifty_price || 0))}
                      disabled={buyingTicker === pick.ticker}
                      style={{
                        padding: "6px 14px", borderRadius: 6, border: "1px solid rgba(16,185,129,0.4)",
                        background: "rgba(16,185,129,0.08)", color: G.green, fontSize: 11,
                        fontFamily: G.fontMono, fontWeight: 700, cursor: "pointer",
                        opacity: buyingTicker === pick.ticker ? 0.5 : 1,
                        transition: "all 0.2s",
                      }}
                    >
                      {buyingTicker === pick.ticker ? "Recording…" : "+ Buy"}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}

      {/* ── YoYo Watch Section ─────────────────────────────────────── */}
      {yoyoPicks.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <button
            onClick={() => setShowYoyo(v => !v)}
            style={{ width: "100%", background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 10, padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#fbbf24", fontFamily: G.fontMono, fontSize: 12, fontWeight: 600 }}
          >
            <span>〰️ Yo-Yo Watch ({yoyoPicks.length})</span>
            <span style={{ fontSize: 10, color: G.muted, fontWeight: 400, marginLeft: 8, flex: 1, textAlign: "left", paddingLeft: 12 }}>
              Stocks that have broken their thesis before — bounced, then fell again
            </span>
            <span style={{ fontSize: 14 }}>{showYoyo ? "▲" : "▼"}</span>
          </button>
          {showYoyo && (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ padding: "8px 14px", background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.12)", borderRadius: 8, fontSize: 11, color: "#fbbf24", fontFamily: G.fontMono, lineHeight: 1.6 }}>
                These stocks fell &gt;5% from their first recommended price, recovered, then fell again. Genuine recovery or false start? You decide.
              </div>
              {yoyoPicks.map((pick, i) => (
                <div key={i} className="card" style={{ padding: 16, borderLeft: "3px solid #fbbf24", opacity: 0.9 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <span style={{ fontFamily: G.fontMono, fontWeight: 700, fontSize: 14, color: "#fbbf24" }}>{pick.ticker}</span>
                      <span style={{ color: G.muted, fontSize: 11, marginLeft: 8 }}>{pick.name}</span>
                      <div style={{ fontSize: 10, color: G.muted, marginTop: 2 }}>{pick.sector}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: G.fontMono, fontSize: 15, fontWeight: 700 }}>{pick.price}</div>
                      <div style={{ fontSize: 10, color: "#fbbf24", fontFamily: G.fontMono, marginTop: 2 }}>↕ {pick.yoyo_count}x yo-yo</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 11, fontFamily: G.fontMono, color: G.muted, marginBottom: 8 }}>
                    <span>5D <span style={{ color: (pick.ret_5d||0) > 0 ? G.green : G.red }}>{(pick.ret_5d||0) > 0 ? "+" : ""}{(pick.ret_5d||0).toFixed(1)}%</span></span>
                    <span>1M <span style={{ color: (pick.ret_1m||0) > 0 ? G.green : G.red }}>{(pick.ret_1m||0) > 0 ? "+" : ""}{(pick.ret_1m||0).toFixed(1)}%</span></span>
                    <span>vs {benchmark} <span style={{ color: (pick.rs_5d||0) > 0 ? G.green : G.red }}>{(pick.rs_5d||0) > 0 ? "+" : ""}{(pick.rs_5d||0).toFixed(1)}%</span></span>
                  </div>
                  {pick.signal && (
                    <div style={{ fontSize: 11, color: G.muted, lineHeight: 1.6, padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 6, borderLeft: "2px solid rgba(251,191,36,0.3)" }}>
                      <span style={{ color: "#fbbf24", fontSize: 10, fontWeight: 600, fontFamily: G.fontMono }}>YO-YO WATCH · </span>{pick.signal}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Crowded Trades Section ────────────────────────────────────── */}
      {crowdedPicks.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <button
            onClick={() => setShowCrowded(v => !v)}
            style={{ width: "100%", background: "rgba(148,163,184,0.06)", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 10, padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#94a3b8", fontFamily: G.fontMono, fontSize: 12, fontWeight: 600 }}
          >
            <span>👥 Crowded Trades ({crowdedPicks.length})</span>
            <span style={{ fontSize: 10, color: G.muted, fontWeight: 400, marginLeft: 8, flex: 1, textAlign: "left", paddingLeft: 12 }}>
              Strong movers the crowd has already discovered — still tracked, not fresh
            </span>
            <span style={{ fontSize: 14 }}>{showCrowded ? "▲" : "▼"}</span>
          </button>
          {showCrowded && (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ padding: "8px 14px", background: "rgba(148,163,184,0.04)", border: "1px solid rgba(148,163,184,0.12)", borderRadius: 8, fontSize: 11, color: "#94a3b8", fontFamily: G.fontMono, lineHeight: 1.6 }}>
                These stocks have been picked 15+ consecutive scans — the crowd is fully in. Often still performing, but the early-mover edge is gone. Existing holders may stay in; new entries carry more risk.
              </div>
              {crowdedPicks.map((pick, i) => (
                <div key={i} className="card" style={{ padding: 16, borderLeft: "3px solid #94a3b8", opacity: 0.85 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <span style={{ fontFamily: G.fontMono, fontWeight: 700, fontSize: 14, color: "#94a3b8" }}>{pick.ticker}</span>
                      <span style={{ color: G.muted, fontSize: 11, marginLeft: 8 }}>{pick.name}</span>
                      <div style={{ fontSize: 10, color: G.muted, marginTop: 2 }}>{pick.sector}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: G.fontMono, fontSize: 15, fontWeight: 700 }}>{pick.price}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: G.fontMono, marginTop: 2 }}>👥 {pick.consecutive_picks}x picked</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 11, fontFamily: G.fontMono, color: G.muted, marginBottom: 8 }}>
                    <span>5D <span style={{ color: (pick.ret_5d||0) > 0 ? G.green : G.red }}>{(pick.ret_5d||0) > 0 ? "+" : ""}{(pick.ret_5d||0).toFixed(1)}%</span></span>
                    <span>1M <span style={{ color: (pick.ret_1m||0) > 0 ? G.green : G.red }}>{(pick.ret_1m||0) > 0 ? "+" : ""}{(pick.ret_1m||0).toFixed(1)}%</span></span>
                    <span>vs {benchmark} <span style={{ color: (pick.rs_5d||0) > 0 ? G.green : G.red }}>{(pick.rs_5d||0) > 0 ? "+" : ""}{(pick.rs_5d||0).toFixed(1)}%</span></span>
                  </div>
                  {pick.signal && (
                    <div style={{ fontSize: 11, color: G.muted, lineHeight: 1.6, padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 6, borderLeft: "2px solid rgba(148,163,184,0.3)" }}>
                      <span style={{ color: "#94a3b8", fontSize: 10, fontWeight: 600, fontFamily: G.fontMono }}>CROWDED · </span>{pick.signal}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div style={{ marginTop: 20, fontSize: 11, color: "rgba(255,255,255,0.18)", textAlign: "center", fontFamily: G.fontMono, lineHeight: 1.6 }}>
        ⚠ Dark Horses are momentum signals, not buy recommendations. Signals use relative strength vs {benchmark} + OBV buy-pressure detection.<br />
        Past momentum does not guarantee future returns. Market Caution mode activates automatically in downtrends.<br />
        SEBI Disclaimer: For educational purposes only. Not registered investment advice.
      </div>
    </div>
  );
}


// ── Portfolio Tab ─────────────────────────────────────────────────────────────
function Portfolio({ market = "india" }) {
  const [auth, setAuth] = useState(() => getStoredAuth());
  const handleLogin  = (token, username) => setAuth({ token, username });
  const handleLogout = () => { clearAuth(); setAuth(null); };
  if (!auth) return <LoginGate onLogin={handleLogin} />;
  return <PortfolioInner auth={auth} onLogout={handleLogout} market={market} />;
}

function PortfolioInner({ auth, onLogout, market = "india" }) {
  const isUS        = market === "us";
  const currency    = isUS ? "$" : "₹";
  const benchmark   = isUS ? "S&P 500" : "Nifty";
  const apiPrefix   = isUS ? "portfolio-us" : "portfolio";
  const marketLabel = isUS ? "🇺🇸 US Portfolio" : "💼 India Portfolio";
  const [positions, setPositions]   = useState([]);
  const [history, setHistory]       = useState([]);
  const [summary, setSummary]       = useState(null);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [sellingTicker, setSellingTicker] = useState(null);
  const [benchmarkPrice, setBenchmarkPrice] = useState(0);

  const authHeader = { "Authorization": `Bearer ${auth.token}` };

  const loadPortfolio = async () => {
    setLoading(true);
    try {
      const [posRes, histRes] = await Promise.all([
        fetch(`${API_BASE}/${apiPrefix}/positions`, { headers: authHeader }),
        fetch(`${API_BASE}/${apiPrefix}/history`,   { headers: authHeader }),
      ]);
      if (posRes.ok) {
        const posData = await posRes.json();
        setPositions(posData.positions || []);
        setSummary(posData.summary || null);
        if (posData.positions?.length) {
          setBenchmarkPrice(posData.positions[0]?.current_nifty || posData.positions[0]?.current_spy || 0);
        }
      }
      if (histRes.ok) {
        const histData = await histRes.json();
        setHistory(histData.trades || []);
        setStats(histData.stats || null);
      }
    } catch (e) {}
    finally { setLoading(false); }
  };

  const handleSell = async (position) => {
    if (!window.confirm(`Sell ${position.ticker} at ₹${position.current_price?.toFixed(2)}?`)) return;
    setSellingTicker(position.ticker);
    try {
      const sellBody = isUS ? {
        ticker:      position.ticker,
        exit_price:  position.current_price,
        exit_signal: position.exit_signal,
        exit_spy:    benchmarkPrice || 0,
      } : {
        ticker:      position.ticker,
        exit_price:  position.current_price,
        exit_signal: position.exit_signal,
        exit_nifty:  benchmarkPrice || 0,
      };
      const res = await fetch(`${API_BASE}/${apiPrefix}/sell`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify(sellBody)
      });
      const data = await res.json();
      if (res.ok) {
        await loadPortfolio();
      } else {
        alert(data.detail || "Could not record sell");
      }
    } catch (e) {
      alert("Network error");
    } finally {
      setSellingTicker(null);
    }
  };

  useEffect(() => { loadPortfolio(); }, []);

  const signalConfig = {
    HOLD:  { color: "#10b981", bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.25)",  icon: "🟢" },
    WATCH: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.25)",  icon: "🟡" },
    EXIT:  { color: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.25)",   icon: "🔴" },
  };

  if (loading) return (
    <div style={{ padding: 40, textAlign: "center", color: G.muted, fontFamily: G.fontMono, fontSize: 13 }}>
      Loading portfolio…
    </div>
  );

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 0 40px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: G.fontDisplay, fontSize: "clamp(20px,4vw,28px)", marginBottom: 4 }}>{marketLabel}</div>
          <div style={{ color: G.muted, fontSize: 13 }}>{isUS ? "US positions · Alpha vs S&P 500" : "India positions · Alpha vs Nifty"}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={loadPortfolio} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: G.muted, fontSize: 11, fontFamily: G.fontMono, cursor: "pointer" }}>
            ↻ Refresh
          </button>
          <button onClick={() => { onLogout(); }} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)", background: "none", color: G.muted, fontSize: 11, fontFamily: G.fontMono, cursor: "pointer" }}>
            Sign out
          </button>
        </div>
      </div>

      {/* Summary bar */}
      {summary && summary.total > 0 && (
        <div style={{ marginBottom: 20, padding: "14px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontFamily: G.fontMono, fontSize: 12, color: G.subtext }}>
            <span style={{ color: G.text, fontWeight: 700 }}>{summary.total}</span> open
          </span>
          <span style={{ fontFamily: G.fontMono, fontSize: 12, color: G.subtext }}>
            Avg alpha <span style={{ color: summary.avg_alpha >= 0 ? G.green : G.red, fontWeight: 700 }}>{summary.avg_alpha >= 0 ? "+" : ""}{summary.avg_alpha}%</span>
          </span>
          <span style={{ fontFamily: G.fontMono, fontSize: 12 }}>
            🟢 {summary.hold} &nbsp; 🟡 {summary.watch} &nbsp; 🔴 {summary.exit}
          </span>
        </div>
      )}

      {/* Empty state */}
      {positions.length === 0 && (
        <div style={{ padding: "40px 20px", textAlign: "center", color: G.muted, fontFamily: G.fontMono, fontSize: 13, background: "rgba(255,255,255,0.02)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
          No open positions.<br />
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 8, display: "block" }}>
            Tap + Buy on any Dark Horse to start tracking.
          </span>
        </div>
      )}

      {/* Open positions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {positions.map(pos => {
          const sc = signalConfig[pos.exit_signal] || signalConfig.HOLD;
          const retPos = (pos.stock_ret || 0) >= 0;
          const alphaPos = (pos.alpha || 0) >= 0;
          return (
            <div key={pos.id} className="dh-card" style={{ borderLeft: `3px solid ${sc.color}` }}>

              {/* Exit signal badge */}
              <div style={{ marginBottom: 10, padding: "6px 10px", background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: G.fontMono, fontSize: 11, fontWeight: 700, color: sc.color }}>
                  {sc.icon} {pos.exit_signal}
                </span>
                <span style={{ fontFamily: G.fontMono, fontSize: 10, color: sc.color, opacity: 0.8 }}>
                  {pos.exit_reason}
                </span>
              </div>

              {/* Ticker + price */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <span style={{ fontFamily: G.fontMono, fontWeight: 700, fontSize: 15, color: G.accent }}>{pos.ticker}</span>
                  <span style={{ color: G.muted, fontSize: 11, marginLeft: 8 }}>{pos.company_name}</span>
                  <div style={{ fontSize: 10, color: G.muted, marginTop: 2 }}>{pos.sector} · {pos.days_held}d held · entered {pos.entry_signal}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: G.fontMono, fontSize: 15, fontWeight: 700 }}>{currency}{pos.current_price?.toFixed(2)}</div>
                  <div style={{ fontSize: 10, color: G.muted, fontFamily: G.fontMono }}>entry {currency}{parseFloat(pos.entry_price).toFixed(2)}</div>
                </div>
              </div>

              {/* Returns */}
              <div style={{ display: "flex", gap: 20, fontSize: 12, fontFamily: G.fontMono, marginBottom: 10, flexWrap: "wrap" }}>
                <div>
                  <div style={{ color: G.muted, fontSize: 10, marginBottom: 2 }}>RETURN</div>
                  <div style={{ color: retPos ? G.green : G.red, fontWeight: 700 }}>
                    {retPos ? "+" : ""}{pos.stock_ret?.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div style={{ color: G.muted, fontSize: 10, marginBottom: 2 }}>{benchmark.toUpperCase()}</div>
                  <div style={{ color: G.subtext }}>{((pos.nifty_ret || pos.spy_ret || 0)) >= 0 ? "+" : ""}{(pos.nifty_ret || pos.spy_ret || 0).toFixed(1)}%</div>
                </div>
                <div>
                  <div style={{ color: G.muted, fontSize: 10, marginBottom: 2 }}>ALPHA</div>
                  <div style={{ color: alphaPos ? G.green : G.red, fontWeight: 700 }}>
                    {alphaPos ? "+" : ""}{pos.alpha?.toFixed(1)}%
                  </div>
                </div>
                {pos.sell_pressure != null && (
                  <div>
                    <div style={{ color: G.muted, fontSize: 10, marginBottom: 2 }}>SELL PRESSURE</div>
                    <div style={{ color: pos.sell_pressure > 1.3 ? G.red : pos.sell_pressure > 1.1 ? G.accent : G.green, fontWeight: 700 }}>
                      {pos.sell_pressure?.toFixed(2)}x
                    </div>
                  </div>
                )}
                {pos.obv_signal != null && (
                  <div>
                    <div style={{ color: G.muted, fontSize: 10, marginBottom: 2 }}>OBV</div>
                    <div style={{ color: pos.obv_signal > 0 ? G.green : G.red, fontWeight: 700 }}>
                      {pos.obv_signal > 0 ? "▲" : "▼"} {Math.abs(pos.obv_signal)?.toFixed(2)}
                    </div>
                  </div>
                )}
                {pos.recency_score != null && (
                  <div>
                    <div style={{ color: G.muted, fontSize: 10, marginBottom: 2 }}>RECENCY</div>
                    <div style={{ color: pos.recency_score > 0.5 ? G.green : pos.recency_score > 0.3 ? G.accent : G.red, fontWeight: 700 }}>
                      {(pos.recency_score * 10)?.toFixed(1)}/10
                    </div>
                  </div>
                )}
              </div>

              {/* News headline if present */}
              {pos.news_headline && (
                <div style={{ marginBottom: 10, padding: "6px 10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, fontSize: 11, color: G.muted, fontFamily: G.fontMono, lineHeight: 1.5 }}>
                  📰 {pos.news_headline}
                </div>
              )}

              {/* Extra reason if present */}
              {pos.extra_reason && pos.extra_reason !== pos.exit_reason && (
                <div style={{ marginBottom: 10, padding: "6px 10px", background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 6, fontSize: 11, color: G.red, fontFamily: G.fontMono, lineHeight: 1.5 }}>
                  ⚠ {pos.extra_reason}
                </div>
              )}

              {/* Sell button */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={() => handleSell(pos)}
                  disabled={sellingTicker === pos.ticker}
                  style={{
                    padding: "7px 18px", borderRadius: 6, cursor: "pointer",
                    fontFamily: G.fontMono, fontSize: 11, fontWeight: 700,
                    border: `1px solid ${sc.color}40`,
                    background: sc.bg, color: sc.color,
                    opacity: sellingTicker === pos.ticker ? 0.5 : 1,
                    transition: "all 0.2s",
                  }}
                >
                  {sellingTicker === pos.ticker ? "Recording…" : pos.exit_signal === "EXIT" ? "🔴 Sell Now" : "Sell"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Track record */}
      {(history.length > 0 || stats) && (
        <div style={{ marginTop: 24 }}>
          <button
            onClick={() => setShowHistory(v => !v)}
            style={{ width: "100%", background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 10, padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", color: G.purple, fontFamily: G.fontMono, fontSize: 12, fontWeight: 600 }}
          >
            <span>📊 Track Record ({history.length} closed trades)</span>
            <span style={{ fontSize: 14 }}>{showHistory ? "▲" : "▼"}</span>
          </button>

          {showHistory && stats && (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>

              {/* Stats summary */}
              <div style={{ padding: "14px 16px", background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: 8, display: "flex", gap: 24, flexWrap: "wrap" }}>
                <div style={{ fontFamily: G.fontMono, fontSize: 12 }}>
                  <div style={{ color: G.muted, fontSize: 10, marginBottom: 2 }}>WIN RATE</div>
                  <div style={{ color: G.green, fontWeight: 700 }}>{stats.win_rate}%</div>
                </div>
                <div style={{ fontFamily: G.fontMono, fontSize: 12 }}>
                  <div style={{ color: G.muted, fontSize: 10, marginBottom: 2 }}>AVG ALPHA</div>
                  <div style={{ color: (stats.avg_alpha||0) >= 0 ? G.green : G.red, fontWeight: 700 }}>
                    {(stats.avg_alpha||0) >= 0 ? "+" : ""}{stats.avg_alpha}%
                  </div>
                </div>
                {stats.best_trade && (
                  <div style={{ fontFamily: G.fontMono, fontSize: 12 }}>
                    <div style={{ color: G.muted, fontSize: 10, marginBottom: 2 }}>BEST</div>
                    <div style={{ color: G.green, fontWeight: 700 }}>{stats.best_trade.ticker} +{stats.best_trade.alpha?.toFixed(1)}%</div>
                  </div>
                )}
                {stats.worst_trade && (
                  <div style={{ fontFamily: G.fontMono, fontSize: 12 }}>
                    <div style={{ color: G.muted, fontSize: 10, marginBottom: 2 }}>WORST</div>
                    <div style={{ color: G.red, fontWeight: 700 }}>{stats.worst_trade.ticker} {stats.worst_trade.alpha?.toFixed(1)}%</div>
                  </div>
                )}
              </div>

              {/* By entry signal */}
              {stats.by_entry_signal && Object.keys(stats.by_entry_signal).length > 0 && (
                <div style={{ padding: "12px 16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8 }}>
                  <div style={{ fontFamily: G.fontMono, fontSize: 10, color: G.muted, marginBottom: 10, fontWeight: 700 }}>ALPHA BY ENTRY SIGNAL</div>
                  <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                    {Object.entries(stats.by_entry_signal).map(([sig, s]) => (
                      <div key={sig} style={{ fontFamily: G.fontMono, fontSize: 12 }}>
                        <div style={{ color: G.muted, fontSize: 10, marginBottom: 2 }}>{sig} ({s.count})</div>
                        <div style={{ color: s.avg_alpha >= 0 ? G.green : G.red, fontWeight: 700 }}>
                          {s.avg_alpha >= 0 ? "+" : ""}{s.avg_alpha}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trade list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {history.map(trade => {
                  const alphaPos = (trade.alpha || 0) >= 0;
                  return (
                    <div key={trade.id} style={{ padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span style={{ fontFamily: G.fontMono, fontWeight: 700, fontSize: 13, color: G.accent }}>{trade.ticker}</span>
                        <span style={{ fontSize: 10, color: G.muted, marginLeft: 8, fontFamily: G.fontMono }}>{trade.entry_signal} → {trade.exit_signal}</span>
                      </div>
                      <div style={{ textAlign: "right", fontFamily: G.fontMono }}>
                        <div style={{ color: alphaPos ? G.green : G.red, fontWeight: 700, fontSize: 13 }}>
                          {alphaPos ? "+" : ""}{parseFloat(trade.alpha || 0).toFixed(1)}% alpha
                        </div>
                        <div style={{ fontSize: 10, color: G.muted }}>
                          {currency}{parseFloat(trade.entry_price).toFixed(0)} → {currency}{parseFloat(trade.exit_price || 0).toFixed(0)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div style={{ marginTop: 24, fontSize: 11, color: "rgba(255,255,255,0.15)", textAlign: "center", fontFamily: G.fontMono, lineHeight: 1.6 }}>
        Portfolio tracks entries at signal prices vs {benchmark}. Not financial advice.
      </div>
    </div>
  );
}

// ── Research Terminal ─────────────────────────────────────────────────────────
function ResearchTerminal() {
  const [inputVal, setInputVal] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [chartTicker, setChartTicker] = useState("");
  const [stockInfo, setStockInfo] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const chatEndRef = useRef(null);
  const searchTimer = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    const handler = e => { if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleInput = val => {
    setInputVal(val);
    setShowDropdown(false);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (val.trim().length < 2) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(val)}`);
        const data = await res.json();
        setSearchResults(data.results || []);
        setShowDropdown((data.results || []).length > 0);
      } catch { setSearchResults([]); }
      setSearching(false);
    }, 400);
  };

  const analyze = async (ticker, companyName) => {
    const sym = ticker.trim().toUpperCase();
    if (!sym) return;
    setShowDropdown(false);
    setInputVal(companyName ? `${sym} — ${companyName}` : sym);
    setLoading(true); setChartData(null); setStockInfo(null);
    const userMsg = { role: "user", content: `Analyse ${sym}.NS — give me a detailed fundamental analysis.` };
    setMessages(prev => [...prev, userMsg]);
    try {
      const response = await fetch(`${API_BASE}/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: sym, question: `Give me a full fundamental analysis of ${sym}` }),
      });
      if (!response.ok) throw new Error(`Backend error: ${response.status}`);
      const data = await response.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.analysis || "Unable to fetch analysis." }]);
      const ld = data.live_data || {};
      setStockInfo({ name: ld.company_name || companyName || sym, price: ld.price || "—", pe: ld.pe || "—", roe: ld.roe || "—", mcap: ld.mcap || "—", week_52_high: ld.week_52_high || "—", week_52_low: ld.week_52_low || "—", verdict: data.verdict || "", target_12m: data.target_12m || "" });
      setChartTicker(sym);
      setTimeout(() => { setChartData(buildChartFromHistory(ld.history, sym)); }, 100);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: `⚠️ Error: ${e.message}` }]);
    }
    setLoading(false);
  };

  const handleSend = () => {
    if (searchResults.length > 0) { analyze(searchResults[0].ticker, searchResults[0].name); }
    else { analyze(inputVal.split("—")[0].trim()); }
    setInputVal(""); setSearchResults([]);
  };

  const verdictColor = stockInfo?.verdict === "BUY" ? G.green : stockInfo?.verdict === "AVOID" ? G.red : G.accent;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontSize: 11, color: G.muted, fontFamily: G.fontMono, marginBottom: 10, letterSpacing: "0.08em" }}>NSE STOCK RESEARCH TERMINAL</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div className="search-wrap" ref={wrapperRef}>
            <input className="inp" style={{ fontFamily: G.fontBody, fontSize: 14 }}
              placeholder="Search by name or ticker (e.g. Ola Electric, RELIANCE)"
              value={inputVal} onChange={e => handleInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSend(); if (e.key === "Escape") setShowDropdown(false); }}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)} />
            {showDropdown && searchResults.length > 0 && (
              <div className="dropdown">
                {searchResults.map(r => (
                  <div key={r.ticker} className="dropdown-item" onClick={() => analyze(r.ticker, r.name)}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <span style={{ fontFamily: G.fontMono, fontWeight: 700, fontSize: 13, color: G.accent }}>{r.ticker}</span>
                        <span style={{ marginLeft: 10, fontSize: 13, color: G.text }}>{r.name}</span>
                      </div>
                      {r.sector && <span style={{ fontSize: 11, color: G.muted, fontFamily: G.fontMono }}>{r.sector}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button className="btn" onClick={handleSend} disabled={!inputVal.trim() || loading} style={{ whiteSpace: "nowrap" }}>
            {loading ? "Analysing…" : searching ? "Searching…" : "Analyse →"}
          </button>
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 10, color: G.muted, fontFamily: G.fontMono, marginBottom: 8, letterSpacing: "0.06em" }}>POPULAR STOCKS</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {SUGGESTIONS.map(s => (
              <div key={s.ticker} className="unsel" style={{ borderRadius: 8, padding: "6px 10px", cursor: "pointer" }} onClick={() => analyze(s.ticker, s.name)}>
                <div style={{ fontFamily: G.fontMono, fontWeight: 700, fontSize: 11, color: G.accent }}>{s.ticker}</div>
                <div style={{ fontSize: 10, color: G.muted, fontFamily: G.fontBody, marginTop: 1 }}>{s.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {(stockInfo || chartData) && (
        <div className="card chart-wrapper slide-in" style={{ padding: "20px 16px" }}>
          {stockInfo && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: G.fontMono, fontWeight: 700, fontSize: 18, color: G.accent }}>{chartTicker}.NS</span>
                    <span style={{ fontSize: 24, fontWeight: 700, color: G.green, fontFamily: G.fontMono }}>{stockInfo.price}</span>
                  </div>
                  <div style={{ fontSize: 14, color: G.text, marginTop: 2, fontWeight: 500 }}>{stockInfo.name}</div>
                </div>
                {stockInfo.verdict && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ background: verdictColor + "18", border: `1px solid ${verdictColor}40`, borderRadius: 8, padding: "6px 14px", display: "inline-block" }}>
                      <div style={{ fontSize: 11, color: G.muted, fontFamily: G.fontMono, marginBottom: 2 }}>AI VERDICT</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: verdictColor, fontFamily: G.fontMono }}>{stockInfo.verdict}</div>
                    </div>
                    {stockInfo.target_12m && <div style={{ fontSize: 11, color: G.muted, marginTop: 4, fontFamily: G.fontMono }}>12M Target: <span style={{ color: G.accent }}>{stockInfo.target_12m}</span></div>}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap", paddingTop: 12, borderTop: `1px solid ${G.border}` }}>
                {[["P/E", stockInfo.pe], ["ROE", stockInfo.roe], ["MCap", stockInfo.mcap], ["52W High", stockInfo.week_52_high], ["52W Low", stockInfo.week_52_low]].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 10, color: G.muted, fontFamily: G.fontMono, marginBottom: 2 }}>{k}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: G.text, fontFamily: G.fontMono }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {chartData && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontSize: 11, color: G.muted, fontFamily: G.fontMono, letterSpacing: "0.06em" }}>PRICE HISTORY + AI FORECAST</span>
                <div style={{ display: "flex", gap: 14, fontSize: 11, color: G.muted }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 16, height: 2, background: G.green, display: "inline-block", borderRadius: 2 }} /> Historical</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 16, height: 2, background: G.accent, display: "inline-block", borderRadius: 2 }} /> Forecast</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200} minWidth={0}>
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={G.green} stopOpacity={0.15}/><stop offset="95%" stopColor={G.green} stopOpacity={0}/></linearGradient>
                    <linearGradient id="foreGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={G.accent} stopOpacity={0.2}/><stop offset="95%" stopColor={G.accent} stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fill: G.muted, fontSize: 9, fontFamily: G.fontMono }} tickLine={false} axisLine={false} interval={5} />
                  <YAxis tick={{ fill: G.muted, fontSize: 9, fontFamily: G.fontMono }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v/1000).toFixed(1)}k`} width={40} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="price" stroke={G.green} strokeWidth={2} fill="url(#histGrad)" dot={false} activeDot={{ r:4, fill:G.green }} data={chartData.filter(d => d.historical)} />
                  <Area type="monotone" dataKey="price" stroke={G.accent} strokeWidth={2} strokeDasharray="5 3" fill="url(#foreGrad)" dot={false} activeDot={{ r:4, fill:G.accent }} data={chartData.filter(d => !d.historical)} />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.18)", textAlign: "center", marginTop: 8, fontFamily: G.fontMono }}>⚠ Forecast is illustrative — not financial advice.</div>
            </>
          )}
        </div>
      )}

      {messages.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${G.border}`, fontSize: 11, color: G.muted, fontFamily: G.fontMono, letterSpacing: "0.07em" }}>AI FUNDAMENTAL ANALYSIS</div>
          <div style={{ maxHeight: 420, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
            {messages.map((m, i) => (
              <div key={i} className="slide-in" style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: m.role==="user"?"rgba(255,255,255,0.08)":G.accentDim, border:`1px solid ${m.role==="user"?G.border:G.accentBorder}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, flexShrink:0, marginTop:1 }}>{m.role==="user"?"U":"◈"}</div>
                <div style={{ fontSize: 13.5, lineHeight: 1.7, color: m.role==="user"?G.muted:G.text, whiteSpace:"pre-wrap", fontFamily:G.fontBody, flex:1 }}>{m.content}</div>
              </div>
            ))}
            {loading && (
              <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                <div style={{ width:28, height:28, borderRadius:6, background:G.accentDim, border:`1px solid ${G.accentBorder}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12 }}>◈</div>
                <div style={{ display:"flex", gap:5 }}>{[0,1,2].map(i=><div key={i} className="pulse" style={{ width:6,height:6,borderRadius:3,background:G.accent,animationDelay:`${i*0.2}s` }}/>)}</div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div style={{ padding:"12px 16px", borderTop:`1px solid ${G.border}`, display:"flex", gap:10 }}>
            <input className="inp" style={{ flex:1, fontSize:13 }} placeholder="Ask a follow-up (e.g. 'How does it compare to peers?')"
              value={inputVal.includes("—")?"":inputVal} onChange={e=>setInputVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSend()} />
            <button className="btn" disabled={loading} onClick={handleSend} style={{ padding:"11px 18px" }}>↑</button>
          </div>
        </div>
      )}

      {messages.length === 0 && !loading && (
        <div style={{ textAlign:"center", padding:"40px 20px", color:G.muted }}>
          <div style={{ fontSize:36, marginBottom:12 }}>📊</div>
          <div style={{ fontFamily:G.fontDisplay, fontSize:18, color:G.text, marginBottom:8 }}>Research any NSE stock</div>
          <div style={{ fontSize:13, lineHeight:1.6 }}>Type a company name or ticker above.<br/>You'll get live fundamentals + an AI price forecast.</div>
        </div>
      )}
    </div>
  );
}

// ── Advisor Flow ──────────────────────────────────────────────────────────────
const RISKS = [
  { id:"conservative", icon:"🛡️", label:"Rakshak (Conservative)", desc:"Capital preservation. Low volatility Nifty 50 bluechips and PSU dividend payers." },
  { id:"moderate", icon:"⚖️", label:"Santulit (Moderate)", desc:"Balanced growth. Mix of large-cap leaders and emerging sectoral stories." },
  { id:"aggressive", icon:"🚀", label:"Saahasi (Aggressive)", desc:"High growth. Midcap momentum plays, new-age tech, and high-conviction bets." },
];
const HORIZONS = [
  { id:"short", icon:"⚡", label:"Short Term", sub:"< 1 year" },
  { id:"medium", icon:"📈", label:"Medium Term", sub:"1–5 years" },
  { id:"long", icon:"🏔️", label:"Long Term", sub:"5+ years" },
];

function AdvisorFlow() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [risk, setRisk] = useState(null);
  const [horizon, setHorizon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const stocks = (risk && horizon) ? NIFTY_STOCKS[risk][horizon] : [];
  const proceed = () => { if (step < 2) { setStep(s=>s+1); return; } setLoading(true); setTimeout(()=>{setLoading(false);setDone(true);},2000); };
  const reset = () => { setStep(0); setName(""); setAmount(""); setRisk(null); setHorizon(null); setDone(false); };
  const canGo = [name.trim()&&amount.trim(), !!risk, !!horizon];

  if (loading) return (
    <div style={{ textAlign:"center", padding:"60px 20px" }}>
      <div style={{ width:40,height:40,borderRadius:"50%",border:`2px solid ${G.border}`,borderTopColor:G.accent,margin:"0 auto 20px" }} className="spin" />
      <div style={{ fontFamily:G.fontDisplay, fontSize:20, marginBottom:8 }}>Scanning Nifty universe…</div>
      <div style={{ color:G.muted, fontSize:13 }}>Matching your profile to NSE fundamentals</div>
    </div>
  );

  if (done) return (
    <div className="slide-in">
      <div style={{ marginBottom:6,fontSize:11,fontFamily:G.fontMono,color:G.accent,letterSpacing:"0.08em" }}>YOUR NSE PICKS</div>
      <div style={{ fontFamily:G.fontDisplay,fontSize:"clamp(20px,5vw,28px)",marginBottom:4 }}>Namaste, {name} 🙏</div>
      <div style={{ color:G.muted,fontSize:13,marginBottom:20 }}>{RISKS.find(r=>r.id===risk)?.label.split(" ")[0]} · {HORIZONS.find(h=>h.id===horizon)?.label} · ₹{parseFloat(amount.replace(/,/g,"")).toLocaleString("en-IN")}</div>
      <div style={{ display:"flex",flexDirection:"column",gap:12,marginBottom:20 }}>
        {stocks.map((s,i)=>(
          <div key={s.ticker} className="card slide-in" style={{ padding:16,animationDelay:`${i*0.1}s` }}>
            <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,flexWrap:"wrap" }}>
              <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                <span style={{ color:"rgba(255,255,255,0.2)",fontSize:11,fontFamily:G.fontMono }}>{i+1}.</span>
                <div>
                  <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
                    <span style={{ fontFamily:G.fontMono,fontWeight:600,fontSize:14,color:G.accent }}>{s.ticker}</span>
                    <span style={{ fontSize:14,fontWeight:500,color:G.text }}>{s.name}</span>
                  </div>
                  <div style={{ display:"flex",gap:8,marginTop:5,flexWrap:"wrap" }}>
                    {[["P/E",s.pe],["ROE",s.roe],["MCap",s.mcap]].map(([k,v])=>(<span key={k} style={{ fontSize:11,fontFamily:G.fontMono,color:G.subtext }}><span style={{ color:G.muted }}>{k}</span> {v}</span>))}
                  </div>
                </div>
              </div>
              <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
                <span className="chip" style={{ background:(SECTOR_COLORS[s.sector]||"#6366f1")+"18",color:SECTOR_COLORS[s.sector]||"#6366f1",border:`1px solid ${(SECTOR_COLORS[s.sector]||"#6366f1")}30` }}>{s.sector}</span>
                <span style={{ fontFamily:G.fontMono,fontSize:13,fontWeight:700,color:G.green }}>{s.change}</span>
              </div>
            </div>
            <p style={{ fontSize:13,color:G.subtext,lineHeight:1.6,marginTop:10 }}>{s.reason}</p>
          </div>
        ))}
      </div>
      <button className="btn" onClick={reset} style={{ width:"100%",marginBottom:10 }}>Start Over</button>
      <div style={{ fontSize:11,color:"rgba(255,255,255,0.2)",textAlign:"center",lineHeight:1.6,fontFamily:G.fontMono }}>⚠ SEBI Disclaimer: Educational purposes only. Not registered investment advice.</div>
    </div>
  );

  return (
    <div>
      <div style={{ display:"flex",gap:6,marginBottom:28 }}>{[0,1,2].map(i=><div key={i} style={{ height:3,flex:1,borderRadius:2,background:i<=step?G.accent:G.border,transition:"background 0.3s" }}/>)}</div>
      {step===0&&(<div className="slide-in">
        <div style={{ fontSize:11,fontFamily:G.fontMono,color:G.accent,letterSpacing:"0.08em",marginBottom:10 }}>INVESTOR PROFILE</div>
        <h2 style={{ fontFamily:G.fontDisplay,fontSize:"clamp(22px,5vw,34px)",marginBottom:8,lineHeight:1.2 }}>Smart picks from<br/><em>Nifty's finest.</em></h2>
        <p style={{ color:G.muted,fontSize:13.5,marginBottom:28,lineHeight:1.65 }}>3 quick questions. AI-matched NSE stocks. Built for Indian investors.</p>
        <div style={{ display:"flex",flexDirection:"column",gap:12,marginBottom:24 }}>
          <div><label style={{ fontSize:11,color:G.muted,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase",display:"block",marginBottom:6,fontFamily:G.fontMono }}>Your Name</label><input className="inp" placeholder="e.g. Rahul" value={name} onChange={e=>setName(e.target.value)}/></div>
          <div><label style={{ fontSize:11,color:G.muted,fontWeight:500,letterSpacing:"0.06em",textTransform:"uppercase",display:"block",marginBottom:6,fontFamily:G.fontMono }}>Investment Amount (₹)</label><input className="inp" style={{ fontFamily:G.fontMono }} placeholder="e.g. 5,00,000" value={amount} onChange={e=>setAmount(e.target.value)}/></div>
        </div>
        <button className="btn" disabled={!canGo[0]} onClick={proceed} style={{ width:"100%" }}>Continue →</button>
      </div>)}
      {step===1&&(<div className="slide-in">
        <div style={{ fontSize:11,fontFamily:G.fontMono,color:G.accent,letterSpacing:"0.08em",marginBottom:10 }}>STEP 1 OF 2</div>
        <h2 style={{ fontFamily:G.fontDisplay,fontSize:"clamp(20px,5vw,30px)",marginBottom:8,lineHeight:1.2 }}>Aapki risk appetite<br/>kya hai?</h2>
        <p style={{ color:G.muted,fontSize:13,marginBottom:24,lineHeight:1.6 }}>This shapes how we balance safety vs. growth in your NSE picks.</p>
        <div style={{ display:"flex",flexDirection:"column",gap:10,marginBottom:24 }}>
          {RISKS.map(r=>(<div key={r.id} className={`card ${risk===r.id?"sel":""}`} style={{ padding:16,cursor:"pointer",display:"flex",gap:14,alignItems:"flex-start",transition:"all 0.15s" }} onClick={()=>setRisk(r.id)}>
            <span style={{ fontSize:22,marginTop:1 }}>{r.icon}</span>
            <div style={{ flex:1 }}><div style={{ fontWeight:600,fontSize:14,marginBottom:3,color:risk===r.id?G.accent:G.text }}>{r.label}</div><div style={{ fontSize:12.5,color:G.muted,lineHeight:1.5 }}>{r.desc}</div></div>
            {risk===r.id&&<span style={{ color:G.accent,fontSize:16 }}>✓</span>}
          </div>))}
        </div>
        <button className="btn" disabled={!canGo[1]} onClick={proceed} style={{ width:"100%" }}>Continue →</button>
      </div>)}
      {step===2&&(<div className="slide-in">
        <div style={{ fontSize:11,fontFamily:G.fontMono,color:G.accent,letterSpacing:"0.08em",marginBottom:10 }}>STEP 2 OF 2</div>
        <h2 style={{ fontFamily:G.fontDisplay,fontSize:"clamp(20px,5vw,30px)",marginBottom:8,lineHeight:1.2 }}>Kitne time ke liye<br/>invest karenge?</h2>
        <p style={{ color:G.muted,fontSize:13,marginBottom:24,lineHeight:1.6 }}>Your horizon changes everything — short-term momentum vs. long-term compounding.</p>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:24 }}>
          {HORIZONS.map(h=>(<div key={h.id} className={`card ${horizon===h.id?"sel":""}`} style={{ padding:"18px 10px",cursor:"pointer",textAlign:"center",transition:"all 0.15s" }} onClick={()=>setHorizon(h.id)}>
            <div style={{ fontSize:24,marginBottom:8 }}>{h.icon}</div>
            <div style={{ fontWeight:600,fontSize:13,color:horizon===h.id?G.accent:G.text,marginBottom:2 }}>{h.label}</div>
            <div style={{ fontSize:11,color:G.muted,fontFamily:G.fontMono }}>{h.sub}</div>
          </div>))}
        </div>
        <button className="btn" disabled={!canGo[2]} onClick={proceed} style={{ width:"100%" }}>Get My NSE Picks →</button>
      </div>)}
    </div>
  );
}

// ── App Shell ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("advisor");
  const TABS = [["advisor","🧭 Advisor"],["darkhorses","🐴 India"],["darkhorses-us","🇺🇸 US"],["portfolio","💼 India"],["portfolio-us","💼 US"],["research","🔬 Research"]];

  return (
    <div style={{ minHeight:"100vh",background:G.bg,color:G.text,fontFamily:G.fontBody,display:"flex",flexDirection:"column" }}>
      <style>{css}</style>

      {/* Header */}
      <div style={{ borderBottom:`1px solid ${G.border}`,background:G.surface,position:"sticky",top:0,zIndex:50 }}>
        <div style={{ maxWidth:720,margin:"0 auto",padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div style={{ display:"flex",alignItems:"center",gap:10,padding:"14px 0" }}>
            <div style={{ width:30,height:30,background:`linear-gradient(135deg,#d97706,${G.accent})`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15 }}>◈</div>
            <div>
              <span style={{ fontFamily:G.fontDisplay,fontSize:16,fontWeight:700 }}>Stockwise</span>
              <span style={{ marginLeft:6,fontSize:10,fontFamily:G.fontMono,color:G.muted,background:"rgba(255,255,255,0.06)",padding:"2px 6px",borderRadius:4 }}>NSE</span>
            </div>
          </div>
          <div style={{ display:"flex" }}>
            {TABS.map(([id,label])=>(
              <button key={id} onClick={()=>setTab(id)} style={{ background:"none",border:"none",padding:"14px 10px",fontSize:12,fontWeight:500,fontFamily:G.fontBody,cursor:"pointer",borderBottom:`2px solid ${tab===id?G.accent:"transparent"}`,color:tab===id?G.accent:G.muted,transition:"all 0.2s",whiteSpace:"nowrap" }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ticker strip */}
      <div style={{ background:"rgba(0,0,0,0.4)",borderBottom:`1px solid ${G.border}`,overflow:"hidden",whiteSpace:"nowrap" }}>
        <div style={{ display:"inline-flex",animation:"ticker 30s linear infinite" }}>
          {[...Array(2)].map((_,rep)=>(
            [["NIFTY 50","23,481.50","+0.62%"],["SENSEX","77,414.92","+0.58%"],["RELIANCE","2,912","+1.4%"],["TCS","3,841","+0.6%"],["HDFCBANK","1,642","+0.8%"],["INFY","1,742","+0.9%"],["BAJFINANCE","7,124","+2.1%"],["ZOMATO","231","+4.2%"],["ADANIPORTS","1,342","+3.1%"],["ITC","458","+1.1%"]].map(([n,p,c],i)=>(
              <span key={`${rep}-${i}`} style={{ display:"inline-flex",alignItems:"center",gap:6,padding:"6px 20px",fontSize:11,fontFamily:G.fontMono,borderRight:`1px solid ${G.border}` }}>
                <span style={{ color:G.muted }}>{n}</span>
                <span style={{ color:G.text,fontWeight:600 }}>{p}</span>
                <span style={{ color:G.green,fontWeight:700 }}>{c}</span>
              </span>
            ))
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1,maxWidth:720,margin:"0 auto",width:"100%",padding:"28px 20px 48px" }}>
        {tab==="advisor"&&<AdvisorFlow/>}
        {tab==="darkhorses"&&<DarkHorses market="india" />}
        {tab==="darkhorses-us"&&<DarkHorses market="us" />}
        {tab==="portfolio"&&<Portfolio market="india" />}
        {tab==="portfolio-us"&&<Portfolio market="us" />}
        {tab==="research"&&<ResearchTerminal/>}
      </div>

      <div style={{ borderTop:`1px solid ${G.border}`,padding:"14px 20px",textAlign:"center",fontSize:11,color:"rgba(255,255,255,0.18)",fontFamily:G.fontMono }}>
        SEBI DISCLAIMER: Not a registered investment advisor. For educational use only. © 2026 Stockwise
      </div>
    </div>
  );
}
