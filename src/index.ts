import express from "express";
import type { Request, Response, NextFunction } from "express-serve-static-core";
import { utils } from "./core/index.js";
import { ApiRoutes, createFailureResponse, createSuccessResponse } from "./turbo.js";
import { Exception } from "./core/utils.js";

const main = async (): Promise<void> => {
  // Handle Http Requests
  const app = express();

  // Configure all routes
  ApiRoutes.forEach((route) => {
    const method = route.method.toLowerCase() as "get" | "post" | "put" | "patch" | "delete";
    app[method](route.path, (req, res) =>
      utils.handleExpressRequest(req, res, route, createSuccessResponse, createFailureResponse)
    );
  });

  // Configure Not found Route and error handler
  app.use((req, res) => {
    return res.json(createFailureResponse(new Exception(404, `Requested path ${req.path} doesn't exist.`)));
  });

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    return res.json(createFailureResponse(new Exception(500, err.message)));
  });

  /**
   * Start server to listen on port 3000
   */
  const port = 3000;
  const host = "127.0.0.1";
  app.listen(port, host, () => console.log(`Server started at: http://${host}:${port}`));
};

main().catch(console.error);
