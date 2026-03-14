const express = require("express");
const router = express.Router();;
const { getParkings, saveVehicleEntry, saveVehicleExit } = require("../controllers/parkingController.js");

router.get("/parkings", getParkings);

router.post("/vehicle-entry", saveVehicleEntry);   // car enter hone par

router.post("/vehicle-exit", saveVehicleExit);     // car exit hone par

module.exports = router;
