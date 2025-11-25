// Cargar variables desde .env en desarrollo
require('dotenv').config();

const express = require('express');
const path = require('path');
const https = require('https');
const querystring = require('querystring');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Endpoint para verificar el token de Turnstile
app.post('/verify', (req, res) => {
  const token = req.body && req.body.token;
  const secret = process.env.TURNSTILE_SECRET;

  // Log incoming request for debugging (mask most of the token)
  try {
    if (token) {
      const masked = token.length > 16 ? token.slice(0, 8) + '...' + token.slice(-8) : token;
      console.log('Incoming /verify token (masked):', masked, 'length:', token.length);
    } else {
      console.log('Incoming /verify with no token in body');
    }
  } catch (e) {
    console.warn('Error logging incoming token:', e && e.message);
  }

  if (!secret) {
    return res.status(500).json({ ok: false, error: 'TURNSTILE_SECRET no configurada en el servidor' });
  }

  if (!token) {
    return res.status(400).json({ ok: false, error: 'Token no proporcionado' });
  }

  const postData = querystring.stringify({ secret, response: token });
  // Log the post data length (don't print full secret)
  try {
    console.log('Posting to Turnstile: postData length', Buffer.byteLength(postData));
  } catch (e) {
    console.warn('Error logging postData info:', e && e.message);
  }

  const options = {
    hostname: 'challenges.cloudflare.com',
    path: '/turnstile/v0/siteverify',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const request = https.request(options, (cfRes) => {
    let data = '';
    cfRes.on('data', (chunk) => { data += chunk; });
    cfRes.on('end', () => {
      // Log Cloudflare response status and headers for debugging
      console.log('Turnstile response status:', cfRes.statusCode);
      console.log('Turnstile response headers:', cfRes.headers);
      console.log('Turnstile raw response body length:', data ? data.length : 0);

      if (!data || data.length === 0) {
        return res.status(502).json({ ok: false, error: 'Empty response from Turnstile', status: cfRes.statusCode, headers: cfRes.headers });
      }

      try {
        const parsed = JSON.parse(data);
        // parsed.success is boolean, other fields may exist
        res.json({ ok: true, verification: parsed });
      } catch (err) {
        // If parsing fails, return the raw text for easier debugging
        console.warn('Failed to parse Turnstile response as JSON:', err.message);
        return res.status(502).json({ ok: false, error: 'Error parsing response from Turnstile', details: err.message, raw: data });
      }
    });
  });

  request.on('error', (err) => {
    res.status(502).json({ ok: false, error: 'Error contacting Turnstile', details: err.message });
  });

  request.write(postData);
  request.end();
});

// Catch-all to serve index.html for browsers
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
