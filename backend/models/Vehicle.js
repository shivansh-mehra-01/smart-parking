const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({
    plateNumber: {
        type: String,
        required: true
    },

    parkingId: {
        type: String,
        required: true
    },

    camera: {
        type: String,
        required: true
    },

    entryTime: {
        type: Date,
        default: Date.now
    },

    exitTime: {
        type: Date,
        default: null
    },

    plate_text: String,
    entry_time: String,
    exit_time: String,
    status: { type: String, default: "inside" },
    source: String,
    duration_mins: Number

}, { collection: 'parking_log' });

module.exports = mongoose.model("Vehicle", vehicleSchema);