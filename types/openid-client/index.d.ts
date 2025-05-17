export interface TokenSet {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}

export class Client {
  constructor(config: {
    client_id: string;
    client_secret: string;
    redirect_uris: string[];
    response_types: string[];
  });
  callback(redirectUri: string, params: { code: string }): Promise<TokenSet>;
  refresh(refreshToken: string): Promise<TokenSet>;
}

export class Issuer {
  constructor(metadata: {
    issuer: string;
    authorization_endpoint: string;
    token_endpoint: string;
  });
  Client: typeof Client;
}
