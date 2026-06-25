const express = require("express");
const { getShelbyClient } = require("./shelby");
const { getDatasetByName } = require("./db");

const router = express.Router();

router.get("/download/:blobName", async (req, res) => {
  try {
    const { blobName } = req.params;

    const dataset = getDatasetByName(blobName);
    if (!dataset) return res.status(404).json({ error: "Dataset not found" });

    const client = await getShelbyClient();

    const { AccountAddress } = await import("@aptos-labs/ts-sdk");
    const account = AccountAddress.from(process.env.WALLET_ADDRESS);

    const data = await client.rpc.getBlob({
      account,
      blobName,
    });

    res.setHeader("Content-Type", dataset.mimeType || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${blobName}"`);

    const reader = data.readable.getReader();
    const chunks = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const buffer = Buffer.concat(chunks.map((c) => Buffer.from(c)));
    res.send(buffer);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;