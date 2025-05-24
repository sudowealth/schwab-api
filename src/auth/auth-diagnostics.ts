import { type TokenPersistence } from './token-persistence'
import { type TokenSnapshot } from './types'

export interface AuthDiagnosticsOptions {
	includeTokenValues?: boolean // default: false
}

export interface AuthDiagnosticsResult {
	issuedAt: Date | null
	expiresAt: Date | null
	secondsUntilExpiry: number | null
	hasRefreshToken: boolean
	storageKey: string
	warnings: string[]
}

/**
 * Produce a human-readable snapshot of token state
 * without mutating anything.
 */
export async function getAuthDiagnostics(
	persistence: TokenPersistence,
	opts: AuthDiagnosticsOptions = {},
): Promise<AuthDiagnosticsResult> {
	const snap: TokenSnapshot | null = await persistence.read()

	if (!snap) {
		return {
			issuedAt: null,
			expiresAt: null,
			secondsUntilExpiry: null,
			hasRefreshToken: false,
			storageKey: persistence.key,
			warnings: ['no token stored'],
		}
	}

	const now = Date.now() / 1000 // seconds
	const warnings: string[] = []

	if (snap.expires_at && snap.expires_at < now) {
		warnings.push('token already expired')
	} else if (snap.expires_at && snap.expires_at - now < 300) {
		warnings.push('token expires in <5 min')
	}

	return {
		issuedAt: snap.issued_at ? new Date(snap.issued_at * 1000) : null,
		expiresAt: snap.expires_at ? new Date(snap.expires_at * 1000) : null,
		secondsUntilExpiry: snap.expires_at ? snap.expires_at - now : null,
		hasRefreshToken: Boolean(snap.refresh_token),
		storageKey: persistence.key,
		warnings,
		...(opts.includeTokenValues ? { accessToken: snap.access_token } : {}),
	}
}
