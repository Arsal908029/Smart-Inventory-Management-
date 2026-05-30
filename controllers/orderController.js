const Order = require('../models/Order');
const Product = require('../models/Product');
const StockHistory = require('../models/StockHistory');
const Invoice = require('../models/Invoice');
const TransactionLog = require('../models/TransactionLog');

// @desc    Get all orders
// @route   GET /orders
const getOrders = async (req, res) => {
    try {
        let query = {};
        
        // Handle search
        if (req.query.search) {
            query.$or = [
                { orderNumber: { $regex: req.query.search, $options: 'i' } },
                { 'customer.name': { $regex: req.query.search, $options: 'i' } },
                { 'customer.email': { $regex: req.query.search, $options: 'i' } }
            ];
        }
        
        // Handle status filter
        if (req.query.status && req.query.status !== 'all') {
            query.status = req.query.status;
        }

        const orders = await Order.find(query)
            .sort('-createdAt')
            .populate('items.product', 'name sku');
            
        res.render('orders/index', {
            title: 'Orders',
            orders,
            searchQuery: req.query.search || '',
            statusFilter: req.query.status || 'all'
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('errors/500', { title: 'Server Error' });
    }
};

// @desc    Show create order form
// @route   GET /orders/create
const showCreateForm = async (req, res) => {
    try {
        const products = await Product.find({ status: 'active', quantity: { $gt: 0 } });
        res.render('orders/create', {
            title: 'Create Order',
            products,
            error: null
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('errors/500', { title: 'Server Error' });
    }
};

// @desc    Create order
// @route   POST /orders
const createOrder = async (req, res) => {
    const session = await Order.startSession();
    session.startTransaction();
    
    try {
        const { 
            customerName, customerEmail, customerPhone, shippingAddress,
            items, paymentMethod, notes, shippingMethod 
        } = req.body;
        
        const orderItems = typeof items === 'string' ? JSON.parse(items) : items;
        if (!orderItems || orderItems.length === 0) throw new Error('Cart is empty');

        let subtotal = 0;
        const processedItems = [];

        // 1. Verify Stock & Calculate Prices within transaction
        for (const item of orderItems) {
            const product = await Product.findById(item.product).session(session);
            if (!product) throw new Error(`Product ${item.product} not found`);
            if (product.quantity < item.quantity) throw new Error(`Insufficient stock for ${product.name}`);

            processedItems.push({
                product: product._id,
                name: product.name,
                sku: product.sku,
                quantity: item.quantity,
                price: product.price
            });
            subtotal += product.price * item.quantity;
            
            // Deduct Stock
            const oldStock = product.quantity;
            product.quantity -= item.quantity;
            await product.save({ session });

            // Log Stock History
            await StockHistory.create([{
                product: product._id,
                quantity: item.quantity,
                type: 'sale',
                previousStock: oldStock,
                newStock: product.quantity,
                performedBy: req.session.user.id,
                notes: `Sold in new order`
            }], { session });
        }

        // 2. Calculate Totals
        const tax = subtotal * 0.10;
        const shippingCosts = { standard: 5, express: 15, pickup: 0 };
        const shipping = shippingCosts[shippingMethod] || 0;
        const total = subtotal + tax + shipping;

        // 3. Create Order
        const orderNumber = 'ORD-' + Date.now().toString().slice(-6);
        const order = await Order.create([{
            orderNumber,
            customer: {
                name: customerName,
                email: customerEmail,
                phone: customerPhone,
                address: shippingAddress
            },
            items: processedItems,
            subtotal,
            tax,
            shipping,
            total,
            status: 'pending',
            paymentMethod: paymentMethod || 'cash',
            paymentStatus: 'pending',
            createdBy: req.session.user.id,
            notes: notes || ''
        }], { session });

        await session.commitTransaction();
        res.redirect('/orders');
    } catch (error) {
        await session.abortTransaction();
        console.error('Order Transaction Failed:', error);
        
        const products = await Product.find({ status: 'active', quantity: { $gt: 0 } });
        res.render('orders/create', {
            title: 'Create Order',
            products,
            error: error.message
        });
    } finally {
        session.endSession();
    }
};

// @desc    Show order details
// @route   GET /orders/:id
const getOrderDetails = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('items.product');
            
        if (!order) {
            return res.status(404).render('errors/404', { title: 'Not Found' });
        }
        
        // Get associated invoice if exists
        const invoice = await Invoice.findOne({ order: order._id });
        
        res.render('orders/details', {
            title: `Order ${order.orderNumber}`,
            order,
            invoice
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('errors/500', { title: 'Server Error' });
    }
};

// @desc    Update order status
// @route   POST /orders/:id/status
const updateOrderStatus = async (req, res) => {
    const session = await Order.startSession();
    try {
        session.startTransaction({
            readConcern: { level: 'snapshot' },
            writeConcern: { w: 'majority' }
        });

        const { status } = req.body;
        
        // READ WITH VALIDATION
        const order = await Order.findById(req.params.id).session(session);
        if (!order) {
            throw new Error('Order not found');
        }

        // Validation rule: Cannot cancel a completed order
        if (status === 'cancelled' && order.status === 'completed') {
            throw new Error('Cannot cancel a completed order');
        }

        // If cancelling order, restore stock
        if (status === 'cancelled' && order.status !== 'cancelled') {
            for (const item of order.items) {
                const product = await Product.findById(item.product).session(session);
                if (product) {
                    const oldStock = product.quantity;
                    product.quantity += item.quantity;
                    await product.save({ session });

                    await StockHistory.create([{
                        product: product._id,
                        quantity: item.quantity,
                        type: 'adjustment',
                        previousStock: oldStock,
                        newStock: product.quantity,
                        performedBy: req.session.user.id,
                        notes: `Order ${order.orderNumber} cancelled`
                    }], { session });
                }
            }
        }
        
        // If completed, generate invoice and transaction log
        if (status === 'completed' && order.status !== 'completed') {
            const invoiceNumber = 'INV-' + Date.now().toString().slice(-6);
            await Invoice.create([{
                invoiceNumber,
                order: order._id,
                total: order.total,
                status: 'paid'
            }], { session });

            await TransactionLog.create([{
                transactionId: 'TXN-' + Date.now().toString().slice(-8),
                type: 'sale',
                totalAmount: order.total,
                reference: order._id,
                status: 'completed',
                performedBy: req.session.user.id
            }], { session });
            
            order.paymentStatus = 'paid';
        }
        
        order.status = status;
        await order.save({ session });
        
        await session.commitTransaction();
        res.redirect(`/orders/${order._id}`);
    } catch (error) {
        await session.abortTransaction();
        console.error('Update Order Transaction Failed:', error);
        res.status(500).send(`Transaction Failed: ${error.message}`);
    } finally {
        session.endSession();
    }
};

module.exports = {
    getOrders,
    showCreateForm,
    createOrder,
    getOrderDetails,
    updateOrderStatus
};