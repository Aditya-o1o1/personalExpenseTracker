const bcrypt = require('bcrypt');
const User = require('../models/user.model');
const { createError, handleDuplicateError } = require('../utils/error.utils');

const profileFields = ['firstName', 'lastName', 'email', 'dob', 'phoneNumber', 'gender'];

const getProfileService = async (userId) => {
  const user = await User.findOne({ _id: userId, isDeleted: false });

  if (!user) {
    throw createError('User not found', 404);
  }

  return user;
};

const updateProfileService = async (userId, data) => {
  const userQuery = User.findOne({ _id: userId, isDeleted: false });
  if (data.password) userQuery.select('+password');
  const user = await userQuery;

  if (!user) {
    throw createError('User not found', 404);
  }

  if (data.password) {
    const isCurrentPasswordValid = await bcrypt.compare(data.currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      throw createError('Current password is incorrect', 401);
    }

    const isNewPasswordSame = await bcrypt.compare(data.password, user.password);

    if (isNewPasswordSame) {
      throw createError('New password must be different from your current password', 400);
    }

    user.password = await bcrypt.hash(data.password, 12);
  }

  for (const field of profileFields) {
    if (data[field] !== undefined) {
      user[field] = data[field];
    }
  }

  try {
    return await user.save();
  } catch (error) {
    handleDuplicateError(error, 'Email already exists');
  }
};

module.exports = { getProfileService, updateProfileService };
