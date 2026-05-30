const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: String,
    sku: String,
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    }
});

// SHARD KEY: { createdAt: 1 } - Range Sharding to ensure queries targeting date ranges are routed efficiently.
const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    customer: {
        name: {
            type: String,
            required: true
        },
        email: String,
        phone: String,
        address: String
    },
    items: [orderItemSchema],
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    tax: {
        type: Number,
        default: 0,
        min: 0
    },
    taxRate: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'cancelled', 'refunded'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'mobile_money'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    notes: String,
    invoiceGenerated: {
        type: Boolean,
        default: false
    },
    processedAt: Date,
    completedAt: Date
}, {
    timestamps: true
});

// Generate order number before save
orderSchema.pre('save', async function(next) {
    if (!this.orderNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const count = await mongoose.model('Order').countDocuments();
        this.orderNumber = `ORD-${year}${month}-${String(count + 1).padStart(6, '0')}`;
    }
    next();
});

// Index for efficient querying
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'customer.email': 1 });

module.exports = mongoose.model('Order', orderSchema);