const {
  createBudgetService,
  allBudgetService,
  budgetByIdService,
  updateBudgetService,
  deleteBudgetService,
} = require('../services/budgets.service');

const createBudgetController = async (req, res, next) => {
  try {
    const budget = await createBudgetService(req.body, req.user.id);

    return res.status(201).json({
      success: true,
      message: 'Budget created successfully',
      Budget: budget,
    });
  } catch (error) {
    next(error);
  }
};

const allBudgetController = async (req, res, next) => {
  try {
    const { items, pagination } = await allBudgetService(req.user.id, req.validatedQuery);

    return res.status(200).json({
      success: true,
      message: 'All Budget fetched successfully',
      Budget: items,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

const budgetByIdController = async (req, res, next) => {
  try {
    const budget = await budgetByIdService(req.params.id, req.user.id);

    return res.status(200).json({
      success: true,
      message: 'Budget fetched successfully',
      Budget: budget,
    });
  } catch (error) {
    next(error);
  }
};

const updateBudgetController = async (req, res, next) => {
  try {
    const budget = await updateBudgetService(req.body, req.params.id, req.user.id);

    return res.status(200).json({
      success: true,
      message: 'Budget updated successfully',
      updatedBudget: budget,
    });
  } catch (error) {
    next(error);
  }
};

const deleteBudgetController = async (req, res, next) => {
  try {
    const budget = await deleteBudgetService(req.params.id, req.user.id);

    return res.status(200).json({
      success: true,
      message: 'Budget deleted successfully',
      deletedBudget: budget,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBudgetController,
  allBudgetController,
  budgetByIdController,
  updateBudgetController,
  deleteBudgetController,
};
