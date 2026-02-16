/**
 * Standardized API Response helper
 *
 * Contoh:
 *   ApiResponse.success(res, data, 'Berhasil mengambil data');
 *   ApiResponse.created(res, data, 'Story berhasil dibuat');
 *   ApiResponse.noContent(res);
 */
class ApiResponse {
  /**
   * 200 OK
   */
  static success(res, data = null, message = 'Success') {
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message,
      data,
    });
  }

  /**
   * 201 Created
   */
  static created(res, data = null, message = 'Created successfully') {
    return res.status(201).json({
      success: true,
      statusCode: 201,
      message,
      data,
    });
  }

  /**
   * 204 No Content
   */
  static noContent(res) {
    return res.status(204).send();
  }

  /**
   * Paginated response (untuk list endpoints)
   */
  static paginated(res, data, pagination, message = 'Success') {
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message,
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        totalItems: pagination.totalItems,
        totalPages: Math.ceil(pagination.totalItems / pagination.limit),
      },
    });
  }
}

module.exports = ApiResponse;
