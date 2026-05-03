import { useState, useEffect } from "react";
import { getAptosWallets } from "@aptos-labs/wallet-standard";

const API_URL = "https://castro-api-production.up.railway.app";

interface Video {
  name: string;
  blobName: string;
  url: string;
  owner?: string;
}

export default function App() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [playing, setPlaying] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [wallet, setWallet] = useState<any>(null);

  const connectWallet = async () => {
    try {
      const { aptosWallets } = getAptosWallets();
      const petra = aptosWallets.find((w: any) => w.name === "Petra");
      if (!petra) {
        alert("Petra wallet not found! Please install it from petra.app");
        return;
      }
      const connectFeature = petra.features["aptos:connect"];
      const result = await connectFeature.connect();
      const address =
        result?.args?.address?.toString() ||
        result?.args?.publicKey?.toString() ||
        result?.account?.address?.toString() ||
        Object.values(result?.args || {})[0]?.toString() ||
        "unknown";
      setAccount(address);
      setWallet(petra);
      setMessage("✅ Wallet connected!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      console.error("Connect error:", err);
      setMessage("❌ Failed to connect: " + err.message);
    }
  };

  const disconnectWallet = async () => {
    try {
      if (wallet) {
        const disconnectFeature = wallet.features["aptos:disconnect"];
        await disconnectFeature.disconnect();
      }
      setAccount(null);
      setWallet(null);
      setVideos([]);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (account) {
      fetch(`${API_URL}/blobs`)
        .then(res => res.json())
        .then(data => {
          const myVideos = data.blobs.filter((b: any) => b.owner === account);
          setVideos(myVideos.map((b: any) => ({ name: b.name, blobName: b.blobName, url: "", owner: b.owner })));
        })
        .catch(err => console.error("Failed to load blobs:", err));
    }
  }, [account]);

  const handleUpload = async (file: File) => {
    if (!file || !account) return;
    setUploading(true);
    setMessage("Uploading to Shelby...");
    try {
      const response = await fetch(`${API_URL}/upload?name=${file.name}&owner=${account}`, {
        method: "POST",
        body: file,
      });
      const data = await response.json();
      if (data.success) {
        setVideos(prev => [...prev, { name: file.name, blobName: data.blobName, url: URL.createObjectURL(file), owner: account }]);
        setMessage("✅ Uploaded to Shelby!");
      } else {
        setMessage("❌ Upload failed. Try again.");
      }
    } catch (err) {
      setMessage("❌ Upload failed. Try again.");
    }
    setUploading(false);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const handlePlay = async (video: Video) => {
    if (playing === video.blobName) { setPlaying(null); return; }
    if (video.url) { setPlaying(video.blobName); return; }
    setMessage("Loading from Shelby...");
    try {
      const res = await fetch(`${API_URL}/download?blobName=${video.blobName}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setVideos(prev => prev.map(v => v.blobName === video.blobName ? { ...v, url } : v));
      setPlaying(video.blobName);
      setMessage("");
    } catch (err) {
      setMessage("❌ Failed to load video.");
    }
  };

  const shortAddress = account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "";

  return (
    <div style={{ minHeight: "100vh", background: "#f9f9f9", fontFamily: "'Segoe UI', Arial, sans-serif" }}>
      <nav style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "12px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "24px" }}>🎬</span>
          <span style={{ fontSize: "22px", fontWeight: "700", color: "#111" }}>Castro</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "12px", background: "#f0f0f0", padding: "4px 10px", borderRadius: "20px", color: "#555" }}>Powered by Shelby</span>
          {account ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "13px", color: "#111", fontWeight: "600" }}>🟢 {shortAddress}</span>
              <button onClick={disconnectWallet} style={{ background: "#ff4444", color: "white", border: "none", padding: "6px 14px", borderRadius: "8px", fontSize: "13px", cursor: "pointer" }}>Disconnect</button>
            </div>
          ) : (
            <button onClick={connectWallet} style={{ background: "#1a73e8", color: "white", border: "none", padding: "8px 18px", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>Connect Petra Wallet</button>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}>
        {!account && (
          <div style={{ textAlign: "center", padding: "80px", background: "#fff", borderRadius: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>🔐</div>
            <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#111", marginBottom: "8px" }}>Connect your wallet</h2>
            <p style={{ color: "#888", marginBottom: "24px" }}>Connect your Petra wallet to upload and view your videos</p>
            <button onClick={connectWallet} style={{ background: "#1a73e8", color: "white", border: "none", padding: "12px 32px", borderRadius: "8px", fontSize: "16px", fontWeight: "600", cursor: "pointer" }}>Connect Petra Wallet</button>
          </div>
        )}

        {account && (
          <>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{ border: `2px dashed ${dragOver ? "#1a73e8" : "#ccc"}`, borderRadius: "16px", padding: "48px", textAlign: "center", background: dragOver ? "#e8f0fe" : "#fff", marginBottom: "40px", transition: "all 0.2s", cursor: "pointer" }}
              onClick={() => document.getElementById("fileInput")?.click()}
            >
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>📁</div>
              <p style={{ fontSize: "18px", fontWeight: "600", color: "#111", margin: "0 0 8px" }}>{uploading ? "Uploading to Shelby..." : "Drop your video here"}</p>
              <p style={{ fontSize: "14px", color: "#888", margin: "0 0 16px" }}>or click to browse files</p>
              <input id="fileInput" type="file" accept="video/*" onChange={handleFileInput} disabled={uploading} style={{ display: "none" }} />
              <button disabled={uploading} style={{ background: "#1a73e8", color: "white", border: "none", padding: "10px 24px", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.7 : 1 }}>
                {uploading ? "Uploading..." : "Select Video"}
              </button>
              {message && <p style={{ marginTop: "16px", color: "#1a73e8", fontWeight: "600" }}>{message}</p>}
            </div>

            <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#111", marginBottom: "20px" }}>
              {videos.length > 0 ? `Your Videos (${videos.length})` : "No videos yet"}
            </h2>
            {videos.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px", color: "#aaa" }}>
                <div style={{ fontSize: "64px", marginBottom: "16px" }}>🎥</div>
                <p style={{ fontSize: "16px" }}>Upload your first video to get started</p>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
              {videos.map((video, index) => (
                <div key={index} style={{ background: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                  {playing === video.blobName && video.url ? (
                    <video src={video.url} controls autoPlay style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }} />
                  ) : (
                    <div onClick={() => handlePlay(video)} style={{ width: "100%", aspectRatio: "16/9", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <div style={{ width: "48px", height: "48px", background: "rgba(255,255,255,0.9)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: "20px", marginLeft: "4px" }}>▶</span>
                      </div>
                    </div>
                  )}
                  <div style={{ padding: "12px 16px" }}>
                    <p style={{ fontSize: "14px", fontWeight: "600", color: "#111", margin: "0 0 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{video.name}</p>
                    <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>Stored on Shelby Network</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}