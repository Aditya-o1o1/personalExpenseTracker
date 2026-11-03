const handleDuplicateError = (error, message = 'A record with these details already exists') => {
  if (error.code === 11000) {
    throw createError(message, 409);
  }

  throw error;
};

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

module.exports = { handleDuplicateError, createError };
