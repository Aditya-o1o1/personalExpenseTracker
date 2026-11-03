const {
  addCategoryService,
  allCategoriesService,
  categoryByIdService,
  updateCategoryService,
  deleteCategoryService,
} = require('../services/categories.service');

const formatCategory = (category) => ({
  id: category._id.toString(),
  name: category.name,
  type: category.type,
  user: category.userId
    ? {
        id: category.userId._id.toString(),
        firstName: category.userId.firstName,
        lastName: category.userId.lastName,
        email: category.userId.email,
      }
    : null,
});

const addCategoryController = async (req, res, next) => {
  try {
    const category = await addCategoryService(req.body, req.user.id);

    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category: formatCategory(category),
    });
  } catch (error) {
    next(error);
  }
};

const allCategoriesController = async (req, res, next) => {
  try {
    const { items, pagination } = await allCategoriesService(req.user.id, req.validatedQuery);

    return res.status(200).json({
      success: true,
      message: 'All Categories',
      categories: items.map(formatCategory),
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

const categoryByIdController = async (req, res, next) => {
  try {
    const category = await categoryByIdService(req.params.id, req.user.id);

    return res.status(200).json({
      success: true,
      message: 'category fetched successfully',
      category: formatCategory(category),
    });
  } catch (error) {
    next(error);
  }
};

const updateCategoryController = async (req, res, next) => {
  try {
    const category = await updateCategoryService(req.params.id, req.body, req.user.id);

    return res.status(200).json({
      success: true,
      message: 'category updated successfully',
      category: formatCategory(category),
    });
  } catch (error) {
    next(error);
  }
};

const deleteCategoryController = async (req, res, next) => {
  try {
    const category = await deleteCategoryService(req.params.id, req.user.id);

    return res.status(200).json({
      success: true,
      message: 'category deleted successfully',
      category: formatCategory(category),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addCategoryController,
  allCategoriesController,
  categoryByIdController,
  updateCategoryController,
  deleteCategoryController,
};
