'use client';

import { useState } from "react";
import { getAptosWallets } from "@aptos-labs/wallet-standard";

interface Video {
  name: string;
  blobName: string;
  url: string;
  owner?: string;
  txHash?: string;
  uploadDate?: string;
  fileSize?: string;
}

const API_URL = "https://castro-api.onrender.com";
const SHELBY_CONTRACT = "0x85fdb9a176ab8ef1d9d9c1b60d60b3924f0800ac1de1cc2085fb0b8bb4988e6a";

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [playing, setPlaying] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState("");

  const loadMyVideos = async (address: string) => {
    try {
      const res = await fetch(API_URL + "/blobs");
      const data = await res.json();
      const myVideos = data.blobs.filter((b: any) => b.owner === address);
      setVideos(myVideos.map((b: any) => ({
        name: b.name,
        blobName: b.blobName,
        url: "",
        owner: b.owner,
        txHash: b.txHash
      })));
    } catch (err) {
      console.error("Failed to load videos:", err);
    }
  };

  const connectWallet = async () => {
    try {
      const { aptosWallets } = getAptosWallets();
      const petra = aptosWallets.find((w: any) => w.name === "Petra");
      if (!petra) {
        alert("Petra wallet not found! Please install it from petra.app");
        return;
      }
      const connectFeature = petra.features["aptos:connect"];
      const result = await connectFeature.connect() as any;
      const address =
        result?.args?.address?.toString() ||
        result?.args?.publicKey?.toString() ||
        result?.account?.address?.toString() ||
        Object.values(result?.args || {})[0]?.toString() ||
        "unknown";
      setAccount(address);
      setWallet(petra);
      setShowUpload(true);
      setMessage("Wallet connected!");
      setTimeout(() => setMessage(""), 3000);
      await loadMyVideos(address);
    } catch (err: any) {
      setMessage("Failed to connect: " + err.message);
    }
  };

  const disconnectWallet = async () => {
    try {
      if (wallet) await wallet.features["aptos:disconnect"].disconnect();
      setAccount(null);
      setWallet(null);
      setShowUpload(false);
      setVideos([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpload = async (file: File) => {
    if (!file || !account || !wallet) return;
    setUploading(true);
    setMessage("Please approve transaction in your wallet...");
    try {
      const submitFeature = wallet.features["aptos:signAndSubmitTransaction"];
      if (!submitFeature) throw new Error("Wallet does not support transactions");
      const blobName = "media/" + Date.now() + "-" + file.name.replace(/\s+/g, '-');
      const txResult = await submitFeature.signAndSubmitTransaction({
        payload: {
          function: SHELBY_CONTRACT + "::blob_metadata::register_blob",
          typeArguments: [],
          functionArguments: [blobName, String(Math.floor(Date.now() * 1000) + 2592000000000), new Uint8Array(32), "1", String(file.size), "0", "0"],
        }
      }) as any;
      const txHash = txResult?.args?.hash || txResult?.hash;
      if (!txHash) throw new Error("Transaction was cancelled or rejected");
      setMessage("Transaction confirmed! Uploading file...");
      const response = await fetch(API_URL + "/upload?name=" + file.name + "&owner=" + account + "&txHash=" + txHash, {
        method: "POST",
        body: file,
      });
      const data = await response.json();
      if (data.success) {
        const newVideo = {
          name: file.name,
          blobName: data.blobName,
          url: URL.createObjectURL(file),
          owner: account,
          txHash,
          uploadDate: new Date().toLocaleDateString(),
          fileSize: (file.size / (1024 * 1024)).toFixed(2) + " MB"
        };
        setVideos(prev => [newVideo, ...prev]);
        setPlaying(data.blobName);
        setMessage("Uploaded! Playing now...");
      } else {
        setMessage("Upload failed. Try again.");
      }
    } catch (err: any) {
      setMessage(err.message);
    }
    setUploading(false);
    setTimeout(() => setMessage(""), 5000);
  };

  const handleDelete = (blobName: string) => {
    if (!confirm("Are you sure you want to delete this?")) return;
    setVideos(prev => prev.filter(v => v.blobName !== blobName));
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handlePlay = async (video: Video) => {
    if (playing === video.blobName) {
      setPlaying(null);
      return;
    }
    if (video.url) {
      setPlaying(video.blobName);
      return;
    }
    setMessage("Loading video...");
    try {
      const res = await fetch(API_URL + "/download?blobName=" + video.blobName);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setVideos(prev => prev.map(v => v.blobName === video.blobName ? { ...v, url } : v));
      setPlaying(video.blobName);
      setMessage("");

    } catch (err) {
      setMessage("Failed to load video.");
    }
  };

  const shortAddress = account ? account.slice(0, 6) + "..." + account.slice(-4) : "";

  return (
    <div className="min-h-screen text-white font-sans" style={{background: "linear-gradient(135deg, #0a0a0a 0%, #111118 50%, #0a0a0a 100%)"}}>
      <nav className="px-8 py-5 flex items-center justify-between sticky top-0 z-50 border-b border-white/5" style={{background: "rgba(10,10,10,0.95)", backdropFilter: "blur(20px)"}}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
            <span className="text-sm">▶</span>
          </div>
          <span className="text-xl font-bold tracking-tight">CASTRO</span>
          <span className="text-xs text-white/20 font-mono hidden sm:block">// on-chain video vault</span>
        </div>
        <div className="flex items-center gap-3">
          {account ? (
            <>
              <button onClick={() => setShowUpload(!showUpload)} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-md text-sm font-bold cursor-pointer transition-all">
                {showUpload ? "x Close" : "+ Upload"}
              </button>
              <span className="text-sm text-green-400 font-mono bg-green-400/10 px-3 py-1.5 rounded-md">● {shortAddress}</span>
              <button onClick={disconnectWallet} className="text-white/40 hover:text-white/80 text-sm cursor-pointer transition-all">Sign out</button>
            </>
          ) : (
            <button onClick={connectWallet} className="bg-white text-black px-5 py-2 rounded-md text-sm font-bold cursor-pointer hover:bg-white/90 transition-all">
              Connect Wallet
            </button>
          )}
        </div>
      </nav>

      {!account && (
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 to-transparent pointer-events-none" />
          <div className="max-w-5xl mx-auto px-8 py-24 relative">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xs font-bold text-red-400 uppercase tracking-widest bg-red-400/10 px-3 py-1 rounded-full border border-red-400/20">Shelby Protocol</span>
              <span className="text-white/20">x</span>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest bg-blue-400/10 px-3 py-1 rounded-full border border-blue-400/20">Aptos L1</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-black mb-6 leading-tight tracking-tight">
              Your videos.<br />
              <span className="text-white/30">On-chain. Forever.</span>
            </h1>
            <p className="text-white/50 text-xl max-w-lg mb-10 leading-relaxed">
              Castro stores your videos permanently on Shelby decentralized network, anchored to the Aptos blockchain. Only your wallet. Only your content.
            </p>
            <button onClick={connectWallet} className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-md text-base font-bold cursor-pointer transition-all">
              Connect Wallet to Start
            </button>
          </div>
        </div>
      )}

      {!account && (
        <div className="border-t border-white/5 px-8 py-16">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs text-white/20 uppercase tracking-widest mb-2 font-mono">// the process</p>
            <h2 className="text-2xl font-black mb-10">How Castro Works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl p-6 border border-white/8" style={{background: "rgba(255,255,255,0.03)"}}>
                <div className="text-3xl font-black text-white/10 mb-3">01</div>
                <h3 className="font-bold text-white mb-2">Upload Video</h3>
                <p className="text-sm text-white/40 leading-relaxed">Connect your Petra wallet and upload. You need APT for gas and ShelbyUSD for decentralized storage.</p>
              </div>
              <div className="rounded-xl p-6 border border-white/8" style={{background: "rgba(255,255,255,0.03)"}}>
                <div className="text-3xl font-black text-white/10 mb-3">02</div>
                <h3 className="font-bold text-white mb-2">On-Chain Anchoring</h3>
                <p className="text-sm text-white/40 leading-relaxed">Your video metadata is written to Aptos L1 via the Shelby Protocol smart contract, permanent and immutable.</p>
              </div>
              <div className="rounded-xl p-6 border border-white/8" style={{background: "rgba(255,255,255,0.03)"}}>
                <div className="text-3xl font-black text-white/10 mb-3">03</div>
                <h3 className="font-bold text-white mb-2">Private Vault</h3>
                <p className="text-sm text-white/40 leading-relaxed">Only your wallet can access your videos. No platform can delete or restrict your content.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-8 py-10">
        {account && showUpload && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files?.[0]; if (file) handleUpload(file); }}
            onClick={() => document.getElementById("fileInput")?.click()}
            className={"rounded-2xl p-12 text-center mb-8 cursor-pointer transition-all border-2 border-dashed " + (dragOver ? "border-red-500 bg-red-500/5" : "border-white/10 hover:border-white/20")}
          >
            <div className="text-5xl mb-4">🎬</div>
            <p className="text-xl font-bold mb-2">{uploading ? "Processing your video..." : "Drop your video here"}</p>
            <p className="text-sm text-white/30 mb-6">or click to browse • videos & images accepted • requires ShelbyUSD + APT gas</p>
            <input id="fileInput" type="file" accept="video/*,image/*" onChange={handleFileInput} disabled={uploading} className="hidden" />
            <button disabled={uploading} className={"px-8 py-3 rounded-md text-sm font-bold transition-all " + (uploading ? "bg-white/10 text-white/30 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 text-white cursor-pointer")}>
              {uploading ? "Processing..." : "Select Video"}
            </button>
            {message && <p className="mt-5 text-red-400 font-semibold">{message}</p>}
          </div>
        )}

        {message && !showUpload && account && (
          <p className="text-center text-red-400 font-semibold mb-6">{message}</p>
        )}

        {account && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black uppercase tracking-wider text-white/60">
                {videos.length > 0 ? "My Vault - " + videos.length + " videos" : "My Vault"}
              </h2>
            </div>
            {videos.length === 0 && (
              <div className="text-center py-24 text-white/20">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-lg font-bold mb-2">Your vault is empty</p>
                <p className="text-sm">Click + Upload to add your first video</p>
              </div>
            )}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search videos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.filter(v => v.name.toLowerCase().includes(search.toLowerCase())).map((video, index) => (
                <div key={index} className="rounded-xl overflow-hidden border border-white/8 hover:border-white/15 transition-all group" style={{background: "rgba(255,255,255,0.03)"}}>
                  {playing === video.blobName && video.url ? (
                    <video src={video.url} controls autoPlay className="w-full aspect-video object-cover" />
                  ) : (
                    <div onClick={() => handlePlay(video)} className="w-full aspect-video flex items-center justify-center cursor-pointer" style={{background: "rgba(255,255,255,0.05)"}}>
                      <div className="w-16 h-16 rounded-full bg-red-600/80 flex items-center justify-center group-hover:bg-red-600 transition-all group-hover:scale-110">
                        <span className="text-xl ml-1">▶</span>
                      </div>
                    </div>
                  )}
                  <div className="p-4">
                    <p className="text-sm font-bold truncate mb-1">{video.name}</p>
                    <p className="text-xs text-white/30">{video.uploadDate} • {video.fileSize}</p>
                    <button onClick={() => handleDelete(video.blobName)} className="text-xs text-red-500 hover:text-red-400 transition-all mb-1">🗑 Delete</button>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/20 font-mono">Shelby Network</span>
                      {video.txHash && video.txHash !== "unknown" && (
                        <a href={"https://explorer.shelby.xyz/shelbynet/account/" + video.owner} target="_blank" rel="noopener noreferrer" className="text-xs text-red-400 hover:text-red-300 transition-all">
                          On-chain
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mt-24 pt-8 border-t border-white/5 flex items-center justify-between text-xs text-white/15 font-mono">
          <span>CASTRO // Personal Video Vault</span>
          <span>Shelby Protocol x Aptos L1</span>
        </div>
      </div>
    </div>
  );
}
