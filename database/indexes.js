const mongoose = require('mongoose');
require('dotenv').config();

async function setupIndexes() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        
        // Product indexes
        await mongoose.connection.collection('products').createIndex({ sku: 1 }, { unique: true });
        await mongoose.connection.collection('products').createIndex({ name: 'text', description: 'text' });
        await mongoose.connection.collection('products').createIndex({ category: 1, price: -1 });
        await mongoose.connection.collection('products').createIndex({ status: 1, quantity: 1 });
        console.log('Product indexes created');
        
        // Order indexes
        await mongoose.connection.collection('orders').createIndex({ orderNumber: 1 }, { unique: true });
        await mongoose.connection.collection('orders').createIndex({ createdAt: -1 });
        await mongoose.connection.collection('orders').createIndex({ status: 1, createdAt: -1 });
        await mongoose.connection.collection('orders').createIndex({ 'customer.email': 1 });
        console.log('Order indexes created');
        
        // Stock history indexes
        await mongoose.connection.collection('stockhistories').createIndex({ product: 1, date: -1 });
        await mongoose.connection.collection('stockhistories').createIndex({ date: -1, type: 1 });
        console.log('Stock history indexes created');
        
        // Transaction log indexes
        await mongoose.connection.collection('transactionlogs').createIndex({ transactionId: 1 }, { unique: true });
        await mongoose.connection.collection('transactionlogs').createIndex({ createdAt: -1 });
        await mongoose.connection.collection('transactionlogs').createIndex({ type: 1, status: 1 });
        console.log('Transaction log indexes created');
        
        console.log('All indexes created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error creating indexes:', error);
        process.exit(1);
    }
}

setupIndexes();
