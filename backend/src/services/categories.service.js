const Category = require('../models/category.model');
const { handleDuplicateError, createError } = require('../utils/error.utils');
const { escapeRegex, getPagination, getPaginationInfo } = require('../utils/listing.utils');

const addCategoryService = async (data, userId) => {
  const existingCategory = await Category.findOne({
    userId,
    name: data.name,
    type: data.type,
    isDeleted: false,
  });

  if (existingCategory) {
    throw createError('Category already exists', 409);
  }

  try {
    const deletedCategory = await Category.findOneAndUpdate(
      { userId, name: data.name, type: data.type, isDeleted: true },
      { isDeleted: false, deletedAt: null },
      { new: true, sort: { updatedAt: -1 } },
    );

    if (deletedCategory) {
      return deletedCategory.populate('userId', 'firstName lastName email');
    }

    const category = await Category.create({
      name: data.name,
      type: data.type,
      userId,
    });

    return category.populate('userId', 'firstName lastName email');
  } catch (error) {
    handleDuplicateError(error, 'Category already exists');
  }
};

const allCategoriesService = async (userId, filters) => {
  const { page, limit, skip } = getPagination(filters);
  const query = { userId, isDeleted: false };

  if (filters.type) query.type = filters.type;
  if (filters.search) query.name = new RegExp(escapeRegex(filters.search), 'i');

  const [items, total] = await Promise.all([
    Category.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'firstName lastName email'),
    Category.countDocuments(query),
  ]);

  return {
    items,
    pagination: getPaginationInfo(page, limit, total),
  };
};

const categoryByIdService = async (id, userId) => {
  const category = await Category.findOne({
    _id: id,
    userId,
    isDeleted: false,
  }).populate('userId', 'firstName lastName email');

  if (!category) {
    throw createError('Category not found', 404);
  }

  return category;
};

const updateCategoryService = async (id, data, userId) => {
  if (!id) {
    throw createError('Category id is required', 400);
  }

  const updates = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.type !== undefined) updates.type = data.type;

  if (Object.keys(updates).length === 0) {
    throw createError('At least one category field is required', 400);
  }

  const category = await Category.findOne({
    _id: id,
    userId,
    isDeleted: false,
  });

  if (!category) {
    throw createError('Category not found', 404);
  }

  Object.assign(category, updates);
  try {
    await category.save();
    return category.populate('userId', 'firstName lastName email');
  } catch (error) {
    handleDuplicateError(error, 'Category already exists');
  }
};

const deleteCategoryService = async (id, userId) => {
  const category = await Category.findOneAndUpdate(
    { _id: id, userId, isDeleted: false },
    { isDeleted: true, deletedAt: new Date() },
    { new: true },
  ).populate('userId', 'firstName lastName email');

  if (!category) {
    throw createError('Category not found', 404);
  }

  return category;
};

module.exports = {
  addCategoryService,
  allCategoriesService,
  categoryByIdService,
  updateCategoryService,
  deleteCategoryService,
};
