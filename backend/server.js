const express = require('express');
const cors = require('cors');
const { initCrowdSimulator } = require('./services/crowdSimulator');
const { initWaitTimeService } = require('./services/waitTimeService'); // <-- IMPORT NEW SERVICE

// Import Routes
const ridesRouter = require('./routes/rides');
const crowdRouter = require('./routes/crowd');
const waitTimesRouter = require('./routes/waitTimes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mount Routes
app.use('/rides', ridesRouter);
app.use('/crowd', crowdRouter);
app.use('/wait-times', waitTimesRouter);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("Global Server Error:", err.stack);
    res.status(500).json({ error: 'Internal Server Error!' });
});

const PORT = process.env.PORT || 5000;

// Boot Sequence: Start Simulators sequentially, then open the API port
const bootServer = async () => {
    try {
        await initCrowdSimulator();
        await initWaitTimeService(); // <-- START NEW SERVICE
        
        app.listen(PORT, () => {
            console.log(`\n🌊 Water Park Backend is live on http://localhost:${PORT}`);
            console.log(`- Layout Data:     http://localhost:${PORT}/rides`);
            console.log(`- Live Crowd Data: http://localhost:${PORT}/crowd`);
            console.log(`- Live Wait Times: http://localhost:${PORT}/wait-times`);
        });
    } catch (err) {
        console.error("🔥 Critical failure during server boot sequence:", err);
        process.exit(1); 
    }
};

bootServer();