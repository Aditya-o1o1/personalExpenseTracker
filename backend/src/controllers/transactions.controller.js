const {
  addTransactionService,
  allTransactionsService,
  transactionByIdService,
  updateTransactionService,
  deleteTransactionService,
} = require('../services/transactions.service');

const addTransactionController = async (req, res, next) => {
  try {
    const transaction = await addTransactionService(req.body, req.user.id);

    return res.status(201).json({
      success: true,
      message: 'Transaction added successfully',
      transaction,
    });
  } catch (error) {
    next(error);
  }
};

const allTransactionsController = async (req, res, next) => {
  try {
    const { items, pagination } = await allTransactionsService(req.user.id, req.validatedQuery);
    return res.status(200).json({
      success: true,
      message: 'All Transactions',
      Transactions: items,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

const transactionByIdController = async (req, res, next) => {
  try {
    const transaction = await transactionByIdService(req.params.id, req.user.id);
    return res.status(200).json({
      success: true,
      message: 'Transaction fetched successfully',
      Transaction: transaction,
    });
  } catch (error) {
    next(error);
  }
};

const updateTransactionController = async (req, res, next) => {
  try {
    const transaction = await updateTransactionService(req.body, req.params.id, req.user.id);

    return res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      updatedTransaction: transaction,
    });
  } catch (error) {
    next(error);
  }
};

const deleteTransactionController = async (req, res, next) => {
  try {
    const transaction = await deleteTransactionService(req.params.id, req.user.id);

    return res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
      deletedTransaction: transaction,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addTransactionController,
  allTransactionsController,
  transactionByIdController,
  updateTransactionController,
  deleteTransactionController,
};
