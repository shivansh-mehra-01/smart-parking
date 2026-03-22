const express = require("express");
const router = express.Router();
const { getParkings, updateParkingSlots, saveVehicleEntry, saveVehicleExit, verifyDeviceKey } = require("../controllers/parkingController.js");

router.get("/parkings", getParkings);
router.post("/verify-device", verifyDeviceKey);

router.put("/parkings/:id/slots", updateParkingSlots);

router.post("/vehicle-entry", saveVehicleEntry);

router.post("/vehicle-exit", saveVehicleExit);

module.exports = router;
