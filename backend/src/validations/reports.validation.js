const Joi = require('joi');

const reportsQuerySchema = Joi.object({
  period: Joi.string().valid('daily', 'weekly', 'monthly').default('monthly'),
  dateFrom: Joi.date().iso().max('now'),
  dateTo: Joi.date().iso().max('now').min(Joi.ref('dateFrom')),
});

module.exports = { reportsQuerySchema };
