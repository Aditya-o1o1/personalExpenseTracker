const express = require('express');
const router = express.Router();

const { isValid } = require('../middleware/validation.middleware');
const authMiddleware = require('../middleware/auth.middleware');
const {
  registerSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  loginSchema,
  deleteAccountSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../validations/user.validation.js');
const {
  registerUserController,
  resendVerificationController,
  verifyEmailController,
  loginUserController,
  forgotPasswordController,
  resetPasswordController,
  logoutUserController,
  deleteUserController,
} = require('../controllers/auth.controller.js');

router.post('/register', isValid(registerSchema), registerUserController);
router.post('/verify-email', isValid(verifyEmailSchema), verifyEmailController);
router.post(
  '/resend-verification',
  isValid(resendVerificationSchema),
  resendVerificationController,
);
router.post('/login', isValid(loginSchema), loginUserController);
router.post('/forgot-password', isValid(forgotPasswordSchema), forgotPasswordController);
router.post('/reset-password', isValid(resetPasswordSchema), resetPasswordController);
router.post('/logout', authMiddleware, logoutUserController);
router.delete('/deleteAccount', authMiddleware, isValid(deleteAccountSchema), deleteUserController);

module.exports = router;
