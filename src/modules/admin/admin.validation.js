const Joi = require('joi');

const updateUserRole = {
  params: Joi.object({
    id: Joi.number().integer().positive().required()
      .messages({ 'number.base': 'ID user harus berupa angka' }),
  }),
  body: Joi.object({
    role: Joi.string().valid('reader', 'writer', 'admin').required()
      .messages({
        'any.only': 'Role harus salah satu dari: reader, writer, admin',
        'any.required': 'Role wajib diisi',
      }),
  }),
};

const updateReportStatus = {
  params: Joi.object({
    id: Joi.number().integer().positive().required()
      .messages({ 'number.base': 'ID report harus berupa angka' }),
  }),
  body: Joi.object({
    status: Joi.string().valid('pending', 'reviewed', 'resolved').required()
      .messages({
        'any.only': 'Status harus salah satu dari: pending, reviewed, resolved',
        'any.required': 'Status wajib diisi',
      }),
  }),
};

const deleteUser = {
  params: Joi.object({
    id: Joi.number().integer().positive().required()
      .messages({ 'number.base': 'ID user harus berupa angka' }),
  }),
};

const getUserById = {
  params: Joi.object({
    id: Joi.number().integer().positive().required()
      .messages({ 'number.base': 'ID user harus berupa angka' }),
  }),
};

const manageGenre = {
  body: Joi.object({
    name: Joi.string().min(2).max(50).required()
      .messages({
        'string.min': 'Nama genre minimal 2 karakter',
        'string.max': 'Nama genre maksimal 50 karakter',
        'any.required': 'Nama genre wajib diisi',
      }),
  }),
};

const manageTag = {
  body: Joi.object({
    name: Joi.string().min(2).max(50).required()
      .messages({
        'string.min': 'Nama tag minimal 2 karakter',
        'string.max': 'Nama tag maksimal 50 karakter',
        'any.required': 'Nama tag wajib diisi',
      }),
  }),
};

const idParam = {
  params: Joi.object({
    id: Joi.number().integer().positive().required()
      .messages({ 'number.base': 'ID harus berupa angka' }),
  }),
};

module.exports = {
  updateUserRole,
  updateReportStatus,
  deleteUser,
  getUserById,
  manageGenre,
  manageTag,
  idParam,
};
