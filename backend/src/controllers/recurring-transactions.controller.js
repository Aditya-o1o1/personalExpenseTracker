const {
  createRecurringTransactionService,
  listRecurringTransactionsService,
  deleteRecurringTransactionService,
} = require('../services/recurring-transactions.service');

const createRecurringTransactionController = async (req, res, next) => {
  try {
    const schedule = await createRecurringTransactionService(req.body, req.user.id);
    return res.status(201).json({
      success: true,
      message: 'Recurring transaction created successfully',
      schedule,
    });
  } catch (error) {
    next(error);
  }
};

const listRecurringTransactionsController = async (req, res, next) => {
  try {
    const schedules = await listRecurringTransactionsService(req.user.id);
    return res.status(200).json({ success: true, schedules });
  } catch (error) {
    next(error);
  }
};

const deleteRecurringTransactionController = async (req, res, next) => {
  try {
    const schedule = await deleteRecurringTransactionService(req.params.id, req.user.id);
    return res.status(200).json({
      success: true,
      message: 'Recurring transaction cancelled successfully',
      schedule,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRecurringTransactionController,
  listRecurringTransactionsController,
  deleteRecurringTransactionController,
};
