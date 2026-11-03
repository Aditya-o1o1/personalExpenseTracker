const Joi = require('joi');

const categorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
  type: Joi.string().valid('income', 'expense').required(),
});

const categoryListingSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().trim().max(100),
  type: Joi.string().valid('income', 'expense'),
});

const categoryUpdateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50),
  type: Joi.string().valid('income', 'expense'),
})
  .min(1)
  .required();

const categoryIdSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

module.exports = {
  categorySchema,
  categoryListingSchema,
  categoryUpdateSchema,
  categoryIdSchema,
};
