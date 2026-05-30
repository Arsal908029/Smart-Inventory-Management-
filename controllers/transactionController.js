const TransactionLog = require('../models/TransactionLog');

// @desc    Get all transactions
// @route   GET /transactions
const getTransactions = async (req, res) => {
    try {
        const transactions = await TransactionLog.find()
            .sort('-createdAt')
            .populate('performedBy', 'name email');
            
        res.render('transactions/index', {
            title: 'Transaction Logs',
            transactions
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('errors/500', { title: 'Server Error' });
    }
};

module.exports = {
    getTransactions
};