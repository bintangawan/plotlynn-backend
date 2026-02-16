const Joi = require('joi');

const toggleFollow = {
  params: Joi.object({
    userId: Joi.number().integer().positive().required(),
  }),
};

const getFollowers = {
  params: Joi.object({
    userId: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

const getFollowing = {
  params: Joi.object({
    userId: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

const checkFollow = {
  params: Joi.object({
    userId: Joi.number().integer().positive().required(),
  }),
};

module.exports = {
  toggleFollow,
  getFollowers,
  getFollowing,
  checkFollow,
};
