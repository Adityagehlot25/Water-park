const { loadCSV } = require('./dataloader');
const { getCrowdData } = require('./crowdSimulator');

// ---------------------------------------------------------
// Configuration & Constants
// ---------------------------------------------------------
const UPDATE_INTERVAL_MS = 5000; // Update every 5 seconds (sync with crowdSimulator)
const MAX_WAIT_TIME_MINS = 120;  // Hard cap on wait times
const MIN_WAIT_TIME_MINS = 0;    // Floor for wait times

// ---------------------------------------------------------
// In-Memory State
// ---------------------------------------------------------
/**
 * Stores static ride metadata loaded from CSV to prevent constant disk I/O.
 * Structure: { "AQ01": { capacity: 10, cycle_time: 2.5 }, ... }
 */
let rideMetadataCache = {};

/**
 * Stores the live calculated wait times.
 * Structure: { "AQ01": { wait_time: 15.5, last_updated: "2026-03-25T10:05:00.000Z" }, ... }
 */
let liveWaitTimesState = {};

// ---------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------

/**
 * Adds a small amount of realistic noise to the calculated wait time.
 * Real park queues are rarely perfectly mathematical due to loading/unloading friction.
 * * @param {number} baseWaitTime - The mathematically calculated wait time
 * @returns {number} - Wait time with +/- 1 to 2 minutes of noise
 */
const addWaitTimeNoise = (baseWaitTime) => {
    // Only add noise if there is an actual queue
    if (baseWaitTime <= 0) return 0;
    
    // Generate noise between -2.0 and +2.0 minutes
    const noise = (Math.random() * 4) - 2;
    return baseWaitTime + noise;
};

// ---------------------------------------------------------
// Core Logic
// ---------------------------------------------------------

/**
 * Computes wait times for all rides based on current crowd data and static capabilities.
 * Modifies the in-memory `liveWaitTimesState` object.
 */
const calculateWaitTimes = () => {
    const liveCrowd = getCrowdData();
    const now = new Date().toISOString();

    // Ensure we have metadata loaded before trying to calculate
    if (Object.keys(rideMetadataCache).length === 0) {
        console.warn("⚠️ Cannot calculate wait times: Ride metadata not yet loaded.");
        return;
    }

    for (const rideId in liveCrowd) {
        const crowdData = liveCrowd[rideId];
        const rideMeta = rideMetadataCache[rideId];

        // Failsafe: If a ride exists in crowd data but not metadata, skip it
        if (!rideMeta) continue;

        const peopleInQueue = crowdData.people_in_queue || 0;
        const capacity = rideMeta.capacity;
        const cycleTime = rideMeta.cycle_time;

        // Failsafe: Prevent division by zero
        if (capacity <= 0) {
            console.error(`🚨 Ride ${rideId} has 0 or invalid capacity! Cannot calculate wait time.`);
            liveWaitTimesState[rideId] = { wait_time: 0, last_updated: now };
            continue;
        }

        // 1. Core Mathematical Calculation
        // wait_time = (people / capacity_per_cycle) * cycle_time
        // Note: Math.ceil is used because if you have 11 people and capacity is 10, 
        // that's 2 cycles required to clear the queue, not 1.1 cycles.
        const cyclesRequired = Math.ceil(peopleInQueue / capacity);
        let baseWaitTime = cyclesRequired * cycleTime;

        // 2. Apply Noise
        let finalWaitTime = addWaitTimeNoise(baseWaitTime);

        // 3. Clamp to Boundaries (0 to 120 mins) and format to 2 decimal places
        finalWaitTime = Math.max(MIN_WAIT_TIME_MINS, Math.min(finalWaitTime, MAX_WAIT_TIME_MINS));

        // 4. Update State
        liveWaitTimesState[rideId] = {
            wait_time: Number(finalWaitTime.toFixed(2)),
            last_updated: now
        };
    }
    
    // Optional debug log
    // console.log(`[${now}] Wait times updated for ${Object.keys(liveWaitTimesState).length} rides.`);
};

// ---------------------------------------------------------
// Initialization & Exports
// ---------------------------------------------------------

/**
 * Returns the current in-memory wait times state.
 * @returns {Object} - The liveWaitTimesState object
 */
const getWaitTimes = () => {
    return liveWaitTimesState;
};

/**
 * Initializes the service by pre-loading ride metadata from the dataset
 * and starting the continuous calculation loop.
 */
const initWaitTimeService = async () => {
    try {
        console.log("⏳ Initializing Wait Time Service...");
        
        // We use the dataset you generated in the very first prompt 
        // that contains capacity_per_cycle and cycle_time_min
        const ridesData = await loadCSV('waterpark_wait_time_dataset.csv');
        
        if (!ridesData || ridesData.length === 0) {
            throw new Error("No data found in ride metadata CSV.");
        }

        // Build the fast-lookup cache map
        // We just need one entry per ride to get its static capabilities
        ridesData.forEach(row => {
            if (!rideMetadataCache[row.ride_id]) {
                rideMetadataCache[row.ride_id] = {
                    capacity: parseInt(row.capacity_per_cycle, 10) || 1,
                    cycle_time: parseFloat(row.cycle_time) || 1.0
                };
            }
        });

        console.log(`✅ Cached static metadata for ${Object.keys(rideMetadataCache).length} rides.`);

        // Run the first calculation immediately
        calculateWaitTimes();

        // Start the continuous polling loop
        setInterval(calculateWaitTimes, UPDATE_INTERVAL_MS);
        console.log(`⏱️  Wait Time calculation loop started. Updating every ${UPDATE_INTERVAL_MS / 1000} seconds.`);

    } catch (error) {
        console.error("❌ Failed to initialize Wait Time Service:", error);
        throw error;
    }
};

module.exports = {
    initWaitTimeService,
    getWaitTimes,
    calculateWaitTimes // Exported for testing/manual triggering if needed
};