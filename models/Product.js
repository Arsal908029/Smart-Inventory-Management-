const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        index: true
    },
    sku: {
        type: String,
        required: [true, 'SKU is required'],
        unique: true,
        uppercase: true,
        trim: true
    },
    barcode: {
        type: String,
        unique: true,
        sparse: true
    },
    description: {
        type: String,
        required: [true, 'Description is required']
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: 0
    },
    cost: {
        type: Number,
        required: [true, 'Cost is required'],
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    reorderLevel: {
        type: Number,
        default: 10
    },
    reorderQuantity: {
        type: Number,
        default: 50
    },
    location: {
        warehouse: String,
        shelf: String,
        bin: String
    },
    supplier: {
        name: String,
        contact: String,
        email: String,
        phone: String
    },
    suppliers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier'
    }],
    images: [{
        url: String,
        alt: String,
        isPrimary: Boolean
    }],
    weight: {
        value: Number,
        unit: {
            type: String,
            enum: ['kg', 'g', 'lb', 'oz'],
            default: 'kg'
        }
    },
    dimensions: {
        length: Number,
        width: Number,
        height: Number,
        unit: {
            type: String,
            enum: ['cm', 'in'],
            default: 'cm'
        }
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'discontinued'],
        default: 'active'
    },
    tags: [String],
    salesCount: {
        type: Number,
        default: 0
    },
    rating: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 }
    },
    seo: {
        title: String,
        description: String,
        slug: { type: String, unique: true, sparse: true }
    }
}, {
    timestamps: true
});

// Compound indexes for efficient querying
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, price: -1 });
productSchema.index({ status: 1, quantity: 1 });

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
    if (this.cost > 0) {
        return ((this.price - this.cost) / this.price) * 100;
    }
    return 0;
});

// Method to check if product needs reordering
productSchema.methods.needsReorder = function() {
    return this.quantity <= this.reorderLevel;
};

module.exports = mongoose.model('Product', productSchema);