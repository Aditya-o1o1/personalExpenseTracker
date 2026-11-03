const Joi = require('joi');

const objectId = Joi.string().hex().length(24);
const paginationFields = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().trim().max(100),
};

const budgetSchema = Joi.object({
  categoryId: objectId.allow(null).default(null),
  amount: Joi.number().positive().precision(2).required(),
  period: Joi.string().valid('weekly', 'monthly', 'yearly').default('monthly'),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).allow(null).default(null),
});

const updateBudgetSchema = Joi.object({
  categoryId: objectId.allow(null),
  amount: Joi.number().positive().precision(2),
  period: Joi.string().valid('weekly', 'monthly', 'yearly'),
  startDate: Joi.date().iso(),
  endDate: Joi.alternatives().conditional('startDate', {
    is: Joi.exist(),
    then: Joi.date().iso().greater(Joi.ref('startDate')).allow(null),
    otherwise: Joi.date().iso().allow(null),
  }),
})
  .min(1)
  .required();

const budgetListingSchema = Joi.object({
  ...paginationFields,
  categoryId: objectId,
  period: Joi.string().valid('weekly', 'monthly', 'yearly'),
  startDateFrom: Joi.date().iso(),
  startDateTo: Joi.date().iso().min(Joi.ref('startDateFrom')),
});

const budgetIdSchema = Joi.object({
  id: objectId.required(),
});

module.exports = {
  budgetSchema,
  updateBudgetSchema,
  budgetListingSchema,
  budgetIdSchema,
};
