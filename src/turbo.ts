import { Type, type Static } from "@sinclair/typebox";
import { TurboSchema } from "./core/index.js";

export const inputSchema = TurboSchema({
  headers: Type.Object({}),
  params: Type.Object({
    nums: Type.Integer({ minimum: 10, maximum: 20 }),
  }),
  data: Type.Object({}),
});

type IHomeSchema = Static<typeof inputSchema>;
export const HomeRoute: TurboCore.ITurboRoute<IHomeSchema> = {
  method: "GET",
  path: "/home/:nums",
  schema: inputSchema,
  middlewares: [],
  handle: async ({ input, success }) => {
    console.log({ input });
    return success({ status: "Dashboard processed successfully.", data: null });
  },
};
export const ApiRoutes: TurboCore.ITurboRoute[] = [HomeRoute];

export const createFailureResponse: Turbo.ICreateFailureResponseFn = (ex: Turbo.IException): Turbo.IServiceResult => {
  return { isSuccess: false, status: ex.message, code: ex.code };
};

export const createSuccessResponse: Turbo.ICreateSuccessResponseFn = ({ data, status }) => {
  return { isSuccess: true, status: status, code: 200, data: data };
};
