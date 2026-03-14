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

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.use("/api", parkingRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});