import { Type } from "@sinclair/typebox";

export const TurboSchema = <
  THeaders extends TurboCore.TProperties,
  TParams extends TurboCore.TProperties,
  TData extends TurboCore.TProperties
>(
  options: TurboCore.ITurboSchema<THeaders, TParams, TData>
) => {
  return Type.Object({
    headers: Type.Required(options.headers),
    params: Type.Required(options.params),
    data: Type.Required(options.data),
  });
};
