const {
  registerUserService,
  resendVerificationService,
  verifyEmailService,
  loginUserService,
  forgotPasswordService,
  resetPasswordService,
  logoutUserService,
  deleteUserService,
} = require('../services/auth.service');

const registerUserController = async (req, res, next) => {
  try {
    await registerUserService(req.body);

    return res.status(201).json({
      success: true,
      message: 'Confirmation code sent. Verify your email to complete registration.',
    });
  } catch (error) {
    next(error);
  }
};

const verifyEmailController = async (req, res, next) => {
  try {
    await verifyEmailService(req.body);

    return res.status(200).json({
      success: true,
      message: 'Email confirmed. You can now log in.',
    });
  } catch (error) {
    next(error);
  }
};

const resendVerificationController = async (req, res, next) => {
  try {
    await resendVerificationService(req.body.email);

    return res.status(200).json({
      success: true,
      message: 'If this address has an unconfirmed account, a new code will be sent.',
    });
  } catch (error) {
    next(error);
  }
};

const loginUserController = async (req, res, next) => {
  try {
    const result = await loginUserService(req.body);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

const forgotPasswordController = async (req, res, next) => {
  try {
    await forgotPasswordService(req.body.email);

    return res.status(200).json({
      success: true,
      message: 'If an account exists for this email, password reset instructions will be sent.',
    });
  } catch (error) {
    next(error);
  }
};

const resetPasswordController = async (req, res, next) => {
  try {
    await resetPasswordService(req.body);

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
};

const logoutUserController = async (req, res, next) => {
  try {
    await logoutUserService(req.user);

    return res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
};

const deleteUserController = async (req, res, next) => {
  try {
    const user = await deleteUserService(req.user.id, req.body.password);

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUserController,
  resendVerificationController,
  verifyEmailController,
  loginUserController,
  forgotPasswordController,
  resetPasswordController,
  logoutUserController,
  deleteUserController,
};
