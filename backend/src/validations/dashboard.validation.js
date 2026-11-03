const Joi = require('joi');

const dashboardQuerySchema = Joi.object({
  dateFrom: Joi.date().iso().max('now'),
  dateTo: Joi.date().iso().max('now').min(Joi.ref('dateFrom')),
});

module.exports = { dashboardQuerySchema };
