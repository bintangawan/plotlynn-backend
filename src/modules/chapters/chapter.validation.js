const Joi = require('joi');

const createChapter = {
  params: Joi.object({
    storyId: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    title: Joi.string().trim().max(150).required(),
    content: Joi.string().allow('', null),
    is_published: Joi.boolean().default(false),
  }),
};

const updateChapter = {
  params: Joi.object({
    storyId: Joi.number().integer().positive().required(),
    chapterId: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    title: Joi.string().trim().max(150),
    content: Joi.string().allow('', null),
    is_published: Joi.boolean(),
  }).min(1),
};

const getChapter = {
  params: Joi.object({
    storyId: Joi.number().integer().positive().required(),
    chapterId: Joi.number().integer().positive().required(),
  }),
};

const deleteChapter = {
  params: Joi.object({
    storyId: Joi.number().integer().positive().required(),
    chapterId: Joi.number().integer().positive().required(),
  }),
};

const listChapters = {
  params: Joi.object({
    storyId: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

module.exports = {
  createChapter,
  updateChapter,
  getChapter,
  deleteChapter,
  listChapters,
};
