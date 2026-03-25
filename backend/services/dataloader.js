const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// In-memory cache to store parsed CSV data
const cache = {};

const loadCSV = (fileName) => {
    return new Promise((resolve, reject) => {
        // If data is already loaded in memory, return it instantly
        if (cache[fileName]) {
            return resolve(cache[fileName]);
        }

        const results = [];
        const filePath = path.join(__dirname, '../datasets', fileName);

        // Stream and parse the CSV
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
                // Save to cache after the first load
                cache[fileName] = results;
                resolve(results);
            })
            .on('error', (err) => reject(err));
    });
};

module.exports = { loadCSV };