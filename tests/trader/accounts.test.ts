import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { configureSchwabApi, SchwabApiError } from '../../src/core'
import {
	getAccounts,
	getAccountByNumber,
} from '../../src/trader/accounts/endpoints'

// Mock the global fetch
const mockFetch = vi.fn()

describe('Trader API - Accounts Endpoints', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', mockFetch)
		// Configure for tests (optional, if defaults are not suitable)
		configureSchwabApi({
			baseUrl: 'https://api.test.schwabapi.com',
			enableLogging: false,
		})
	})

	afterEach(() => {
		vi.unstubAllGlobals()
		mockFetch.mockReset()
	})

	describe('getAccounts', () => {
		it('should retrieve accounts successfully', async () => {
			const mockAccountsResponse = [
				{ securitiesAccount: { accountId: '123', hashedAccountId: 'abc' } },
				{ securitiesAccount: { accountId: '456', hashedAccountId: 'def' } },
			]
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockAccountsResponse,
				status: 200,
			})

			const accounts = await getAccounts('test-token')
			expect(mockFetch).toHaveBeenCalledWith(
				'https://api.test.schwabapi.com/trader/v1/accounts',
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({
						Authorization: 'Bearer test-token',
					}),
				}),
			)
			expect(accounts).toEqual(mockAccountsResponse)
		})

		it('should retrieve accounts with fields query parameter', async () => {
			const mockAccountsResponse = [
				{
					securitiesAccount: {
						accountId: '123',
						hashedAccountId: 'abc',
						positions: [],
					},
				},
			]
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockAccountsResponse,
				status: 200,
			})

			await getAccounts('test-token', { queryParams: { fields: 'positions' } })
			expect(mockFetch).toHaveBeenCalledWith(
				'https://api.test.schwabapi.com/trader/v1/accounts?fields=positions',
				expect.any(Object),
			)
		})

		it('should throw SchwabApiError on API error', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				json: async () => ({ error: 'Failed to fetch accounts' }),
				status: 500,
			})

			await expect(getAccounts('test-token')).rejects.toThrow(SchwabApiError)
		})
	})

	describe('getAccountByNumber', () => {
		it('should retrieve a specific account successfully', async () => {
			const mockAccountResponse = {
				securitiesAccount: { accountId: '123', hashedAccountId: 'abc' },
			}
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockAccountResponse,
				status: 200,
			})

			const account = await getAccountByNumber('test-token', {
				pathParams: { accountNumber: 'abc' },
			})
			expect(mockFetch).toHaveBeenCalledWith(
				'https://api.test.schwabapi.com/trader/v1/accounts/abc',
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({
						Authorization: 'Bearer test-token',
					}),
				}),
			)
			expect(account).toEqual(mockAccountResponse)
		})

		it('should throw SchwabApiError if account not found (404)', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				json: async () => ({ message: 'Account not found' }),
				status: 404,
			})

			await expect(
				getAccountByNumber('test-token', {
					pathParams: { accountNumber: 'nonexistent' },
				}),
			).rejects.toThrow(SchwabApiError)
		})
	})
})
