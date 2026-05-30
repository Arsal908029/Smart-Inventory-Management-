const mongoose = require('mongoose');
const User = require('../models/User');
const TransactionLog = require('../models/TransactionLog');
const Product = require('../models/Product');
const StockHistory = require('../models/StockHistory');

// --- Connection Module ---
exports.getConnectionStatus = (req, res) => {
    const states = {
        0: 'Disconnected',
        1: 'Connected',
        2: 'Connecting',
        3: 'Disconnecting',
        99: 'Uninitialized'
    };
    const state = mongoose.connection.readyState;
    
    res.render('dbAdmin/connection', {
        title: 'Database Connection',
        status: states[state] || 'Unknown',
        host: mongoose.connection.host || 'N/A',
        name: mongoose.connection.name || 'N/A',
        port: mongoose.connection.port || 'N/A'
    });
};

// --- Index Management ---
exports.getIndexes = async (req, res) => {
    try {
        const collections = await mongoose.connection.db.collections();
        const indexesData = [];

        for (let collection of collections) {
            const indexes = await collection.indexes();
            indexes.forEach(index => {
                indexesData.push({
                    collection: collection.collectionName,
                    name: index.name,
                    keys: JSON.stringify(index.key)
                });
            });
        }

        res.render('dbAdmin/indexes', {
            title: 'Index Management',
            indexes: indexesData
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching indexes');
    }
};

exports.createIndex = async (req, res) => {
    try {
        const { collectionName, fieldName, indexType } = req.body;
        const collection = mongoose.connection.db.collection(collectionName);
        
        let indexSpec = {};
        indexSpec[fieldName] = indexType === 'hashed' ? 'hashed' : 1;
        
        await collection.createIndex(indexSpec);
        res.redirect('/dbadmin/indexes');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error creating index');
    }
};

exports.dropIndex = async (req, res) => {
    try {
        const { collectionName, indexName } = req.body;
        const collection = mongoose.connection.db.collection(collectionName);
        
        await collection.dropIndex(indexName);
        res.redirect('/dbadmin/indexes');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error dropping index');
    }
};

// --- Transaction Demo ---
exports.getTransactionsDemo = async (req, res) => {
    const users = await User.find().limit(5);
    res.render('dbAdmin/transactions', {
        title: 'Transaction Demo',
        users,
        error: null,
        success: null
    });
};

// Demo: Multi-Collection Transfer Points
exports.transferPoints = async (req, res) => {
    const { senderId, receiverId, points, simulateError } = req.body;
    const session = await mongoose.startSession();
    
    try {
        session.startTransaction();
        const transferAmount = parseInt(points, 10);
        
        // 1. Deduct from sender
        const sender = await User.findById(senderId).session(session);
        if (!sender) throw new Error("Sender not found");
        if (sender.points < transferAmount) throw new Error("Insufficient points");
        
        sender.points -= transferAmount;
        await sender.save({ session });
        
        // Simulating a random failure if requested
        if (simulateError === 'true') {
            throw new Error("Simulated failure during transaction! Rolling back...");
        }

        // 2. Add to receiver
        const receiver = await User.findById(receiverId).session(session);
        if (!receiver) throw new Error("Receiver not found");
        
        receiver.points += transferAmount;
        await receiver.save({ session });
        
        // 3. Log transaction
        await TransactionLog.create([{
            transactionId: 'TRX-' + Date.now(),
            type: 'adjustment',
            totalAmount: transferAmount,
            reference: receiverId,
            status: 'completed',
            performedBy: senderId,
            notes: `Transfer ${transferAmount} points`
        }], { session });

        await session.commitTransaction();
        session.endSession();
        
        const users = await User.find().limit(5);
        res.render('dbAdmin/transactions', {
            title: 'Transaction Demo',
            users,
            error: null,
            success: 'Transaction Committed Successfully!'
        });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        
        const users = await User.find().limit(5);
        res.render('dbAdmin/transactions', {
            title: 'Transaction Demo',
            users,
            error: `Transaction Aborted: ${err.message}`,
            success: null
        });
    }
};

// --- Sharding Demo ---
exports.getShardingInfo = async (req, res) => {
    try {
        let shardingStatus = "Unable to fetch sharding status from non-admin role.";
        let isSharded = false;

        try {
            const adminDb = mongoose.connection.db.admin();
            const result = await adminDb.command({ listShards: 1 });
            if(result.ok) {
                isSharded = true;
                shardingStatus = JSON.stringify(result.shards, null, 2);
            }
        } catch (e) {
            shardingStatus = e.message;
        }

        res.render('dbAdmin/sharding', {
            title: 'Sharding Management',
            shardingStatus,
            isSharded
        });
    } catch (err) {
        res.status(500).send('Error accessing sharding info');
    }
};

// --- Concurrent Transaction Test ---
exports.concurrentTransactionTest = async (req, res) => {
    try {
        const product = await Product.findOne({ status: 'active', quantity: { $gt: 10 } });
        if (!product) {
            const users = await User.find().limit(5);
            return res.render('dbAdmin/transactions', {
                title: 'Transaction Demo',
                users,
                error: 'No product with sufficient stock available to run concurrent test. Add stock to a product first.',
                success: null
            });
        }
        
        const productId = product._id;
        
        const runTxn = async (name, qtyDeduct, delayMs) => {
            const session = await mongoose.startSession();
            session.startTransaction();
            try {
                if (delayMs) await new Promise(r => setTimeout(r, delayMs));
                
                const p = await Product.findById(productId).session(session);
                p.quantity -= qtyDeduct;
                await p.save({ session });
                
                await StockHistory.create([{
                    product: productId,
                    quantity: -qtyDeduct,
                    type: 'adjustment',
                    performedBy: req.session.user.id,
                    notes: `Concurrent Test: ${name}`
                }], { session });
                
                await session.commitTransaction();
                return `${name}: SUCCESS`;
            } catch (err) {
                await session.abortTransaction();
                return `${name}: ABORTED (${err.message.includes('WriteConflict') ? 'WriteConflict caught' : err.message})`;
            } finally {
                session.endSession();
            }
        };

        // Run both at exactly the same time using Promise.all
        // Txn A will start, delay slightly, save.
        // Txn B will start, delay slightly more, and attempt to save the same document.
        // MongoDB will throw a WriteConflict error for one of them to guarantee Snapshot Isolation.
        const results = await Promise.all([
            runTxn('Transaction A', 5, 0),
            runTxn('Transaction B', 3, 50)
        ]);
        
        const users = await User.find().limit(5);
        res.render('dbAdmin/transactions', {
            title: 'Transaction Demo',
            users,
            error: null,
            success: `Concurrent Test Complete! Result 1: [${results[0]}] | Result 2: [${results[1]}]`
        });
        
    } catch (e) {
        console.error(e);
        res.status(500).send('Error running concurrent test');
    }
};

// --- Replica Set Status ---
exports.getReplSetStatus = async (req, res) => {
    let replStatus = "Unable to fetch Replica Set status. Are you connected to a Replica Set?";
    let isReplicaSet = false;

    try {
        const adminDb = mongoose.connection.db.admin();
        const result = await adminDb.command({ replSetGetStatus: 1 });
        if (result.ok) {
            isReplicaSet = true;
            replStatus = JSON.stringify(result, null, 2);
        }
    } catch (e) {
        replStatus = e.message;
    }

    res.render('dbAdmin/replset', {
        title: 'Replica Set Status',
        replStatus,
        isReplicaSet
    });
};
