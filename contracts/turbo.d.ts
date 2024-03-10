declare namespace Turbo {
  type TurboRequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

  interface IException extends Error {
    code: number;
    status: string;
  }
  type IServiceResult<T = any> =
    | { isSuccess: false; status: string; code: number }
    | {
        isSuccess: true;
        status: string;
        code: number;
        data: T;
      };

  /**
   * Turbo Handle Function
   * You need to implement logic inside of this function
   */

  type IHandleFnParams<TData> = {
    input: TData;
    success: <TData>({ data: TData, status: string }) => Turbo.IServiceResult<TData>;
    req: import("express-serve-static-core").Request;
  };

  type IHandleFn<TParamsData, TReturnData = any> = (
    params: IHandleFnParams<TParamsData>
  ) => Promise<Turbo.IServiceResult<TReturnData>> | Turbo.IServiceResult<TReturnData>;

  type IMiddlewareFn<TParamsData> = (params: IHandleFnParams<TParamsData>) => Promise<void> | void;

  type ICreateSuccessResponseFn = <TData>({ data: TData, status: string }) => Turbo.IServiceResult<TData>;
  type ICreateFailureResponseFn = (ex: IException) => Turbo.IServiceResult;
}

declare namespace TurboCore {
  type TProperties = import("@sinclair/typebox").TProperties;
  type TObject = import("@sinclair/typebox").TObject;
  type ITurboSchema<THeaders extends TProperties, TParams extends TProperties, TData extends TProperties> = {
    headers: TObject<THeaders>;
    params: TObject<TParams>;
    data: TObject<TData>;
  };

  interface TurboResponse {
    setHeader(name: string, value: string): TurboResponse;
    json(data: any): void;
    html(template: string): void;
    binFile(filepath: string): void;
  }

  interface ITurboRoute<TValSchema = any> {
    path: string;
    method: Turbo.TurboRequestMethod;
    schema: import("@sinclair/typebox").TSchema;
    middlewares: Turbo.IMiddlewareFn<TValSchema>[];
    handle: Turbo.IHandleFn<TValSchema>;
  }

  interface ITurboMainOptions {
    routes: ITurboRoute<any>[];
  }
}
