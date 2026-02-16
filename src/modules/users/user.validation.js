const Joi = require('joi');

const updateProfile = {
  body: Joi.object({
    username: Joi.string().alphanum().min(3).max(50)
      .messages({
        'string.min': 'Username minimal 3 karakter',
        'string.max': 'Username maksimal 50 karakter',
        'string.alphanum': 'Username hanya boleh huruf dan angka',
      }),
    bio: Joi.string().max(1000).allow('', null)
      .messages({
        'string.max': 'Bio maksimal 1000 karakter',
      }),
    avatar_url: Joi.string().uri().max(500).allow('', null)
      .messages({
        'string.uri': 'Format URL avatar tidak valid',
        'string.max': 'URL avatar maksimal 500 karakter',
      }),
  }).min(1).messages({
    'object.min': 'Minimal satu field harus diisi untuk update',
  }),
};

const changePassword = {
  body: Joi.object({
    currentPassword: Joi.string().required()
      .messages({ 'any.required': 'Password saat ini wajib diisi' }),
    newPassword: Joi.string().min(8).max(255).required()
      .messages({
        'string.min': 'Password baru minimal 8 karakter',
        'any.required': 'Password baru wajib diisi',
      }),
    confirmNewPassword: Joi.string().valid(Joi.ref('newPassword')).required()
      .messages({
        'any.only': 'Konfirmasi password tidak cocok',
        'any.required': 'Konfirmasi password baru wajib diisi',
      }),
  }),
};

const getUserById = {
  params: Joi.object({
    id: Joi.number().integer().positive().required()
      .messages({ 'number.base': 'ID user harus berupa angka' }),
  }),
};

const getUserByUsername = {
  params: Joi.object({
    username: Joi.string().alphanum().min(3).max(50).required()
      .messages({ 'any.required': 'Username wajib diisi' }),
  }),
};

module.exports = { updateProfile, changePassword, getUserById, getUserByUsername };
