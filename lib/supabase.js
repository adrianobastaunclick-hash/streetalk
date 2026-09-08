const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Read environment variables
const supabaseUrl = process.env.SUPABASE_URL || null;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || null;

let supabase = null;
let isConfigured = false;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });
    isConfigured = true;
    console.log('[STREETALK:SUPABASE] Connected to Supabase at:', supabaseUrl);
  } catch (err) {
    console.error('[STREETALK:SUPABASE] Initialization failed:', err.message);
    isConfigured = false;
  }
} else {
  console.log('[STREETALK:SUPABASE] No credentials found in environment. Running in zero-persistence memory mode.');
}

/**
 * Hash an IP address for anonymous analytics and abuse tracking without exposing raw PII
 */
function hashIp(ip) {
  if (!ip) return 'anonymous';
  return crypto.createHash('sha256').update(ip + (process.env.IP_SALT || 'streetalk_salt_2026')).digest('hex').substring(0, 16);
}

/**
 * Check if Supabase client is active
 */
function isReady() {
  return isConfigured && supabase !== null;
}

/**
 * Get current Supabase connection status
 */
function getStatus() {
  return {
    configured: isConfigured,
    url: supabaseUrl ? supabaseUrl.replace(/https?:\/\//, '').split('.')[0] + '.supabase.co' : null,
    mode: isConfigured ? 'supabase_cloud' : 'in_memory_volatile'
  };
}

/**
 * Archive a secret to Supabase (Wall of Street Secrets)
 */
async function archiveSecret({ content, mood = 'cazzeggio', isPublic = true }) {
  if (!isReady()) {
    return { ok: true, memoryOnly: true };
  }

  try {
    const { data, error } = await supabase
      .from('secrets')
      .insert([
        {
          content: content.trim(),
          mood: mood.toLowerCase(),
          is_public: Boolean(isPublic),
          likes_count: 0
        }
      ])
      .select();

    if (error) {
      console.warn('[STREETALK:SUPABASE] Failed to archive secret:', error.message);
      return { ok: false, error: error.message };
    }
    return { ok: true, data: data[0] };
  } catch (err) {
    console.warn('[STREETALK:SUPABASE] Unexpected error archiving secret:', err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Fetch public street confessions from Supabase
 */
async function getPublicSecrets({ limit = 20, mood = null } = {}) {
  if (!isReady()) {
    return { ok: true, secrets: [], memoryOnly: true };
  }

  try {
    let query = supabase
      .from('secrets')
      .select('id, content, mood, likes_count, created_at')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (mood && mood !== 'all') {
      query = query.eq('mood', mood.toLowerCase());
    }

    const { data, error } = await query;
    if (error) {
      console.warn('[STREETALK:SUPABASE] Error fetching secrets:', error.message);
      return { ok: false, error: error.message, secrets: [] };
    }
    return { ok: true, secrets: data || [] };
  } catch (err) {
    console.warn('[STREETALK:SUPABASE] Error fetching secrets:', err.message);
    return { ok: false, error: err.message, secrets: [] };
  }
}

/**
 * Log an abuse report to Supabase for safety moderation
 */
async function logReport({ roomId, reason, reporterIp, reportedIp }) {
  if (!isReady()) {
    return { ok: true, memoryOnly: true };
  }

  try {
    const reporterHash = hashIp(reporterIp);
    const reportedHash = hashIp(reportedIp);

    const { data, error } = await supabase
      .from('reports')
      .insert([
        {
          room_id: roomId,
          reason: reason || 'unspecified',
          reporter_ip_hash: reporterHash,
          reported_ip_hash: reportedHash,
          status: 'pending'
        }
      ]);

    if (error) {
      console.warn('[STREETALK:SUPABASE] Error logging report:', error.message);
      return { ok: false, error: error.message };
    }
    return { ok: true, data };
  } catch (err) {
    console.warn('[STREETALK:SUPABASE] Error logging report:', err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Record telemetry metrics to Supabase
 */
async function recordTelemetry({ totalMatches = 0, totalMessages = 0, peakConcurrent = 0 }) {
  if (!isReady()) {
    return { ok: true, memoryOnly: true };
  }

  try {
    const { error } = await supabase
      .from('telemetry')
      .insert([
        {
          total_matches: totalMatches,
          total_messages: totalMessages,
          peak_concurrent: peakConcurrent
        }
      ]);

    if (error) {
      console.warn('[STREETALK:SUPABASE] Telemetry write error:', error.message);
    }
  } catch (err) {
    console.warn('[STREETALK:SUPABASE] Telemetry write error:', err.message);
  }
}

module.exports = {
  supabase,
  isReady,
  getStatus,
  archiveSecret,
  getPublicSecrets,
  logReport,
  recordTelemetry,
  hashIp
};
