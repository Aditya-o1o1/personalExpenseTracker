const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const generateToken = require('../utils/generateToken.utils');
const { createError, handleDuplicateError } = require('../utils/error.utils');
const RevokedToken = require('../models/revoked-token.model');
const Category = require('../models/category.model');
const defaultCategories = require('../constants/default-categories');
const { createEmailTransporter, sendEmail } = require('../utils/email.utils');

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

const hashEmailVerificationCode = (code) =>
  crypto.createHmac('sha256', process.env.JWT_SECRET).update(code).digest('hex');

const throwOtpFailure = async ({ email, attemptsField, query, invalidMessage, lockedMessage }) => {
  const updatedUser = await User.findOneAndUpdate(
    {
      ...query,
      $or: [
        { [attemptsField]: { $lt: OTP_MAX_ATTEMPTS } },
        { [attemptsField]: { $exists: false } },
      ],
    },
    { $inc: { [attemptsField]: 1 } },
    { new: true },
  ).select(`+${attemptsField}`);

  if (updatedUser) {
    if (updatedUser[attemptsField] >= OTP_MAX_ATTEMPTS) {
      throw createError(lockedMessage, 429);
    }
    throw createError(
      `${invalidMessage}. ${OTP_MAX_ATTEMPTS - updatedUser[attemptsField]} attempts remaining.`,
      400,
    );
  }

  const user = await User.findOne({ email, isDeleted: false }).select(`+${attemptsField}`);
  if (user && user[attemptsField] >= OTP_MAX_ATTEMPTS) {
    throw createError(lockedMessage, 429);
  }
  throw createError(invalidMessage, 400);
};

const registerUserService = async (data) => {
  const transporter = createEmailTransporter();
  const user = await User.findOne({ email: data.email, isDeleted: false });

  if (user) {
    throw createError('Email already exists', 409);
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);
  const code = crypto.randomInt(100000, 1000000).toString();
  const verificationToken = hashEmailVerificationCode(code);
  const verificationSentAt = new Date();
  let newUser;

  try {
    newUser = await User.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: hashedPassword,
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: new Date(verificationSentAt.getTime() + OTP_EXPIRY_MS),
      emailVerificationAttempts: 0,
      emailVerificationSentAt: verificationSentAt,
      emailVerificationResends: 0,
      emailVerificationResendWindowStart: verificationSentAt,
      dob: data.dob,
      phoneNumber: data.phoneNumber,
      gender: data.gender,
    });
  } catch (error) {
    handleDuplicateError(error, 'Email already exists');
  }

  try {
    await Category.insertMany(
      defaultCategories.map((category) => ({
        ...category,
        userId: newUser._id,
      })),
    );
    await sendEmail(
      transporter,
      newUser.email,
      'Confirm your email',
      `Your email confirmation code is ${code}. It expires in 5 minutes.`,
    );
  } catch (error) {
    await Category.deleteMany({ userId: newUser._id });
    await newUser.deleteOne();
    throw error;
  }
};

const resendVerificationService = async (email) => {
  const user = await User.findOne({
    email,
    isDeleted: false,
    isEmailVerified: false,
  }).select(
    '+emailVerificationAttempts +emailVerificationSentAt +emailVerificationResends +emailVerificationResendWindowStart',
  );

  if (!user) return;

  const now = new Date();
  const cooldownRemaining = 60 * 1000 - (now - (user.emailVerificationSentAt || 0));
  if (cooldownRemaining > 0) {
    throw createError(`Please wait ${Math.ceil(cooldownRemaining / 1000)} seconds before requesting another code`, 429);
  }

  const windowExpired =
    !user.emailVerificationResendWindowStart ||
    now - user.emailVerificationResendWindowStart >= 60 * 60 * 1000;
  if (!windowExpired && (user.emailVerificationResends || 0) >= 3) {
    throw createError('Too many confirmation code requests. Try again in an hour.', 429);
  }

  const code = crypto.randomInt(100000, 1000000).toString();
  const verificationToken = hashEmailVerificationCode(code);
  const transporter = createEmailTransporter();
  const guards = [
    user.emailVerificationSentAt
      ? { emailVerificationSentAt: user.emailVerificationSentAt }
      : { emailVerificationSentAt: { $exists: false } },
    user.emailVerificationResends > 0
      ? { emailVerificationResends: user.emailVerificationResends }
      : {
          $or: [
            { emailVerificationResends: user.emailVerificationResends || 0 },
            { emailVerificationResends: { $exists: false } },
          ],
        },
    user.emailVerificationResendWindowStart
      ? { emailVerificationResendWindowStart: user.emailVerificationResendWindowStart }
      : { emailVerificationResendWindowStart: { $exists: false } },
  ];
  const updatedUser = await User.findOneAndUpdate(
    {
      _id: user._id,
      isDeleted: false,
      isEmailVerified: false,
      $and: guards,
    },
    {
      $set: {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: new Date(now.getTime() + OTP_EXPIRY_MS),
        emailVerificationAttempts: 0,
        emailVerificationSentAt: now,
        emailVerificationResends: windowExpired ? 1 : (user.emailVerificationResends || 0) + 1,
        ...(windowExpired ? { emailVerificationResendWindowStart: now } : {}),
      },
    },
    { new: true },
  );
  if (!updatedUser) {
    throw createError('A confirmation code was just requested. Please wait before trying again.', 429);
  }

  try {
    await sendEmail(
      transporter,
      updatedUser.email,
      'Confirm your email',
      `Your email confirmation code is ${code}. It expires in 5 minutes.`,
    );
  } catch (error) {
    await User.updateOne(
      { _id: user._id, emailVerificationToken: verificationToken },
      { $unset: { emailVerificationToken: 1, emailVerificationExpires: 1 } },
    );
    throw error;
  }
};

const verifyEmailService = async ({ email, code }) => {
  const hashedCode = hashEmailVerificationCode(code);
  const user = await User.findOneAndUpdate({
    email,
    isDeleted: false,
    isEmailVerified: false,
    emailVerificationToken: hashedCode,
    emailVerificationExpires: { $gt: new Date() },
    $or: [
      { emailVerificationAttempts: { $lt: OTP_MAX_ATTEMPTS } },
      { emailVerificationAttempts: { $exists: false } },
    ],
  }, {
    $set: { isEmailVerified: true },
    $unset: {
      emailVerificationToken: 1,
      emailVerificationExpires: 1,
      emailVerificationAttempts: 1,
    },
  }, { new: true });

  if (!user) {
    await throwOtpFailure({
      email,
      attemptsField: 'emailVerificationAttempts',
      query: {
        email,
        isDeleted: false,
        isEmailVerified: false,
        emailVerificationToken: { $ne: hashedCode },
        emailVerificationExpires: { $gt: new Date() },
      },
      invalidMessage: 'Invalid or expired confirmation code',
      lockedMessage: 'Too many incorrect attempts. Request a new confirmation code.',
    });
  }
};

const loginUserService = async (data) => {
  const user = await User.findOne({ email: data.email, isDeleted: false }).select('+password');

  if (!user) {
    throw createError('Invalid Email or Password', 401);
  }

  if (!user.isEmailVerified) {
    throw createError('Please confirm your email before logging in', 403);
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.password);

  if (!isPasswordValid) {
    throw createError('Invalid Email or Password', 401);
  }

  return {
    token: generateToken(user),
    user: {
      id: user._id,
      email: user.email,
    },
  };
};

const forgotPasswordService = async (email) => {
  const user = await User.findOne({ email, isDeleted: false });

  if (!user) {
    throw createError('user not found', 404);
  }

  const transporter = createEmailTransporter();
  const code = crypto.randomInt(100000, 1000000).toString();
  user.resetPasswordToken = hashEmailVerificationCode(code);
  user.resetPasswordExpires = new Date(Date.now() + OTP_EXPIRY_MS);
  user.resetPasswordAttempts = 0;
  await user.save();

  try {
    await sendEmail(
      transporter,
      user.email,
      'Password reset code',
      `Your password reset code is ${code}. It expires in 5 minutes. If you did not request this, ignore this email.`,
    );
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.resetPasswordAttempts = undefined;
    await user.save();
    throw error;
  }
};

const resetPasswordService = async ({ email, code, password }) => {
  const hashedCode = hashEmailVerificationCode(code);
  const user = await User.findOne({
    email,
    isDeleted: false,
    resetPasswordToken: hashedCode,
    resetPasswordExpires: { $gt: new Date() },
    $or: [
      { resetPasswordAttempts: { $lt: OTP_MAX_ATTEMPTS } },
      { resetPasswordAttempts: { $exists: false } },
    ],
  }).select('+password');

  if (!user) {
    await throwOtpFailure({
      email,
      attemptsField: 'resetPasswordAttempts',
      query: {
        email,
        isDeleted: false,
        resetPasswordToken: { $ne: hashedCode },
        resetPasswordExpires: { $gt: new Date() },
      },
      invalidMessage: 'Invalid or expired reset code',
      lockedMessage: 'Too many incorrect attempts. Request a new password reset code.',
    });
  }

  if (await bcrypt.compare(password, user.password)) {
    throw createError('New password must be different from your current password', 400);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const updatedUser = await User.findOneAndUpdate(
    {
      _id: user._id,
      isDeleted: false,
      resetPasswordToken: hashedCode,
      resetPasswordExpires: { $gt: new Date() },
      $or: [
        { resetPasswordAttempts: { $lt: OTP_MAX_ATTEMPTS } },
        { resetPasswordAttempts: { $exists: false } },
      ],
    },
    {
      $set: { password: passwordHash },
      $unset: {
        resetPasswordToken: 1,
        resetPasswordExpires: 1,
        resetPasswordAttempts: 1,
      },
    },
  );
  if (!updatedUser) {
    throw createError('Invalid or expired reset code', 400);
  }
};

const logoutUserService = async ({ jti, exp }) => {
  if (!jti || !exp) {
    throw createError('Invalid or expired token', 401);
  }

  await RevokedToken.updateOne(
    { jti },
    { $setOnInsert: { jti, expiresAt: new Date(exp * 1000) } },
    { upsert: true },
  );
};

const deleteUserService = async (userId, password) => {
  const user = await User.findOne({ _id: userId, isDeleted: false }).select('+password');

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw createError('Incorrect password', 401);
  }

  const result = await User.findOneAndUpdate(
    { _id: userId, isDeleted: false },
    { isDeleted: true, deletedAt: new Date() },
    { new: true },
  );

  if (!result) {
    throw createError('User not found', 404);
  }

  return result;
};

module.exports = {
  registerUserService,
  resendVerificationService,
  verifyEmailService,
  loginUserService,
  forgotPasswordService,
  resetPasswordService,
  logoutUserService,
  deleteUserService,
};
