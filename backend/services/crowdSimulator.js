const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// ---------------------------------------------------------
// Configuration & Constants
// ---------------------------------------------------------
const UPDATE_INTERVAL_MS = 5000; // Update every 5 seconds
const MAX_QUEUE_SIZE = 300;      // Hard cap on queue size
const MIN_QUEUE_SIZE = 0;        // Floor for queue size

// ---------------------------------------------------------
// In-Memory State
// ---------------------------------------------------------
/**
 * Stores the live crowd data.
 * Structure:
 * {
 * "AQ01": { people_in_queue: 45, crowd_level: 0.15, last_updated: "2026-03-25T10:05:00.000Z" },
 * ...
 * }
 */
let liveCrowdState = {};

// ---------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------

/**
 * Calculates a time-based multiplier to simulate daily crowd curves.
 * Assumes the park is open from 10:00 to 22:00.
 * * @param {Date} dateObj - The current simulation time
 * @returns {number} - A multiplier usually between 0.3 and 1.2
 */
const getTimeOfDayMultiplier = (dateObj) => {
    const hour = dateObj.getHours();
    
    if (hour < 12) {
        // Morning: Lower crowds, steadily increasing
        return 0.4 + ((hour - 10) * 0.2); 
    } else if (hour >= 12 && hour < 17) {
        // Afternoon: Peak crowds
        return 1.2;
    } else if (hour >= 17 && hour < 20) {
        // Evening: Crowds tapering off
        return 0.8;
    } else {
        // Night: Park emptying out
        return 0.3;
    }
};

/**
 * Normalizes the queue size into a 0.0 to 1.0 crowd level.
 * * @param {number} queueSize - Current people in queue
 * @returns {number} - Crowd level rounded to 3 decimal places
 */
const calculateCrowdLevel = (queueSize) => {
    // Simple linear normalization based on the MAX_QUEUE_SIZE
    const level = queueSize / MAX_QUEUE_SIZE;
    return Math.min(Math.max(level, 0), 1); // Clamp between 0 and 1
};

/**
 * The core simulation logic. Modifies the in-memory state for all rides.
 */
const updateCrowd = () => {
    const now = new Date();
    const timeMultiplier = getTimeOfDayMultiplier(now);

    for (const rideId in liveCrowdState) {
        const ride = liveCrowdState[rideId];
        
        // 1. Calculate a base fluctuation (-5 to +10)
        // We skew it slightly positive to allow queues to build, 
        // relying on the timeMultiplier to pull it down later.
        let fluctuation = Math.floor(Math.random() * 16) - 5; 
        
        // 2. Apply the time-of-day pressure
        // If it's peak time, queues tend to grow faster. 
        // If it's closing time, queues tend to shrink.
        if (timeMultiplier > 1.0) {
            fluctuation += Math.floor(Math.random() * 5); // Boost growth
        } else if (timeMultiplier < 0.6) {
            fluctuation -= Math.floor(Math.random() * 8); // Force shrinkage
        }

        // 3. Apply fluctuation and clamp to realistic boundaries
        let newQueueSize = ride.people_in_queue + fluctuation;
        newQueueSize = Math.max(MIN_QUEUE_SIZE, Math.min(newQueueSize, MAX_QUEUE_SIZE));

        // 4. Update the in-memory state
        liveCrowdState[rideId] = {
            people_in_queue: newQueueSize,
            crowd_level: Number(calculateCrowdLevel(newQueueSize).toFixed(3)),
            last_updated: now.toISOString()
        };
    }
    
    // Optional: Log to console to verify it's running (comment out in production)
    // console.log(`[${now.toISOString()}] Crowd state updated for ${Object.keys(liveCrowdState).length} rides.`);
};


// ---------------------------------------------------------
// Main Exported Functions
// ---------------------------------------------------------

/**
 * Returns the current in-memory crowd state.
 * This is the function your Express API routes will call.
 * * @returns {Object} - The liveCrowdState object
 */
const getCrowdData = () => {
    return liveCrowdState;
};

/**
 * Initializes the simulator by reading the latest state from the CSV,
 * loading it into memory, and starting the update interval.
 */
const initCrowdSimulator = () => {
    return new Promise((resolve, reject) => {
        console.log("🌊 Initializing Crowd Simulator...");
        
        const filePath = path.join(__dirname, '../datasets/waterpark_crowd_simulation.csv');
        const rows = [];

        // Check if file exists to prevent hard crashes
        if (!fs.existsSync(filePath)) {
            return reject(new Error(`Dataset not found at ${filePath}`));
        }

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => rows.push(data))
            .on('end', () => {
                if (rows.length === 0) {
                    return reject(new Error("CSV is empty."));
                }

                // 1. Find the latest timestamp in the dataset to use as our starting point
                const latestTimestamp = rows.reduce((max, row) => 
                    row.timestamp > max ? row.timestamp : max, rows[0].timestamp
                );

                // 2. Filter the rows to only get the data from that final timestamp
                const latestData = rows.filter(row => row.timestamp === latestTimestamp);

                // 3. Populate the initial in-memory state
                latestData.forEach(row => {
                    liveCrowdState[row.ride_id] = {
                        people_in_queue: parseInt(row.people_in_queue, 10) || 0,
                        crowd_level: parseFloat(row.crowd_level) || 0.0,
                        last_updated: new Date().toISOString() // Set to actual server startup time
                    };
                });

                console.log(`✅ Loaded initial state for ${Object.keys(liveCrowdState).length} rides.`);
                
                // 4. Start the continuous simulation loop
                setInterval(updateCrowd, UPDATE_INTERVAL_MS);
                console.log(`⏱️  Simulation loop started. Updating every ${UPDATE_INTERVAL_MS / 1000} seconds.`);
                
                resolve();
            })
            .on('error', (err) => reject(err));
    });
};

module.exports = {
    initCrowdSimulator,
    getCrowdData
};