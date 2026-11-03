const express = require('express');
const router = express.Router();

const { isValid } = require('../middleware/validation.middleware');
const {
  transactionSchema,
  transactionUpdateSchema,
  transactionIdSchema,
  transactionListingSchema,
} = require('../validations/transaction.validation');
const {
  addTransactionController,
  allTransactionsController,
  transactionByIdController,
  updateTransactionController,
  deleteTransactionController,
} = require('../controllers/transactions.controller');

router.post('/add', isValid(transactionSchema), addTransactionController);
router.get('/listing', isValid(transactionListingSchema, 'query'), allTransactionsController);
router.get('/:id', isValid(transactionIdSchema, 'params'), transactionByIdController);
router.put(
  '/update/:id',
  isValid(transactionIdSchema, 'params'),
  isValid(transactionUpdateSchema),
  updateTransactionController,
);
router.delete('/delete/:id', isValid(transactionIdSchema, 'params'), deleteTransactionController);
// Filtering by category, date range, or transaction type.
module.exports = router;
