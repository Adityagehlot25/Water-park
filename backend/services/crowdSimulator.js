const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const UPDATE_INTERVAL_MS = 5000; 
const MAX_QUEUE_SIZE = 300;      
const MIN_QUEUE_SIZE = 0;        

/**
 * Single Source of Truth State
 * {
 * timestamp: "2026-03-25T10:05:00.000Z",
 * rides: { "AQ01": { people_in_queue: 45, crowd_level: 0.15 }, ... }
 * }
 */
let liveState = {
    timestamp: null,
    rides: {}
};

// Optional callback to trigger other services (like wait times) on the exact same tick
let onTickCallback = null;

const getTimeOfDayMultiplier = (dateObj) => {
    const hour = dateObj.getHours();
    if (hour < 12) return 0.4 + ((hour - 10) * 0.2); 
    if (hour >= 12 && hour < 17) return 1.2;
    if (hour >= 17 && hour < 20) return 0.8;
    return 0.3;
};

const calculateCrowdLevel = (queueSize) => {
    const level = queueSize / MAX_QUEUE_SIZE;
    return Math.min(Math.max(level, 0), 1);
};

const updateCrowd = () => {
    const now = new Date();
    const timeMultiplier = getTimeOfDayMultiplier(now);

    // Update the single master timestamp
    liveState.timestamp = now.toISOString();

    for (const rideId in liveState.rides) {
        const ride = liveState.rides[rideId];
        
        let fluctuation = Math.floor(Math.random() * 16) - 5; 
        
        if (timeMultiplier > 1.0) {
            fluctuation += Math.floor(Math.random() * 5); 
        } else if (timeMultiplier < 0.6) {
            fluctuation -= Math.floor(Math.random() * 8); 
        }

        let newQueueSize = ride.people_in_queue + fluctuation;
        newQueueSize = Math.max(MIN_QUEUE_SIZE, Math.min(newQueueSize, MAX_QUEUE_SIZE));

        liveState.rides[rideId] = {
            people_in_queue: newQueueSize,
            crowd_level: Number(calculateCrowdLevel(newQueueSize).toFixed(3))
        };
    }
    
    // Trigger the synchronous update for dependent services (Wait Times)
    if (onTickCallback) {
        onTickCallback(liveState);
    }
};

const getCrowdData = () => {
    return liveState;
};

/**
 * Initializes the simulator. Accepts a callback to run after every crowd update.
 */
const initCrowdSimulator = (tickCallback) => {
    return new Promise((resolve, reject) => {
        console.log("🌊 Initializing Crowd Simulator...");
        
        onTickCallback = tickCallback; // Register the callback
        const filePath = path.join(__dirname, '../datasets/waterpark_crowd_simulation.csv');
        const rows = [];

        if (!fs.existsSync(filePath)) {
            return reject(new Error(`Dataset not found at ${filePath}`));
        }

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => rows.push(data))
            .on('end', () => {
                if (rows.length === 0) return reject(new Error("CSV is empty."));

                const latestTimestamp = rows.reduce((max, row) => 
                    row.timestamp > max ? row.timestamp : max, rows[0].timestamp
                );

                const latestData = rows.filter(row => row.timestamp === latestTimestamp);

                // Set initial master timestamp
                liveState.timestamp = new Date().toISOString(); 
                
                latestData.forEach(row => {
                    liveState.rides[row.ride_id] = {
                        people_in_queue: parseInt(row.people_in_queue, 10) || 0,
                        crowd_level: parseFloat(row.crowd_level) || 0.0
                    };
                });

                console.log(`✅ Loaded initial state for ${Object.keys(liveState.rides).length} rides.`);
                
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