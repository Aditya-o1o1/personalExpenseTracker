const express = require('express');
const router = express.Router();

const { isValid } = require('../middleware/validation.middleware');
const { dashboardQuerySchema } = require('../validations/dashboard.validation');
const {
  dashboardController,
  dashboardSummaryController,
} = require('../controllers/dashboard.controller');

router.get('/', isValid(dashboardQuerySchema, 'query'), dashboardController);
router.get('/summary', isValid(dashboardQuerySchema, 'query'), dashboardSummaryController);

module.exports = router;
