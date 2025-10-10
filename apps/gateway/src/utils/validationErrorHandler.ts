export const handleValidationError = (error: any) => {
  const message = Array.isArray(error.message)
    ? error.message[0] 
    : error.message;

  return {
    success: false,
    message: message || 'Validation failed',
    status: error.statusCode || 400,
  };
};