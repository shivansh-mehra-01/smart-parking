const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const parkingRoutes = require("./routes/parkingRoutes.js");

mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log("Connected to mongodb");
}).catch((error) => {
    console.log(error);
});

const app = express();

// Open CORS — allows all origins (safe for this parking management API)
app.use(cors({
    origin: true,
    credentials: true,
}));

app.use(express.json());

// Health-check endpoint (useful for Render keep-alive and monitoring)
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/", (req, res) => {
    res.send("Smart Parking API is running.");
});

app.use("/api", parkingRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});