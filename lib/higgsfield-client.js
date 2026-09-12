'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config();

const MANIFEST_PATH = path.join(__dirname, '..', 'assets', 'higgsfield-manifest.json');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

function loadManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(`Manifest non trovato in: ${MANIFEST_PATH}`);
  }
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
}

function getAssetStatus() {
  const manifest = loadManifest();
  const results = {};

  for (const [key, asset] of Object.entries(manifest.assets)) {
    const targetFile = path.join(__dirname, '..', asset.target_path);
    const fallbackFile = path.join(__dirname, '..', asset.fallback_path);

    const targetExists = fs.existsSync(targetFile);
    const fallbackExists = fs.existsSync(fallbackFile);

    results[key] = {
      id: asset.id,
      name: asset.name,
      type: asset.type,
      targetPath: asset.target_path,
      targetExists,
      fallbackPath: asset.fallback_path,
      fallbackExists,
      activeSource: targetExists ? asset.target_path : (fallbackExists ? asset.fallback_path : null),
      prompt: asset.higgsfield_prompt
    };
  }

  return results;
}

function getPromptForAsset(assetId) {
  const manifest = loadManifest();
  const asset = manifest.assets[assetId];
  if (!asset) {
    throw new Error(`Asset '${assetId}' non presente nel manifest.`);
  }
  return {
    id: asset.id,
    name: asset.name,
    type: asset.type,
    prompt: asset.higgsfield_prompt,
    instructions: manifest.pipeline.free_tier_workflow
  };
}

/**
 * Recupera la lista dei modelli ufficiali disponibili dall'API live di Higgsfield AI
 */
function fetchAvailableModels() {
  const keyId = process.env.HIGGSFIELD_API_KEY_ID;
  const keySecret = process.env.HIGGSFIELD_API_KEY_SECRET;

  return new Promise((resolve) => {
    if (!keyId || !keySecret) {
      return resolve({
        authenticated: false,
        error: 'Credenziali HIGGSFIELD_API_KEY_ID e HIGGSFIELD_API_KEY_SECRET non configurate in .env'
      });
    }

    https.get('https://api.higgsfield.ai/models', {
      headers: {
        'hf-api-key': keyId,
        'hf-secret': keySecret
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            authenticated: res.statusCode === 200,
            statusCode: res.statusCode,
            models: parsed.items || []
          });
        } catch (e) {
          resolve({ authenticated: false, error: e.message, raw: data });
        }
      });
    }).on('error', (err) => {
      resolve({ authenticated: false, error: err.message });
    });
  });
}

/**
 * Invia una richiesta di generazione live all'API ufficiale di Higgsfield AI
 */
function generateWithHiggsfield(options = {}) {
  const keyId = process.env.HIGGSFIELD_API_KEY_ID;
  const keySecret = process.env.HIGGSFIELD_API_KEY_SECRET;
  const model = options.model || 'higgsfield-ai/soul/v2/standard';
  const prompt = options.prompt || 'underground street dark wet asphalt with neon orange lamps, rain, cinematic streetalk';
  const aspectRatio = options.aspectRatio || '16:9';

  return new Promise((resolve) => {
    if (!keyId || !keySecret) {
      return resolve({
        success: false,
        error: 'Credenziali API non trovate nel file .env'
      });
    }

    const payload = JSON.stringify({
      prompt,
      aspect_ratio: aspectRatio
    });

    const req = https.request({
      hostname: 'api.higgsfield.ai',
      path: `/${model}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'hf-api-key': keyId,
        'hf-secret': keySecret
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode === 200 || res.statusCode === 201) {
            resolve({
              success: true,
              statusCode: res.statusCode,
              model,
              data: parsed
            });
          } else if (res.statusCode === 403 && parsed.detail === 'not_enough_credits') {
            resolve({
              success: false,
              authenticated: true,
              statusCode: 403,
              code: 'NOT_ENOUGH_CREDITS',
              message: 'Autenticazione Higgsfield riuscita, ma il credito API è esaurito (not_enough_credits). I visual ad alta risoluzione locali rimangono attivi.',
              detail: parsed
            });
          } else {
            resolve({
              success: false,
              statusCode: res.statusCode,
              error: parsed.detail || 'Errore API Higgsfield',
              detail: parsed
            });
          }
        } catch (e) {
          resolve({ success: false, statusCode: res.statusCode, error: e.message, raw: data });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });

    req.write(payload);
    req.end();
  });
}

module.exports = {
  loadManifest,
  getAssetStatus,
  getPromptForAsset,
  fetchAvailableModels,
  generateWithHiggsfield
};
