import { describe, it, expect } from 'vitest';
import { isRetryable } from '../api';

describe('isRetryable', () => {
  it('returns true for network TypeError', () => {
    const error = new TypeError('Failed to fetch');
    expect(isRetryable(error, null)).toBe(true);
  });

  it('returns true for AbortError', () => {
    const error = new DOMException('The operation was aborted', 'AbortError');
    expect(isRetryable(error, null)).toBe(true);
  });

  it('returns true for 500 server error', () => {
    expect(isRetryable(null, 500)).toBe(true);
  });

  it('returns true for 502 Bad Gateway', () => {
    expect(isRetryable(null, 502)).toBe(true);
  });

  it('returns true for 503 Service Unavailable', () => {
    expect(isRetryable(null, 503)).toBe(true);
  });

  it('returns true for 429 rate limit', () => {
    expect(isRetryable(null, 429)).toBe(true);
  });

  it('returns false for 404', () => {
    expect(isRetryable(null, 404)).toBe(false);
  });

  it('returns false for 400 bad request', () => {
    expect(isRetryable(null, 400)).toBe(false);
  });

  it('returns false for null error and null status', () => {
    expect(isRetryable(null, null)).toBe(false);
  });
});
