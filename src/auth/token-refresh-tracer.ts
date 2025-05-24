export interface TokenRefreshTraceEvent {
	attempt: number
	succeeded: boolean
	latencyMs: number
	error?: unknown
}

export interface TokenRefreshTracer {
	log(evt: TokenRefreshTraceEvent): void
}
