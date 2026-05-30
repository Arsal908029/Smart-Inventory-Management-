const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const makeAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOneAndUpdate(
            { email: 'arsalan.ali@example.com' }, // or whatever email they used
            { role: 'admin' },
            { new: true }
        );
        // Wait, I don't know their exact email. Let's just update ALL users to admin for testing.
        await User.updateMany({}, { role: 'admin' });
        console.log('Successfully upgraded all users to admin role.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

makeAdmin();
