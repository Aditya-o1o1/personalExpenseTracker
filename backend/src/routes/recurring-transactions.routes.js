const express = require('express');
const router = express.Router();

const { isValid } = require('../middleware/validation.middleware');
const {
  recurringTransactionSchema,
  recurringTransactionIdSchema,
} = require('../validations/recurring-transaction.validation');
const {
  createRecurringTransactionController,
  listRecurringTransactionsController,
  deleteRecurringTransactionController,
} = require('../controllers/recurring-transactions.controller');

router.post('/', isValid(recurringTransactionSchema), createRecurringTransactionController);
router.get('/', listRecurringTransactionsController);
router.delete(
  '/:id',
  isValid(recurringTransactionIdSchema, 'params'),
  deleteRecurringTransactionController,
);

module.exports = router;
