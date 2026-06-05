const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || 'Rosetiplouf/Portfolio';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
const GITHUB_API_BASE = 'https://api.github.com';

if (!GITHUB_TOKEN) {
  console.warn('[WARN] GITHUB_TOKEN is not set. The GitHub write API will fail until you provide it.');
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));

function githubHeaders() {
  const headers = {
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json'
  };
  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }
  return headers;
}

async function githubRequest(url, method = 'GET', body = null) {
  const options = { method, headers: githubHeaders() };
  if (body) options.body = JSON.stringify(body);
  const response = await fetch(url, options);
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (error) {
    throw new Error(`GitHub response parse error: ${error.message}\nResponse text: ${text}`);
  }
  if (!response.ok) {
    const message = data && data.message ? data.message : response.statusText;
    const error = new Error(`GitHub API error (${response.status}): ${message}`);
    error.status = response.status;
    error.details = data;
    throw error;
  }
  return data;
}

async function getFileSha(path) {
  const encodedPath = encodeURIComponent(path).replace(/%2F/g, '/');
  const url = `${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/${encodedPath}?ref=${encodeURIComponent(GITHUB_BRANCH)}`;
  try {
    const data = await githubRequest(url);
    return data.sha;
  } catch (error) {
    if (error.status === 404) {
      return null;
    }
    throw error;
  }
}

function ensureBase64(content) {
  if (typeof content !== 'string') {
    throw new Error('Content must be a string.');
  }
  const prefix = 'base64,';
  const index = content.indexOf(prefix);
  if (index !== -1) {
    return content.slice(index + prefix.length);
  }
  return Buffer.from(content, 'utf8').toString('base64');
}

app.get('/api/status', (req, res) => {
  res.json({ ok: true, repo: GITHUB_REPO, branch: GITHUB_BRANCH, tokenConfigured: Boolean(GITHUB_TOKEN) });
});

app.get('/api/file', async (req, res) => {
  const path = req.query.path;
  if (!path) {
    return res.status(400).json({ error: 'Missing path query parameter' });
  }

  try {
    const encodedPath = encodeURIComponent(path).replace(/%2F/g, '/');
    const url = `${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/${encodedPath}?ref=${encodeURIComponent(GITHUB_BRANCH)}`;
    const data = await githubRequest(url);
    res.json({ path, sha: data.sha, content: Buffer.from(data.content || '', 'base64').toString('utf8'), encoding: data.encoding });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.status(error.status || 500).json({ error: error.message, details: error.details });
  }
});

app.post('/api/update-file', async (req, res) => {
  const { path, content, message } = req.body;
  if (!path || typeof content !== 'string') {
    return res.status(400).json({ error: 'Missing required fields: path and content' });
  }
  if (!GITHUB_TOKEN) {
    return res.status(500).json({ error: 'GITHUB_TOKEN is not configured on the backend.' });
  }

  try {
    const sha = await getFileSha(path);
    const url = `${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`;
    const commitMessage = message || `Update ${path} from portfolio admin`; 
    const payload = {
      message: commitMessage,
      content: ensureBase64(content),
      branch: GITHUB_BRANCH
    };
    if (sha) {
      payload.sha = sha;
    }

    const result = await githubRequest(url, 'PUT', payload);
    res.json({ success: true, file: { path: result.content.path, sha: result.content.sha, url: result.content.html_url } });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, details: error.details });
  }
});

app.post('/api/upload-image', async (req, res) => {
  const { path, dataUrl, message } = req.body;
  if (!path || !dataUrl) {
    return res.status(400).json({ error: 'Missing required fields: path and dataUrl' });
  }
  if (!GITHUB_TOKEN) {
    return res.status(500).json({ error: 'GITHUB_TOKEN is not configured on the backend.' });
  }

  try {
    const encodedData = ensureBase64(dataUrl);
    const sha = await getFileSha(path);
    const url = `${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`;
    const result = await githubRequest(url, 'PUT', {
      message: message || `Upload ${path} from portfolio admin`,
      content: encodedData,
      branch: GITHUB_BRANCH,
      sha: sha || undefined
    });
    res.json({ success: true, file: { path: result.content.path, sha: result.content.sha, url: result.content.html_url } });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, details: error.details });
  }
});

app.listen(PORT, () => {
  console.log(`GitHub write backend listening on http://localhost:${PORT}`);
  console.log(`Repository: ${GITHUB_REPO} @ ${GITHUB_BRANCH}`);
});
