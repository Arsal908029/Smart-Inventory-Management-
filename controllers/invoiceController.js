const Invoice = require('../models/Invoice');
const Order = require('../models/Order');

// @desc    Get all invoices
// @route   GET /invoices
const getInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find()
            .sort('-createdAt')
            .populate({
                path: 'order',
                populate: { path: 'items.product' }
            });
            
        res.render('invoices/index', {
            title: 'Invoices',
            invoices
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('errors/500', { title: 'Server Error' });
    }
};

// @desc    View invoice
// @route   GET /invoices/:id
const viewInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate({
                path: 'order',
                populate: { path: 'items.product' }
            });
            
        if (!invoice) {
            return res.status(404).render('errors/404', { title: 'Not Found' });
        }
        
        res.render('invoices/view', {
            title: `Invoice ${invoice.invoiceNumber}`,
            invoice,
            order: invoice.order
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('errors/500', { title: 'Server Error' });
    }
};

// @desc    Update invoice status
// @route   POST /invoices/:id/status
const updateInvoiceStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const invoice = await Invoice.findById(req.params.id);
        
        if (!invoice) {
            return res.status(404).json({ success: false, message: 'Invoice not found' });
        }
        
        invoice.status = status;
        await invoice.save();
        
        res.redirect(`/invoices/${invoice._id}`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getInvoices,
    viewInvoice,
    updateInvoiceStatus
};
