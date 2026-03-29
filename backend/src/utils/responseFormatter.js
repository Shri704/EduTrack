export const successResponse = (
  res,
  message,
  data = null,
  statusCode = 200
) => {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  return res.status(statusCode).json(response);
};

export const errorResponse = (
  res,
  message,
  statusCode = 500,
  errors = null
) => {
  const response = { success: false, message };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
};

export const paginatedResponse = (res, message, data, pagination) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination
  });
};