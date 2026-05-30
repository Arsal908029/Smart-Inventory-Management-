const mongoose = require('mongoose');

// @desc    Get sharding status
// @route   GET /sharding/status
const getShardStatus = async (req, res) => {
    try {
        let stats = {};
        let isSharded = false;
        
        try {
            // Attempt to get db stats which includes sharding info if sharded
            stats = await mongoose.connection.db.stats();
            
            // Check if collection is sharded
            const collStats = await mongoose.connection.db.command({ collStats: 'products' });
            if (collStats.sharded) {
                isSharded = true;
                stats.shards = collStats.shards;
            }
        } catch (dbErr) {
            console.error('Error fetching deep stats:', dbErr.message);
            // Fallback for non-sharded or restricted environments (like Atlas Free Tier)
            stats = {
                db: mongoose.connection.db.databaseName,
                collections: Object.keys(mongoose.connection.collections).length,
                dataSize: 1024 * 1024 * 5, // Mock 5MB
                storageSize: 1024 * 1024 * 10, // Mock 10MB
                indexes: 12,
                ok: 1
            };
            isMocked = true;
        }
            
        res.render('sharding/index', {
            title: 'Database & Sharding Status',
            stats,
            isSharded,
            isMocked: typeof isMocked !== 'undefined' ? isMocked : false
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('errors/500', { title: 'Server Error' });
    }
};

const User = require('../models/User');

// @desc    Run 100+ document insertion test
// @route   POST /sharding/test-insert
const testInsert = async (req, res) => {
    try {
        const testUsers = [];
        for(let i=0; i<150; i++) {
            testUsers.push({
                name: `Test User ${i}`,
                email: `testuser${Date.now()}_${i}@example.com`,
                password: 'password123',
                role: 'staff'
            });
        }
        await User.insertMany(testUsers);
        // We can't run getShardDistribution() directly via node driver easily,
        // but we simulated the insertion successfully.
        res.redirect('/sharding/status');
    } catch(err) {
        console.error(err);
        res.status(500).send('Error inserting test data');
    }
}

module.exports = {
    getShardStatus,
    testInsert
};
