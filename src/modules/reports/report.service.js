const { pool } = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const { PAGINATION } = require('../../utils/constants');

/**
 * Validasi bahwa target yang di-report memang ada
 */
const validateTarget = async (targetType, targetId) => {
  let table;
  switch (targetType) {
    case 'story':
      table = 'stories';
      break;
    case 'chapter':
      table = 'chapters';
      break;
    case 'comment':
      table = 'comments';
      break;
    default:
      throw ApiError.badRequest('Target type tidak valid');
  }

  const [rows] = await pool.execute(`SELECT id FROM ${table} WHERE id = ?`, [targetId]);
  if (rows.length === 0) {
    throw ApiError.notFound(`${targetType} dengan id ${targetId} tidak ditemukan`);
  }
};

/**
 * Create report — user melaporkan konten
 * reports: id, reporter_id, target_type, target_id, reason, status, created_at
 */
const createReport = async (reporterId, data) => {
  // Validasi target exist
  await validateTarget(data.target_type, data.target_id);

  // Cek apakah user sudah report target yang sama (anti-spam)
  const [existing] = await pool.execute(
    'SELECT id FROM reports WHERE reporter_id = ? AND target_type = ? AND target_id = ?',
    [reporterId, data.target_type, data.target_id]
  );

  if (existing.length > 0) {
    throw ApiError.conflict('Anda sudah pernah melaporkan konten ini');
  }

  const [result] = await pool.execute(
    'INSERT INTO reports (reporter_id, target_type, target_id, reason) VALUES (?, ?, ?, ?)',
    [reporterId, data.target_type, data.target_id, data.reason]
  );

  return getReportById(result.insertId);
};

/**
 * Get report by ID (admin)
 */
const getReportById = async (reportId) => {
  const [rows] = await pool.execute(
    `SELECT r.*, u.username as reporter_name, u.email as reporter_email
     FROM reports r
     LEFT JOIN users u ON u.id = r.reporter_id
     WHERE r.id = ?`,
    [reportId]
  );

  if (rows.length === 0) {
    throw ApiError.notFound('Report tidak ditemukan');
  }

  return rows[0];
};

/**
 * Update report status (admin)
 */
const updateReportStatus = async (reportId, status) => {
  const [rows] = await pool.execute('SELECT id FROM reports WHERE id = ?', [reportId]);

  if (rows.length === 0) {
    throw ApiError.notFound('Report tidak ditemukan');
  }

  await pool.execute('UPDATE reports SET status = ? WHERE id = ?', [status, reportId]);

  return getReportById(reportId);
};

/**
 * List reports (admin, paginated, filterable)
 */
const listReports = async (query) => {
  const page = query.page || PAGINATION.DEFAULT_PAGE;
  const limit = query.limit || PAGINATION.DEFAULT_LIMIT;
  const offset = (page - 1) * limit;

  let sql = `
    SELECT r.*, u.username as reporter_name
    FROM reports r
    LEFT JOIN users u ON u.id = r.reporter_id
  `;
  let countSql = 'SELECT COUNT(*) as total FROM reports';

  const conditions = [];
  const params = [];

  if (query.status) {
    conditions.push('r.status = ?');
    params.push(query.status);
  }

  if (query.target_type) {
    conditions.push('r.target_type = ?');
    params.push(query.target_type);
  }

  if (conditions.length > 0) {
    const where = ' WHERE ' + conditions.join(' AND ');
    sql += where;
    // countSql doesn't have 'r.' alias
    countSql += ' WHERE ' + conditions.map((c) => c.replace('r.', '')).join(' AND ');
  }

  const [countRows] = await pool.execute(countSql, params);
  const totalItems = countRows[0].total;

  sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';

  const [rows] = await pool.execute(sql, [...params, String(limit), String(offset)]);

  return {
    reports: rows,
    pagination: { page, limit, totalItems },
  };
};

/**
 * Delete report (admin)
 */
const deleteReport = async (reportId) => {
  const [rows] = await pool.execute('SELECT id FROM reports WHERE id = ?', [reportId]);

  if (rows.length === 0) {
    throw ApiError.notFound('Report tidak ditemukan');
  }

  await pool.execute('DELETE FROM reports WHERE id = ?', [reportId]);
};

module.exports = {
  createReport,
  getReportById,
  updateReportStatus,
  listReports,
  deleteReport,
};
