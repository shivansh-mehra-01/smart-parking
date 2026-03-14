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
    }

});

module.exports = mongoose.model("Vehicle", vehicleSchema);