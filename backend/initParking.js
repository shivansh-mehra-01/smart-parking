const mongoose = require("mongoose");
const Parking = require("./models/Parking.js");
const dotenv = require("dotenv");

dotenv.config();

mongoose.connect(process.env.MONGO_URI);

const parkings = [
  {
    name: "MP Nagar Parking 1",
    address: "MP Nagar Bhopal MP",
    latitude: 23.2317869,
    longitude: 77.4296376,
    totalSlots: 100,
    availableSlots: 100,
  },
  {
    name: "MP Nagar Parking 2",
    address: "MP Nagar Bhopal MP",
    latitude: 23.2318487,
    longitude: 77.4303621,
    totalSlots: 200,
    availableSlots: 200,
  },
  {
    name: "MP Nagar Parking 3",
    address: "MP Nagar Bhopal MP",
    latitude: 23.2240375,
    longitude: 77.4399797,
    totalSlots: 300,
    availableSlots: 300,
  },
  {
    name: "MP Nagar Parking 4",
    address: "MP Nagar Bhopal MP",
    latitude: 23.2237618,
    longitude: 77.4402973,
    totalSlots: 400,
    availableSlots: 400,
  }
];

async function insertParkingData() {
  try {
    await Parking.deleteMany({});
    const docs = await Parking.insertMany(parkings);
    console.log("Parkings are inserted with Auto IDs:");
    docs.forEach(d => console.log(`${d.name}: ${d._id}`));
  } catch (error) {
    console.error(error.message);
  } finally {
    await mongoose.disconnect();
  }
}

insertParkingData();