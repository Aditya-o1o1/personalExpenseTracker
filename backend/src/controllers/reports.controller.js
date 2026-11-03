const { getReportsService } = require('../services/reports.service');

const reportsController = async (req, res, next) => {
  try {
    const report = await getReportsService(req.user.id, req.validatedQuery);

    return res.status(200).json({
      success: true,
      message: 'Financial report fetched successfully',
      report,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { reportsController };