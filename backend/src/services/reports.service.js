const mongoose = require('mongoose');
const Transaction = require('../models/transaction.model');

const getReportDateRange = (period, filters = {}) => {
  const dateTo = filters.dateTo || new Date();
  const endDate = new Date(dateTo);

  if (
    filters.dateTo &&
    endDate.getUTCHours() === 0 &&
    endDate.getUTCMinutes() === 0 &&
    endDate.getUTCSeconds() === 0 &&
    endDate.getUTCMilliseconds() === 0
  ) {
    endDate.setUTCHours(23, 59, 59, 999);
  }

  let dateFrom = filters.dateFrom && new Date(filters.dateFrom);

  if (!dateFrom) {
    dateFrom = new Date(endDate);
    if (period === 'daily') {
      dateFrom.setUTCDate(dateFrom.getUTCDate() - 29);
      dateFrom.setUTCHours(0, 0, 0, 0);
    } else if (period === 'weekly') {
      dateFrom.setUTCDate(dateFrom.getUTCDate() - ((dateFrom.getUTCDay() + 6) % 7));
      dateFrom.setUTCDate(dateFrom.getUTCDate() - 77);
      dateFrom.setUTCHours(0, 0, 0, 0);
    } else {
      dateFrom.setUTCDate(1);
      dateFrom.setUTCMonth(dateFrom.getUTCMonth() - 11);
      dateFrom.setUTCHours(0, 0, 0, 0);
    }
  }

  return { dateFrom, dateTo: endDate };
};

const getReportsService = async (userId, filters = {}) => {
  const period = filters.period || 'monthly';
  const { dateFrom, dateTo } = getReportDateRange(period, filters);
  const [unit, startOfWeek] =
    period === 'weekly' ? ['week', 'monday'] : [period === 'daily' ? 'day' : 'month', undefined];

  const summaries = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        isDeleted: false,
        date: { $gte: dateFrom, $lte: dateTo },
      },
    },
    {
      $group: {
        _id: {
          $dateTrunc: {
            date: '$date',
            unit,
            ...(startOfWeek ? { startOfWeek } : {}),
            timezone: 'UTC',
          },
        },
        income: {
          $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] },
        },
        expenses: {
          $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] },
        },
        transactionCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        date: '$_id',
        income: 1,
        expenses: 1,
        balance: { $subtract: ['$income', '$expenses'] },
        transactionCount: 1,
      },
    },
  ]);

  const summary = summaries.reduce(
    (totals, item) => ({
      income: totals.income + item.income,
      expenses: totals.expenses + item.expenses,
      balance: totals.balance + item.balance,
      transactionCount: totals.transactionCount + item.transactionCount,
    }),
    { income: 0, expenses: 0, balance: 0, transactionCount: 0 },
  );

  return {
    period: { type: period, dateFrom, dateTo },
    summary,
    summaries,
  };
};

module.exports = { getReportsService };
