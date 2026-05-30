const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Supplier name is required'],
        trim: true,
        index: true
    },
    contact: {
        type: String,
        required: [true, 'Contact person name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required']
    },
    leadTimeDays: {
        type: Number,
        default: 7,
        min: 0
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        default: 3
    },
    address: {
        type: String
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Supplier', supplierSchema);
