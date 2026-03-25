const express = require('express');
const router = express.Router();
const { loadCSV } = require('../services/dataloader');

// GET /crowd
router.get('/', async (req, res) => {
    try {
        const data = await loadCSV('waterpark_crowd_simulation.csv');
        
        if (!data || data.length === 0) {
            return res.status(404).json({ message: "No crowd data available." });
        }

        // Find the maximum (latest) timestamp
        // String comparison works perfectly for standard chronological datetimes
        const latestTimestamp = data.reduce((max, row) => 
            row.timestamp > max ? row.timestamp : max, data[0].timestamp
        );

        // Filter the dataset to only include rows matching the latest timestamp
        const latestData = data.filter(row => row.timestamp === latestTimestamp);

        // Map requested fields
        const result = latestData.map(row => ({
            ride_id: row.ride_id,
            people_in_queue: parseInt(row.people_in_queue, 10),
            crowd_level: parseFloat(row.crowd_level)
        }));

        // Return the timestamp as well to help the frontend display the "Last Updated" time
        res.json({
            timestamp: latestTimestamp,
            data: result
        });
    } catch (error) {
        console.error("Error loading crowd data:", error);
        res.status(500).json({ error: "Failed to load crowd simulation data." });
    }
});

module.exports = router;