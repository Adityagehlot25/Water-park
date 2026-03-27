const { loadCSV } = require('./dataloader');

const MAX_WAIT_TIME_MINS = 120;  
const MIN_WAIT_TIME_MINS = 0;    

let rideMetadataCache = {};

/**
 * Stores the calculated wait times.
 * Structure: 
 * {
 * timestamp: "2026-03-25T10:05:00.000Z",
 * rides: { "AQ01": { wait_time: 15.5 }, ... }
 * }
 */
let liveWaitTimesState = {
    timestamp: null,
    rides: {}
};

const addWaitTimeNoise = (baseWaitTime) => {
    if (baseWaitTime <= 0) return 0;
    const noise = (Math.random() * 4) - 2;
    return baseWaitTime + noise;
};

/**
 * Calculates wait times based on the EXACT snapshot provided by the Crowd Simulator.
 * This guarantees perfect synchronization.
 * * @param {Object} liveCrowdSnapshot - { timestamp: "...", rides: { ... } }
 */
const calculateWaitTimes = (liveCrowdSnapshot) => {
    if (Object.keys(rideMetadataCache).length === 0) return;

    // Inherit the exact timestamp from the crowd simulator
    liveWaitTimesState.timestamp = liveCrowdSnapshot.timestamp;

    console.log(`[SYNC DEBUG] Crowd T: ${liveCrowdSnapshot.timestamp} | Wait T: ${liveWaitTimesState.timestamp}`);

    for (const rideId in liveCrowdSnapshot.rides) {
        const crowdData = liveCrowdSnapshot.rides[rideId];
        const rideMeta = rideMetadataCache[rideId];

        if (!rideMeta) continue;

        const peopleInQueue = crowdData.people_in_queue || 0;
        const capacity = rideMeta.capacity;
        const cycleTime = rideMeta.cycle_time;

        if (capacity <= 0) {
            liveWaitTimesState.rides[rideId] = { wait_time: 0 };
            continue;
        }

        const baseWaitTime = (peopleInQueue / capacity) * cycleTime;
        let finalWaitTime = addWaitTimeNoise(baseWaitTime);
        finalWaitTime = Math.max(MIN_WAIT_TIME_MINS, Math.min(finalWaitTime, MAX_WAIT_TIME_MINS));

        // Update state
        liveWaitTimesState.rides[rideId] = {
            wait_time: Number(finalWaitTime.toFixed(2))
        };
    }
};

const getWaitTimes = () => {
    return liveWaitTimesState;
};

const initWaitTimeService = async () => {
    try {
        console.log("⏳ Initializing Wait Time Metadata...");
        
        const ridesData = await loadCSV('waterpark_wait_time_dataset.csv');
        
        if (!ridesData || ridesData.length === 0) {
            throw new Error("No data found in ride metadata CSV.");
        }

        ridesData.forEach(row => {
            if (!rideMetadataCache[row.ride_id]) {
                rideMetadataCache[row.ride_id] = {
                    capacity: parseInt(row.capacity_per_cycle || row.capacity, 10) || 10,
                    cycle_time: parseFloat(row.cycle_time_min || row.cycle_time) || 2.0 
                };
            }
        });

        console.log(`✅ Cached static metadata for ${Object.keys(rideMetadataCache).length} rides.`);
        // NOTE: No setInterval here! We wait for crowdSimulator to trigger us.

    } catch (error) {
        console.error("❌ Failed to initialize Wait Time Service:", error);
        throw error;
    }
};

module.exports = {
    initWaitTimeService,
    getWaitTimes,
    calculateWaitTimes 
};