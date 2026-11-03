const Transaction = require('../models/transaction.model');
const Category = require('../models/category.model');
const { createError } = require('../utils/error.utils');
const { escapeRegex, getPagination, getPaginationInfo } = require('../utils/listing.utils');
const { checkBudgetAlerts } = require('./budget-alerts.service');

const validateCategory = async (categoryId, type, userId) => {
  const category = await Category.findOne({
    _id: categoryId,
    userId,
    isDeleted: false,
  });

  if (!category) {
    throw createError('Category not found', 404);
  }

  if (category.type !== type) {
    throw createError('Transaction type must match category type', 400);
  }
};

const addTransactionService = async (data, userId) => {
  await validateCategory(data.categoryId, data.type, userId);

  const transaction = await Transaction.create({
    categoryId: data.categoryId,
    type: data.type,
    amount: data.amount,
    description: data.description,
    date: data.date,
    userId,
  });

  if (transaction.type === 'expense') {
    await checkBudgetAlerts(userId, transaction.date);
  }

  return transaction;
};

const allTransactionsService = async (userId, filters) => {
  const { page, limit, skip } = getPagination(filters);
  const query = { userId, isDeleted: false };

  if (filters.categoryId) query.categoryId = filters.categoryId;
  if (filters.type) query.type = filters.type;
  if (filters.dateFrom || filters.dateTo) {
    query.date = {};
    if (filters.dateFrom) query.date.$gte = filters.dateFrom;
    if (filters.dateTo) query.date.$lte = filters.dateTo;
  }
  if (filters.search) {
    const search = new RegExp(escapeRegex(filters.search), 'i');
    const matchingCategories = await Category.find({
      userId,
      isDeleted: false,
      name: search,
    }).select('_id');

    query.$or = [
      { description: search },
      { categoryId: { $in: matchingCategories.map((category) => category._id) } },
    ];
  }

  const [items, total] = await Promise.all([
    Transaction.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'firstName lastName email'),
    Transaction.countDocuments(query),
  ]);

  return {
    items,
    pagination: getPaginationInfo(page, limit, total),
  };
};

const transactionByIdService = async (id, userId) => {
  const transaction = await Transaction.findOne({
    _id: id,
    isDeleted: false,
    userId,
  });

  if (!transaction) {
    throw createError('Transaction not found', 404);
  }

  return transaction;
};

const updateTransactionService = async (data, id, userId) => {
  const { categoryId, type, amount, description, date } = data;
  const updates = {};
  if (categoryId !== undefined) updates.categoryId = categoryId;
  if (type !== undefined) updates.type = type;
  if (amount !== undefined) updates.amount = amount;
  if (description !== undefined) updates.description = description;
  if (date !== undefined) updates.date = date;

  if (Object.keys(updates).length === 0) {
    throw createError('At least one transaction field is required', 400);
  }

  const transaction = await Transaction.findOne({
    _id: id,
    isDeleted: false,
    userId,
  });

  if (!transaction) {
    throw createError('Transaction not found', 404);
  }

  if (categoryId !== undefined || type !== undefined) {
    await validateCategory(
      categoryId ?? transaction.categoryId,
      type ?? transaction.type,
      userId,
    );
  }

  const wasExpense = transaction.type === 'expense';
  const previousDate = new Date(transaction.date);
  Object.assign(transaction, updates);
  const updatedTransaction = await transaction.save();

  if (wasExpense) {
    await checkBudgetAlerts(userId, previousDate);
  }
  if (transaction.type === 'expense' && (!wasExpense || updates.date)) {
    await checkBudgetAlerts(userId, transaction.date);
  }

  return updatedTransaction;
};

const deleteTransactionService = async (id, userId) => {
  const transaction = await Transaction.findOneAndUpdate(
    { _id: id, isDeleted: false, userId },
    { isDeleted: true, deletedAt: new Date() },
    { new: true },
  ).populate('userId', 'firstName lastName email');

  if (!transaction) {
    throw createError('Transaction not found', 404);
  }

  if (transaction.type === 'expense') {
    await checkBudgetAlerts(userId, transaction.date);
  }

  return transaction;
};

module.exports = {
  addTransactionService,
  allTransactionsService,
  transactionByIdService,
  updateTransactionService,
  deleteTransactionService,
};
