const mongoose = require("mongoose");

const parkingSchema = new mongoose.Schema({
    name: { type: String, required: true },

    address: String,

    city: String,
    area: String,

    latitude: Number,
    longitude: Number,

    totalSlots: { type: Number, required: true },
    availableSlots: { type: Number, default: 0 },

    type: {
        type: String,
        enum: ["mall", "hospital", "govt", "private"],
    },

    // 🔐 security (must for your system)
    deviceKey: { type: String, required: true, unique: true },

}, { timestamps: true });

module.exports = mongoose.model("Parking", parkingSchema);