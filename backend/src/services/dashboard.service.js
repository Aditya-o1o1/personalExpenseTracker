const mongoose = require('mongoose');
const Budget = require('../models/budget.model');
const Transaction = require('../models/transaction.model');

const getDateRange = (filters = {}) => {
  const now = new Date();
  const fallbackDate = filters.dateTo || now;
  const dateFrom =
    filters.dateFrom ||
    new Date(Date.UTC(fallbackDate.getUTCFullYear(), fallbackDate.getUTCMonth(), 1));
  const dateTo = filters.dateTo || now;

  if (
    filters.dateTo &&
    dateTo.getUTCHours() === 0 &&
    dateTo.getUTCMinutes() === 0 &&
    dateTo.getUTCSeconds() === 0 &&
    dateTo.getUTCMilliseconds() === 0
  ) {
    dateTo.setUTCHours(23, 59, 59, 999);
  }

  return { dateFrom, dateTo };
};

const getSummary = async (ownerId, dateFrom, dateTo) => {
  const totals = await Transaction.aggregate([
    {
      $match: {
        userId: ownerId,
        isDeleted: false,
        date: { $gte: dateFrom, $lte: dateTo },
      },
    },
    {
      $group: {
        _id: '$type',
        amount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);
  const income = totals.find((item) => item._id === 'income');
  const expenses = totals.find((item) => item._id === 'expense');
  const incomeAmount = income?.amount || 0;
  const expenseAmount = expenses?.amount || 0;

  return {
    income: incomeAmount,
    expenses: expenseAmount,
    balance: incomeAmount - expenseAmount,
    transactionCount: totals.reduce((count, item) => count + item.count, 0),
  };
};

const getDashboardSummaryService = async (userId, filters = {}) => {
  const ownerId = new mongoose.Types.ObjectId(userId);
  const { dateFrom, dateTo } = getDateRange(filters);
  const summary = await getSummary(ownerId, dateFrom, dateTo);

  return {
    period: { dateFrom, dateTo },
    summary,
  };
};

const normalizeCategoryType = (category, transactionType) => {
  if (!category) return category;

  const categoryData = category.toObject ? category.toObject() : { ...category };

  return {
    ...categoryData,
    type: transactionType,
  };
};

const getDashboardService = async (userId, filters = {}) => {
  const ownerId = new mongoose.Types.ObjectId(userId);
  const { dateFrom, dateTo } = getDateRange(filters);
  const transactionFilter = {
    userId: ownerId,
    isDeleted: false,
    date: { $gte: dateFrom, $lte: dateTo },
  };

  const [summary, recentTransactions, budgets] = await Promise.all([
    getSummary(ownerId, dateFrom, dateTo),
    Transaction.find(transactionFilter)
      .sort({ date: -1 })
      .limit(5)
      .populate('categoryId', 'name type'),
    Budget.find({
      userId: ownerId,
      isDeleted: false,
      startDate: { $lte: dateTo },
      $or: [{ endDate: null }, { endDate: { $gte: dateFrom } }],
    })
      .sort({ startDate: -1 })
      .populate('categoryId', 'name type'),
  ]);

  const normalizedRecentTransactions = recentTransactions.map((transaction) => {
    const categoryId = transaction.categoryId
      ? normalizeCategoryType(transaction.categoryId, transaction.type)
      : transaction.categoryId;

    return {
      ...transaction.toObject(),
      categoryId,
    };
  });

  const budgetStatus = await Promise.all(
    budgets.map(async (budget) => {
      const budgetDateFrom =
        budget.startDate > dateFrom ? budget.startDate : dateFrom;
      const budgetDateTo =
        budget.endDate && budget.endDate < dateTo ? budget.endDate : dateTo;
      const expenseFilter = {
        userId: ownerId,
        isDeleted: false,
        type: 'expense',
        date: { $gte: budgetDateFrom, $lte: budgetDateTo },
      };

      if (budget.categoryId) {
        expenseFilter.categoryId = budget.categoryId._id;
      }

      const [expenseTotal] = await Transaction.aggregate([
        { $match: expenseFilter },
        { $group: { _id: null, amount: { $sum: '$amount' } } },
      ]);
      const spent = expenseTotal?.amount || 0;
      const percentUsed = Math.round((spent / budget.amount) * 100);

      return {
        budgetId: budget._id,
        category: budget.categoryId,
        period: budget.period,
        amount: budget.amount,
        spent,
        remaining: Math.max(budget.amount - spent, 0),
        percentUsed,
        status:
          spent >= budget.amount
            ? 'over_budget'
            : spent >= budget.amount * 0.8
              ? 'near_limit'
              : 'on_track',
      };
    }),
  );

  return {
    period: {
      dateFrom,
      dateTo,
    },
    summary,
    recentTransactions: normalizedRecentTransactions,
    budgetStatus,
  };
};

module.exports = { getDashboardService, getDashboardSummaryService };