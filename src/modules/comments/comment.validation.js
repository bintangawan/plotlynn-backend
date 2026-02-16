const Joi = require('joi');

const createComment = {
  params: Joi.object({
    chapterId: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    content: Joi.string().trim().min(1).max(2000).required(),
    parent_id: Joi.number().integer().positive().allow(null).default(null),
  }),
};

const updateComment = {
  params: Joi.object({
    commentId: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    content: Joi.string().trim().min(1).max(2000).required(),
  }),
};

const deleteComment = {
  params: Joi.object({
    commentId: Joi.number().integer().positive().required(),
  }),
};

const getCommentsByChapter = {
  params: Joi.object({
    chapterId: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

const flagComment = {
  params: Joi.object({
    commentId: Joi.number().integer().positive().required(),
  }),
};

module.exports = {
  createComment,
  updateComment,
  deleteComment,
  getCommentsByChapter,
  flagComment,
};
