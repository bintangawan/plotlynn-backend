const Joi = require('joi');

const register = {
  body: Joi.object({
    username: Joi.string().alphanum().min(3).max(50).required()
      .messages({
        'string.min': 'Username minimal 3 karakter',
        'string.max': 'Username maksimal 50 karakter',
        'string.alphanum': 'Username hanya boleh huruf dan angka',
        'any.required': 'Username wajib diisi',
      }),
    email: Joi.string().email().max(100).required()
      .messages({
        'string.email': 'Format email tidak valid',
        'any.required': 'Email wajib diisi',
      }),
    password: Joi.string().min(8).max(255).required()
      .messages({
        'string.min': 'Password minimal 8 karakter',
        'any.required': 'Password wajib diisi',
      }),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
      .messages({
        'any.only': 'Konfirmasi password tidak cocok',
        'any.required': 'Konfirmasi password wajib diisi',
      }),
  }),
};

const login = {
  body: Joi.object({
    email: Joi.string().email().required()
      .messages({
        'string.email': 'Format email tidak valid',
        'any.required': 'Email wajib diisi',
      }),
    password: Joi.string().required()
      .messages({
        'any.required': 'Password wajib diisi',
      }),
  }),
};

module.exports = { register, login };
