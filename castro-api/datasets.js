const express = require("express");
const { getAllDatasets, getDatasetByName, addDataset } = require("./db");

const router = express.Router();

// Get all datasets
router.get("/datasets", (req, res) => {
  try {
    const { category, search } = req.query;
    let datasets = getAllDatasets();

    if (category && category !== "all") {
      datasets = datasets.filter(
        (d) => d.category?.toLowerCase() === category.toLowerCase()
      );
    }

    if (search) {
      datasets = datasets.filter(
        (d) =>
          d.blobName?.toLowerCase().includes(search.toLowerCase()) ||
          d.description?.toLowerCase().includes(search.toLowerCase())
      );
    }

    res.json({ success: true, datasets });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single dataset
router.get("/datasets/:blobName", (req, res) => {
  try {
    const dataset = getDatasetByName(req.params.blobName);
    if (!dataset) return res.status(404).json({ error: "Dataset not found" });
    res.json({ success: true, dataset });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save dataset metadata
router.post("/datasets", (req, res) => {
  try {
    const { blobName, description, price, category, mimeType, size, seller } = req.body;
    if (!blobName) return res.status(400).json({ error: "blobName is required" });
    const dataset = addDataset({
      blobName,
      description,
      price,
      category,
      mimeType,
      size,
      seller,
      downloads: 0,
      createdAt: new Date().toISOString(),
    });
    res.json({ success: true, dataset });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;