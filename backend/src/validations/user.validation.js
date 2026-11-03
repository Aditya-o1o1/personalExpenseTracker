const joi = require('joi');

const registerSchema = joi.object({
  firstName: joi.string().trim().min(2).max(50).required(),
  lastName: joi.string().trim().min(2).max(50).required(),
  email: joi.string().lowercase().email().required(),
  password: joi.string().min(8).max(128).required(),
  dob: joi.date().iso().max('now').required(),
  phoneNumber: joi
    .string()
    .trim()
    .pattern(/^[0-9+() -]{7,20}$/)
    .allow(''),
  gender: joi.string().valid('male', 'female', 'other').default('other'),
});

const verifyEmailSchema = joi.object({
  email: joi.string().lowercase().trim().email().required(),
  code: joi
    .string()
    .pattern(/^[0-9]{6}$/)
    .required(),
});

const resendVerificationSchema = joi.object({
  email: joi.string().lowercase().trim().email().required(),
});

const loginSchema = joi.object({
  email: joi.string().lowercase().trim().email().required(),
  password: joi.string().required(),
});

const deleteAccountSchema = joi.object({
  password: joi.string().required(),
});

const forgotPasswordSchema = joi.object({
  email: joi.string().lowercase().trim().email().required(),
});

const resetPasswordSchema = joi.object({
  email: joi.string().lowercase().trim().email().required(),
  code: joi
    .string()
    .pattern(/^[0-9]{6}$/)
    .required(),
  password: joi.string().min(8).max(128).required(),
});

const profileUpdateSchema = joi
  .object({
    firstName: joi.string().trim().min(2).max(50),
    lastName: joi.string().trim().min(2).max(50),
    email: joi.string().lowercase().trim().email(),
    dob: joi.date().iso().max('now'),
    phoneNumber: joi
      .string()
      .trim()
      .pattern(/^[0-9+() -]{7,20}$/)
      .allow(''),
    gender: joi.string().valid('male', 'female', 'other'),
    currentPassword: joi.when('password', {
      is: joi.exist(),
      then: joi.string().required(),
      otherwise: joi.forbidden(),
    }),
    password: joi.string().min(8).max(128),
  })
  .min(1)
  .required();

module.exports = {
  registerSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  loginSchema,
  deleteAccountSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  profileUpdateSchema,
};
