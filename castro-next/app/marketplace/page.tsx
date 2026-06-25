"use client";
import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface Dataset {
  blobName: string;
  description: string;
  price: string;
  category: string;
  mimeType: string;
  size: number;
  seller: string;
  downloads: number;
  createdAt: string;
}

export default function Marketplace() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [tab, setTab] = useState("shelby");
  const [theme, setTheme] = useState("dark");
  const [showUpload, setShowUpload] = useState(false);
  const [showBuy, setShowBuy] = useState<Dataset | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({ name: "", description: "", price: "", category: "NLP" });
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [account, setAccount] = useState<string | null>(null);
  

  const dark = theme === "dark";

  useEffect(() => { fetchDatasets(); }, [category, search]);

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (category !== "all") params.append("category", category);
      if (search) params.append("search", search);
      const res = await fetch(`${API_URL}/datasets?${params}`);
      const data = await res.json();
      setDatasets(data.datasets || []);
    } catch { setDatasets([]); } finally { setLoading(false); }
  };

  const connectWallet = async () => {
    try {
      const { getAptosWallets } = await import("@aptos-labs/wallet-standard");
      const { aptosWallets } = getAptosWallets();
      const petra = aptosWallets.find((w: any) => w.name === "Petra");
      if (!petra) return alert("Petra wallet not found! Please install it from petra.app");
      const result = await petra.features["aptos:connect"].connect();
      const addressData = result?.args?.address?.data;
      if (addressData) {
        const hex = "0x" + Object.values(addressData).map((b: any) => b.toString(16).padStart(2,"0")).join("");
        setAccount(hex);
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to connect");
    }
  };

  const disconnectWallet = async () => {
    try {
      await disconnect();
    } catch (e) { 
      console.error(e);
    }
  };

  const handleUpload = async () => {
    if (!file || !uploadForm.name) return setMessage("Please fill all fields and select a file");
    if (!account) return setMessage("Please connect your wallet first");
    setUploading(true); setMessage("Confirming storage payment in Petra...");
    try {
      const blobName = uploadForm.name.replace(/\s+/g, "-");
      const petra = (window as any).aptos;
      
      // Step 1: Ask user to sign a ShelbyUSD storage fee transaction via Petra
      const storageFee = 1_000_000; // 1 ShelbyUSD
      const SHELBYUSD_FA = "0x1b18363a9f1fe5e6ebf247daba5cc1c18052bb232efdc4c50f556053922d98e1";
      const { getAptosWallets } = await import("@aptos-labs/wallet-standard");
      const { aptosWallets } = getAptosWallets();
      const petraWallet = aptosWallets.find((w: any) => w.name === "Petra");
      const txResult = await petraWallet?.features["aptos:signAndSubmitTransaction"]?.signAndSubmitTransaction({
        payload: {
          function: "0x1::primary_fungible_store::transfer",
          typeArguments: ["0x1::fungible_asset::Metadata"],
          functionArguments: [
            SHELBYUSD_FA,
            "0x3c525656e33a31e1726050ec5eeceee58ead67099cca34652faa291b56307d12",
            storageFee.toString()
          ]
        }
      });
      console.log("Payment tx:", txResult);
      setMessage("Payment confirmed! Uploading to Shelby...");
      // Upload directly using the API with wallet address
      const form = new FormData();
      form.append("file", file);
      form.append("name", blobName);
      form.append("description", uploadForm.description);
      form.append("price", uploadForm.price);
      form.append("category", uploadForm.category);
      form.append("seller", account);
      const uploadRes = await fetch(`${API_URL}/upload`, { method: "POST", body: form });
      const uploadData = await uploadRes.json();
      if (!uploadData.success) throw new Error(uploadData.error || "Upload failed");
      if (uploadData.success) { setShowUpload(false); setMessage(""); fetchDatasets(); }
    } catch (e: any) { 
      console.error("Upload error:", e);
      setMessage(e.message || "Upload failed");
    } finally { setUploading(false); }
  };

  const handlePurchase = async (dataset: Dataset) => {
    try {
      const res = await fetch(`${API_URL}/purchase/${dataset.blobName}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerAddress: account || "0x1234...demo" }),
      });
      const data = await res.json();
      if (data.success) { setShowBuy(null); setShowSuccess(true); }
    } catch { setMessage("Purchase failed"); }
  };

  const bg = dark ? "#0f172a" : "#f8fafc";
  const bg2 = dark ? "#1e293b" : "#fff";
  const bg3 = dark ? "#334155" : "#f1f5f9";
  const bdr = dark ? "#1e293b" : "#e2e8f0";
  const bdr2 = dark ? "#334155" : "#cbd5e1";
  const tx = dark ? "#f1f5f9" : "#0f172a";
  const tx2 = dark ? "#94a3b8" : "#475569";
  const tx3 = dark ? "#475569" : "#94a3b8";
  const green = "#10b981";
  const green2 = dark ? "rgba(16,185,129,0.12)" : "rgba(16,185,129,0.08)";
  const green3 = "rgba(16,185,129,0.25)";
  const card = dark ? "#1e293b" : "#fff";
  const categories = ["all", "NLP", "Vision", "Time series", "Tabular", "Audio", "Medical"];

  return (
    <div style={{ background: bg, color: tx, minHeight: "100vh", fontFamily: "sans-serif" }}>

      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderBottom: `1px solid ${bdr}`, background: bg, flexWrap: "wrap", gap: 10, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 32, height: 32, background: green, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff", fontSize: 15 }}>D</div>
          <span style={{ fontSize: 15, fontWeight: 700, color: tx }}>DataVault</span>
          <span style={{ fontSize: 10, color: green, background: green2, padding: "2px 9px", borderRadius: 20, border: `1px solid ${green3}`, fontWeight: 600 }}>on Shelby</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", background: bg2, border: `1px solid ${bdr2}`, borderRadius: 10, padding: 3, gap: 2 }}>
            {["dark","light"].map(t => (
              <button key={t} onClick={() => setTheme(t)} style={{ fontSize: 11, padding: "5px 11px", borderRadius: 7, border: "none", cursor: "pointer", background: theme === t ? green : "transparent", color: theme === t ? "#fff" : tx2, fontFamily: "inherit" }}>
                {t === "dark" ? "🌙" : "☀️"} {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          {account ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: green, background: green2, border: `1px solid ${green3}`, padding: "6px 12px", borderRadius: 9, fontWeight: 600 }}>
                ● {account.slice(0,6)}...{account.slice(-4)}
              </span>
              <button onClick={disconnectWallet} style={{ fontSize: 12, padding: "7px 14px", borderRadius: 9, background: "transparent", border: `1px solid ${bdr2}`, color: tx2, cursor: "pointer", fontFamily: "inherit" }}>Disconnect</button>
            </div>
          ) : (
            <button onClick={connectWallet} style={{ fontSize: 12, padding: "7px 16px", borderRadius: 9, background: green, border: "none", color: "#fff", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>
              Connect Petra
            </button>
          )}
          <button onClick={() => setShowUpload(true)} style={{ fontSize: 12, padding: "7px 16px", borderRadius: 9, background: bg2, border: `1px solid ${bdr2}`, color: tx2, cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>+ Upload</button>
        </div>
      </nav>

      <div style={{ padding: "60px 24px 44px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: green2, border: `1px solid ${green3}`, borderRadius: 20, padding: "5px 14px", marginBottom: 18 }}>
          <div style={{ width: 6, height: 6, background: green, borderRadius: "50%" }}></div>
          <span style={{ fontSize: 11, color: green, fontWeight: 600 }}>Live on Shelby Testnet · Aptos</span>
        </div>
        <h1 style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-1px", marginBottom: 14, color: tx }}>
          The <span style={{ color: green }}>decentralized</span><br />AI dataset marketplace
        </h1>
        <p style={{ fontSize: 14, color: tx2, maxWidth: 460, margin: "0 auto 28px", lineHeight: 1.75 }}>Every dataset stored on Shelby Protocol — hot decentralized storage on Aptos. Buy and sell AI training data with ShelbyUSD.</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => setTab("shelby")} style={{ fontSize: 13, padding: "11px 24px", borderRadius: 10, background: green, border: "none", color: "#fff", cursor: "pointer", fontWeight: 700, fontFamily: "inherit" }}>Browse listings</button>
          <button onClick={() => setTab("discover")} style={{ fontSize: 13, padding: "11px 20px", borderRadius: 10, background: bg2, border: `1px solid ${bdr2}`, color: tx2, cursor: "pointer", fontFamily: "inherit" }}>Discover external</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", border: `1px solid ${bdr}`, borderRadius: 12, overflow: "hidden", margin: "0 24px 28px" }}>
        {[["1,240","Datasets"],["98 TB","On Shelby"],["320","Sellers"],["4,800","Purchases"]].map(([v,l]) => (
          <div key={l} style={{ padding: 16, textAlign: "center", borderRight: `1px solid ${bdr}`, background: card }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: tx, marginBottom: 3 }}>{v}</div>
            <div style={{ fontSize: 11, color: tx3, fontWeight: 500 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", borderBottom: `1px solid ${bdr}`, padding: "0 24px", background: bg, overflowX: "auto" }}>
        {[["shelby","📦 DataVault listings"],["discover","🌐 Discover external"],["about","ℹ️ How it works"]].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ fontSize: 12, padding: "12px 16px", color: tab === id ? green : tx2, cursor: "pointer", border: "none", background: "transparent", borderBottom: tab === id ? `2px solid ${green}` : "2px solid transparent", fontFamily: "inherit", fontWeight: 600, whiteSpace: "nowrap" }}>{label}</button>
        ))}
      </div>

      {tab === "shelby" && (
        <div style={{ padding: "28px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: green, letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>Marketplace</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: tx }}>Featured datasets</div>
            </div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search datasets..." style={{ fontSize: 13, padding: "8px 13px", borderRadius: 9, border: `1px solid ${bdr2}`, background: bg2, color: tx, outline: "none", fontFamily: "inherit", minWidth: 200 }} />
          </div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 18 }}>
            {categories.map(c => (
              <button key={c} onClick={() => setCategory(c)} style={{ fontSize: 11, padding: "5px 13px", borderRadius: 8, cursor: "pointer", border: `1px solid ${category === c ? green : bdr2}`, background: category === c ? green : "transparent", color: category === c ? "#fff" : tx2, fontFamily: "inherit", fontWeight: 600 }}>{c === "all" ? "All" : c}</button>
            ))}
          </div>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: tx2 }}>Loading datasets from Shelby...</div>
          ) : datasets.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
              <p style={{ fontSize: 15, fontWeight: 600, color: tx, marginBottom: 6 }}>No datasets yet</p>
              <p style={{ fontSize: 13, color: tx2 }}>Be the first to upload a dataset to Shelby!</p>
              <button onClick={() => setShowUpload(true)} style={{ marginTop: 16, fontSize: 13, padding: "10px 22px", borderRadius: 9, background: green, border: "none", color: "#fff", cursor: "pointer", fontWeight: 700, fontFamily: "inherit" }}>Upload dataset</button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 12 }}>
              {datasets.map((d, i) => (
                <div key={i} style={{ background: card, border: `1px solid ${bdr}`, borderRadius: 12, padding: "1.1rem", display: "flex", flexDirection: "column", gap: 9, cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = green)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = bdr)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 6, background: green2, color: green, fontWeight: 700 }}>{d.category}</span>
                    <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 6, background: green2, color: green, fontWeight: 700 }}>☁️ Shelby</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: tx }}>{d.blobName}</div>
                  <div style={{ fontSize: 11, color: tx2, lineHeight: 1.55 }}>{d.description}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, background: green2, border: `1px solid ${green3}`, borderRadius: 7, padding: "5px 8px" }}>
                    <span style={{ fontSize: 10, color: green, fontWeight: 600 }}>✅ {d.mimeType} · {(d.size/1024).toFixed(1)} KB · Shelby testnet</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: 10, color: tx3, fontWeight: 500 }}>{d.seller?.slice(0,6)}...{d.seller?.slice(-4)}</span>
                    <span style={{ fontSize: 10, color: tx3, marginLeft: "auto" }}>⬇ {d.downloads}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${bdr}`, paddingTop: 9, marginTop: "auto" }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: tx }}>{d.price} <small style={{ fontSize: 10, color: tx3, fontWeight: 400 }}>SUSD</small></span>
                    {account && d.seller === account ? (
                      <span style={{ fontSize: 11, padding: "6px 14px", borderRadius: 7, background: "transparent", border: `1px solid ${green}`, color: green, fontWeight: 700 }}>Your listing</span>
                    ) : (
                      <button onClick={() => setShowBuy(d)} style={{ fontSize: 11, padding: "6px 14px", borderRadius: 7, background: green, border: "none", color: "#fff", cursor: "pointer", fontWeight: 700, fontFamily: "inherit" }}>Buy</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "discover" && (
        <div style={{ padding: "28px 24px" }}>
          <div style={{ fontSize: 11, color: green, letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>Discover external</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: tx, marginBottom: 6 }}>Browse from Kaggle, HuggingFace, GitHub & PwC</div>
          <p style={{ fontSize: 13, color: tx2, marginBottom: 20, lineHeight: 1.65 }}>Find datasets from across the web. Import any dataset to Shelby and list it on DataVault.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 12 }}>
            {[
              { name: "Common crawl news 2024", tag: "NLP", src: "HuggingFace", srcColor: "#d97706", desc: "800GB news articles for pretraining LLMs.", size: "800 GB" },
              { name: "Open images v7", tag: "Vision", src: "Kaggle", srcColor: "#3b82f6", desc: "9M images with 36M bounding boxes.", size: "565 GB" },
              { name: "SQuAD 2.0", tag: "NLP", src: "PwC", srcColor: "#ef4444", desc: "100K Q&A pairs for reading comprehension.", size: "35 MB" },
              { name: "Common voice 17", tag: "Audio", src: "HuggingFace", srcColor: "#d97706", desc: "2,500+ hours across 120 languages.", size: "70 GB" },
              { name: "House prices advanced", tag: "Tabular", src: "Kaggle", srcColor: "#3b82f6", desc: "79 features for price prediction models.", size: "1 MB" },
              { name: "MIMIC-III clinical notes", tag: "Medical", src: "GitHub", srcColor: tx3, desc: "40K ICU patient records for clinical NLP.", size: "6.7 GB" },
            ].map((d, i) => (
              <div key={i} style={{ background: card, border: `1px solid ${bdr}`, borderRadius: 12, padding: "1.1rem", display: "flex", flexDirection: "column", gap: 9 }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = green)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = bdr)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 6, background: green2, color: green, fontWeight: 700 }}>{d.tag}</span>
                  <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 6, background: `${d.srcColor}20`, color: d.srcColor, fontWeight: 700 }}>{d.src}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: tx }}>{d.name}</div>
                <div style={{ fontSize: 11, color: tx2, lineHeight: 1.55 }}>{d.desc}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, background: `${d.srcColor}12`, border: `1px solid ${d.srcColor}30`, borderRadius: 7, padding: "5px 8px" }}>
                  <span style={{ fontSize: 10, color: d.srcColor, fontWeight: 600 }}>🔗 {d.src} · {d.size} · Free</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${bdr}`, paddingTop: 9, marginTop: "auto" }}>
                  <span style={{ fontSize: 11, color: tx2, fontWeight: 500 }}>Free · External</span>
                  <button onClick={() => setShowUpload(true)} style={{ fontSize: 11, padding: "6px 12px", borderRadius: 7, background: bg3, border: `1px solid ${bdr2}`, color: tx2, cursor: "pointer", fontFamily: "inherit" }}>Import to Shelby</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "about" && (
        <div style={{ padding: "28px 24px" }}>
          <div style={{ fontSize: 11, color: green, letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>Why DataVault</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: tx, marginBottom: 20 }}>Powered by Shelby Protocol</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12, marginBottom: 28 }}>
            {[["🔓","Censorship resistant","No central server can delete your dataset."],["⚡","Hot storage","Shelby serves data fast — not IPFS-slow."],["💰","ShelbyUSD payments","On-chain payments. Sellers earn instantly."],["🛡️","On-chain ownership","Every dataset registered on Aptos."]].map(([ico,t,d]) => (
              <div key={t as string} style={{ background: card, border: `1px solid ${bdr}`, borderRadius: 12, padding: "1.1rem" }}>
                <div style={{ width: 36, height: 36, background: green2, border: `1px solid ${green3}`, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10, fontSize: 18 }}>{ico}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: tx, marginBottom: 4 }}>{t}</div>
                <div style={{ fontSize: 11, color: tx2, lineHeight: 1.55 }}>{d}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 10 }}>
            {[["01","Connect Petra","Your wallet is your identity."],["02","Get ShelbyUSD","Claim free tokens from faucet."],["03","Buy a dataset","Pay SUSD, download instantly."],["04","Upload & earn","Set price, earn on every sale."]].map(([n,t,d]) => (
              <div key={n as string} style={{ background: dark ? "rgba(255,255,255,0.02)" : "#f8fafc", border: `1px solid ${bdr}`, borderRadius: 12, padding: 14 }}>
                <div style={{ width: 36, height: 36, background: green2, border: `2px solid ${green3}`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: green, fontWeight: 700, marginBottom: 10 }}>{n}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: tx, marginBottom: 4 }}>{t}</div>
                <div style={{ fontSize: 11, color: tx2, lineHeight: 1.55 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* INFO SECTIONS */}
      <div style={{ background: bg }}>

        {/* WHAT IS DATAVAULT */}
        <div style={{ padding: "56px 24px", borderBottom: `1px solid ${bdr}` }}>
          <div style={{ fontSize: 11, color: green, letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>About DataVault</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: tx, letterSpacing: "-0.5px", marginBottom: 12, lineHeight: 1.2 }}>What is DataVault<br/>and why does it matter?</div>
          <p style={{ fontSize: 14, color: tx2, lineHeight: 1.75, maxWidth: 560, marginBottom: 28 }}>AI models are only as good as the data they're trained on. But today, most AI training datasets are locked behind centralized platforms. DataVault changes that by making AI data ownership trustless, open, and permanent.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
            {[["🤖","The AI data problem","AI companies spend millions acquiring training data from centralized vendors. Prices are opaque, access can be revoked, and data provenance is unverifiable."],["🔓","DataVault's solution","A peer-to-peer marketplace where anyone can upload, sell, and buy AI training datasets. Data stored permanently on Shelby Protocol. Payments on-chain in ShelbyUSD."],["💡","Who it's for","Data scientists who want to monetize datasets. AI researchers who need affordable training data. Startups that can't afford enterprise data vendors."],["🌍","Why now","The AI boom has created an explosion in demand for quality training data. Decentralized storage has finally matured to the point where it's fast enough for real-world use."]].map(([ico,t,d]) => (
              <div key={t} style={{ background: card, border: `1px solid ${bdr}`, borderRadius: 14, padding: "1.2rem" }}>
                <div style={{ width: 40, height: 40, background: green2, border: `1px solid ${green3}`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 12 }}>{ico}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: tx, marginBottom: 5 }}>{t}</div>
                <div style={{ fontSize: 12, color: tx2, lineHeight: 1.6 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* WHAT IS SHELBY */}
        <div style={{ padding: "56px 24px", borderBottom: `1px solid ${bdr}` }}>
          <div style={{ fontSize: 11, color: green, letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>Powered by Shelby Protocol</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: tx, letterSpacing: "-0.5px", marginBottom: 12 }}>What is Shelby Protocol?</div>
          <p style={{ fontSize: 14, color: tx2, lineHeight: 1.75, maxWidth: 560, marginBottom: 24 }}>Shelby is a decentralized hot storage network built on top of Aptos blockchain. Think of it as a trustless Amazon S3 — fast, cheap, and no single company in control.</p>
          <div style={{ background: green2, border: `1px solid ${green3}`, borderRadius: 14, padding: 24, marginBottom: 28 }}>
            <p style={{ fontSize: 15, color: tx, lineHeight: 1.75, fontStyle: "italic" }}>"Shelby Protocol provides hot storage that is S3-compatible, lightning fast, and fully decentralized. Every file is split across multiple storage providers, erasure coded for redundancy, and anchored to the Aptos blockchain."</p>
            <span style={{ fontSize: 12, color: green, fontWeight: 600, marginTop: 10, display: "block" }}>— Shelby Protocol documentation</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
            {[["Storage","Decentralized hot storage","Unlike IPFS which is slow for large files, Shelby is designed for hot data — meaning fast retrieval times comparable to traditional cloud storage."],["Erasure coding","Data redundancy built in","Every file uploaded to Shelby is split into chunks and erasure coded across multiple storage providers. Even if some nodes go down, your data is still retrievable."],["On-chain","Anchored to Aptos","Every blob stored on Shelby is registered as a smart contract transaction on Aptos L1. The metadata, merkle root, and ownership are verifiable on-chain forever."],["Payments","ShelbyUSD micropayments","Storage is paid for in ShelbyUSD. Micropayment channels allow efficient per-byte payments without expensive on-chain transactions for each request."],["API","S3-compatible SDK","Shelby provides a TypeScript SDK with upload, download, and metadata APIs that mirror Amazon S3 — making it easy for developers to integrate."],["Network","Multiple networks","Shelby runs on Shelbynet, Testnet, and Mainnet (coming). DataVault is currently live on Shelby Testnet with real uploads and downloads."]].map(([tag,t,d]) => (
              <div key={t} style={{ background: card, border: `1px solid ${bdr}`, borderRadius: 14, padding: "1.2rem" }}>
                <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 6, background: green2, color: green, fontWeight: 700, display: "inline-block", marginBottom: 8 }}>{tag}</span>
                <div style={{ fontSize: 13, fontWeight: 700, color: tx, marginBottom: 5 }}>{t}</div>
                <div style={{ fontSize: 12, color: tx2, lineHeight: 1.6 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* WHAT IS APTOS */}
        <div style={{ padding: "56px 24px", borderBottom: `1px solid ${bdr}` }}>
          <div style={{ fontSize: 11, color: green, letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>Built on Aptos</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: tx, letterSpacing: "-0.5px", marginBottom: 12 }}>Why Aptos blockchain?</div>
          <p style={{ fontSize: 14, color: tx2, lineHeight: 1.75, maxWidth: 560, marginBottom: 28 }}>Aptos is a Layer 1 blockchain built by former Meta engineers. It's designed for high throughput, low latency, and developer-friendly smart contracts using the Move programming language.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
            {[["🚀","High throughput","Aptos can process up to 160,000 transactions per second using parallel execution. DataVault purchases and uploads are fast and cheap even under heavy load."],["🔐","Move smart contracts","Shelby's smart contracts are written in Move — a resource-oriented language designed to prevent common vulnerabilities that plague Solidity-based chains."],["💸","Low transaction fees","Aptos transaction fees are fractions of a cent — making it practical for micropayments like paying for individual dataset downloads in ShelbyUSD."],["🌐","Petra wallet","Petra is Aptos's native browser wallet. DataVault uses Petra for identity, signing transactions, and paying for datasets with ShelbyUSD."],["🏗️","Backed by a16z","Aptos raised $350M led by a16z crypto. The ecosystem has strong developer tooling, grants, and a growing infrastructure ecosystem including Shelby Protocol."],["📊","On-chain data registry","Every dataset on DataVault is registered as an Aptos transaction — a permanent, tamper-proof record of who uploaded what and when."]].map(([ico,t,d]) => (
              <div key={t} style={{ background: card, border: `1px solid ${bdr}`, borderRadius: 14, padding: "1.2rem" }}>
                <div style={{ width: 40, height: 40, background: green2, border: `1px solid ${green3}`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 12 }}>{ico}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: tx, marginBottom: 5 }}>{t}</div>
                <div style={{ fontSize: 12, color: tx2, lineHeight: 1.6 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* HOW THEY CONNECT */}
        <div style={{ padding: "56px 24px", borderBottom: `1px solid ${bdr}` }}>
          <div style={{ fontSize: 11, color: green, letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>The full stack</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: tx, letterSpacing: "-0.5px", marginBottom: 12 }}>How DataVault, Shelby<br/>and Aptos work together</div>
          <p style={{ fontSize: 14, color: tx2, lineHeight: 1.75, maxWidth: 560, marginBottom: 28 }}>DataVault is a thin marketplace layer on top of two powerful primitives — Shelby for storage and Aptos for payments and identity.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[["1","Seller connects Petra wallet","Petra wallet on Aptos testnet provides the seller's identity. No account creation needed — your wallet IS your account."],["2","Dataset uploaded to Shelby Protocol","The file is sent to DataVault's API which uses the Shelby SDK to upload the blob. Shelby erasure codes it, distributes it, and registers it on Aptos L1."],["3","Listing created on DataVault","Dataset metadata is stored in DataVault's database. The actual data never touches DataVault's servers — only Shelby's network."],["4","Buyer pays in ShelbyUSD","A buyer connects their Petra wallet and pays the seller's price in ShelbyUSD. The payment is a signed on-chain transaction confirmed in seconds."],["5","Download unlocked from Shelby","After payment, DataVault fetches the blob from Shelby Protocol and streams it directly to the buyer — the data flows from Shelby, not DataVault's servers."]].map(([n,t,d]) => (
              <div key={n} style={{ display: "flex", gap: 16, padding: "16px 0", borderBottom: `1px solid ${bdr}` }}>
                <div style={{ width: 36, height: 36, background: green2, border: `2px solid ${green3}`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: green, flexShrink: 0 }}>{n}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: tx, marginBottom: 3 }}>{t}</div>
                  <div style={{ fontSize: 12, color: tx2, lineHeight: 1.6 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COMPARISON */}
        <div style={{ padding: "56px 24px", borderBottom: `1px solid ${bdr}` }}>
          <div style={{ fontSize: 11, color: green, letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>Why decentralized?</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: tx, letterSpacing: "-0.5px", marginBottom: 12 }}>DataVault vs centralized<br/>dataset platforms</div>
          <p style={{ fontSize: 14, color: tx2, lineHeight: 1.75, maxWidth: 560, marginBottom: 28 }}>Kaggle, Hugging Face, and other platforms are great — but they're centralized. Here's how DataVault compares.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ background: card, border: `1px solid ${green3}`, borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: green, marginBottom: 14 }}>✅ DataVault on Shelby</div>
              {["Data stored on decentralized network","No platform can delete your dataset","On-chain provenance and ownership","Instant peer-to-peer payments","No platform fee taking your earnings","Open source and permissionless"].map(i => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: `1px solid ${bdr}`, fontSize: 12, color: tx2 }}>
                  <span style={{ color: green, fontWeight: 700 }}>✓</span>{i}
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#f87171", marginBottom: 14 }}>❌ Centralized platforms</div>
              {["Data stored on company servers","Platform can remove datasets anytime","No verifiable data provenance","Bank transfers take days to settle","Platform takes 20-30% of earnings","Requires account approval"].map(i => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: `1px solid ${bdr}`, fontSize: 12, color: tx2 }}>
                  <span style={{ color: "#ef4444", fontWeight: 700 }}>✗</span>{i}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ECOSYSTEM STATS */}
        <div style={{ padding: "56px 24px" }}>
          <div style={{ fontSize: 11, color: green, letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>Shelby + Aptos ecosystem</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: tx, letterSpacing: "-0.5px", marginBottom: 12 }}>The infrastructure<br/>powering DataVault</div>
          <p style={{ fontSize: 14, color: tx2, lineHeight: 1.75, maxWidth: 560, marginBottom: 24 }}>DataVault is built on top of battle-tested, well-funded infrastructure that is actively being developed.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", border: `1px solid ${bdr}`, borderRadius: 12, overflow: "hidden", marginBottom: 28 }}>
            {[["$350M","Aptos funding raised"],["160K","Aptos TPS capacity"],["10 TiB","Shelby testnet capacity"],["<$0.01","Avg Aptos tx fee"]].map(([v,l]) => (
              <div key={l} style={{ padding: 16, textAlign: "center", borderRight: `1px solid ${bdr}`, background: card }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: tx, marginBottom: 3 }}>{v}</div>
                <div style={{ fontSize: 11, color: tx3, fontWeight: 500 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
            {[["🔗","Shelby Protocol docs","Read the full Shelby documentation to understand the storage layer powering DataVault.","https://docs.shelby.xyz","docs.shelby.xyz →"],["🌐","Aptos developer docs","Learn about Move smart contracts, Petra wallet, and building on Aptos L1.","https://aptos.dev","aptos.dev →"],["💧","Get testnet tokens","Claim free ShelbyUSD and APT from the testnet faucets to start buying and selling on DataVault.","https://docs.shelby.xyz/apis/faucet/shelbyusd","Get ShelbyUSD →"]].map(([ico,t,d,href,link]) => (
              <div key={t} style={{ background: card, border: `1px solid ${green3}`, borderRadius: 14, padding: "1.2rem" }}>
                <div style={{ width: 40, height: 40, background: green2, border: `1px solid ${green3}`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 12 }}>{ico}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: tx, marginBottom: 5 }}>{t}</div>
                <div style={{ fontSize: 12, color: tx2, lineHeight: 1.6, marginBottom: 8 }}>{d}</div>
                <a href={href} target="_blank" style={{ fontSize: 12, color: green, fontWeight: 600, textDecoration: "none" }}>{link}</a>
              </div>
            ))}
          </div>
        </div>

      </div>
      <div style={{ background: green2, border: `1px solid ${green3}`, borderRadius: 14, padding: 28, textAlign: "center", margin: "0 24px 28px" }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: tx }}>Start selling your datasets on Shelby</h2>
        <p style={{ fontSize: 13, color: tx2, marginBottom: 20, lineHeight: 1.65 }}>Upload once. Your data lives on Shelby Protocol forever.<br />Earn ShelbyUSD every time someone buys.</p>
        <button onClick={() => setShowUpload(true)} style={{ fontSize: 13, padding: "11px 24px", borderRadius: 10, background: green, border: "none", color: "#fff", cursor: "pointer", fontWeight: 700, fontFamily: "inherit" }}>Upload dataset</button>
      </div>

      <footer style={{ padding: "16px 24px", borderTop: `1px solid ${bdr}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, background: bg }}>
        <span style={{ fontSize: 11, color: tx3, fontWeight: 500 }}>© 2025 DataVault · Powered by Shelby Protocol on Aptos</span>
        <div style={{ display: "flex", gap: 16 }}>
          {["Twitter","Docs","GitHub","Faucet"].map(l => <a key={l} style={{ fontSize: 11, color: tx3, cursor: "pointer", textDecoration: "none", fontWeight: 500 }}>{l}</a>)}
        </div>
      </footer>

      {showUpload && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          <div style={{ background: card, border: `1px solid ${bdr2}`, borderRadius: 14, padding: "1.5rem", width: 320, maxWidth: "100%", position: "relative" }}>
            <button onClick={() => setShowUpload(false)} style={{ position: "absolute", top: 13, right: 13, background: bg3, border: "none", color: tx2, cursor: "pointer", fontSize: 14, width: 26, height: 26, borderRadius: 6, fontFamily: "inherit" }}>✕</button>
            <div style={{ fontSize: 14, fontWeight: 700, color: tx, marginBottom: 14 }}>📤 Upload dataset to Shelby</div>
            <div onClick={() => document.getElementById("ds-file")?.click()} style={{ border: `2px dashed ${bdr2}`, borderRadius: 10, padding: "1.3rem", textAlign: "center", cursor: "pointer", marginBottom: 4 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>☁️</div>
              <p style={{ fontSize: 12, color: tx2, margin: "0 0 3px", fontWeight: 600 }}>{file ? file.name : "Click to browse"}</p>
              <p style={{ fontSize: 10, color: tx3, margin: 0 }}>CSV, JSON, ZIP supported</p>
              <input id="ds-file" type="file" style={{ display: "none" }} onChange={e => setFile(e.target.files?.[0] || null)} />
            </div>
            {[["Dataset name (no spaces)","name"],["Price (ShelbyUSD)","price"],["Description","description"]].map(([placeholder, key]) => (
              <div key={key}>
                <div style={{ fontSize: 11, color: tx2, marginBottom: 3, marginTop: 10, fontWeight: 600 }}>{placeholder}</div>
                <input value={uploadForm[key as keyof typeof uploadForm]} onChange={e => setUploadForm(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} style={{ width: "100%", background: dark ? "#0f172a" : "#f8fafc", border: `1px solid ${bdr2}`, borderRadius: 8, color: tx, fontSize: 12, padding: "8px 10px", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>
            ))}
            <div style={{ fontSize: 11, color: tx2, marginBottom: 3, marginTop: 10, fontWeight: 600 }}>Category</div>
            <select value={uploadForm.category} onChange={e => setUploadForm(p => ({ ...p, category: e.target.value }))} style={{ width: "100%", background: dark ? "#0f172a" : "#f8fafc", border: `1px solid ${bdr2}`, borderRadius: 8, color: tx2, fontSize: 12, padding: "8px 10px", outline: "none", fontFamily: "inherit" }}>
              {["NLP","Vision","Time series","Tabular","Audio","Medical"].map(c => <option key={c}>{c}</option>)}
            </select>
            {message && <p style={{ fontSize: 11, color: "#ef4444", margin: "8px 0 0", fontWeight: 600 }}>{message}</p>}
            <button onClick={handleUpload} disabled={uploading} style={{ width: "100%", marginTop: 14, padding: 11, fontSize: 13, borderRadius: 9, background: uploading ? bg3 : green, border: "none", color: uploading ? tx2 : "#fff", cursor: uploading ? "not-allowed" : "pointer", fontWeight: 700, fontFamily: "inherit" }}>
              {uploading ? "Uploading to Shelby..." : "Upload to Shelby"}
            </button>
          </div>
        </div>
      )}

      {showBuy && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          <div style={{ background: card, border: `1px solid ${bdr2}`, borderRadius: 14, padding: "1.5rem", width: 310, maxWidth: "100%", position: "relative" }}>
            <button onClick={() => setShowBuy(null)} style={{ position: "absolute", top: 13, right: 13, background: bg3, border: "none", color: tx2, cursor: "pointer", fontSize: 14, width: 26, height: 26, borderRadius: 6, fontFamily: "inherit" }}>✕</button>
            <div style={{ fontSize: 14, fontWeight: 700, color: tx, marginBottom: 14 }}>🛒 Confirm purchase</div>
            <div style={{ background: bg3, border: `1px solid ${bdr}`, borderRadius: 10, padding: 12, marginBottom: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: tx, margin: "0 0 3px" }}>{showBuy.blobName}</p>
              <p style={{ fontSize: 11, color: tx2, margin: 0 }}>{showBuy.mimeType} · Stored on Shelby testnet</p>
            </div>
            <div style={{ border: `1px solid ${bdr}`, borderRadius: 10, overflow: "hidden", marginBottom: 14 }}>
              {[["Price",`${showBuy.price} SUSD`],["Network fee","~0.001 APT"]].map(([l,v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "10px 12px", borderBottom: `1px solid ${bdr}`, color: tx2 }}>
                  <span>{l}</span><span style={{ color: tx, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "10px 12px", background: green2 }}>
                <span style={{ fontWeight: 700, color: tx }}>Your balance</span><span style={{ color: green, fontWeight: 700 }}>240 SUSD</span>
              </div>
            </div>
            <button onClick={() => handlePurchase(showBuy)} style={{ width: "100%", padding: 11, fontSize: 13, borderRadius: 9, background: green, border: "none", color: "#fff", cursor: "pointer", fontWeight: 700, fontFamily: "inherit", marginBottom: 8 }}>Confirm with Petra wallet</button>
            <button onClick={() => setShowBuy(null)} style={{ width: "100%", padding: 10, fontSize: 12, borderRadius: 9, background: "transparent", border: `1px solid ${bdr2}`, color: tx2, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          </div>
        </div>
      )}

      {showSuccess && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          <div style={{ background: card, border: `1px solid ${bdr2}`, borderRadius: 14, padding: "1.5rem", width: 300, maxWidth: "100%", textAlign: "center" }}>
            <div style={{ width: 50, height: 50, background: green2, border: `2px solid ${green3}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 24 }}>✅</div>
            <p style={{ fontSize: 15, fontWeight: 800, color: tx, margin: "0 0 6px" }}>Purchase confirmed!</p>
            <p style={{ fontSize: 12, color: tx2, margin: "0 0 14px", lineHeight: 1.65 }}>Your dataset is ready. Stored permanently on Shelby Protocol.</p>
            <div style={{ background: bg3, border: `1px solid ${bdr}`, borderRadius: 9, padding: "9px 11px", marginBottom: 14, textAlign: "left" }}>
              <p style={{ fontSize: 10, color: tx3, margin: "0 0 3px", fontWeight: 600 }}>Transaction hash</p>
              <p style={{ fontSize: 11, color: green, margin: 0, fontWeight: 600 }}>0x7f3a...b92c · <span style={{ textDecoration: "underline", cursor: "pointer" }}>View on Aptos</span></p>
            </div>
            <button onClick={() => setShowSuccess(false)} style={{ width: "100%", padding: 11, fontSize: 13, borderRadius: 9, background: green, border: "none", color: "#fff", cursor: "pointer", fontWeight: 700, fontFamily: "inherit", marginBottom: 8 }}>⬇ Download dataset</button>
            <button onClick={() => setShowSuccess(false)} style={{ width: "100%", padding: 10, fontSize: 12, borderRadius: 9, background: "transparent", border: `1px solid ${bdr2}`, color: tx2, cursor: "pointer", fontFamily: "inherit" }}>Back to marketplace</button>
          </div>
        </div>
      )}
    </div>
  );
}
