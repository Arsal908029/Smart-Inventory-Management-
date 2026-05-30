const Order = require('../models/Order');
const Product = require('../models/Product');
const Category = require('../models/Category');

// @desc    Get aggregation reports
// @route   GET /aggregation/report
const getReport = async (req, res) => {
    try {
        // 1. Total Revenue by Category (Aggregation Pipeline)
        const revenueByCategory = await Order.aggregate([
            { $unwind: '$items' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.product',
                    foreignField: '_id',
                    as: 'productInfo'
                }
            },
            { $unwind: '$productInfo' },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'productInfo.category',
                    foreignField: '_id',
                    as: 'categoryInfo'
                }
            },
            { $unwind: '$categoryInfo' },
            {
                $group: {
                    _id: '$categoryInfo.name',
                    totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                    itemsSold: { $sum: '$items.quantity' }
                }
            },
            { $sort: { totalRevenue: -1 } }
        ]);

        // 2. Daily Sales Trend (Last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const dailySales = await Order.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo }, status: 'completed' } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    revenue: { $sum: '$total' },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 3. Low Stock Inventory Valuation
        const inventoryValuation = await Product.aggregate([
            { $match: { status: 'active' } },
            {
                $group: {
                    _id: null,
                    totalValue: { $sum: { $multiply: ['$cost', '$quantity'] } },
                    retailValue: { $sum: { $multiply: ['$price', '$quantity'] } },
                    totalItems: { $sum: '$quantity' }
                }
            }
        ]);

        res.render('reports/index', {
            title: 'Business Intelligence',
            revenueByCategory,
            dailySales,
            inventoryValuation: inventoryValuation[0] || { totalValue: 0, retailValue: 0, totalItems: 0 }
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('errors/500', { title: 'Server Error' });
    }
};

module.exports = {
    getReport
};