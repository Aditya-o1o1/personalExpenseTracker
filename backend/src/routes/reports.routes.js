const express = require('express');
const router = express.Router();

const { isValid } = require('../middleware/validation.middleware');
const { reportsQuerySchema } = require('../validations/reports.validation');
const { reportsController } = require('../controllers/reports.controller');

router.get('/summary', isValid(reportsQuerySchema, 'query'), reportsController);

module.exports = router;
