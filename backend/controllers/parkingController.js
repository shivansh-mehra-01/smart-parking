const Parking = require("../models/Parking.js");
const Vehicle = require("../models/Vehicle.js");

// GET /api/parkings — saari parkings fetch karo
const getParkings = async (req, res) => {
    try {
        const parkings = await Parking.find();
        res.json(parkings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// POST /api/vehicle-entry — car enter hone par
// 1. Vehicle record banao with exitTime=null
// 2. availableSlots -1 karo
const saveVehicleEntry = async (req, res) => {
    try {
        const { plateNumber, camera, parkingId } = req.body;

        console.log("Vehicle ENTRY:", plateNumber, "| Parking:", parkingId);

        // Check karo vehicle pehle se andar toh nahi hai
        const alreadyInside = await Vehicle.findOne({
            plateNumber: plateNumber,
            exitTime: null
        });

        if (alreadyInside) {
            console.log("Vehicle already inside:", plateNumber);
            return res.json({ message: "Vehicle already inside parking" });
        }

        // Parking find karo
        const parking = await Parking.findById(parkingId);
        if (!parking) {
            return res.status(404).json({ error: "Parking not found" });
        }

        // Check karo slot available hai ya nahi
        if (parking.availableSlots <= 0) {
            return res.status(400).json({ error: "No slots available" });
        }

        // Vehicle entry record save karo
        const newVehicle = new Vehicle({
            plateNumber,
            camera,
            parkingId,
            entryTime: new Date(),
            exitTime: null
        });
        await newVehicle.save();

        // availableSlots -1 karo
        parking.availableSlots = parking.availableSlots - 1;
        await parking.save();

        console.log(`Slot updated: ${parking.availableSlots}/${parking.totalSlots} available`);

        res.json({
            message: "Vehicle entry saved, slot decremented",
            vehicle: newVehicle,
            availableSlots: parking.availableSlots
        });

    } catch (error) {
        console.log("Error in vehicle entry:", error);
        res.status(500).json({ error: error.message });
    }
};

// POST /api/vehicle-exit — car exit hone par
// 1. Vehicle ka exitTime set karo
// 2. availableSlots +1 karo
const saveVehicleExit = async (req, res) => {
    try {
        const { plateNumber } = req.body;

        console.log("Vehicle EXIT:", plateNumber);

        // Wo vehicle dhundo jo abhi andar hai (exitTime=null)
        const vehicle = await Vehicle.findOne({
            plateNumber: plateNumber,
            exitTime: null
        });

        if (!vehicle) {
            console.log("No entry found for vehicle:", plateNumber);
            return res.status(404).json({ error: "No active entry found for this vehicle" });
        }

        // exitTime set karo
        vehicle.exitTime = new Date();
        await vehicle.save();

        // Parking find karo aur slot +1 karo
        const parking = await Parking.findById(vehicle.parkingId);
        if (parking) {
            // totalSlots se zyada nahi hona chahiye
            if (parking.availableSlots < parking.totalSlots) {
                parking.availableSlots = parking.availableSlots + 1;
                await parking.save();
            }
            console.log(`Slot updated: ${parking.availableSlots}/${parking.totalSlots} available`);
        }

        res.json({
            message: "Vehicle exit recorded, slot incremented",
            vehicle: vehicle,
            availableSlots: parking ? parking.availableSlots : null
        });

    } catch (error) {
        console.log("Error in vehicle exit:", error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getParkings, saveVehicleEntry, saveVehicleExit };