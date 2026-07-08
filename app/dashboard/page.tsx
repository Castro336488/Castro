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

export default function Dashboard() {
  const [account, setAccount] = useState<string | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("dark");
  const dark = theme === "dark";

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

  useEffect(() => {
    connectWallet();
  }, []);

  useEffect(() => {
    if (account) fetchMyDatasets();
  }, [account]);

  const connectWallet = async () => {
    try {
      const { getAptosWallets } = await import("@aptos-labs/wallet-standard");
      const { aptosWallets } = getAptosWallets();
      const petra = aptosWallets.find((w: any) => w.name === "Petra");
      if (!petra) return;
      const result = await petra.features["aptos:connect"].connect();
      const addressData = result?.args?.address?.data;
      if (addressData) {
        const hex = "0x" + Object.values(addressData).map((b: any) => b.toString(16).padStart(2, "0")).join("");
        setAccount(hex);
      }
    } catch (e) { console.error(e); }
  };

  const fetchMyDatasets = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/datasets`);
      const data = await res.json();
      const mine = (data.datasets || []).filter((d: Dataset) => d.seller === account);
      setDatasets(mine);
    } catch { setDatasets([]); } finally { setLoading(false); }
  };

  const totalDownloads = datasets.reduce((sum, d) => sum + (d.downloads || 0), 0);
  const totalEarnings = datasets.reduce((sum, d) => sum + (Number(d.price) * (d.downloads || 0)), 0);

  return (
    <div style={{ background: bg, color: tx, minHeight: "100vh", fontFamily: "sans-serif" }}>

      {/* NAV */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderBottom: `1px solid ${bdr}`, background: bg, flexWrap: "wrap", gap: 10, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 32, height: 32, background: green, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff", fontSize: 15 }}>D</div>
          <span style={{ fontSize: 15, fontWeight: 700, color: tx }}>DataVault</span>
          <span style={{ fontSize: 10, color: green, background: green2, padding: "2px 9px", borderRadius: 20, border: `1px solid ${green3}`, fontWeight: 600 }}>Seller Dashboard</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", background: bg2, border: `1px solid ${bdr2}`, borderRadius: 10, padding: 3, gap: 2 }}>
            {["dark", "light"].map(t => (
              <button key={t} onClick={() => setTheme(t)} style={{ fontSize: 11, padding: "5px 11px", borderRadius: 7, border: "none", cursor: "pointer", background: theme === t ? green : "transparent", color: theme === t ? "#fff" : tx2, fontFamily: "inherit" }}>
                {t === "dark" ? "🌙" : "☀️"} {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          {account ? (
            <span style={{ fontSize: 11, color: green, background: green2, border: `1px solid ${green3}`, padding: "6px 12px", borderRadius: 9, fontWeight: 600 }}>
              ● {account.slice(0, 6)}...{account.slice(-4)}
            </span>
          ) : (
            <button onClick={connectWallet} style={{ fontSize: 12, padding: "7px 16px", borderRadius: 9, background: green, border: "none", color: "#fff", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>
              Connect Petra
            </button>
          )}
          <a href="/marketplace" style={{ fontSize: 12, padding: "7px 14px", borderRadius: 9, background: bg2, border: `1px solid ${bdr2}`, color: tx2, cursor: "pointer", textDecoration: "none", fontWeight: 600 }}>← Marketplace</a>
        </div>
      </nav>

      {!account ? (
        <div style={{ textAlign: "center", padding: "80px 24px" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <p style={{ fontSize: 18, fontWeight: 700, color: tx, marginBottom: 8 }}>Connect your wallet</p>
          <p style={{ fontSize: 14, color: tx2, marginBottom: 24 }}>Connect your Petra wallet to view your seller dashboard.</p>
          <button onClick={connectWallet} style={{ fontSize: 13, padding: "11px 24px", borderRadius: 10, background: green, border: "none", color: "#fff", cursor: "pointer", fontWeight: 700, fontFamily: "inherit" }}>Connect Petra wallet</button>
        </div>
      ) : (
        <div style={{ padding: "28px 24px" }}>

          {/* HEADER */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: green, letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>Seller Dashboard</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: tx, letterSpacing: "-0.5px" }}>Your listings on Shelby</div>
          </div>

          {/* STATS */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 0, border: `1px solid ${bdr}`, borderRadius: 12, overflow: "hidden", marginBottom: 28 }}>
            {[
              ["📦", datasets.length.toString(), "Total listings"],
              ["⬇️", totalDownloads.toString(), "Total downloads"],
              ["💰", `${totalEarnings} SUSD`, "Total earnings"],
              ["☁️", "Shelby testnet", "Storage network"],
            ].map(([ico, v, l]) => (
              <div key={l} style={{ padding: 16, textAlign: "center", borderRight: `1px solid ${bdr}`, background: card }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{ico}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: tx, marginBottom: 3 }}>{v}</div>
                <div style={{ fontSize: 11, color: tx3, fontWeight: 500 }}>{l}</div>
              </div>
            ))}
          </div>

          {/* LISTINGS */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: tx2 }}>Loading your listings...</div>
          ) : datasets.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
              <p style={{ fontSize: 15, fontWeight: 600, color: tx, marginBottom: 6 }}>No listings yet</p>
              <p style={{ fontSize: 13, color: tx2, marginBottom: 20 }}>Upload your first dataset to start selling on DataVault.</p>
              <a href="/marketplace" style={{ fontSize: 13, padding: "10px 22px", borderRadius: 9, background: green, border: "none", color: "#fff", cursor: "pointer", fontWeight: 700, textDecoration: "none" }}>Go to marketplace</a>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {datasets.map((d, i) => (
                <div key={i} style={{ background: card, border: `1px solid ${bdr}`, borderRadius: 12, padding: "1rem 1.2rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, background: green2, border: `1px solid ${green3}`, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                      {d.category === "NLP" ? "📝" : d.category === "Vision" ? "🖼️" : d.category === "Audio" ? "🎵" : d.category === "Medical" ? "🏥" : "📊"}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: tx, marginBottom: 2 }}>{d.blobName}</div>
                      <div style={{ fontSize: 11, color: tx2 }}>{d.category} · {d.mimeType} · {(d.size / 1024).toFixed(1)} KB</div>
                      <div style={{ fontSize: 10, color: tx3, marginTop: 2 }}>Uploaded {new Date(d.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: tx }}>{d.price} <span style={{ fontSize: 10, color: tx3, fontWeight: 400 }}>SUSD</span></div>
                      <div style={{ fontSize: 10, color: tx3 }}>Price</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: tx }}>{d.downloads}</div>
                      <div style={{ fontSize: 10, color: tx3 }}>Downloads</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: green }}>{Number(d.price) * d.downloads} <span style={{ fontSize: 10, fontWeight: 400 }}>SUSD</span></div>
                      <div style={{ fontSize: 10, color: tx3 }}>Earned</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, background: green2, border: `1px solid ${green3}`, borderRadius: 7, padding: "4px 8px" }}>
                      <span style={{ fontSize: 10, color: green, fontWeight: 600 }}>☁️ On Shelby</span>
                    </div>
                    <a href={`${API_URL}/download/${d.blobName}`} target="_blank" style={{ fontSize: 11, padding: "6px 12px", borderRadius: 7, background: bg3, border: `1px solid ${bdr2}`, color: tx2, cursor: "pointer", textDecoration: "none", fontWeight: 600 }}>⬇ Download</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <footer style={{ padding: "16px 24px", borderTop: `1px solid ${bdr}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, background: bg, marginTop: 40 }}>
        <span style={{ fontSize: 11, color: tx3, fontWeight: 500 }}>© 2025 DataVault · Powered by Shelby Protocol on Aptos</span>
        <a href="/marketplace" style={{ fontSize: 11, color: green, textDecoration: "none", fontWeight: 600 }}>← Back to marketplace</a>
      </footer>
    </div>
  );
}
