const express = require("express");
const { getShelbyClient } = require("./shelby");
const { getDatasetByName, getAllDatasets, writeDB } = require("./db");

const router = express.Router();

router.post("/purchase/:blobName", async (req, res) => {
  try {
    const { blobName } = req.params;
    const { buyerAddress } = req.body;

    if (!buyerAddress) {
      return res.status(400).json({ error: "Buyer address is required" });
    }

    const dataset = getDatasetByName(blobName);
    if (!dataset) {
      return res.status(404).json({ error: "Dataset not found" });
    }

    // Record the purchase
    const datasets = getAllDatasets();
    const index = datasets.findIndex((d) => d.blobName === blobName);

    if (index !== -1) {
      if (!datasets[index].buyers) datasets[index].buyers = [];
      datasets[index].buyers.push(buyerAddress);
      datasets[index].downloads += 1;
      writeDB(datasets);
    }

    res.json({
      success: true,
      message: "Purchase recorded",
      blobName,
      buyer: buyerAddress,
      downloadUrl: `/api/download/${blobName}`,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;