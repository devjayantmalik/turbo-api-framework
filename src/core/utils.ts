import { DefaultErrorFunction, SetErrorFunction } from "@sinclair/typebox/errors";
import { Value } from "@sinclair/typebox/value";
import type { Request, Response } from "express";
import fs from "fs/promises";
import path from "path";

export class Exception extends Error {
  public code: number = 500;
  public status: string = "Something went wrong.";
  constructor(code: number, status: string) {
    super(status);
    this.code = code;
    this.status = status;
  }
}

export const findRoutesInDir = async (dirpath: string) => {
  const dirItems = await fs.readdir(dirpath, { encoding: "utf8", recursive: true, withFileTypes: true });
  const files = dirItems
    .map((item) => path.join(item.path, item.name))
    .filter((item) => item.endsWith(".ts") || item.endsWith(".js") || item.endsWith(".cjs") || item.endsWith(".mjs"));

  const allRoutes: TurboCore.ITurboRoute[] = [];

  for (let filepath of files) {
    // Import provided filepath and extract routeKey for TurboRoute object.
    const imported = await import(filepath);
    const routeKey = Object.keys(imported).find((item) => item.includes("Route"));

    // print warning for found filepath
    if (!routeKey) {
      console.warn(`${filepath} doesn't export a valid TurboRoute`);
      continue;
    }

    // Add found Route to all routes
    const routeFound: TurboCore.ITurboRoute = imported[routeKey];
    // TODO: validate found route to match our expected schema.
    allRoutes.push(routeFound);
  }

  return allRoutes;
};

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
