import pkceChallenge from 'pkce-challenge'
import { safeBase64Encode, safeBase64Decode } from './auth-utils'

export interface PkcePair {
	verifier: string
	challenge: string
}

/**
 * Generate a PKCE code verifier/challenge pair
 */
export async function generatePkcePair(): Promise<PkcePair> {
	const pkce = await pkceChallenge()
	return { verifier: pkce.code_verifier, challenge: pkce.code_challenge }
}

/**
 * Build the state parameter including the PKCE verifier
 */
export function buildState(state: unknown, verifier: string): string {
	const combined = {
		...(typeof state === 'object' && state
			? state
			: { original_app_state: state }),
		pkce_code_verifier: verifier,
	}
	return safeBase64Encode(JSON.stringify(combined))
}

/**
 * Extract the PKCE verifier from a state parameter
 */
export function extractVerifier(stateParam: string): string | null {
	try {
		const decoded = safeBase64Decode(stateParam)
		const obj = JSON.parse(decoded)
		return typeof obj.pkce_code_verifier === 'string'
			? obj.pkce_code_verifier
			: null
	} catch (error) {
		// If decode still fails after the second chance in safeBase64Decode,
		// it might be due to double-encoding in the redirect URI
		console.error(
			'Invalid PKCE state – check that the redirect URI is not double-encoded',
			error,
		)
		return null
	}
}
