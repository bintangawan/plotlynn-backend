/**
 * Application Constants
 * Enum & magic values yang digunakan di seluruh app
 */

// User Roles (sesuai ENUM di tabel users)
const ROLES = {
  READER: 'reader',
  WRITER: 'writer',
  ADMIN: 'admin',
};

// Story Status (sesuai ENUM di tabel stories)
const STORY_STATUS = {
  DRAFT: 'draft',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
};

// Age Rating (sesuai ENUM di tabel stories)
const AGE_RATING = {
  GENERAL: 'general',
  TEEN: 'teen',
  MATURE: 'mature',
};

// Notification Types (sesuai ENUM di tabel notifications)
const NOTIFICATION_TYPES = {
  NEW_CHAPTER: 'new_chapter',
  FOLLOW: 'follow',
  COMMENT: 'comment',
  LIKE: 'like',
  SYSTEM: 'system',
};

// Notification Reference Types (sesuai ENUM di tabel notifications)
const REFERENCE_TYPES = {
  STORY: 'story',
  CHAPTER: 'chapter',
  COMMENT: 'comment',
  USER: 'user',
};

// Report Target Types (sesuai ENUM di tabel reports)
const REPORT_TARGETS = {
  STORY: 'story',
  CHAPTER: 'chapter',
  COMMENT: 'comment',
};

// Report Status (sesuai ENUM di tabel reports)
const REPORT_STATUS = {
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  RESOLVED: 'resolved',
};

// Pagination defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

module.exports = {
  ROLES,
  STORY_STATUS,
  AGE_RATING,
  NOTIFICATION_TYPES,
  REFERENCE_TYPES,
  REPORT_TARGETS,
  REPORT_STATUS,
  PAGINATION,
};
