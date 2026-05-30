const Category = require('../models/Category');
const Product = require('../models/Product');

// Helper to build tree
const buildTree = (nodes, parentId = null) => {
    return nodes
        .filter(node => String(node.parent) === String(parentId))
        .map(node => ({
            ...node._doc,
            productCount: node.productCount,
            subcategories: buildTree(nodes, node._id)
        }));
};

// @desc    Get all categories
// @route   GET /categories
const getCategories = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true })
            .populate('productCount')
            .sort('order name');
            
        // Separate top-level and sub-categories
        const topLevel = categories.filter(c => !c.parent);
        const subCategories = categories.filter(c => c.parent);

        res.render('categories/index', {
            title: 'Categories',
            categories: topLevel,
            allCategories: categories // for search/filter if needed
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('errors/500', { title: 'Server Error', error });
    }
};

// @desc    Show create category form
// @route   GET /categories/create
const showCreateForm = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true });
        res.render('categories/create', {
            title: 'Create Category',
            categories,
            error: null,
            category: null
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('errors/500', { title: 'Server Error' });
    }
};

// @desc    Create category
// @route   POST /categories
const createCategory = async (req, res) => {
    try {
        const { name, description, parent, order } = req.body;
        
        // Check if category exists
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            const categories = await Category.find({ isActive: true });
            return res.render('categories/create', {
                title: 'Create Category',
                categories,
                error: 'Category name already exists',
                category: req.body
            });
        }
        
        await Category.create({ 
            name, 
            description, 
            parent: parent || null,
            order: parseInt(order) || 0
        });
        res.redirect('/categories');
    } catch (error) {
        console.error(error);
        const categories = await Category.find({ isActive: true });
        res.render('categories/create', {
            title: 'Create Category',
            categories,
            error: error.message,
            category: req.body
        });
    }
};

// @desc    Show edit category form
// @route   GET /categories/:id/edit
const showEditForm = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).render('errors/404', { title: 'Not Found' });
        }
        
        const categories = await Category.find({ isActive: true, _id: { $ne: category._id } });
        
        res.render('categories/edit', {
            title: 'Edit Category',
            category,
            categories,
            error: null
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('errors/500', { title: 'Server Error', error });
    }
};

// @desc    Update category
// @route   POST /categories/:id
const updateCategory = async (req, res) => {
    try {
        const { name, description, parent, order } = req.body;
        const category = await Category.findById(req.params.id);
        
        if (!category) {
            return res.status(404).render('errors/404', { title: 'Not Found' });
        }
        
        // Check if new name exists elsewhere
        if (name !== category.name) {
            const existingCategory = await Category.findOne({ name });
            if (existingCategory) {
                const categories = await Category.find({ isActive: true, _id: { $ne: category._id } });
                return res.render('categories/edit', {
                    title: 'Edit Category',
                    category: { ...category._doc, ...req.body },
                    categories,
                    error: 'Category name already exists'
                });
            }
        }
        
        category.name = name;
        category.description = description;
        category.parent = parent || null;
        category.order = parseInt(order) || 0;
        await category.save();
        
        res.redirect('/categories');
    } catch (error) {
        console.error(error);
        const categories = await Category.find({ isActive: true, _id: { $ne: req.params.id } });
        res.render('categories/edit', {
            title: 'Edit Category',
            category: req.body,
            categories,
            error: error.message
        });
    }
};

// @desc    Delete category
// @route   POST /categories/:id/delete
const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).render('errors/404', { title: 'Not Found' });
        }
        
        // Check if has subcategories or products
        const hasSub = await Category.findOne({ parent: category._id, isActive: true });
        const hasProducts = await Product.findOne({ category: category._id, status: 'active' });
        
        if (hasSub || hasProducts) {
            req.flash('error', 'Cannot delete category with subcategories or products');
            return res.redirect('/categories');
        }

        // Soft delete
        category.isActive = false;
        await category.save();
        
        res.redirect('/categories');
    } catch (error) {
        console.error(error);
        res.status(500).render('errors/500', { title: 'Server Error', error });
    }
};

module.exports = {
    getCategories,
    showCreateForm,
    createCategory,
    showEditForm,
    updateCategory,
    deleteCategory
};