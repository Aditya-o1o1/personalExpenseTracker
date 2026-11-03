const Joi = require('joi');

const objectId = Joi.string().hex().length(24);

const recurringTransactionSchema = Joi.object({
  categoryId: objectId.required(),
  type: Joi.string().valid('income', 'expense').required(),
  amount: Joi.number().positive().precision(2).required(),
  description: Joi.string().trim().max(200).allow('').default(''),
  frequency: Joi.string().valid('daily', 'weekly', 'monthly', 'yearly').required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')),
});

const recurringTransactionIdSchema = Joi.object({
  id: objectId.required(),
});

module.exports = { recurringTransactionSchema, recurringTransactionIdSchema };
