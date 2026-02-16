/**
 * Async error handler wrapper
 * Menghilangkan repetitive try-catch di setiap controller
 *
 * Contoh:
 *   const getStory = catchAsync(async (req, res) => {
 *     const story = await storyService.getById(req.params.id);
 *     ApiResponse.success(res, story);
 *   });
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = catchAsync;
