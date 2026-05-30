const mongoose = require('mongoose');

const transactionLogSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        enum: ['sale', 'purchase', 'return', 'adjustment', 'transfer'],
        required: true
    },
    reference: {
        type: String,
        refPath: 'referenceModel'
    },
    referenceModel: {
        type: String,
        enum: ['Order', 'Product', 'StockHistory']
    },
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        quantity: Number,
        previousStock: Number,
        newStock: Number,
        cost: Number,
        price: Number
    }],
    totalAmount: Number,
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'rolled_back'],
        default: 'pending'
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    metadata: {
        ip: String,
        userAgent: String,
        notes: String
    },
    rollbackReason: String,
    completedAt: Date
}, {
    timestamps: true
});

transactionLogSchema.index({ transactionId: 1 });
transactionLogSchema.index({ createdAt: -1 });
transactionLogSchema.index({ type: 1, status: 1 });

module.exports = mongoose.model('TransactionLog', transactionLogSchema);