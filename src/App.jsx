import { useState, useRef, useEffect } from "react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from "recharts";

const G = {
  bg: "#07080d", surface: "#0e1018", border: "#1c1f2e",
  accent: "#f59e0b", accentDim: "rgba(245,158,11,0.12)", accentBorder: "rgba(245,158,11,0.3)",
  green: "#22c55e", red: "#ef4444", muted: "rgba(255,255,255,0.35)",
  text: "#e8eaf0", subtext: "rgba(255,255,255,0.5)",
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
  .spin { animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }
  .pulse { animation: pulse 2s ease-in-out infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
  .slide-in {.chart-wrapper { -webkit-transform: translateZ(0); transform: translateZ(0); } animation: slideIn 0.3s ease-out; }
  @keyframes slideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }
`;

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

// ── API base — change this to your Railway URL when deploying ─────────────────
const API_BASE = "https://stockwise-backend-production-3527.up.railway.app";

function generateChartData(ticker) {
  const seed = ticker.split("").reduce((a,c) => a + c.charCodeAt(0), 0);
  const rng = (i) => Math.sin(seed * i * 0.31 + i * 1.7) * 0.5 + 0.5;
  const base = 800 + rng(1) * 3200;
  const trend = (rng(2) - 0.3) * 0.002;
  const vol = 0.015 + rng(3) * 0.025;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const data = [];
  let price = base;
  for (let i = 0; i < 24; i++) {
    price = price * (1 + trend + (rng(i * 7 + 1) - 0.48) * vol);
    data.push({ month: months[i % 12] + (i < 12 ? " '24" : " '25"), price: Math.round(price), historical: true });
  }
  const lastPrice = data[data.length - 1].price;
  const futureBase = trend > 0 ? lastPrice * 1.08 : lastPrice * 0.95;
  for (let i = 0; i < 6; i++) {
    const fp = futureBase * (1 + trend * (i + 1) * 30);
    const spread = fp * (0.04 + i * 0.02);
    data.push({ month: months[(18 + i) % 12] + " '26", price: Math.round(fp), upper: Math.round(fp + spread), lower: Math.round(fp - spread), historical: false, forecast: true });
  }
  return data;
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{ background: "#12141f", border: `1px solid ${G.border}`, borderRadius: 8, padding: "10px 14px", fontFamily: G.fontMono, fontSize: 12 }}>
      <div style={{ color: G.muted, marginBottom: 4 }}>{label}</div>
      <div style={{ color: d?.forecast ? G.accent : G.green, fontWeight: 600 }}>₹{payload[0]?.value?.toLocaleString("en-IN")}</div>
      {d?.forecast && d?.upper && <div style={{ color: G.muted, fontSize: 11 }}>Range: ₹{d.lower?.toLocaleString("en-IN")} – ₹{d.upper?.toLocaleString("en-IN")}</div>}
      {d?.forecast && <div style={{ color: G.accent, fontSize: 10, marginTop: 2 }}>▲ AI Forecast</div>}
    </div>
  );
};

function ResearchTerminal() {
  const [inputVal, setInputVal] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [chartTicker, setChartTicker] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const SUGGESTIONS = ["RELIANCE","TCS","HDFCBANK","INFY","ZOMATO","BAJFINANCE","DIXON","WIPRO","ADANIPORTS","NESTLEIND"];

  const analyze = async (t) => {
    const sym = t.trim().toUpperCase();
    if (!sym) return;
    setLoading(true);
    setChartData(null);
    const userMsg = { role: "user", content: `Analyse ${sym}.NS (NSE) — give me a detailed fundamental analysis.` };
    setMessages(prev => [...prev, userMsg]);

    try {
      const response = await fetch(`${API_BASE}/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker: sym,
          question: `Give me a full fundamental analysis of ${sym}`,
        }),
      });
      if (!response.ok) throw new Error(`Backend error: ${response.status}`);
      const data = await response.json();
      const content = data.analysis || "Unable to fetch analysis.";
      setMessages(prev => [...prev, { role: "assistant", content }]);
      setTimeout(() => {
	  setChartData(generateChartData(sym));
	  setChartTicker(sym);
	}, 100);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: `⚠️ Error: ${e.message}. Make sure your backend is running on port 8000.` }]);
    }
    setLoading(false);
  };

  const handleSend = () => { if (inputVal.trim()) { analyze(inputVal); setInputVal(""); } };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontSize: 11, color: G.muted, fontFamily: G.fontMono, marginBottom: 10, letterSpacing: "0.08em" }}>NSE STOCK RESEARCH TERMINAL</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input className="inp" style={{ flex: 1, minWidth: 180, fontFamily: G.fontMono, fontSize: 15, letterSpacing: "0.05em" }}
            placeholder="Enter NSE ticker (e.g. RELIANCE)" value={inputVal}
            onChange={e => setInputVal(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && handleSend()} />
          <button className="btn" onClick={handleSend} disabled={!inputVal.trim() || loading} style={{ whiteSpace: "nowrap" }}>
            {loading ? "Analysing…" : "Analyse →"}
          </button>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
          {SUGGESTIONS.map(s => (
            <span key={s} className="chip unsel" onClick={() => { setInputVal(s); analyze(s); setInputVal(""); }}>{s}</span>
          ))}
        </div>
      </div>

      {chartData && (
        <div className="card slide-in chart-wrapper" style={{ padding: "20px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
            <div>
              <span style={{ fontFamily: G.fontMono, fontWeight: 600, fontSize: 16, color: G.accent }}>{chartTicker}.NS</span>
              <span style={{ marginLeft: 10, fontSize: 12, color: G.muted }}>Price History + AI Forecast</span>
            </div>
            <div style={{ display: "flex", gap: 16, fontSize: 11, color: G.muted }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 20, height: 2, background: G.green, display: "inline-block", borderRadius: 2 }} /> Historical</span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 20, height: 2, background: G.accent, display: "inline-block", borderRadius: 2 }} /> Forecast</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240} minWidth={0}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={G.green} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={G.green} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="foreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={G.accent} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={G.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: G.muted, fontSize: 10, fontFamily: G.fontMono }} tickLine={false} axisLine={false} interval={5} />
              <YAxis tick={{ fill: G.muted, fontSize: 10, fontFamily: G.fontMono }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v/1000).toFixed(1)}k`} width={40} />
              <Tooltip content={<ChartTooltip />} />
              <ReferenceLine x="Oct '25" stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" label={{ value: "Today", fill: G.muted, fontSize: 10 }} />
              <Area type="monotone" dataKey="price" stroke={G.green} strokeWidth={2} fill="url(#histGrad)" dot={false} activeDot={{ r: 4, fill: G.green }} data={chartData.filter(d => d.historical)} />
              <Area type="monotone" dataKey="price" stroke={G.accent} strokeWidth={2} strokeDasharray="5 3" fill="url(#foreGrad)" dot={false} activeDot={{ r: 4, fill: G.accent }} data={chartData.filter(d => !d.historical)} />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "center", marginTop: 8, fontFamily: G.fontMono }}>
            ⚠ Forecast is illustrative and based on fundamental momentum signals — not financial advice.
          </div>
        </div>
      )}

      {messages.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${G.border}`, fontSize: 11, color: G.muted, fontFamily: G.fontMono, letterSpacing: "0.07em" }}>
            AI FUNDAMENTAL ANALYSIS
          </div>
          <div style={{ maxHeight: 420, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
            {messages.map((m, i) => (
              <div key={i} className="slide-in" style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: m.role === "user" ? "rgba(255,255,255,0.08)" : G.accentDim, border: `1px solid ${m.role === "user" ? G.border : G.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0, marginTop: 1 }}>
                  {m.role === "user" ? "U" : "◈"}
                </div>
                <div style={{ fontSize: 13.5, lineHeight: 1.7, color: m.role === "user" ? G.muted : G.text, whiteSpace: "pre-wrap", fontFamily: G.fontBody, flex: 1 }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: G.accentDim, border: `1px solid ${G.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>◈</div>
                <div style={{ display: "flex", gap: 5 }}>
                  {[0,1,2].map(i => <div key={i} className="pulse" style={{ width: 6, height: 6, borderRadius: 3, background: G.accent, animationDelay: `${i*0.2}s` }} />)}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div style={{ padding: "12px 16px", borderTop: `1px solid ${G.border}`, display: "flex", gap: 10 }}>
            <input className="inp" style={{ flex: 1, fontSize: 13 }} placeholder="Ask a follow-up (e.g. 'How does it compare to peers?')"
              value={inputVal} onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()} />
            <button className="btn" disabled={!inputVal.trim() || loading} onClick={handleSend} style={{ padding: "11px 18px" }}>↑</button>
          </div>
        </div>
      )}

      {messages.length === 0 && !loading && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: G.muted }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
          <div style={{ fontFamily: G.fontDisplay, fontSize: 18, color: G.text, marginBottom: 8 }}>Research any NSE stock</div>
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>Enter a ticker above or pick one of the suggestions.<br />You'll get fundamentals + a 6-month AI price forecast.</div>
        </div>
      )}
    </div>
  );
}

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
  const proceed = () => {
    if (step < 2) { setStep(s => s + 1); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setDone(true); }, 2000);
  };
  const reset = () => { setStep(0); setName(""); setAmount(""); setRisk(null); setHorizon(null); setDone(false); };
  const canGo = [name.trim() && amount.trim(), !!risk, !!horizon];

  if (loading) return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ width: 40, height: 40, borderRadius: "50%", border: `2px solid ${G.border}`, borderTopColor: G.accent, margin: "0 auto 20px" }} className="spin" />
      <div style={{ fontFamily: G.fontDisplay, fontSize: 20, marginBottom: 8 }}>Scanning Nifty universe…</div>
      <div style={{ color: G.muted, fontSize: 13 }}>Matching your profile to NSE fundamentals</div>
    </div>
  );

  if (done) return (
    <div className="slide-in">
      <div style={{ marginBottom: 6, fontSize: 11, fontFamily: G.fontMono, color: G.accent, letterSpacing: "0.08em" }}>YOUR NSE PICKS</div>
      <div style={{ fontFamily: G.fontDisplay, fontSize: "clamp(20px,5vw,28px)", marginBottom: 4 }}>Namaste, {name} 🙏</div>
      <div style={{ color: G.muted, fontSize: 13, marginBottom: 20 }}>
        {RISKS.find(r=>r.id===risk)?.label.split(" ")[0]} · {HORIZONS.find(h=>h.id===horizon)?.label} · ₹{parseFloat(amount.replace(/,/g,"")).toLocaleString("en-IN")}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        {stocks.map((s, i) => (
          <div key={s.ticker} className="card slide-in" style={{ padding: 16, animationDelay: `${i*0.1}s` }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, fontFamily: G.fontMono }}>{i+1}.</span>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: G.fontMono, fontWeight: 600, fontSize: 14, color: G.accent }}>{s.ticker}</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: G.text }}>{s.name}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 5, flexWrap: "wrap" }}>
                    {[["P/E", s.pe], ["ROE", s.roe], ["MCap", s.mcap]].map(([k,v]) => (
                      <span key={k} style={{ fontSize: 11, fontFamily: G.fontMono, color: G.subtext }}><span style={{ color: G.muted }}>{k}</span> {v}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span className="chip" style={{ background: (SECTOR_COLORS[s.sector]||"#6366f1")+"18", color: SECTOR_COLORS[s.sector]||"#6366f1", border:`1px solid ${(SECTOR_COLORS[s.sector]||"#6366f1")}30` }}>{s.sector}</span>
                <span style={{ fontFamily: G.fontMono, fontSize: 13, fontWeight: 700, color: G.green }}>{s.change}</span>
              </div>
            </div>
            <p style={{ fontSize: 13, color: G.subtext, lineHeight: 1.6, marginTop: 10 }}>{s.reason}</p>
          </div>
        ))}
      </div>
      <button className="btn" onClick={reset} style={{ width: "100%", marginBottom: 10 }}>Start Over</button>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", textAlign: "center", lineHeight: 1.6, fontFamily: G.fontMono }}>
        ⚠ SEBI Disclaimer: Educational purposes only. Not registered investment advice. Consult a SEBI-registered advisor.
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
        {[0,1,2].map(i => <div key={i} style={{ height: 3, flex: 1, borderRadius: 2, background: i <= step ? G.accent : G.border, transition: "background 0.3s" }} />)}
      </div>

      {step === 0 && (
        <div className="slide-in">
          <div style={{ fontSize: 11, fontFamily: G.fontMono, color: G.accent, letterSpacing: "0.08em", marginBottom: 10 }}>INVESTOR PROFILE</div>
          <h2 style={{ fontFamily: G.fontDisplay, fontSize: "clamp(22px,5vw,34px)", marginBottom: 8, lineHeight: 1.2 }}>Smart picks from<br/><em>Nifty's finest.</em></h2>
          <p style={{ color: G.muted, fontSize: 13.5, marginBottom: 28, lineHeight: 1.65 }}>3 quick questions. AI-matched NSE stocks. Built for Indian investors.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
            <div>
              <label style={{ fontSize: 11, color: G.muted, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 6, fontFamily: G.fontMono }}>Your Name</label>
              <input className="inp" placeholder="e.g. Rahul" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: G.muted, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 6, fontFamily: G.fontMono }}>Investment Amount (₹)</label>
              <input className="inp" style={{ fontFamily: G.fontMono }} placeholder="e.g. 5,00,000" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
          </div>
          <button className="btn" disabled={!canGo[0]} onClick={proceed} style={{ width: "100%" }}>Continue →</button>
        </div>
      )}

      {step === 1 && (
        <div className="slide-in">
          <div style={{ fontSize: 11, fontFamily: G.fontMono, color: G.accent, letterSpacing: "0.08em", marginBottom: 10 }}>STEP 1 OF 2</div>
          <h2 style={{ fontFamily: G.fontDisplay, fontSize: "clamp(20px,5vw,30px)", marginBottom: 8, lineHeight: 1.2 }}>Aapki risk appetite<br/>kya hai?</h2>
          <p style={{ color: G.muted, fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>This shapes how we balance safety vs. growth in your NSE picks.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {RISKS.map(r => (
              <div key={r.id} className={`card ${risk===r.id?"sel":""}`} style={{ padding: 16, cursor: "pointer", display: "flex", gap: 14, alignItems: "flex-start", transition: "all 0.15s" }} onClick={() => setRisk(r.id)}>
                <span style={{ fontSize: 22, marginTop: 1 }}>{r.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3, color: risk===r.id ? G.accent : G.text }}>{r.label}</div>
                  <div style={{ fontSize: 12.5, color: G.muted, lineHeight: 1.5 }}>{r.desc}</div>
                </div>
                {risk===r.id && <span style={{ color: G.accent, fontSize: 16 }}>✓</span>}
              </div>
            ))}
          </div>
          <button className="btn" disabled={!canGo[1]} onClick={proceed} style={{ width: "100%" }}>Continue →</button>
        </div>
      )}

      {step === 2 && (
        <div className="slide-in">
          <div style={{ fontSize: 11, fontFamily: G.fontMono, color: G.accent, letterSpacing: "0.08em", marginBottom: 10 }}>STEP 2 OF 2</div>
          <h2 style={{ fontFamily: G.fontDisplay, fontSize: "clamp(20px,5vw,30px)", marginBottom: 8, lineHeight: 1.2 }}>Kitne time ke liye<br/>invest karenge?</h2>
          <p style={{ color: G.muted, fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>Your horizon changes everything — short-term momentum vs. long-term compounding.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 24 }}>
            {HORIZONS.map(h => (
              <div key={h.id} className={`card ${horizon===h.id?"sel":""}`} style={{ padding: "18px 10px", cursor: "pointer", textAlign: "center", transition: "all 0.15s" }} onClick={() => setHorizon(h.id)}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{h.icon}</div>
                <div style={{ fontWeight: 600, fontSize: 13, color: horizon===h.id ? G.accent : G.text, marginBottom: 2 }}>{h.label}</div>
                <div style={{ fontSize: 11, color: G.muted, fontFamily: G.fontMono }}>{h.sub}</div>
              </div>
            ))}
          </div>
          <button className="btn" disabled={!canGo[2]} onClick={proceed} style={{ width: "100%" }}>Get My NSE Picks →</button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("advisor");
  return (
    <div style={{ minHeight: "100vh", background: G.bg, color: G.text, fontFamily: G.fontBody, display: "flex", flexDirection: "column" }}>
      <style>{css}</style>

      <div style={{ borderBottom: `1px solid ${G.border}`, background: G.surface, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 0" }}>
            <div style={{ width: 30, height: 30, background: `linear-gradient(135deg,#d97706,${G.accent})`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>◈</div>
            <div>
              <span style={{ fontFamily: G.fontDisplay, fontSize: 16, fontWeight: 700 }}>Stockwise</span>
              <span style={{ marginLeft: 6, fontSize: 10, fontFamily: G.fontMono, color: G.muted, background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: 4 }}>NSE</span>
            </div>
          </div>
          <div style={{ display: "flex" }}>
            {[["advisor","🧭 Advisor"],["research","🔬 Research"]].map(([id,label]) => (
              <button key={id} onClick={() => setTab(id)} style={{ background: "none", border: "none", padding: "14px 14px", fontSize: 13, fontWeight: 500, fontFamily: G.fontBody, cursor: "pointer", borderBottom: `2px solid ${tab===id ? G.accent : "transparent"}`, color: tab===id ? G.accent : G.muted, transition: "all 0.2s" }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: "rgba(0,0,0,0.4)", borderBottom: `1px solid ${G.border}`, overflow: "hidden", whiteSpace: "nowrap" }}>
        <div style={{ display: "inline-flex", animation: "ticker 30s linear infinite" }}>
          {[...Array(2)].map((_, rep) => (
            [["NIFTY 50","23,481.50","+0.62%"],["SENSEX","77,414.92","+0.58%"],["RELIANCE","2,912","+1.4%"],["TCS","3,841","+0.6%"],["HDFCBANK","1,642","+0.8%"],["INFY","1,742","+0.9%"],["BAJFINANCE","7,124","+2.1%"],["ZOMATO","231","+4.2%"],["ADANIPORTS","1,342","+3.1%"],["ITC","458","+1.1%"]].map(([n,p,c],i) => (
              <span key={`${rep}-${i}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 20px", fontSize: 11, fontFamily: G.fontMono, borderRight: `1px solid ${G.border}` }}>
                <span style={{ color: G.muted }}>{n}</span>
                <span style={{ color: G.text, fontWeight: 600 }}>{p}</span>
                <span style={{ color: G.green, fontWeight: 700 }}>{c}</span>
              </span>
            ))
          ))}
        </div>
      </div>

      <div style={{ flex: 1, maxWidth: 720, margin: "0 auto", width: "100%", padding: "28px 20px 48px" }}>
        {tab === "advisor" ? <AdvisorFlow /> : <ResearchTerminal />}
      </div>

      <div style={{ borderTop: `1px solid ${G.border}`, padding: "14px 20px", textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.18)", fontFamily: G.fontMono }}>
        SEBI DISCLAIMER: Not a registered investment advisor. For educational use only. © 2026 Stockwise
      </div>
    </div>
  );
}
