const Supplier = require('../models/Supplier');
const Product = require('../models/Product');

// @desc    Get all suppliers
// @route   GET /suppliers
const getSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.find().sort('name');
        res.render('suppliers/index', {
            title: 'Suppliers',
            suppliers
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('errors/500', { title: 'Server Error' });
    }
};

// @desc    Show create supplier form
// @route   GET /suppliers/create
const showCreateForm = async (req, res) => {
    res.render('suppliers/create', {
        title: 'Add Supplier',
        error: null,
        supplier: null
    });
};

// @desc    Create supplier
// @route   POST /suppliers
const createSupplier = async (req, res) => {
    try {
        const { name, contact, email, phone, leadTimeDays, rating, address } = req.body;
        
        await Supplier.create({
            name, contact, email, phone, leadTimeDays, rating, address
        });
        
        res.redirect('/suppliers');
    } catch (error) {
        console.error(error);
        res.render('suppliers/create', {
            title: 'Add Supplier',
            error: error.message,
            supplier: req.body
        });
    }
};

// @desc    Show edit supplier form
// @route   GET /suppliers/:id/edit
const showEditForm = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) {
            return res.status(404).render('errors/404', { title: 'Not Found' });
        }
        res.render('suppliers/edit', {
            title: 'Edit Supplier',
            supplier,
            error: null
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('errors/500', { title: 'Server Error' });
    }
};

// @desc    Update supplier
// @route   PUT /suppliers/:id
const updateSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) {
            return res.status(404).render('errors/404', { title: 'Not Found' });
        }
        
        const { name, contact, email, phone, leadTimeDays, rating, address, status } = req.body;
        
        supplier.name = name;
        supplier.contact = contact;
        supplier.email = email;
        supplier.phone = phone;
        supplier.leadTimeDays = leadTimeDays;
        supplier.rating = rating;
        supplier.address = address;
        if(status) supplier.status = status;
        
        await supplier.save();
        res.redirect('/suppliers');
    } catch (error) {
        console.error(error);
        const supplier = await Supplier.findById(req.params.id);
        res.render('suppliers/edit', {
            title: 'Edit Supplier',
            supplier,
            error: error.message
        });
    }
};

// @desc    Delete supplier
// @route   DELETE /suppliers/:id
const deleteSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) {
            return res.status(404).render('errors/404', { title: 'Not Found' });
        }
        
        // Remove from any products
        await Product.updateMany(
            { suppliers: supplier._id },
            { $pull: { suppliers: supplier._id } }
        );
        
        await supplier.deleteOne();
        res.redirect('/suppliers');
    } catch (error) {
        console.error(error);
        res.status(500).render('errors/500', { title: 'Server Error' });
    }
};

// @desc    Get supplier details
// @route   GET /suppliers/:id
const getSupplierDetails = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) {
            return res.status(404).render('errors/404', { title: 'Not Found' });
        }
        
        // Find products from this supplier
        const products = await Product.find({ suppliers: supplier._id }).populate('category', 'name');
        
        res.render('suppliers/details', {
            title: supplier.name,
            supplier,
            products
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('errors/500', { title: 'Server Error' });
    }
};

module.exports = {
    getSuppliers,
    showCreateForm,
    createSupplier,
    showEditForm,
    updateSupplier,
    deleteSupplier,
    getSupplierDetails
};
