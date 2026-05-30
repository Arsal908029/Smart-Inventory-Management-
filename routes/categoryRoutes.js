const express = require('express');
const router = express.Router();
const { authMiddleware, managerMiddleware } = require('../middleware/authMiddleware');
const {
    getCategories,
    showCreateForm,
    createCategory,
    showEditForm,
    updateCategory,
    deleteCategory
} = require('../controllers/categoryController');

router.use(authMiddleware);

router.get('/', getCategories);
router.get('/create', showCreateForm);
router.post('/create', createCategory);
router.get('/:id/edit', showEditForm);
router.post('/:id/edit', updateCategory);
router.post('/:id/delete', deleteCategory);

module.exports = router;