require("dotenv").config();
const express = require("express");
const cors = require("cors");
const uploadRoute = require("./upload");
const datasetsRoute = require("./datasets");
const downloadRoute = require("./download");
const purchaseRoute = require("./purchase"); // 👈 new

const app = express();
app.use(cors({ 
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());
app.use("/api", uploadRoute);
app.use("/api", datasetsRoute);
app.use("/api", downloadRoute);
app.use("/api", purchaseRoute); // 👈 new

app.get("/", (req, res) => {
  res.json({ message: "Castro Marketplace API is running 🚀" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});