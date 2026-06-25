const express = require("express");
const multer = require("multer");
const { getShelbyClient } = require("./shelby");
const { addDataset } = require("./db");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { name, description, price, category } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const client = await getShelbyClient();

    const { Account, Ed25519PrivateKey } = await import("@aptos-labs/ts-sdk");
    const signer = Account.fromPrivateKey({
      privateKey: new Ed25519PrivateKey(process.env.PRIVATE_KEY),
    });

    const expirationMicros = BigInt(Date.now()) * 1000n + 86400_000_000n;

    await client.upload({
      signer,
      blobName: name,
      blobData: file.buffer,
      expirationMicros,
    });

    const dataset = addDataset({
      blobName: name,
      description,
      price,
      category,
      mimeType: file.mimetype,
      size: file.size,
      seller: process.env.WALLET_ADDRESS,
      downloads: 0,
      createdAt: new Date().toISOString(),
    });

    res.json({ success: true, dataset });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;