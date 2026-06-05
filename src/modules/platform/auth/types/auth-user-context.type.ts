export interface AuthUserContext extends Record<string, unknown> {
  sub: string;
  email?: string;
  type?: string;
  sessionId?: string;
  tokenId?: string;
}
