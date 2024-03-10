import { Type, type Static } from "@sinclair/typebox";
import { TurboSchema } from "../core/index.js";

export const homeSchema = TurboSchema({
  headers: Type.Object({}),
  params: Type.Object({
    nums: Type.Integer({ minimum: 10, maximum: 20 }),
  }),
  data: Type.Object({}),
});

type IHomeSchema = Static<typeof homeSchema>;
export const HomeRoute: TurboCore.ITurboRoute<IHomeSchema> = {
  method: "GET",
  path: "/home/:nums",
  schema: homeSchema,
  middlewares: [],
  handle: async ({ input, success }) => {
    console.log({ input: input.params });
    // throw new Exception(400, "Dashboard doesn't work now");
    return success({ status: "Dashboard processed successfully.", data: { name: "John" } });
  },
};
