export type AuthErrorCode =
	| 'INVALID_CODE' // The authorization code is invalid
	| 'UNAUTHORIZED' // The client credentials are invalid
	| 'TOKEN_EXPIRED' // The refresh token has expired or is invalid (Schwab refresh tokens expire after 7 days)
	| 'NETWORK' // A network error occurred
	| 'REFRESH_NEEDED' // The access token has expired and needs to be refreshed
	| 'UNKNOWN' // An unknown error occurred

export class SchwabAuthError extends Error {
	constructor(
		public code: AuthErrorCode,
		message: string = code,
		public status?: number,
	) {
		super(message)
	}
}
