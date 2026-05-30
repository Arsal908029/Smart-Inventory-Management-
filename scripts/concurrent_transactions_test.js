require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const transferPoints = async (senderId, receiverId, points) => {
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

        // 2. Add to receiver
        const receiver = await User.findById(receiverId).session(session);
        if (!receiver) throw new Error("Receiver not found");
        
        receiver.points += transferAmount;
        await receiver.save({ session });

        await session.commitTransaction();
        console.log(`Successfully transferred ${points} from ${senderId} to ${receiverId}`);
    } catch (err) {
        await session.abortTransaction();
        console.error(`Transaction Aborted for ${senderId} -> ${receiverId}: ${err.message}`);
    } finally {
        session.endSession();
    }
};

const runConcurrentTest = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB.');

        // Get two users to test with
        const users = await User.find().limit(4);
        if (users.length < 4) {
            console.log('Not enough users in the database to run concurrent test.');
            process.exit(1);
        }

        console.log('Starting concurrent transactions...');
        
        // Execute multiple transactions simultaneously to test snapshot isolation/locking
        await Promise.all([
            transferPoints(users[0]._id, users[1]._id, 5),
            transferPoints(users[2]._id, users[3]._id, 10),
            transferPoints(users[1]._id, users[0]._id, 2)
        ]);

        console.log('Concurrent transaction test complete.');
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

runConcurrentTest();
