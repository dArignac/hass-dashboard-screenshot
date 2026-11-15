export interface HassTokens {
  access_token: string;
  token_type: string;
  clientId: string;
  hassUrl: string;
  expires: number;
}

export function buildHassTokens(haUrl: string, haToken: string): HassTokens {
  const normalizedUrl = haUrl.replace(/\/+$/, '');
  return {
    access_token: haToken,
    token_type: 'Bearer',
    clientId: `${normalizedUrl}/`,
    hassUrl: normalizedUrl,
    expires: 9999999999999,
  };
}

export function createAuthInitScript(tokens: HassTokens): string {
  return `localStorage.setItem('hassTokens', JSON.stringify(${JSON.stringify(tokens)}));`;
}
