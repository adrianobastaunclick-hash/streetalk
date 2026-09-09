const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// The optional backend integration accepts server credentials only. Never fall
// back to a public anon key or a shared/default salt for moderation identifiers.
const supabaseUrl = process.env.SUPABASE_URL || null;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || null;
const ipSalt = typeof process.env.IP_SALT === 'string' ? process.env.IP_SALT.trim() : '';
let supabase = null;
let isConfigured = false;

if (supabaseUrl && supabaseKey && ipSalt) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
    isConfigured = true;
    console.log('[STREETALK:SUPABASE] Optional moderation storage configured.');
  } catch {
    console.error('[STREETALK:SUPABASE] Moderation storage initialization failed.');
  }
} else {
  console.log('[STREETALK:SUPABASE] Moderation storage disabled: server credentials and IP_SALT are required.');
}

function hashIp(ip) {
  if (!ipSalt) throw new Error('IP_SALT is required for moderation storage');
  if (typeof ip !== 'string' || !ip) throw new Error('A network identifier is required');
  // Keyed pseudonyms are still moderation data; they do not imply anonymity.
  return crypto.createHmac('sha256', ipSalt).update(ip).digest('hex');
}

function isReady() {
  return isConfigured && supabase !== null;
}

function getStatus() {
  return {
    configured: isConfigured,
    mode: isConfigured ? 'supabase_reports_only' : 'in_memory_volatile',
    privateContentStorage: false,
    publicFeedEnabled: false
  };
}

// Compatibility entry points stay closed even if a caller or old UI invokes them.
async function archiveSecret() {
  return { ok: false, code: 'PRIVATE_CONTENT_NOT_STORED' };
}

async function getPublicSecrets() {
  return { ok: false, code: 'FEED_DISABLED', secrets: [] };
}

const REPORT_REASONS = Object.freeze(['safety_report', 'spam', 'harassment', 'other']);
function normalizeReportReason(reason) {
  const code = typeof reason === 'string' ? reason.trim().toLowerCase() : '';
  return REPORT_REASONS.includes(code) ? code : 'safety_report';
}

async function logReport({ roomId, reason, reporterIp, reportedIp }) {
  if (!isReady()) return { ok: true, memoryOnly: true };
  try {
    const { error } = await supabase.from('reports').insert([{
      room_id: roomId,
      reason: normalizeReportReason(reason),
      reporter_ip_hash: hashIp(reporterIp),
      reported_ip_hash: hashIp(reportedIp),
      status: 'pending'
    }]);
    if (error) {
      console.warn('[STREETALK:SUPABASE] Moderation report write failed.');
      return { ok: false, code: 'REPORT_WRITE_FAILED' };
    }
    return { ok: true };
  } catch {
    console.warn('[STREETALK:SUPABASE] Moderation report write failed.');
    return { ok: false, code: 'REPORT_WRITE_FAILED' };
  }
}

// Retained for existing numeric telemetry callers; no chat content is accepted.
async function recordTelemetry({ totalMatches = 0, totalMessages = 0, peakConcurrent = 0 }) {
  if (!isReady()) return { ok: true, memoryOnly: true };
  const count = value => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
  try {
    const { error } = await supabase.from('telemetry').insert([{
      total_matches: count(totalMatches),
      total_messages: count(totalMessages),
      peak_concurrent: count(peakConcurrent)
    }]);
    if (!error) return { ok: true };
  } catch {
    // SDK errors may contain request data. Log a fixed diagnostic only.
  }
  console.warn('[STREETALK:SUPABASE] Numeric telemetry write failed.');
  return { ok: false, code: 'TELEMETRY_WRITE_FAILED' };
}

module.exports = {
  supabase,
  isReady,
  getStatus,
  archiveSecret,
  getPublicSecrets,
  logReport,
  recordTelemetry,
  hashIp,
  normalizeReportReason,
  REPORT_REASONS
};
