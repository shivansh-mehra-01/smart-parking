const express = require("express");
const router = express.Router();
const { getParkings, updateParkingSlots, saveVehicleEntry, saveVehicleExit, verifyDeviceKey, updateVehiclePlate } = require("../controllers/parkingController.js");
const { 
    getDashboardStats, getLiveOccupancy, getBookingsToday, exportBookings,
    getAuthParkings, authLogin, getPricing, updatePricing,
    getProfile, updateProfile, getNotifications 
} = require("../controllers/apiController.js");

// --- Parking and Vehicle Routes ---
router.get("/parkings", getParkings);

router.post("/verify-device", verifyDeviceKey);
router.put("/parkings/:id/slots", updateParkingSlots);
router.post("/vehicle-entry", saveVehicleEntry);
router.post("/vehicle-exit", saveVehicleExit);
router.put("/vehicle/:id", updateVehiclePlate);   // OCR auto-correct 

// --- Frontend API Routes ---
router.get("/dashboard/stats", getDashboardStats);
router.get("/occupancy/live", getLiveOccupancy);

router.get("/bookings/today", getBookingsToday);
router.get("/bookings/export", exportBookings);

router.get("/auth/parkings", getAuthParkings);
router.post("/auth/login", authLogin);

router.get("/pricing", getPricing);
router.put("/pricing/:plan_id", updatePricing);

router.get("/profile", getProfile);
router.put("/profile", updateProfile);

router.get("/notifications", getNotifications);

module.exports = router;
