const mongoose = require("mongoose");
const Parking = require("../models/Parking.js");
const { ObjectId } = mongoose.Types;

const mapVehicle = (doc) => {
    return {
        _id: doc._id.toString(),
        plate_text: doc.plate_text || doc.plateNumber,
        entry_time: doc.entry_time || (doc.entryTime ? doc.entryTime.toISOString() : null),
        exit_time: doc.exit_time || (doc.exitTime ? doc.exitTime.toISOString() : null),
        status: doc.status || (doc.exitTime ? "exited" : "inside"),
        duration_mins: doc.duration_mins || 0,
        source: doc.source || doc.camera || "camera_0"
    };
};

const getDashboardStats = async (req, res) => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const db = mongoose.connection.db;
        const settings = await db.collection("facility_settings").findOne() || {};
        
        let targetParking;
        if (settings.facility_name) {
            targetParking = await db.collection("parkings").findOne({ name: settings.facility_name });
        }
        if (!targetParking) {
            targetParking = await db.collection("parkings").findOne() || { totalSlots: 0, availableSlots: 0 };
        }

        const total_capacity = targetParking.totalSlots;
        const active_sessions = targetParking.totalSlots - targetParking.availableSlots;
        
        const parkingIdStr = targetParking._id ? targetParking._id.toString() : null;
        const baseQuery = parkingIdStr ? { parkingId: parkingIdStr } : {};

        const startIso = startOfDay.toISOString();
        const entries_today = await db.collection("parking_log").countDocuments({ ...baseQuery, entry_time: { $gte: startIso } });
        const exits_today = await db.collection("parking_log").countDocuments({ ...baseQuery, status: "exited", exit_time: { $gte: startIso } });

        const exited_docs = await db.collection("parking_log").find({ ...baseQuery, status: "exited", exit_time: { $gte: startIso } }).toArray();
        let totalDuration = 0;
        exited_docs.forEach(doc => {
            totalDuration += (doc.duration_mins || 0);
        });
        const avg_dwell_time = exited_docs.length ? totalDuration / exited_docs.length : 0;
        
        const recent_logs = await db.collection("parking_log").find(baseQuery).sort({ _id: -1 }).limit(10).toArray();

        res.json({
            total_capacity: total_capacity,
            active_sessions,
            entries_today,
            exits_today,
            avg_dwell_time_mins: avg_dwell_time,
            recent_logs: recent_logs.map(mapVehicle)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getLiveOccupancy = async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const settings = await db.collection("facility_settings").findOne() || {};
        
        let targetParking;
        if (settings.facility_name) {
            targetParking = await db.collection("parkings").findOne({ name: settings.facility_name });
        }
        if (!targetParking) {
            targetParking = await db.collection("parkings").findOne() || { totalSlots: 0 };
        }

        const parkingIdStr = targetParking._id ? targetParking._id.toString() : null;
        const baseQuery = parkingIdStr ? { parkingId: parkingIdStr, status: "inside" } : { status: "inside" };
        
        const total_capacity = targetParking.totalSlots;
        
        const live_docs = await mongoose.connection.db.collection("parking_log").find(baseQuery).sort({ entry_time: -1 }).toArray();
        res.json({
            total_capacity: total_capacity || 120,
            sessions: live_docs.map(mapVehicle)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getBookingsToday = async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const settings = await db.collection("facility_settings").findOne() || {};
        let targetParking;
        if (settings.facility_name) {
            targetParking = await db.collection("parkings").findOne({ name: settings.facility_name });
        }
        if (!targetParking) {
            targetParking = await db.collection("parkings").findOne() || {};
        }
        const parkingIdStr = targetParking._id ? targetParking._id.toString() : null;
        const baseQuery = parkingIdStr ? { parkingId: parkingIdStr } : {};

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const startIso = startOfDay.toISOString();
        const docs = await db.collection("parking_log").find({ ...baseQuery, entry_time: { $gte: startIso } }).sort({ entry_time: -1 }).toArray();
        res.json(docs.map(mapVehicle));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.exportBookings = async (req, res) => {
    // Requires CSV packaging
    try {
        const { start_date, end_date } = req.query;
        const start = new Date(start_date);
        const end = new Date(end_date + 'T23:59:59.999Z');
        const startIso = start.toISOString();
        const endIso = end.toISOString();
        const docs = await mongoose.connection.db.collection("parking_log").find({ 
            entry_time: { $gte: startIso, $lte: endIso } 
        }).sort({ entry_time: -1 }).toArray();
        
        let csv = "Plate Text,Entry Time,Exit Time,Duration (Mins),Status,Confidence,Source\n";
        docs.forEach(doc => {
            const m = mapVehicle(doc);
            csv += `${m.plate_text},${m.entry_time || ''},${m.exit_time || ''},${m.duration_mins},${m.status},,${m.source}\n`;
        });
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="parking_logs_${start_date}_to_${end_date}.csv"`);
        res.send(csv);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- AUTH ENDPOINTS ---
const getAuthParkings = async (req, res) => {
    try {
        const parkings = await mongoose.connection.db.collection('parkings').find({}, { projection: { name: 1, _id: 0 } }).toArray();
        res.json(parkings.filter(p => p.name).map(p => p.name));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const authLogin = async (req, res) => {
    try {
        const { parking_name, device_key } = req.body;
        const parking = await mongoose.connection.db.collection('parkings').findOne({ name: parking_name, deviceKey: device_key });
        if (parking) {
            await mongoose.connection.db.collection('facility_settings').updateOne(
                {}, 
                { $set: { facility_name: parking_name } }, 
                { upsert: true }
            );
            return res.json({ status: "success", message: "Authenticated" });
        }
        res.status(401).json({ detail: "Invalid Parking Name or Device Key" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- PRICING ENDPOINTS ---
const getPricing = async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const settings = await db.collection("facility_settings").findOne() || {};
        let targetParking;
        if (settings.facility_name) {
            targetParking = await db.collection("parkings").findOne({ name: settings.facility_name });
        }
        if (!targetParking) {
            targetParking = await db.collection("parkings").findOne() || {};
        }
        const parkingIdStr = targetParking._id ? targetParking._id.toString() : null;
        
        let plans = [];
        if (parkingIdStr) {
            plans = await db.collection('pricing_plans').find({ parkingId: parkingIdStr }).toArray();
            
            if (plans.length === 0) {
                const globalPlans = await db.collection('pricing_plans').find({ parkingId: { $exists: false } }).toArray();
                if (globalPlans.length > 0) {
                    const newPlans = globalPlans.map(p => {
                        const { _id, ...rest } = p;
                        return { ...rest, parkingId: parkingIdStr };
                    });
                    await db.collection('pricing_plans').insertMany(newPlans);
                    plans = await db.collection('pricing_plans').find({ parkingId: parkingIdStr }).toArray();
                } else {
                    const defaultPlans = [
                        { type: 'car', timeWindow: '0-2 hours', rate: 50, description: 'Base rate for first 2 hours', active: true, parkingId: parkingIdStr },
                        { type: 'bike', timeWindow: '0-2 hours', rate: 20, description: 'Base rate for first 2 hours', active: true, parkingId: parkingIdStr }
                    ];
                    await db.collection('pricing_plans').insertMany(defaultPlans);
                    plans = await db.collection('pricing_plans').find({ parkingId: parkingIdStr }).toArray();
                }
            }
        } else {
            plans = await db.collection('pricing_plans').find().toArray();
        }

        res.json(plans.map(p => ({...p, _id: p._id.toString()})));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updatePricing = async (req, res) => {
    try {
        const { plan_id } = req.params;
        const plan = req.body;
        await mongoose.connection.db.collection('pricing_plans').updateOne(
            { _id: new ObjectId(plan_id) },
            { $set: plan }
        );
        res.json({ status: "success" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- PROFILE ENDPOINTS ---
const getProfile = async (req, res) => {
    try {
        let settings = await mongoose.connection.db.collection('facility_settings').findOne() || {};
        let fac_name = settings.facility_name;
        
        let parking = null;
        if (fac_name) {
            parking = await mongoose.connection.db.collection('parkings').findOne({ name: fac_name });
        }
        if (!parking) {
            parking = await mongoose.connection.db.collection('parkings').findOne() || {};
        }

        let doc = parking ? { ...parking, _id: parking._id ? parking._id.toString() : '' } : {};
        doc.facility_name = doc.name;
        res.json(doc);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { _id, facility_name, ...profileData } = req.body;
        if (profileData.totalSlots) profileData.totalSlots = parseInt(profileData.totalSlots);
        if (profileData.availableSlots) profileData.availableSlots = parseInt(profileData.availableSlots);
        
        let settings = await mongoose.connection.db.collection('facility_settings').findOne() || {};
        let fac_name = settings.facility_name;
        
        if (fac_name) {
            await mongoose.connection.db.collection('parkings').updateOne({ name: fac_name }, { $set: profileData }, { upsert: true });
        }
        res.json({ status: "success" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getNotifications = async (req, res) => {
    res.json([
        { id: 101, title: "Gate 4 Sensor", message: "Gate 4 proximity sensor is showing intermittent connectivity.", type: "error", time: "10 mins ago" },
        { id: 102, title: "High Occupancy", message: "Facility has exceeded 80% occupancy.", type: "warning", time: "25 mins ago" },
        { id: 103, title: "Cleaning Schedule", message: "Level 3 maintenance will start at 22:00.", type: "info", time: "2 hours ago" }
    ]);
};

module.exports = {
    getDashboardStats,
    getLiveOccupancy,
    getBookingsToday,
    exportBookings: exports.exportBookings,
    getAuthParkings,
    authLogin,
    getPricing,
    updatePricing,
    getProfile,
    updateProfile,
    getNotifications
};
