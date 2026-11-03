const Transaction = require('../models/transaction.model');

const getBudgetUsage = async (budget, asOf = new Date()) => {
  const dateTo =
    budget.endDate && budget.endDate < asOf ? budget.endDate : asOf;

  if (budget.startDate > dateTo) {
    return {
      spent: 0,
      remaining: budget.amount,
      percentUsed: 0,
      status: 'on_track',
    };
  }

  const transactionFilter = {
    userId: budget.userId,
    isDeleted: false,
    type: 'expense',
    date: { $gte: budget.startDate, $lte: dateTo },
  };

  if (budget.categoryId) transactionFilter.categoryId = budget.categoryId;

  const [total] = await Transaction.aggregate([
    { $match: transactionFilter },
    { $group: { _id: null, amount: { $sum: '$amount' } } },
  ]);
  const spent = total?.amount || 0;

  return {
    spent,
    remaining: Math.max(budget.amount - spent, 0),
    percentUsed: Math.round((spent / budget.amount) * 100),
    status:
      spent >= budget.amount
        ? 'over_budget'
        : spent >= budget.amount * 0.8
          ? 'near_limit'
          : 'on_track',
  };
};

const addBudgetUsage = async (budget) => {
  const usage = await getBudgetUsage(budget);

  return {
    ...(budget.toObject ? budget.toObject() : budget),
    ...usage,
    alertStatus: usage.status,
  };
};

module.exports = { getBudgetUsage, addBudgetUsage };
