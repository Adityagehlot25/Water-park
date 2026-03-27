const express = require('express');
const router = express.Router();
const { getWaitTimes } = require('../services/waitTimeService');

router.get('/', (req, res) => {
    try {
        const state = getWaitTimes();
        
        if (!state.timestamp) {
            return res.status(503).json({ message: "Wait time service is still initializing." });
        }

        const result = Object.entries(state.rides).map(([rideId, data]) => ({
            ride_id: rideId,
            actual_wait_time: data.wait_time
        }));

        res.json({
            timestamp: state.timestamp,
            data: result
        });
    } catch (error) {
        console.error("Error serving wait times:", error);
        res.status(500).json({ error: "Failed to retrieve live wait times." });
    }
});

module.exports = router;