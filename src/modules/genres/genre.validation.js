const Joi = require('joi');

const getBySlug = {
  params: Joi.object({
    slug: Joi.string().max(50).required()
      .messages({ 'any.required': 'Slug genre wajib diisi' }),
  }),
};

module.exports = { getBySlug };
