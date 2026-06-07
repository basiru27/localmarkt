import { Router } from 'express';
import { z } from 'zod';
import { promises as dnsPromises } from 'node:dns';

const router = Router();

const emailSchema = z.string().email('Invalid email format').min(5);

const DNS_TIMEOUT_MS = 3000;

function extractDomain(email) {
  return email.split('@')[1].toLowerCase();
}

async function hasMxRecords(domain) {
  const lookup = dnsPromises.resolveMx(domain);
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('DNS timeout')), DNS_TIMEOUT_MS);
  });

  try {
    const addresses = await Promise.race([lookup, timeout]);
    return Array.isArray(addresses) && addresses.length > 0;
  } catch (error) {
    // Definitive negatives: domain doesn't exist or has no MX records
    if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
      return false;
    }
    // Transient errors (timeout, DNS server failure) — rethrow to fail open
    throw error;
  }
}

function levenshteinDistance(a, b) {
  const m = a.length;
  const n = b.length;

  const dp = [];
  for (let i = 0; i <= m; i++) {
    dp[i] = [i];
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  return dp[m][n];
}

const KNOWN_PROVIDERS = [
  'gmail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'outlook.com',
  'hotmail.com',
  'hotmail.co.uk',
  'icloud.com',
  'protonmail.com',
  'proton.me',
  'mail.com',
  'aol.com',
  'ymail.com',
  'yandex.com',
  'zoho.com',
  'gmx.com',
  'live.com',
  'live.co.uk',
  'msn.com',
  'googlemail.com',
  'fastmail.com',
  'tutanota.com',
  'rediffmail.com',
];

const TYPO_THRESHOLD = 2;

function findTypoMatch(domain) {
  // Don't flag legitimate known providers that happen to be close to another
  if (KNOWN_PROVIDERS.includes(domain)) return null;
  for (const provider of KNOWN_PROVIDERS) {
    const dist = levenshteinDistance(domain, provider);
    if (dist <= TYPO_THRESHOLD) {
      return provider;
    }
  }
  return null;
}

/**
 * GET /api/auth/check-email?email=user@domain.com
 * Checks if the email's domain can receive email (MX records) and
 * detects typo-squatted domains (e.g., "gmial.com" vs "gmail.com").
 * Fails open on transient DNS errors to avoid blocking registration
 * due to network issues (especially relevant in The Gambia).
 */
router.get('/check-email', async (req, res, next) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid email format',
        details: parsed.error.errors.map(err => ({
          message: err.message,
        })),
      });
    }

    const domain = extractDomain(email);

    let valid = true;
    let message = null;
    let suggestion = null;

    try {
      valid = await hasMxRecords(domain);
      if (!valid) {
        message = 'This email domain does not appear to accept emails. Please check your email address.';
      }
    } catch (dnsError) {
      // Fail open: DNS errors/timeouts should not prevent registration
      console.warn(`DNS check failed for ${domain}:`, dnsError.message);
      valid = true;
    }

    // If domain has MX records or DNS failed open, also check for typo squats
    if (valid) {
      suggestion = findTypoMatch(domain);
      if (suggestion) {
        valid = false;
        message = `Did you mean ${suggestion}? Please check your email address.`;
      }
    }

    return res.json({ valid, domain, message, suggestion });
  } catch (err) {
    return next(err);
  }
});

export default router;
