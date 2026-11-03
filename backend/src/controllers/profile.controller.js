const { getProfileService, updateProfileService } = require('../services/profile.service');

const formatProfile = (user) => ({
  id: user._id.toString(),
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  dob: user.dob,
  phoneNumber: user.phoneNumber,
  gender: user.gender,
});

const getProfileController = async (req, res, next) => {
  try {
    const user = await getProfileService(req.user.id);

    return res.status(200).json({
      success: true,
      profile: formatProfile(user),
    });
  } catch (error) {
    next(error);
  }
};

const updateProfileController = async (req, res, next) => {
  try {
    const user = await updateProfileService(req.user.id, req.body);

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile: formatProfile(user),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfileController, updateProfileController };
