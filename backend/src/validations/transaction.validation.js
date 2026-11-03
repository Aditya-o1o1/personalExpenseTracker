const Joi = require('joi');

const objectId = Joi.string().hex().length(24);

const transactionFields = {
  categoryId: objectId.required(),
  type: Joi.string().valid('income', 'expense').required(),
  amount: Joi.number().positive().precision(2).required(),
  description: Joi.string().trim().max(200).allow('').default(''),
  date: Joi.date()
    .iso()
    .max('now')
    .default(() => new Date()),
};

const transactionSchema = Joi.object(transactionFields);
const transactionUpdateSchema = Joi.object({
  categoryId: objectId,
  type: Joi.string().valid('income', 'expense'),
  amount: Joi.number().positive().precision(2),
  description: Joi.string().trim().max(200).allow(''),
  date: Joi.date().iso().max('now'),
})
  .min(1)
  .required();

const transactionIdSchema = Joi.object({
  id: objectId.required(),
});

const transactionListingSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().trim().max(100),
  categoryId: objectId,
  type: Joi.string().valid('income', 'expense'),
  dateFrom: Joi.date().iso(),
  dateTo: Joi.date().iso().min(Joi.ref('dateFrom')),
});

module.exports = {
  transactionSchema,
  transactionUpdateSchema,
  transactionIdSchema,
  transactionListingSchema,
};
