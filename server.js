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

  if (!secret) {
    return res.status(500).json({ ok: false, error: 'TURNSTILE_SECRET no configurada en el servidor' });
  }

  if (!token) {
    return res.status(400).json({ ok: false, error: 'Token no proporcionado' });
  }

  const postData = querystring.stringify({ secret, response: token });

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
      try {
        const parsed = JSON.parse(data);
        // parsed.success is boolean, other fields may exist
        res.json({ ok: true, verification: parsed });
      } catch (err) {
        res.status(502).json({ ok: false, error: 'Error parsing response from Turnstile', details: err.message });
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
