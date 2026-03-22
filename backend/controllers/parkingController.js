const Parking = require("../models/Parking.js");
const Vehicle = require("../models/Vehicle.js");

const getParkings = async (req, res) => {
    try {
        const parkings = await Parking.find();
        res.json(parkings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const verifyDeviceKey = async (req, res) => {
    try {
        const { id, deviceKey } = req.body;
        const parking = await Parking.findById(id);
        if (!parking) {
             return res.status(404).json({ error: "Parking not found" });
        }
        if (parking.deviceKey !== deviceKey) {
             return res.status(401).json({ error: "Invalid Device Key" });
        }
        res.json({ message: "Device Verified successfully", success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// PUT /api/parkings/:id/slots — manual slot override
const updateParkingSlots = async (req, res) => {
    try {
        const { id } = req.params;
        const { availableSlots } = req.body;
        
        const parking = await Parking.findById(id);
        if (!parking) {
            return res.status(404).json({ error: "Parking not found" });
        }
        
        parking.availableSlots = availableSlots;
        await parking.save();
        
        res.json({ message: "Slots updated successfully", parking });
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

module.exports = { getParkings, updateParkingSlots, saveVehicleEntry, saveVehicleExit, verifyDeviceKey };