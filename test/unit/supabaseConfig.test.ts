jest.unmock('../../src/lib/supabase');

import { validateSupabaseConfig } from '../../src/lib/supabase';

describe('Supabase config validation', () => {
  it('marks complete Supabase config as ready', () => {
    expect(
      validateSupabaseConfig({
        url: 'https://project.supabase.co',
        anonKey: 'anon-key',
        source: 'test',
      }),
    ).toEqual({
      ready: true,
      error: null,
      source: 'test',
    });
  });

  it('returns a visible error for missing backend config', () => {
    expect(
      validateSupabaseConfig({
        url: undefined,
        anonKey: undefined,
        source: 'test',
      }),
    ).toEqual({
      ready: false,
      error: 'Supabase URL and anon key are required.',
      source: 'test',
    });
  });

  it('returns a visible error for invalid Supabase URLs', () => {
    expect(
      validateSupabaseConfig({
        url: 'https://example.com',
        anonKey: 'anon-key',
        source: 'test',
      }),
    ).toEqual({
      ready: false,
      error: 'Supabase URL must point to a Supabase project or local Supabase instance.',
      source: 'test',
    });
  });
});
