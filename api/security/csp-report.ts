import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * CSP Report Endpoint
 * Receives and logs Content Security Policy violation reports
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const report = req.body;

    // Log CSP violation (in production, you'd send this to a monitoring service)
    // eslint-disable-next-line no-console
    console.log('CSP Violation Report:', JSON.stringify(report, null, 2));

    // In production, you might want to:
    // 1. Send to monitoring service (Sentry, DataDog, etc.)
    // 2. Store in database
    // 3. Send alerts for critical violations

    res.status(204).end(); // No content response
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error processing CSP report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
