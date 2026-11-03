const express = require('express');
const router = express.Router();

const { isValid } = require('../middleware/validation.middleware');
const {
  categorySchema,
  categoryListingSchema,
  categoryUpdateSchema,
  categoryIdSchema,
} = require('../validations/category.validation');

const {
  addCategoryController,
  allCategoriesController,
  categoryByIdController,
  updateCategoryController,
  deleteCategoryController,
} = require('../controllers/categories.controller');

router.post('/add', isValid(categorySchema), addCategoryController);
router.get('/listing', isValid(categoryListingSchema, 'query'), allCategoriesController);
router.get('/:id', isValid(categoryIdSchema, 'params'), categoryByIdController);
router.put(
  '/update/:id',
  isValid(categoryIdSchema, 'params'),
  isValid(categoryUpdateSchema),
  updateCategoryController,
);
router.delete('/delete/:id', isValid(categoryIdSchema, 'params'), deleteCategoryController);

module.exports = router;
