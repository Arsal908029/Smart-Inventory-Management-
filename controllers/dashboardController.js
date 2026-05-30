const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const StockHistory = require('../models/StockHistory');

// @desc    Dashboard home
// @route   GET /dashboard
const getDashboard = async (req, res) => {
    try {
        // Get statistics
        const totalProducts = await Product.countDocuments({ status: 'active' });
        const lowStockProducts = await Product.countDocuments({
            status: 'active',
            $expr: { $lte: ['$quantity', '$reorderLevel'] }
        });
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        
        const todayOrders = await Order.countDocuments({
            createdAt: { $gte: today }
        });
        
        const totalOrders = await Order.countDocuments();
        
        // Get monthly sales
        const monthlySales = await Order.aggregate([
            {
                $match: {
                    status: 'completed',
                    createdAt: { $gte: new Date(new Date().getFullYear(), 0, 1) }
                }
            },
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    total: { $sum: '$total' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        
        // Inventory Value & Average Margin
        const inventoryValueStats = await Product.aggregate([
            { $match: { status: 'active', price: { $gt: 0 } } },
            {
                $group: {
                    _id: null,
                    totalValue: { $sum: { $multiply: ['$quantity', '$cost'] } },
                    avgMargin: { $avg: { $multiply: [{ $divide: [{ $subtract: ['$price', '$cost'] }, '$price'] }, 100] } }
                }
            }
        ]);

        // Customer Retention (Returning Customers)
        const customerStats = await Order.aggregate([
            { $group: { _id: '$customer.email', orderCount: { $sum: 1 } } },
            {
                $group: {
                    _id: null,
                    totalCustomers: { $sum: 1 },
                    returningCustomers: { $sum: { $cond: [{ $gt: ['$orderCount', 1] }, 1, 0] } }
                }
            }
        ]);
        
        // Peak Hours Analysis
        const peakHours = await Order.aggregate([
            {
                $group: {
                    _id: { $hour: '$createdAt' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Sales Comparison (This Month vs Last Month)
        const salesComparison = await Order.aggregate([
            {
                $match: {
                    status: 'completed',
                    createdAt: { $gte: startOfLastMonth }
                }
            },
            {
                $group: {
                    _id: {
                        $cond: [{ $gte: ['$createdAt', startOfMonth] }, 'current', 'last']
                    },
                    total: { $sum: '$total' }
                }
            }
        ]);

        // Get top selling products
        const topProducts = await Order.aggregate([
            { $match: { status: 'completed' } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product',
                    totalSold: { $sum: '$items.quantity' },
                    revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } }
        ]);
        
        // Filter out items where product lookup failed
        const filteredTopProducts = topProducts.filter(tp => tp.product);
        
        // Get recent orders
        const recentOrders = await Order.find()
            .sort('-createdAt')
            .limit(10)
            .populate('createdBy', 'name');
        
        // Get stock alerts
        const stockAlerts = await Product.find({
            status: 'active',
            $expr: { $lte: ['$quantity', '$reorderLevel'] }
        }).limit(10);
        
        // Get total revenue
        const revenue = await Order.aggregate([
            { $match: { status: 'completed' } },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$total' },
                    avg: { $avg: '$total' }
                }
            }
        ]);

        const retentionRate = customerStats[0]?.totalCustomers 
            ? (customerStats[0].returningCustomers / customerStats[0].totalCustomers) * 100 
            : 0;
        
        res.render('dashboard/index', {
            title: 'Dashboard',
            stats: {
                totalProducts,
                lowStockProducts,
                todayOrders,
                totalOrders,
                totalRevenue: revenue[0]?.total || 0,
                averageOrder: revenue[0]?.avg || 0,
                inventoryValue: inventoryValueStats[0]?.totalValue || 0,
                avgMargin: inventoryValueStats[0]?.avgMargin || 0,
                retentionRate: retentionRate
            },
            monthlySales,
            salesComparison,
            peakHours,
            topProducts: filteredTopProducts,
            recentOrders,
            stockAlerts
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('errors/500', { title: 'Server Error' });
    }
};

module.exports = { getDashboard };