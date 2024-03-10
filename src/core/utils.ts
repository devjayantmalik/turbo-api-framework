import { Value } from "@sinclair/typebox/value";
import type { Request, Response } from "express";
import { DefaultErrorFunction, SetErrorFunction } from "@sinclair/typebox/errors";

export class Exception extends Error {
  public code: number = 500;
  public status: string = "Something went wrong.";
  constructor(code: number, status: string) {
    super(status);
    this.code = code;
    this.status = status;
  }
}

SetErrorFunction((ex) => {
  // Remove starting / from path and replace with dots(.)
  ex.path = ex.path.startsWith("/") ? ex.path.slice(1) : ex.path;
  ex.path = ex.path.split("/").slice(1).join(".");

  // Build meaningful error based on default exception message.
  const exceptionText = DefaultErrorFunction(ex).toLowerCase();
  return `${ex.path} is ${exceptionText} but found ${ex.value}`;
});

const extractRequestPayload = (req: Request): TurboCore.ITurboSchema<any, any, any> => {
  return {
    headers: req.headers || {},
    data: { ...(req.body || {}), ...(req.query || {}) },
    params: req.params,
  };
};

export const handleExpressRequest = async (
  req: Request,
  res: Response,
  route: TurboCore.ITurboRoute,
  createSuccessResponse: Turbo.ICreateSuccessResponseFn,
  createFailureResponse: Turbo.ICreateFailureResponseFn
) => {
  // Extract request data and clean data as per schema
  const payload = Value.Convert(route.schema, extractRequestPayload(req));
  const data = Value.Clean(route.schema, payload) as TurboCore.ITurboSchema<any, any, any>;

  // Validate Request payload
  const validationError = Value.Errors(route.schema, data).First();
  if (typeof validationError !== "undefined")
    return res.json(createFailureResponse(new Exception(400, validationError.message)));

  // Prepare payload data for middlewares and handle
  const params: Turbo.IHandleFnParams<any> = {
    input: data,
    success: ({ data, status }: any) => createSuccessResponse({ data, status }),
    req: req,
  };

  // Execute middlewares
  for (let middleware of route.middlewares) {
    try {
      await middleware(params);
    } catch (ex) {
      // Exit this function with failed message if error is thrown
      if (ex instanceof Exception) {
        return res.json(createFailureResponse(ex));
      } else {
        return res.json(createFailureResponse(new Exception(400, ex.message)));
      }
    }
  }

  // Execute Request Handle
  try {
    const apiResult = await route.handle(params);
    return res.json(apiResult);
  } catch (err) {
    if (err instanceof Exception) {
      return res.json(createFailureResponse(err));
    } else {
      return res.json(createFailureResponse(new Exception(400, err.message)));
    }
  }
};
