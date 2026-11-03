const express = require('express');
const router = express.Router();

const { isValid } = require('../middleware/validation.middleware');
const {
  getProfileController,
  updateProfileController,
} = require('../controllers/profile.controller');
const { profileUpdateSchema } = require('../validations/user.validation');

router.get('/', getProfileController);
router.put('/', isValid(profileUpdateSchema), updateProfileController);

module.exports = router;
