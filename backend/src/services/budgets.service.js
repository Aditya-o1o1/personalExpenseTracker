const Budget = require('../models/budget.model');
const Category = require('../models/category.model');
const { createError, handleDuplicateError } = require('../utils/error.utils');
const { escapeRegex, getPagination, getPaginationInfo } = require('../utils/listing.utils');
const { addBudgetUsage } = require('../utils/budget.utils');
const { checkBudgetAlerts } = require('./budget-alerts.service');

const createBudgetService = async (data, userId) => {
  const { categoryId, amount, period, startDate } = data;
  const existingBudget = await Budget.findOne({
    userId,
    categoryId,
    amount,
    period,
    startDate,
    isDeleted: false,
  });

  if (existingBudget) {
    throw createError('Budget already exists', 409);
  }

  try {
    const budget = await Budget.create({
      categoryId,
      amount,
      period,
      startDate,
      endDate: data.endDate,
      userId,
    });
    await checkBudgetAlerts(userId, new Date());
    return addBudgetUsage(budget);
  } catch (error) {
    handleDuplicateError(error, 'Budget already exists');
  }
};

const allBudgetService = async (userId, filters) => {
  const { page, limit, skip } = getPagination(filters);
  const query = {
    userId,
    isDeleted: false,
  };

  if (filters.categoryId) query.categoryId = filters.categoryId;
  if (filters.period) query.period = filters.period;
  if (filters.startDateFrom || filters.startDateTo) {
    query.startDate = {};
    if (filters.startDateFrom) query.startDate.$gte = filters.startDateFrom;
    if (filters.startDateTo) query.startDate.$lte = filters.startDateTo;
  }

  if (filters.search) {
    const search = new RegExp(escapeRegex(filters.search), 'i');
    const categories = await Category.find({
      userId,
      name: search,
      isDeleted: false,
    }).select('_id');
    query.$or = [
      { period: search },
      { categoryId: { $in: categories.map((category) => category._id) } },
    ];
  }

  const [items, total] = await Promise.all([
    Budget.find(query).sort({ startDate: -1 }).skip(skip).limit(limit),
    Budget.countDocuments(query),
  ]);

  return {
    items: await Promise.all(items.map(addBudgetUsage)),
    pagination: getPaginationInfo(page, limit, total),
  };
};

const budgetByIdService = async (id, userId) => {
  const budget = await Budget.findOne({
    userId,
    isDeleted: false,
    _id: id,
  });

  if (!budget) {
    throw createError('Budget not found', 404);
  }

  return addBudgetUsage(budget);
};

const updateBudgetService = async (data, id, userId) => {
  const updates = {};
  if (data.categoryId !== undefined) updates.categoryId = data.categoryId;
  if (data.amount !== undefined) updates.amount = data.amount;
  if (data.period !== undefined) updates.period = data.period;
  if (data.startDate !== undefined) updates.startDate = data.startDate;
  if (data.endDate !== undefined) updates.endDate = data.endDate;

  const budget = await Budget.findOne({
    _id: id,
    userId,
    isDeleted: false,
  });

  if (!budget) {
    throw createError('Budget not found to update', 404);
  }

  Object.assign(budget, updates);
  if (budget.endDate && budget.endDate <= budget.startDate) {
    throw createError('End date must be after start date', 400);
  }

  await budget.save();
  return addBudgetUsage(budget);
};

const deleteBudgetService = async (id, userId) => {
  const budget = await Budget.findOneAndUpdate(
    {
      _id: id,
      userId,
      isDeleted: false,
    },
    { isDeleted: true, deletedAt: new Date() },
    { new: true },
  );

  if (!budget) {
    throw createError('Budget not found to delete', 404);
  }

  return budget;
};

module.exports = {
  createBudgetService,
  allBudgetService,
  budgetByIdService,
  updateBudgetService,
  deleteBudgetService,
};
