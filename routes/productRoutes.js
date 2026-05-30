const express = require('express');
const router = express.Router();
const { authMiddleware, managerMiddleware } = require('../middleware/authMiddleware');
const {
    getProducts,
    showCreateForm,
    createProduct,
    showEditForm,
    updateProduct,
    deleteProduct,
    getProductDetails
} = require('../controllers/productController');

router.use(authMiddleware);

router.get('/', getProducts);
router.get('/create', showCreateForm);
router.post('/', createProduct);
router.get('/:id/edit', showEditForm);
router.put('/:id', updateProduct);
router.post('/:id/delete', deleteProduct);
router.get('/:id', getProductDetails);

module.exports = router;