import {
  clearPendingOtpEmail,
  readPendingOtpEmail,
  storePendingOtpEmail,
} from '../../src/utils/pendingOtpEmail';

describe('pending OTP email storage', () => {
  const values = new Map<string, string>();

  beforeAll(() => {
    Object.defineProperty(globalThis, 'sessionStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => values.get(key) ?? null,
        removeItem: (key: string) => values.delete(key),
        setItem: (key: string, value: string) => values.set(key, value),
      },
    });
  });

  beforeEach(() => {
    values.clear();
    clearPendingOtpEmail();
  });

  afterEach(() => {
    clearPendingOtpEmail();
    values.clear();
  });

  it('keeps a valid pending email in tab-scoped storage', () => {
    expect(storePendingOtpEmail(' person@example.com ')).toBe(true);
    expect(readPendingOtpEmail()).toBe('person@example.com');
  });

  it('does not store invalid email values', () => {
    expect(storePendingOtpEmail('not-an-email')).toBe(false);
    expect(readPendingOtpEmail()).toBeNull();
  });

  it('clears the pending email after use', () => {
    storePendingOtpEmail('person@example.com');
    clearPendingOtpEmail();
    expect(readPendingOtpEmail()).toBeNull();
  });
});
