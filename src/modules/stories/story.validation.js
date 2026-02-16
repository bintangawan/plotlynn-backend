const Joi = require('joi');

const createStory = {
  body: Joi.object({
    title: Joi.string().min(1).max(150).required()
      .messages({
        'string.max': 'Judul cerita maksimal 150 karakter',
        'any.required': 'Judul cerita wajib diisi',
      }),
    synopsis: Joi.string().max(5000).allow('', null)
      .messages({ 'string.max': 'Sinopsis maksimal 5000 karakter' }),
    cover_image_url: Joi.string().uri().max(500).allow('', null)
      .messages({
        'string.uri': 'Format URL cover tidak valid',
        'string.max': 'URL cover maksimal 500 karakter',
      }),
    status: Joi.string().valid('draft', 'ongoing', 'completed').default('draft')
      .messages({ 'any.only': 'Status harus: draft, ongoing, atau completed' }),
    age_rating: Joi.string().valid('general', 'teen', 'mature').default('general')
      .messages({ 'any.only': 'Age rating harus: general, teen, atau mature' }),
    genre_ids: Joi.array().items(Joi.number().integer().positive()).max(5).default([])
      .messages({ 'array.max': 'Maksimal 5 genre per cerita' }),
    tag_ids: Joi.array().items(Joi.number().integer().positive()).max(10).default([])
      .messages({ 'array.max': 'Maksimal 10 tag per cerita' }),
  }),
};

const updateStory = {
  params: Joi.object({
    id: Joi.number().integer().positive().required()
      .messages({ 'number.base': 'ID story harus berupa angka' }),
  }),
  body: Joi.object({
    title: Joi.string().min(1).max(150)
      .messages({ 'string.max': 'Judul cerita maksimal 150 karakter' }),
    synopsis: Joi.string().max(5000).allow('', null),
    cover_image_url: Joi.string().uri().max(500).allow('', null),
    status: Joi.string().valid('draft', 'ongoing', 'completed')
      .messages({ 'any.only': 'Status harus: draft, ongoing, atau completed' }),
    age_rating: Joi.string().valid('general', 'teen', 'mature')
      .messages({ 'any.only': 'Age rating harus: general, teen, atau mature' }),
    genre_ids: Joi.array().items(Joi.number().integer().positive()).max(5)
      .messages({ 'array.max': 'Maksimal 5 genre per cerita' }),
    tag_ids: Joi.array().items(Joi.number().integer().positive()).max(10)
      .messages({ 'array.max': 'Maksimal 10 tag per cerita' }),
  }).min(1).messages({ 'object.min': 'Minimal satu field harus diisi untuk update' }),
};

const getStoryById = {
  params: Joi.object({
    id: Joi.number().integer().positive().required()
      .messages({ 'number.base': 'ID story harus berupa angka' }),
  }),
};

const getStoryBySlug = {
  params: Joi.object({
    slug: Joi.string().max(200).required()
      .messages({ 'any.required': 'Slug story wajib diisi' }),
  }),
};

const deleteStory = {
  params: Joi.object({
    id: Joi.number().integer().positive().required()
      .messages({ 'number.base': 'ID story harus berupa angka' }),
  }),
};

const listStories = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid('draft', 'ongoing', 'completed'),
    age_rating: Joi.string().valid('general', 'teen', 'mature'),
    genre: Joi.string().max(50),
    tag: Joi.string().max(50),
    writer_id: Joi.number().integer().positive(),
    search: Joi.string().max(100),
    sort: Joi.string().valid('latest', 'oldest', 'popular', 'views').default('latest'),
  }),
};

module.exports = { createStory, updateStory, getStoryById, getStoryBySlug, deleteStory, listStories };
