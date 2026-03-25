const express = require('express');
const router = express.Router();
const { getWaitTimes } = require('../services/waitTimeService');

// GET /wait-times
router.get('/', (req, res) => {
    try {
        // Fetch the live, in-memory calculated wait times
        const liveData = getWaitTimes();
        
        if (!liveData || Object.keys(liveData).length === 0) {
            return res.status(503).json({ message: "Wait time service is still initializing." });
        }

        // Convert the object map back into an array for the frontend
        const result = Object.entries(liveData).map(([ride_id, data]) => ({
            ride_id: ride_id,
            actual_wait_time: data.wait_time,
            last_updated: data.last_updated
        }));

        res.json({
            status: "success",
            data: result
        });
    } catch (error) {
        console.error("Error serving wait times:", error);
        res.status(500).json({ error: "Failed to retrieve live wait times." });
    }
});

module.exports = router;