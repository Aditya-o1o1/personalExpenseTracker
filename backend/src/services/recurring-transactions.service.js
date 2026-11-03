const Category = require('../models/category.model');
const RecurringTransaction = require('../models/recurring-transaction.model');
const Transaction = require('../models/transaction.model');
const User = require('../models/user.model');
const { createError } = require('../utils/error.utils');
const { checkBudgetAlerts } = require('./budget-alerts.service');

const validateCategory = async (categoryId, type, userId) => {
  const category = await Category.findOne({ _id: categoryId, userId, isDeleted: false });

  if (!category) throw createError('Category not found', 404);
  if (category.type !== type) {
    throw createError('Transaction type must match category type', 400);
  }
};

const addMonths = (date, months, anchorDay) => {
  const targetMonth = date.getUTCMonth() + months;
  const target = new Date(Date.UTC(date.getUTCFullYear(), targetMonth, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();

  target.setUTCDate(Math.min(anchorDay, lastDay));
  target.setUTCHours(
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
    date.getUTCMilliseconds(),
  );
  return target;
};

const getNextRun = (schedule, currentRun) => {
  const nextRun = new Date(currentRun);

  if (schedule.frequency === 'daily') nextRun.setUTCDate(nextRun.getUTCDate() + 1);
  if (schedule.frequency === 'weekly') nextRun.setUTCDate(nextRun.getUTCDate() + 7);
  if (schedule.frequency === 'monthly') {
    return addMonths(nextRun, 1, schedule.startDate.getUTCDate());
  }
  if (schedule.frequency === 'yearly') {
    return addMonths(nextRun, 12, schedule.startDate.getUTCDate());
  }

  return nextRun;
};

const createRecurringTransactionService = async (data, userId) => {
  const startDate = new Date(data.startDate);
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);

  if (startDate < startOfToday) {
    throw createError('Start date cannot be in the past', 400);
  }

  const nextRun = getNextRun({ frequency: data.frequency, startDate }, startDate);
  if (data.endDate && new Date(data.endDate) < nextRun) {
    throw createError('End date must be on or after the first scheduled transaction', 400);
  }

  await validateCategory(data.categoryId, data.type, userId);

  const schedule = await RecurringTransaction.create({
    ...data,
    userId,
    nextRun,
  });

  return schedule;
};

const listRecurringTransactionsService = async (userId) =>
  RecurringTransaction.find({ userId }).sort({ nextRun: 1 });

const advanceLegacyInitialRuns = async () => {
  const schedules = await RecurringTransaction.find({
    isActive: true,
    $expr: { $eq: ['$nextRun', '$startDate'] },
  });

  for (const schedule of schedules) {
    const nextRun = getNextRun(schedule, schedule.startDate);
    const update =
      schedule.endDate && nextRun > schedule.endDate
        ? { isActive: false }
        : { nextRun };

    await RecurringTransaction.updateOne(
      { _id: schedule._id, isActive: true, nextRun: schedule.startDate },
      update,
    );
  }
};

const deleteRecurringTransactionService = async (id, userId) => {
  const schedule = await RecurringTransaction.findOneAndUpdate(
    { _id: id, userId, isActive: true },
    { isActive: false },
    { new: true },
  );

  if (!schedule) throw createError('Active recurring transaction not found', 404);
  return schedule;
};

const processDueRecurringTransactions = async () => {
  await advanceLegacyInitialRuns();

  const now = new Date();
  const schedules = await RecurringTransaction.find({
    isActive: true,
    nextRun: { $lte: now },
  })
    .sort({ nextRun: 1 })
    .limit(100);

  for (const schedule of schedules) {
    try {
      const occurrenceDate = new Date(schedule.nextRun);

      if (schedule.endDate && occurrenceDate > schedule.endDate) {
        await RecurringTransaction.updateOne(
          { _id: schedule._id, nextRun: occurrenceDate },
          { isActive: false },
        );
        continue;
      }

      const user = await User.findOne({ _id: schedule.userId, isDeleted: false });
      if (!user) {
        await RecurringTransaction.updateOne(
          { _id: schedule._id, nextRun: occurrenceDate },
          { isActive: false },
        );
        continue;
      }

      try {
        await Transaction.create({
          userId: schedule.userId,
          categoryId: schedule.categoryId,
          type: schedule.type,
          amount: schedule.amount,
          description: schedule.description,
          date: occurrenceDate,
          recurringScheduleId: schedule._id,
          recurrenceDate: occurrenceDate,
        });
      } catch (error) {
        if (error.code !== 11000) throw error;
      }

      const nextRun = getNextRun(schedule, occurrenceDate);
      const update =
        schedule.endDate && nextRun > schedule.endDate
          ? { isActive: false }
          : { nextRun };

      const advanceResult = await RecurringTransaction.updateOne(
        { _id: schedule._id, nextRun: occurrenceDate },
        update,
      );

      if (advanceResult.modifiedCount && schedule.type === 'expense') {
        await checkBudgetAlerts(schedule.userId, occurrenceDate);
      }
    } catch (error) {
      console.error(`Failed recurring transaction schedule ${schedule._id}`, error);
    }
  }
};

module.exports = {
  createRecurringTransactionService,
  listRecurringTransactionsService,
  deleteRecurringTransactionService,
  processDueRecurringTransactions,
  getNextRun,
};
