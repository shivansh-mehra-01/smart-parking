const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const db = mongoose.connection.db;
    
    // Create DB City Mall Parking if it doesn't exist
    await db.collection('parkings').updateOne(
        { name: 'DB City Mall Parking' },
        { $setOnInsert: { name: 'DB City Mall Parking', address: 'DB City Mall, Bhopal, MP', totalSlots: 500, availableSlots: 500 } },
        { upsert: true }
    );
    
    const parking = await db.collection('parkings').findOne({ name: 'DB City Mall Parking' });
    console.log(`Parking Found/Created: ${parking.name} (${parking._id})`);

    // Find how many legacy cars are inside
    const insideLogs = await db.collection('parking_log').find({ status: 'inside' }).toArray();
    const insideCount = insideLogs.length;
    
    console.log(`Found ${insideCount} cars currently inside the facility without designated parkingId.`);

    // Attach parkingId to legacy logs
    if (insideCount > 0) {
        await db.collection('parking_log').updateMany(
            { status: 'inside' },
            { $set: { parkingId: parking._id.toString() } }
        );
        console.log(`Updated legacy cars to belong to DB City Mall Parking.`);
    }

    // Update active available slots accurately
    const available = Math.max(0, parking.totalSlots - insideCount);
    await db.collection('parkings').updateOne(
        { _id: parking._id },
        { $set: { availableSlots: available } }
    );
    console.log(`Set DB City Mall availableSlots to ${available} (Out of ${parking.totalSlots})`);

    // Set DB City Mall as the globally active dashboard parking facility
    await db.collection('facility_settings').updateOne(
        {},
        { $set: { facility_name: 'DB City Mall Parking', total_capacity: parking.totalSlots } },
        { upsert: true }
    );
    console.log(`Set dashboard facility_settings active view to DB City Mall Parking.`);

    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
