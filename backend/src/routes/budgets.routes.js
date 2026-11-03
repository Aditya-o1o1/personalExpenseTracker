const express = require('express');
const router = express.Router();

const { isValid } = require('../middleware/validation.middleware');
const {
  budgetSchema,
  updateBudgetSchema,
  budgetListingSchema,
  budgetIdSchema,
} = require('../validations/budget.validation');

const {
  createBudgetController,
  allBudgetController,
  budgetByIdController,
  updateBudgetController,
  deleteBudgetController,
} = require('../controllers/budgets.controller');

router.post('/create', isValid(budgetSchema), createBudgetController);
router.get('/listing', isValid(budgetListingSchema, 'query'), allBudgetController);
router.get('/:id', isValid(budgetIdSchema, 'params'), budgetByIdController);
router.put(
  '/update/:id',
  isValid(budgetIdSchema, 'params'),
  isValid(updateBudgetSchema),
  updateBudgetController,
);
router.delete('/delete/:id', isValid(budgetIdSchema, 'params'), deleteBudgetController);

module.exports = router;
