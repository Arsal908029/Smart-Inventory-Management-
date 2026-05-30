const Product = require('../models/Product');
const Category = require('../models/Category');
const StockHistory = require('../models/StockHistory');
const Supplier = require('../models/Supplier');
const mongoose = require('mongoose');

// @desc    Get all products
// @route   GET /products
const getProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;
        
        // Filter options
        let filter = { status: { $ne: 'inactive' } };
        
        if (req.query.category) {
            filter.category = req.query.category;
        }
        
        if (req.query.search) {
            // Fuzzy search if $text index is available, otherwise use regex
            filter.$or = [
                { name: { $regex: req.query.search, $options: 'i' } },
                { sku: { $regex: req.query.search, $options: 'i' } },
                { tags: { $in: [new RegExp(req.query.search, 'i')] } }
            ];
        }
        
        if (req.query.minPrice || req.query.maxPrice) {
            filter.price = {};
            if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice);
            if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice);
        }

        if (req.query.stockStatus) {
            if (req.query.stockStatus === 'low') {
                filter.$expr = { $lte: ['$quantity', '$reorderLevel'] };
                filter.quantity = { $gt: 0 };
            } else if (req.query.stockStatus === 'out') {
                filter.quantity = 0;
            } else if (req.query.stockStatus === 'in') {
                filter.quantity = { $gt: 0 };
                filter.$expr = { $gt: ['$quantity', '$reorderLevel'] };
            }
        }

        if (req.query.tag) {
            filter.tags = req.query.tag;
        }

        // Sorting
        let sortOption = { createdAt: -1 };
        if (req.query.sort) {
            switch(req.query.sort) {
                case 'price_asc': sortOption = { price: 1 }; break;
                case 'price_desc': sortOption = { price: -1 }; break;
                case 'name_asc': sortOption = { name: 1 }; break;
                case 'name_desc': sortOption = { name: -1 }; break;
                case 'stock_asc': sortOption = { quantity: 1 }; break;
                case 'stock_desc': sortOption = { quantity: -1 }; break;
            }
        }
        
        const products = await Product.find(filter)
            .populate('category', 'name')
            .sort(sortOption)
            .skip(skip)
            .limit(limit);
        
        const total = await Product.countDocuments(filter);
        const categories = await Category.find({ isActive: true });
        
        // Get all unique tags for the tag cloud
        const allTags = await Product.distinct('tags', { status: 'active' });
        
        res.render('products/index', {
            title: 'Inventory',
            products,
            categories,
            allTags,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total,
            query: req.query,
            view: req.query.view || 'grid'
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('errors/500', { title: 'Server Error' });
    }
};

// @desc    Show create product form
// @route   GET /products/create
const showCreateForm = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true });
        const suppliers = await Supplier.find({ status: 'active' });
        res.render('products/create', {
            title: 'Create Product',
            categories,
            suppliers,
            error: null,
            product: null
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('errors/500', { title: 'Server Error' });
    }
};

// @desc    Create product
// @route   POST /products
const createProduct = async (req, res) => {
    try {
        const {
            name, sku, description, category, price, cost,
            quantity, reorderLevel, reorderQuantity,
            tags, imageUrls, weight, length, width, height,
            supplierName, supplierPhone,
            metaTitle, metaDescription, slug
        } = req.body;
        
        // Check if SKU exists
        const existingProduct = await Product.findOne({ sku: sku.toUpperCase() });
        if (existingProduct) {
            const categories = await Category.find({ isActive: true });
            return res.render('products/create', {
                title: 'Create Product',
                categories,
                error: 'SKU already exists',
                product: req.body
            });
        }
        
        // Prepare tags and images
        const tagsArray = tags ? tags.split(',').map(t => t.trim()) : [];
        const imagesArray = imageUrls ? imageUrls.split(',').map(url => ({ url: url.trim(), isPrimary: false })) : [];
        if (imagesArray.length > 0) imagesArray[0].isPrimary = true;

        // Create product
        const product = await Product.create({
            name,
            sku: sku.toUpperCase(),
            description,
            category,
            price: parseFloat(price),
            cost: parseFloat(cost),
            quantity: parseInt(quantity) || 0,
            reorderLevel: parseInt(reorderLevel) || 10,
            reorderQuantity: parseInt(reorderQuantity) || 50,
            tags: tagsArray,
            images: imagesArray,
            weight: { value: parseFloat(weight) || 0, unit: 'kg' },
            dimensions: {
                length: parseFloat(length) || 0,
                width: parseFloat(width) || 0,
                height: parseFloat(height) || 0,
                unit: 'cm'
            },
            suppliers: req.body.supplier ? [req.body.supplier] : [],
            seo: {
                title: metaTitle || name,
                description: metaDescription,
                slug: slug || name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')
            },
            createdBy: req.session.user.id
        });
        
        // Create stock history entry for initial stock
        if (quantity > 0) {
            await StockHistory.create({
                product: product._id,
                quantity: parseInt(quantity),
                type: 'opening',
                previousStock: 0,
                newStock: parseInt(quantity),
                performedBy: req.session.user.id,
                notes: 'Initial stock setup'
            });
        }
        
        res.redirect('/products');
    } catch (error) {
        console.error(error);
        const categories = await Category.find({ isActive: true });
        res.render('products/create', {
            title: 'Create Product',
            categories,
            error: error.message,
            product: req.body
        });
    }
};

// @desc    Show edit product form
// @route   GET /products/:id/edit
const showEditForm = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('category');
        if (!product) {
            return res.status(404).render('errors/404', { title: 'Not Found' });
        }
        
        const categories = await Category.find({ isActive: true });
        const suppliers = await Supplier.find({ status: 'active' });
        
        res.render('products/edit', {
            title: 'Edit Product',
            product,
            categories,
            suppliers,
            error: null
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('errors/500', { title: 'Server Error' });
    }
};

// @desc    Update product
// @route   PUT /products/:id
const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).render('errors/404', { title: 'Not Found' });
        }
        
        const {
            name, sku, description, category, price, cost,
            quantity, reorderLevel, reorderQuantity,
            tags, imageUrls, weight, supplierName,
            metaTitle, metaDescription
        } = req.body;

        const oldQuantity = product.quantity;
        const newQuantity = parseInt(quantity) || 0;
        
        // Prepare tags and images
        const tagsArray = tags ? tags.split(',').map(t => t.trim()) : product.tags;
        let imagesArray = product.images;
        if (imageUrls) {
            const newImages = imageUrls.split(',').map(url => ({ url: url.trim(), isPrimary: false }));
            imagesArray = [...imagesArray, ...newImages];
        }

        // Update product object
        product.name = name || product.name;
        product.sku = sku ? sku.toUpperCase() : product.sku;
        product.description = description || product.description;
        product.category = category || product.category;
        product.price = price ? parseFloat(price) : product.price;
        product.cost = cost ? parseFloat(cost) : product.cost;
        product.quantity = newQuantity;
        product.reorderLevel = reorderLevel ? parseInt(reorderLevel) : product.reorderLevel;
        product.reorderQuantity = reorderQuantity ? parseInt(reorderQuantity) : product.reorderQuantity;
        product.tags = tagsArray;
        product.images = imagesArray;
        
        if (weight) product.weight = { value: parseFloat(weight), unit: 'kg' };
        if (req.body.supplier) product.suppliers = [req.body.supplier];
        
        product.seo = {
            title: metaTitle || product.seo?.title || product.name,
            description: metaDescription || product.seo?.description,
            slug: product.seo?.slug || product.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')
        };
        
        await product.save();
        
        // Create stock history if quantity changed
        if (oldQuantity !== newQuantity) {
            await StockHistory.create({
                product: product._id,
                quantity: Math.abs(newQuantity - oldQuantity),
                type: 'adjustment',
                previousStock: oldQuantity,
                newStock: newQuantity,
                performedBy: req.session.user.id,
                notes: req.body.stockNotes || 'Stock adjustment'
            });
        }
        
        res.redirect('/products');
    } catch (error) {
        console.error(error);
        const categories = await Category.find({ isActive: true });
        const product = await Product.findById(req.params.id);
        res.render('products/edit', {
            title: 'Edit Product',
            product,
            categories,
            error: error.message
        });
    }
};

// @desc    Delete product
// @route   DELETE /products/:id
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).render('errors/404', { title: 'Not Found' });
        }
        
        // Soft delete - just mark as inactive
        product.status = 'inactive';
        await product.save();
        
        res.redirect('/products');
    } catch (error) {
        console.error(error);
        res.status(500).render('errors/500', { title: 'Server Error' });
    }
};

// @desc    Get product details
// @route   GET /products/:id
const getProductDetails = async (req, res) => {
    try {
        // Using $lookup aggregation as required by the module specs
        const aggregatedProduct = await Product.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(req.params.id) } },
            { 
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'suppliers',
                    localField: 'suppliers',
                    foreignField: '_id',
                    as: 'supplierDetails'
                }
            }
        ]);

        if (!aggregatedProduct || aggregatedProduct.length === 0) {
            return res.status(404).render('errors/404', { title: 'Not Found' });
        }
        
        // Convert plain object back to mongoose document to use instance methods like needsReorder()
        const product = await Product.hydrate(aggregatedProduct[0]);
        // Hydrate doesn't populate the virtual/populated fields well for raw use in views, so we'll just pass the aggregated data
        const productData = aggregatedProduct[0];
        
        // Get stock history
        const stockHistory = await StockHistory.find({ product: product._id })
            .sort('-date')
            .limit(20)
            .populate('performedBy', 'name');
        
        res.render('products/details', {
            title: productData.name,
            product: productData,
            stockHistory,
            needsReorder: product.needsReorder()
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('errors/500', { title: 'Server Error' });
    }
};

module.exports = {
    getProducts,
    showCreateForm,
    createProduct,
    showEditForm,
    updateProduct,
    deleteProduct,
    getProductDetails
};