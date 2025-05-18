/**
 * Type utilities for generating endpoint function types from metadata
 */
import { type EndpointMetadata, type SchwabFetchRequestOptions } from './http'

/**
 * Extracts parameter types from an EndpointMetadata object
 */
export type ExtractEndpointTypes<T extends EndpointMetadata> = {
  PathParams: T extends EndpointMetadata<infer P, any, any, any, any, any> ? P : never
  QueryParams: T extends EndpointMetadata<any, infer Q, any, any, any, any> ? Q : never
  BodyType: T extends EndpointMetadata<any, any, infer B, any, any, any> ? B : never
  ResponseType: T extends EndpointMetadata<any, any, any, infer R, any, any> ? R : never
  Method: T extends EndpointMetadata<any, any, any, any, infer M, any> ? M : never
  ErrorType: T extends EndpointMetadata<any, any, any, any, any, infer E> ? E : never
}

/**
 * Creates a function type from endpoint metadata
 */
export type EndpointFunction<T extends EndpointMetadata> = (
  ...args: EndpointFunctionArgs<T>
) => Promise<ExtractEndpointTypes<T>['ResponseType']>

/**
 * Determines the arguments for an endpoint function based on the metadata
 */
type EndpointFunctionArgs<T extends EndpointMetadata> = HasRequiredParams<T> extends true
  ? [
      // Access token is always required
      accessToken: string,
      options: BuildEndpointOptions<T>
    ]
  : HasOptionalParams<T> extends true
  ? [
      // Access token is always required, options are optional
      accessToken: string,
      options?: BuildEndpointOptions<T>
    ]
  : [
      // Just the access token if no other parameters are needed
      accessToken: string
    ]

/**
 * Builds the options parameter type based on what's available in the metadata
 */
type BuildEndpointOptions<T extends EndpointMetadata> = SchwabFetchRequestOptions<
  ExtractEndpointTypes<T>['PathParams'],
  ExtractEndpointTypes<T>['QueryParams'],
  ExtractEndpointTypes<T>['BodyType']
>

/**
 * Determines if an endpoint has required parameters
 */
type HasRequiredParams<T extends EndpointMetadata> = 
  HasRequiredPathParams<T> extends true ? true :
  HasRequiredQueryParams<T> extends true ? true :
  HasRequiredBody<T> extends true ? true : false

/**
 * Determines if an endpoint has any parameters (required or optional)
 */
type HasOptionalParams<T extends EndpointMetadata> = 
  HasPathParams<T> extends true ? true :
  HasQueryParams<T> extends true ? true :
  HasBody<T> extends true ? true : false

/**
 * Checks if the endpoint has any path parameters
 */
type HasPathParams<T extends EndpointMetadata> = 
  ExtractEndpointTypes<T>['PathParams'] extends never ? false :
  ExtractEndpointTypes<T>['PathParams'] extends unknown ? false : true

/**
 * Checks if the endpoint has any query parameters
 */
type HasQueryParams<T extends EndpointMetadata> =
  ExtractEndpointTypes<T>['QueryParams'] extends never ? false :
  ExtractEndpointTypes<T>['QueryParams'] extends unknown ? false : true

/**
 * Checks if the endpoint has a body
 */
type HasBody<T extends EndpointMetadata> =
  ExtractEndpointTypes<T>['BodyType'] extends never ? false :
  ExtractEndpointTypes<T>['BodyType'] extends unknown ? false : true

/**
 * Checks if the endpoint has required path parameters
 * This is a heuristic based on common patterns, as we don't have direct access to the Zod schema details
 */
type HasRequiredPathParams<T extends EndpointMetadata> = 
  T['path'] extends `${string}{${string}}${string}` ? true :
  T['path'] extends `${string}:${string}` ? true : false

/**
 * Checks if the endpoint has required query parameters
 * Without direct access to the Zod schema validation, we can't be certain here
 * so we default to assuming query params are optional
 */
type HasRequiredQueryParams<T extends EndpointMetadata> = false

/**
 * Checks if the endpoint has a required body
 * POST, PUT, and PATCH methods typically require a body
 */
type HasRequiredBody<T extends EndpointMetadata> = 
  T['method'] extends 'POST' | 'PUT' | 'PATCH' ? true : false

/**
 * Takes a namespace of endpoint metadata objects and creates a typed version
 * that includes both the metadata objects and the corresponding endpoint functions
 */
export type ProcessedNamespace<T extends Record<string, any>> = {
  [K in keyof T]: K extends `${infer BaseName}Meta` 
    ? T[K] extends EndpointMetadata
      ? { 
          [MetaKey in K]: T[K] 
        } & { 
          [FnKey in BaseName]: EndpointFunction<T[K]> 
        }
      : T[K]
    : T[K] extends Record<string, any>
      ? ProcessedNamespace<T[K]>
      : T[K]
}

/**
 * Type-safe wrapper around the processNamespace function
 * This doesn't implement the actual functionality but provides proper typing
 */
export type ProcessNamespaceResult<T extends Record<string, any>> = ProcessedNamespace<T>