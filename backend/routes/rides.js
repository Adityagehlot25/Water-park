const express = require('express');
const router = express.Router();
const { loadCSV } = require('../services/dataloader.js');
    
// GET /rides

// GET /wait-times
router.get('/', async (req, res) => {
    try {
        const data = await loadCSV('waterpark_wait_time_dataset.csv');
        
        if (!data || data.length === 0) {
            return res.status(404).json({ message: "No wait time data available." });
        }

        // Find the maximum (latest) timestamp
        const latestTimestamp = data.reduce((max, row) => 
            row.timestamp > max ? row.timestamp : max, data[0].timestamp
        );

        // Filter to latest timestamp rows
        const latestData = data.filter(row => row.timestamp === latestTimestamp);

        // Map requested fields
        const result = latestData.map(row => ({
            ride_id: row.ride_id,
            actual_wait_time: parseFloat(row.actual_wait_time)
        }));

        res.json({
            timestamp: latestTimestamp,
            data: result
        });
    } catch (error) {
        console.error("Error loading wait time data:", error);
        res.status(500).json({ error: "Failed to load wait time dataset." });
    }
});

module.exports = router;