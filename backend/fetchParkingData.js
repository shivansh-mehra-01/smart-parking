const mongoose = require("mongoose");
const Parking = require("./models/Parking.js");

mongoose.connect("mongodb://localhost:27017/rn_smart_parking");

async function fetchParkingData() {
    try {
        const parkings = await Parking.find();
        console.log(parkings);
    } catch(error) {
        console.error(error);
    } finally {
        mongoose.disconnect();
    }
}

fetchParkingData();