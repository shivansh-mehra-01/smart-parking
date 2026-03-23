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

// Allow requests from the Netlify frontend (set FRONTEND_URL in Render env vars)
const allowedOrigins = [
    process.env.FRONTEND_URL,       // e.g. https://your-app.netlify.app
    "http://localhost:5173",        // Vite local dev
    "http://localhost:3000",        // fallback
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS policy: Origin ${origin} not allowed`));
        }
    },
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