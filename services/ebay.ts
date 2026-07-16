const TOKEN_URL = 'https://api.ebay.com/identity/v1/oauth2/token';
const SCOPE = 'https://api.ebay.com/oauth/api_scope';

let cachedToken: string | null = null;
let expiresAt = 0;

function getClientCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing eBay OAuth credentials. Set EBAY_CLIENT_ID and EBAY_CLIENT_SECRET.');
  }

  return { clientId, clientSecret };
}

function buildBasicAuthHeader(clientId: string, clientSecret: string): string {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  return `Basic ${credentials}`;
}

function isTokenValid(): boolean {
  return Boolean(cachedToken) && Date.now() < expiresAt - 60_000;
}

export async function getEbayApplicationToken(): Promise<string> {
  if (isTokenValid()) {
    return cachedToken as string;
  }

  const { clientId, clientSecret } = getClientCredentials();
  const authHeader = buildBasicAuthHeader(clientId, clientSecret);

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: authHeader,
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: SCOPE,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to retrieve eBay application token: ${response.status} ${errorText}`);
  }

  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    token_type?: string;
  };

  if (!payload.access_token) {
    throw new Error('eBay token response did not include an access_token.');
  }

  cachedToken = payload.access_token;
  const ttlSeconds = typeof payload.expires_in === 'number' ? payload.expires_in : 3600;
  expiresAt = Date.now() + ttlSeconds * 1000;

  return cachedToken;
}
