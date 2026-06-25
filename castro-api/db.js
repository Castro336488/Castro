const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "datasets.json");

function readDB() {
  if (!fs.existsSync(DB_PATH)) return [];
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function addDataset(dataset) {
  const db = readDB();
  db.push(dataset);
  writeDB(db);
  return dataset;
}

function getAllDatasets() {
  return readDB();
}

function getDatasetByName(blobName) {
  const db = readDB();
  return db.find((d) => d.blobName === blobName) || null;
}

module.exports = { addDataset, getAllDatasets, getDatasetByName };
module.exports = { addDataset, getAllDatasets, getDatasetByName, writeDB };