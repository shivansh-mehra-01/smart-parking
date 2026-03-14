const mongoose = require("mongoose");

const parkingSchema = new mongoose.Schema({
    name: String,
    address: String,
    latitude: Number,
    longitude: Number,
    totalSlots: Number,
    availableSlots: Number,
});

module.exports = mongoose.model("Parking", parkingSchema);