const Joi = require('joi');

const toggleBookmark = {
  params: Joi.object({
    storyId: Joi.number().integer().positive().required(),
  }),
};

const getMyBookmarks = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

const checkBookmark = {
  params: Joi.object({
    storyId: Joi.number().integer().positive().required(),
  }),
};

module.exports = {
  toggleBookmark,
  getMyBookmarks,
  checkBookmark,
};
