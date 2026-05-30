const mongoose = require('mongoose');

const stockHistorySchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        index: true
    },
    date: {
        type: Date,
        default: Date.now,
        index: true
    },
    quantity: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['purchase', 'sale', 'return', 'adjustment', 'opening'],
        required: true
    },
    reference: {
        id: String,
        model: String,
        number: String
    },
    previousStock: Number,
    newStock: Number,
    notes: String,
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    location: String,
    batchNumber: String,
    expiryDate: Date
}, {
    timestamps: true
});

// Compound index for date range queries
stockHistorySchema.index({ product: 1, date: -1 });
stockHistorySchema.index({ date: -1, type: 1 });

module.exports = mongoose.model('StockHistory', stockHistorySchema);
