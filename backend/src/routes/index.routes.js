const express = require('express');
const router = express.Router();

const auth = require('./auth.routes');
const authMiddleware = require('../middleware/auth.middleware');
const budget = require('./budgets.routes');
const categories = require('./categories.routes');
const dashboard = require('./dashboard.routes');
const profile = require('./profile.routes');
const reports = require('./reports.routes');
const recurringTransactions = require('./recurring-transactions.routes');
const transactions = require('./transactions.routes');

router.use('/auth', auth);
router.use(authMiddleware);
router.use('/budget', budget);
router.use('/category', categories);
router.use('/dashboard', dashboard);
router.use('/profile', profile);
router.use('/reports', reports);
router.use('/recurring-transactions', recurringTransactions);
router.use('/transaction', transactions);

module.exports = router;

// ! Critical warning: Check user authentication.

// ? Is this condition correct?

// todo - Add pagination to the budgets API.

// fix Handle missing categoryId.

// bug Prevent duplicate budget creation.

// hack Temporary workaround for date filtering.

// note Mongoose returns the original document by default.

// info This controller returns dashboard statistics.

// important Validate ownership before updating a budget.

// warning Check whether the budget has expired.

// security Never trust userId from the request body.

// perf Optimize this MongoDB query.

// refactor Move filtering logic into a service.

// test Add unit tests for this controller.

// debug Inspect the query before executing it.

// check Verify the request parameters.

// done Implement budget pagination.

// deprecated Replace this method with the new service.

// review Check error handling before merging.

// idea Add monthly spending charts.

// temp Remove this workaround after fixing the bug.

// * Important implementation detail.

// // This comment should appear grey and strikethrough.
