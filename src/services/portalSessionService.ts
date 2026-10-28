import type { PortalName, PortalSession, TransportRegistrationInput } from '../types/portalSession';

const STORAGE_KEY = 'farmgo-portal-session-v1';
type PortalSessions = Partial<Record<PortalName, PortalSession>>;

function readSessions(): PortalSessions {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as PortalSessions : {};
  } catch {
    throw new Error('Không đọc được phiên đăng nhập demo trong trình duyệt.');
  }
}

function writeSessions(sessions: PortalSessions) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    throw new Error('Không lưu được phiên demo. Hãy kiểm tra bộ nhớ trình duyệt.');
  }
}

function accountName(account: string) {
  const trimmed = account.trim();
  return trimmed.includes('@') ? trimmed.split('@')[0] : trimmed;
}

function createSession(portal: PortalName, account: string, displayName?: string): PortalSession {
  const normalized = account.trim();
  if (!normalized) throw new Error('Nhập tài khoản để tiếp tục.');
  return {
    portal,
    account: normalized,
    displayName: displayName?.trim() || accountName(normalized),
    signedInAt: new Date().toISOString(),
  };
}

export function getPortalSession(portal: PortalName): PortalSession | null {
  return readSessions()[portal] ?? null;
}

export function signInDemoPortal(portal: PortalName, account: string, password: string): PortalSession {
  if (!password) throw new Error('Nhập mật khẩu demo để tiếp tục.');
  const session = createSession(portal, account);
  const sessions = readSessions();
  sessions[portal] = session;
  writeSessions(sessions);
  return session;
}

export function registerDemoTransport(input: TransportRegistrationInput): PortalSession {
  if (!input.displayName.trim()) throw new Error('Nhập tên hiển thị.');
  if (!input.password) throw new Error('Tạo mật khẩu demo để tiếp tục.');
  const session = createSession('transport', input.account, input.displayName);
  const sessions = readSessions();
  sessions.transport = session;
  writeSessions(sessions);
  return session;
}

export function signOutDemoPortal(portal: PortalName) {
  const sessions = readSessions();
  delete sessions[portal];
  writeSessions(sessions);
}
