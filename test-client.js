import {
  createAuthClient,
  configureSchwabApi,
  withRateLimit,
  withRetry
} from './src/index.js';

async function main() {
  if (process.argv.length < 3) {
    console.error('Usage: node test-client.js <auth_code>');
    process.exit(1);
  }

  const auth = createAuthClient({
    clientId: process.env.SCHWAB_ID || 'test-client-id',
    clientSecret: process.env.SCHWAB_SECRET || 'test-client-secret',
    redirectUri: 'https://example.com/callback'
  });

  console.log('Visit:', auth.getAuthorizationUrl().authUrl);

  const tokenSet = await auth.exchangeCodeForTokens({ code: process.argv[2] });
  console.log('Token Set:', tokenSet);

  const schwab = await configureSchwabApi({
    tokens: {
      current: () => tokenSet,
      refresh: () => auth.refreshTokens()
    },
    middlewares: [
      withRateLimit(),
      withRetry({ max: 4 })
    ]
  });

  try {
    const accounts = await schwab.accounts.getAccounts();
    console.log('Accounts:', accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
  }
}

main().catch(console.error);