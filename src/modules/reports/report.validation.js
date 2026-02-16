const Joi = require('joi');

const createReport = {
  body: Joi.object({
    target_type: Joi.string().valid('story', 'chapter', 'comment').required(),
    target_id: Joi.number().integer().positive().required(),
    reason: Joi.string().trim().min(10).max(1000).required(),
  }),
};

const getReportById = {
  params: Joi.object({
    reportId: Joi.number().integer().positive().required(),
  }),
};

const updateReportStatus = {
  params: Joi.object({
    reportId: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    status: Joi.string().valid('pending', 'reviewed', 'resolved').required(),
  }),
};

const listReports = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid('pending', 'reviewed', 'resolved'),
    target_type: Joi.string().valid('story', 'chapter', 'comment'),
  }),
};

module.exports = {
  createReport,
  getReportById,
  updateReportStatus,
  listReports,
};
