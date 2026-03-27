const express = require('express');
const router = express.Router();
const { getCrowdData } = require('../services/crowdSimulator');

router.get('/', (req, res) => {
    try {
        const state = getCrowdData();
        
        if (!state.timestamp) {
            return res.status(503).json({ message: "Crowd service is still initializing." });
        }

        const result = Object.entries(state.rides).map(([rideId, data]) => ({
            ride_id: rideId,
            people_in_queue: data.people_in_queue,
            crowd_level: data.crowd_level
        }));

        res.json({
            timestamp: state.timestamp,
            data: result
        });
    } catch (error) {
        console.error("Error serving crowd data:", error);
        res.status(500).json({ error: "Failed to retrieve live crowd data." });
    }
});

module.exports = router;