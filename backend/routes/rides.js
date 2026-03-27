const express = require('express');
const router = express.Router();
const { loadCSV } = require('../services/dataloader.js');

// helper functions
function parseCapacity(value) {
    if (!value) return null;
    return parseInt(value.replace('+', ''));
}

function parseCycleTime(value) {
    if (!value || value === "Continuous") return null;
    return parseFloat(value);
}

// GET /rides
router.get('/', async (req, res) => {
    try {
        const metaData = await loadCSV('ride_metadata.csv');
        const layoutData = await loadCSV('waterpark_layout.csv');

        if (!metaData || !layoutData) {
            return res.status(500).json({ error: "Datasets not loaded" });
        }

        // Create layout map
        const layoutMap = {};
        layoutData.forEach(row => {
            layoutMap[row.ride_id] = row;
        });

        // Merge datasets
        const result = metaData.map(meta => {
            const layout = layoutMap[meta.ride_id];

            if (!layout) return null;

            return {
                ride_id: meta.ride_id,
                name: meta.name,
                category: meta.category,
                zone: layout.zone,

                x_coordinate: parseFloat(layout.x_coordinate),
                y_coordinate: parseFloat(layout.y_coordinate),

                capacity_per_cycle: parseCapacity(meta.capacity_per_cycle),
                cycle_time_min: parseCycleTime(meta.cycle_time_min),

                popularity_score: parseFloat(meta.popularity_score),
                min_age: meta.min_age,
                intensity_level: parseInt(meta.intensity_level)
            };
        }).filter(Boolean);

        res.json({ data: result });

    } catch (error) {
        console.error("Error loading rides:", error);
        res.status(500).json({ error: "Failed to load rides data" });
    }
});

module.exports = router;