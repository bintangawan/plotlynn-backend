const Joi = require('joi');

const getMyNotifications = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    type: Joi.string().valid('new_chapter', 'follow', 'comment', 'like', 'system'),
    is_read: Joi.number().integer().valid(0, 1),
  }),
};

const markAsRead = {
  params: Joi.object({
    notificationId: Joi.number().integer().positive().required(),
  }),
};

const subscribePush = {
  body: Joi.object({
    endpoint: Joi.string().uri().required(),
    keys: Joi.object({
      p256dh: Joi.string().required(),
      auth: Joi.string().required(),
    }).required(),
  }),
};

module.exports = {
  getMyNotifications,
  markAsRead,
  subscribePush,
};
