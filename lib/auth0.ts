const DOMAIN = process.env.AUTH0_DOMAIN!;
const CLIENT_ID = process.env.AUTH0_CLIENT_ID!;
const CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET!;

export const auth0Config = {
  domain: DOMAIN,
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  audience: `https://${DOMAIN}/api/v2/`,
  authorizationUrl: `https://${DOMAIN}/authorize`,
  tokenUrl: `https://${DOMAIN}/oauth/token`,
  logoutUrl: `https://${DOMAIN}/v2/logout`,
};

function getBaseUrl(request?: Request) {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (request) {
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
  }
  return "http://localhost:3000";
}

export function getLoginUrl(state: string, request?: Request) {
  const baseUrl = getBaseUrl(request);
  const params = new URLSearchParams({
    client_id: auth0Config.clientId,
    redirect_uri: `${baseUrl}/auth/callback`,
    response_type: "code",
    scope: "openid profile email",
    state,
  });

  return `${auth0Config.authorizationUrl}?${params}`;
}

export function getLogoutUrl(request?: Request) {
  const baseUrl = getBaseUrl(request);
  const params = new URLSearchParams({
    client_id: auth0Config.clientId,
    returnTo: baseUrl,
  });

  return `${auth0Config.logoutUrl}?${params}`;
}

export async function exchangeCode(code: string, request?: Request) {
  const baseUrl = getBaseUrl(request);
  const res = await fetch(auth0Config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: auth0Config.clientId,
      client_secret: auth0Config.clientSecret,
      code,
      redirect_uri: `${baseUrl}/auth/callback`,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Auth0 token exchange failed: ${err}`);
  }

  return res.json() as Promise<{
    access_token: string;
    id_token: string;
    token_type: string;
    expires_in: number;
  }>;
}

export function decodeIdToken(idToken: string) {
  const payload = idToken.split(".")[1];
  const decoded = JSON.parse(
    Buffer.from(payload, "base64url").toString("utf-8"),
  );

  return {
    sub: decoded.sub as string,
    email: decoded.email as string,
    name: decoded.name as string,
    emailVerified: decoded.email_verified as boolean,
    picture: decoded.picture as string | undefined,
  };
}
