const mongoose = require("mongoose");

const parkingSchema = new mongoose.Schema({
    _id: String, // Manual ID like 'PARKING_1'
    name: String,
    address: String,
    latitude: Number,
    longitude: Number,
    totalSlots: Number,
    availableSlots: Number,
});

module.exports = mongoose.model("Parking", parkingSchema);