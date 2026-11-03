const {
  getDashboardService,
  getDashboardSummaryService,
} = require('../services/dashboard.service');

const dashboardController = async (req, res, next) => {
  try {
    const dashboard = await getDashboardService(req.user.id, req.validatedQuery);

    return res.status(200).json({
      success: true,
      message: 'Dashboard fetched successfully',
      dashboard,
    });
  } catch (error) {
    next(error);
  }
};

const dashboardSummaryController = async (req, res, next) => {
  try {
    const dashboard = await getDashboardSummaryService(req.user.id, req.validatedQuery);

    return res.status(200).json({
      success: true,
      message: 'Dashboard summary fetched successfully',
      period: dashboard.period,
      summary: dashboard.summary,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { dashboardController, dashboardSummaryController };
