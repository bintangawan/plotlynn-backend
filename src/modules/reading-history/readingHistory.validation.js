const Joi = require('joi');

const upsertHistory = {
  body: Joi.object({
    story_id: Joi.number().integer().positive().required(),
    last_read_chapter_id: Joi.number().integer().positive().required(),
  }),
};

const getMyHistory = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

const deleteHistory = {
  params: Joi.object({
    storyId: Joi.number().integer().positive().required(),
  }),
};

module.exports = {
  upsertHistory,
  getMyHistory,
  deleteHistory,
};
