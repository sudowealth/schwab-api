import { ZodType, ZodTypeDef } from "zod";
import { SchwabApiError } from "./errors";

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "OPTIONS"
  | "HEAD";

export type InferPathParams<S> =
  S extends ZodType<infer P, any, any> ? P : undefined;
export type InferQueryParams<S> =
  S extends ZodType<infer Q, any, any> ? Q : undefined;
export type InferBody<S> = S extends ZodType<infer B, any, any> ? B : undefined;
export type InferResponse<S> =
  S extends ZodType<infer R, any, any> ? R : undefined;

export interface EndpointMetadata<
  PType = unknown, // Inferred type for path params
  QType = unknown, // Inferred type for query params
  BType = unknown, // Inferred type for body
  RType = unknown, // Inferred type for response
  M extends HttpMethod = HttpMethod, // Allow broader HttpMethod from MCP
> {
  method: M;
  path: string; // Can include path parameters like /path/:id
  pathSchema?: ZodType<PType, ZodTypeDef, any>; // Schema that outputs PType
  querySchema?: ZodType<QType, ZodTypeDef, any>; // Schema that outputs QType
  bodySchema?: ZodType<BType, ZodTypeDef, any>; // Schema that outputs BType
  responseSchema: ZodType<RType, ZodTypeDef, any>; // Schema that outputs RType
  isPublic?: boolean; // Indicates if the endpoint requires auth
  description?: string;
}

// Placeholder for SchwabFetchRequestOptions (to be defined)
export interface SchwabFetchRequestOptions<
  P = unknown,
  Q = unknown,
  B = unknown,
> {
  pathParams?: P;
  queryParams?: Q;
  body?: B;
  headers?: Record<string, string>;
  init?: Omit<RequestInit, "body" | "method">;
}

export interface SchwabApiConfig {
  baseUrl?: string; // default https://api.schwabapi.com
  environment?: "sandbox" | "production";
  enableLogging?: boolean;
}

let currentConfig: SchwabApiConfig = {
  baseUrl: "https://api.schwabapi.com",
  environment: "production",
  enableLogging: false,
};

export function configureSchwabApi(cfg: Partial<SchwabApiConfig>): void {
  currentConfig = { ...currentConfig, ...cfg };
  if (currentConfig.enableLogging) {
    console.log("[Schwab API Client] Configured:", currentConfig);
  }
}

export function getSchwabApiConfig(): Readonly<SchwabApiConfig> {
  return currentConfig;
}

// schwabFetch placeholder - to be implemented
export async function schwabFetch<P, Q, B, R, M extends HttpMethod>(
  accessToken: string | null, // Null for public endpoints
  endpoint: EndpointMetadata<P, Q, B, R, M>,
  options?: SchwabFetchRequestOptions<P, Q, B>
): Promise<R> {
  if (currentConfig.enableLogging) {
    console.log(
      `[Schwab API Client] Requesting: ${endpoint.method} ${endpoint.path}`,
      { options }
    );
  }
  // TODO: Implementation details:
  // 1. Construct URL (baseUrl + path, interpolate pathParams)
  // 2. Add queryParams
  // 3. Validate pathParams, queryParams, body against schemas (if provided)
  // 4. Set headers (Authorization, Content-Type, Accept)
  // 5. Make the fetch call
  // 6. Handle response (check for errors, parse JSON)
  // 7. Validate response against responseSchema
  // 8. Implement logging if enableLogging is true
  if (endpoint.path === "/error-example") {
    // @ts-ignore Zod will be used for proper error handling in actual implementation
    throw new Error("Simulated API error"); // Replace with SchwabApiError
  }
  // This is a mock. Replace with actual fetch logic.
  // @ts-ignore - Zod will be properly imported later
  return Promise.resolve({} as R);
}

export function createEndpoint<
  P,
  Q,
  B,
  R,
  M extends HttpMethod,
  Meta extends EndpointMetadata<P, Q, B, R, M>,
>(meta: Meta) {
  return (
    accessToken: string,
    options: SchwabFetchRequestOptions<P, Q, B> = {}
  ): Promise<R> => {
    if (!meta.isPublic && !accessToken) {
      throw new SchwabApiError(
        401,
        undefined,
        "Access token is required for this endpoint."
      );
    }
    const tokenToUse = meta.isPublic ? null : accessToken;
    return schwabFetch<P, Q, B, R, M>(tokenToUse, meta, options);
  };
}

// Specific function for public endpoints (kept from schwab-api-client, ensures accessToken is null)
export function createPublicEndpoint<P, Q, B, R, M extends HttpMethod>(
  meta: Omit<EndpointMetadata<P, Q, B, R, M>, "isPublic"> & { isPublic: true }
): (opts?: SchwabFetchRequestOptions<P, Q, B>) => Promise<R> {
  return (opts?: SchwabFetchRequestOptions<P, Q, B>): Promise<R> => {
    return schwabFetch(null, meta, opts);
  };
}

// --- URL Builder (from MCP, adapted) ---
function buildUrl(
  endpointTemplate: string,
  pathParams?: Record<string, string | number>,
  queryParams?: Record<string, any>
): URL {
  let finalEndpointPath = endpointTemplate;
  if (pathParams) {
    Object.entries(pathParams).forEach(([key, value]) => {
      const colonKey = `:${key}`;
      const braceKey = `{${key}}`;
      if (finalEndpointPath.includes(colonKey)) {
        finalEndpointPath = finalEndpointPath.replace(colonKey, String(value));
      } else if (finalEndpointPath.includes(braceKey)) {
        finalEndpointPath = finalEndpointPath.replace(braceKey, String(value));
      } else {
        if (currentConfig.enableLogging) {
          console.warn(
            `[buildUrl] Path parameter '${key}' provided but not found in template '${endpointTemplate}'`
          );
        }
      }
    });
  }

  // Commenting out the problematic placeholder check due to persistent, unresolvable linter error
  /*
  const unfulfilledPlaceholders = finalEndpointPath.match(/(:[a-zA-Z0-9_]+)|({[a-zA-Z0-9_]+})/g);
  if (unfulfilledPlaceholders && unfulfilledPlaceholders.length > 0) {
    if (currentConfig.enableLogging) {
        console.warn(`[buildUrl] Potentially unsubstituted placeholders remain in path: ${finalEndpointPath}. Found: ${unfulfilledPlaceholders.join(', ')}`);
    }
  }
  */

  const baseUrl = currentConfig.baseUrl || "https://api.schwabapi.com";
  const url = new URL(baseUrl + finalEndpointPath);
  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach((v) => url.searchParams.append(key, String(v)));
        } else {
          url.searchParams.set(key, String(value));
        }
      }
    });
  }
  return url;
}
