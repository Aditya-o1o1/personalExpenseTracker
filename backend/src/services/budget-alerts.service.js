const Budget = require('../models/budget.model');
const User = require('../models/user.model');
const { createEmailTransporter, sendEmail } = require('../utils/email.utils');
const { getBudgetUsage } = require('../utils/budget.utils');

const checkBudgetAlerts = async (userId, transactionDate) => {
  const budgets = await Budget.find({
    userId,
    isDeleted: false,
    startDate: { $lte: transactionDate },
    $or: [{ endDate: null }, { endDate: { $gte: transactionDate } }],
  });
  const user = await User.findById(userId).select('email firstName');
  if (!user || budgets.length === 0) return;

  let transporter;

  for (const budget of budgets) {
    const usage = await getBudgetUsage(budget);
    const { spent, status } = usage;

    if (budget.alertStatus === status) continue;

    if (status !== 'on_track') {
      transporter ||= createEmailTransporter();
      const alertText =
        status === 'over_budget'
          ? `Your spending has reached ${spent}, exceeding your budget of ${budget.amount}.`
          : `You have used ${Math.round((spent / budget.amount) * 100)}% of your budget (${spent} of ${budget.amount}).`;

      await sendEmail(
        transporter,
        user.email,
        status === 'over_budget' ? 'Budget limit exceeded' : 'Budget nearly reached',
        `Hello ${user.firstName},\n\n${alertText}\n\nReview your spending in your expense tracker.`,
      );
    }

    budget.alertStatus = status;
    await budget.save();
  }
};

module.exports = { checkBudgetAlerts };
