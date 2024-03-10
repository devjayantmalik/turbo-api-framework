export const createFailureResponse: Turbo.ICreateFailureResponseFn = (ex: Turbo.IException): Turbo.IServiceResult => {
  return { isSuccess: false, status: ex.message, code: ex.code };
};

export const createSuccessResponse: Turbo.ICreateSuccessResponseFn = ({ data, status }) => {
  return { isSuccess: true, status: status, code: 200, data: data };
};
