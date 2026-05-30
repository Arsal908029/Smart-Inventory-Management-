const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: true,
        unique: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    customer: {
        name: String,
        email: String,
        phone: String,
        address: Object
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        name: String,
        quantity: Number,
        price: Number,
        total: Number
    }],
    subtotal: Number,
    tax: Number,
    discount: Number,
    total: Number,
    pdfPath: String,
    status: {
        type: String,
        enum: ['draft', 'sent', 'paid', 'overdue'],
        default: 'draft'
    },
    dueDate: Date,
    paidAt: Date
}, {
    timestamps: true
});

invoiceSchema.pre('save', async function(next) {
    if (!this.invoiceNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const count = await mongoose.model('Invoice').countDocuments();
        this.invoiceNumber = `INV-${year}-${String(count + 1).padStart(6, '0')}`;
    }
    next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);