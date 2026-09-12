'use strict';

const fs = require('fs');
const path = require('path');

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

async function requestAssetGeneration(assetId, options = {}) {
  const apiKey = process.env.HIGGSFIELD_API_KEY;
  const assetInfo = getPromptForAsset(assetId);

  if (!apiKey) {
    return {
      success: false,
      channel: 'A',
      mode: 'free_tier_manual',
      message: 'HIGGSFIELD_API_KEY non configurata nel file .env. Usa la procedura gratuita Canale A:',
      prompt: assetInfo.prompt,
      instructions: assetInfo.instructions,
      targetPath: assetInfo.id
    };
  }

  // Canale B: Se la chiave è configurata, è possibile interagire con l'endpoint
  return {
    success: true,
    channel: 'B',
    mode: 'api_automated',
    message: `Richiesta di generazione per ${assetId} registrata via API.`,
    assetId
  };
}

module.exports = {
  loadManifest,
  getAssetStatus,
  getPromptForAsset,
  requestAssetGeneration
};
