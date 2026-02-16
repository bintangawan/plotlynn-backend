const Joi = require('joi');

const toggleLike = {
  params: Joi.object({
    chapterId: Joi.number().integer().positive().required(),
  }),
};

const checkLike = {
  params: Joi.object({
    chapterId: Joi.number().integer().positive().required(),
  }),
};

const getLikesByChapter = {
  params: Joi.object({
    chapterId: Joi.number().integer().positive().required(),
  }),
};

module.exports = {
  toggleLike,
  checkLike,
  getLikesByChapter,
};
