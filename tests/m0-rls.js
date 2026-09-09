'use strict';

// Local PostgreSQL only; no dotenv, Supabase credentials, provider API or existing DB.
// Usage: node tests/m0-rls.js --work-dir <absolute disposable parent directory>
// Requires initdb, pg_ctl and psql on PATH. Every invocation owns a new subdirectory.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { spawnSync } = require('node:child_process');

const TABLES = ['secrets', 'reports', 'telemetry'];
const CLIENTS = ['anon', 'authenticated'];
const INSERTS = {
  secrets: "INSERT INTO public.secrets (content,mood) VALUES ('synthetic secret','cazzeggio')",
  reports: "INSERT INTO public.reports (room_id,reason,reporter_ip_hash,reported_ip_hash) VALUES ('synthetic-room','spam','synthetic-reporter','synthetic-reported')",
  telemetry: "INSERT INTO public.telemetry (total_matches,total_messages,peak_concurrent) VALUES (1,2,2)"
};
const UPDATES = {
  secrets: "UPDATE public.secrets SET content = 'synthetic update'",
  reports: "UPDATE public.reports SET status = 'reviewed'",
  telemetry: "UPDATE public.telemetry SET total_messages = 3"
};

// Access-policy fixture from 438ec13769e23935c29123356996ce67f4a3dab7.
// Historical table definitions and policies, without the unrelated marketing seed.
const LEGACY_SCHEMA = `
CREATE TABLE public.secrets (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 content TEXT NOT NULL CHECK (char_length(content) >= 3 AND char_length(content) <= 90),
 mood TEXT NOT NULL CHECK (mood IN ('cazzeggio','sfogati','flirt')),
 likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
 is_public BOOLEAN DEFAULT true,
 created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE public.reports (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), room_id TEXT, reason TEXT NOT NULL,
 reporter_ip_hash TEXT NOT NULL, reported_ip_hash TEXT NOT NULL,
 status TEXT DEFAULT 'pending' CHECK (status IN ('pending','reviewed','dismissed','jailed')),
 created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE public.telemetry (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), total_matches INTEGER DEFAULT 0,
 total_messages INTEGER DEFAULT 0, peak_concurrent INTEGER DEFAULT 0,
 recorded_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access to approved secrets" ON public.secrets FOR SELECT TO anon, authenticated USING (is_public = true);
CREATE POLICY "Allow inserting secrets" ON public.secrets FOR INSERT TO anon, authenticated, service_role WITH CHECK (char_length(content) >= 3 AND char_length(content) <= 90);
CREATE POLICY "Disallow public read on reports" ON public.reports FOR SELECT TO authenticated, service_role USING (true);
CREATE POLICY "Allow service_role and backend insert on reports" ON public.reports FOR INSERT TO anon, authenticated, service_role WITH CHECK (true);
CREATE POLICY "Allow public read on telemetry" ON public.telemetry FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow backend write on telemetry" ON public.telemetry FOR INSERT TO service_role, authenticated, anon WITH CHECK (true);
GRANT ALL ON public.secrets, public.reports, public.telemetry TO anon, authenticated, service_role;
`;

function freePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const port = probe.address().port;
      probe.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

async function main() {
  const flag = process.argv.indexOf('--work-dir');
  const supplied = flag === -1 ? null : process.argv[flag + 1];
  assert(supplied && path.isAbsolute(supplied), 'Pass an absolute --work-dir for a new disposable cluster.');
  const workDir = path.resolve(supplied);
  fs.mkdirSync(workDir, { recursive: true });
  const realWorkDir = fs.realpathSync(workDir);
  const runDir = fs.mkdtempSync(path.join(realWorkDir, 'run-'));
  const dataDir = path.join(runDir, 'data');
  const marker = path.join(runDir, '.streetalk-m0-owned');
  fs.writeFileSync(marker, 'local synthetic PostgreSQL test only\n');
  const port = await freePort();
  const pgEnv = {};
  for (const name of ['PATH','Path','SystemRoot','SYSTEMROOT','COMSPEC','ComSpec','TEMP','TMP','USERPROFILE','APPDATA','LOCALAPPDATA']) {
    if (process.env[name]) pgEnv[name] = process.env[name];
  }
  let checks = 0;
  let startAttempted = false;
  let safelyStopped = false;

  function command(binary, args, input, allowFailure = false) {
    const result = spawnSync(binary, args, {
      env: pgEnv, encoding: 'utf8', windowsHide: true, input,
      timeout: 60000, maxBuffer: 1024 * 1024
    });
    if (!allowFailure && (result.error || result.status !== 0)) {
      const log = binary === 'pg_ctl' && fs.existsSync(path.join(runDir, 'postgres.log')) ? fs.readFileSync(path.join(runDir, 'postgres.log'), 'utf8') : '';
      throw new Error(binary + ' failed: ' + (result.error ? result.error.message : result.stderr || result.stdout) + log);
    }
    return result;
  }

  function sql(database, statement, role, allowFailure = false) {
    return command('psql', [
      '-X', '--no-password', '-h', '127.0.0.1', '-p', String(port),
      '-U', 'streetalk_m0', '-d', database, '-v', 'ON_ERROR_STOP=1',
      '--quiet', '--tuples-only', '--no-align'
    ], '\\set VERBOSITY verbose\n' + (role ? 'SET ROLE ' + role + ';\n' : '') + statement + ';\n', allowFailure);
  }
  function value(db, query, role) { return sql(db, query, role).stdout.trim(); }
  function check(condition, description) {
    assert(condition, description);
    checks++;
  }
  function denied(db, statement, role, description) {
    const result = sql(db, statement, role, true);
    check(result.status !== 0 && /42501/.test(result.stderr), description + ': expected permission denied (42501)');
  }
  function snapshot(db) {
    return TABLES.map(table => value(db, "SELECT md5(COALESCE(string_agg(row_to_json(t)::text,'|' ORDER BY id),'')) FROM public." + table + ' t')).join(':');
  }
  function boundaryChecks(db) {
    for (const role of CLIENTS) {
      for (const table of TABLES) {
        for (const privilege of ['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) {
          check(value(db, "SELECT has_table_privilege('" + role + "','public." + table + "','" + privilege + "')") === 'f',
            db + ': no ' + privilege + ' grant for ' + role + '/' + table);
        }
        denied(db, 'SELECT * FROM public.' + table, role, db + ': client SELECT ' + table);
        denied(db, INSERTS[table], role, db + ': client INSERT ' + table);
        denied(db, UPDATES[table], role, db + ': client UPDATE ' + table);
        denied(db, 'DELETE FROM public.' + table, role, db + ': client DELETE ' + table);
      }
    }
    for (const table of ['secrets','telemetry']) {
      denied(db, 'SELECT * FROM public.' + table, 'service_role', db + ': service SELECT ' + table);
      denied(db, INSERTS[table], 'service_role', db + ': service INSERT ' + table);
      denied(db, UPDATES[table], 'service_role', db + ': service UPDATE ' + table);
      denied(db, 'DELETE FROM public.' + table, 'service_role', db + ': service DELETE ' + table);
    }
    sql(db, "INSERT INTO public.reports (room_id,reason,reporter_ip_hash,reported_ip_hash) VALUES ('service-probe','spam','synthetic-one','synthetic-two')", 'service_role');
    check(value(db, "SELECT count(*) FROM public.reports WHERE room_id = 'service-probe'", 'service_role') === '1', db + ': service INSERT/SELECT reports');
    sql(db, "UPDATE public.reports SET status = 'reviewed' WHERE room_id = 'service-probe'", 'service_role');
    check(value(db, "SELECT status FROM public.reports WHERE room_id = 'service-probe'", 'service_role') === 'reviewed', db + ': service UPDATE reports');
    sql(db, "DELETE FROM public.reports WHERE room_id = 'service-probe'", 'service_role');
    check(value(db, "SELECT count(*) FROM public.reports WHERE room_id = 'service-probe'", 'service_role') === '0', db + ': service DELETE reports');
    check(value(db, "SELECT column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='secrets' AND column_name='is_public'") === 'false',
      db + ': new secrets default to private');
    for (const table of TABLES) {
      check(value(db, "SELECT relrowsecurity FROM pg_class WHERE oid='public." + table + "'::regclass") === 't', db + ': RLS enabled on ' + table);
    }
    console.log('[PASS] ' + db + ': direct client CRUD denied; service CRUD confined to reports; RLS and private default verified.');
  }
  function futureGrantChecks(db) {
    for (const table of TABLES) {
      sql(db, 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.' + table + ' TO PUBLIC; CREATE POLICY synthetic_future_allow ON public.' + table + ' FOR ALL TO PUBLIC USING (true) WITH CHECK (true)');
    }
    for (const role of CLIENTS) {
      for (const table of TABLES) {
        check(value(db, 'SELECT count(*) FROM public.' + table, role) === '0', 'restrictive deny hides rows after future grant');
        denied(db, INSERTS[table], role, 'restrictive deny blocks insertion after future grant');
        check(value(db, 'WITH changed AS (' + UPDATES[table] + ' RETURNING 1) SELECT count(*) FROM changed', role) === '0', 'restrictive deny blocks update after future grant');
        check(value(db, 'WITH changed AS (DELETE FROM public.' + table + ' RETURNING 1) SELECT count(*) FROM changed', role) === '0', 'restrictive deny blocks delete after future grant');
      }
    }
    console.log('[PASS] ' + db + ': restrictive RLS still denies client CRUD with synthetic future PUBLIC grants and permissive policies.');
  }

  try {
    command('initdb', ['-D', dataDir, '-U', 'streetalk_m0', '-A', 'trust', '--no-locale', '--encoding=UTF8']);
    fs.appendFileSync(path.join(dataDir, 'postgresql.conf'), "\nlisten_addresses = '127.0.0.1'\nport = " + port + "\nunix_socket_directories = ''\n");
    startAttempted = true;
    command('pg_ctl', ['-D', dataDir, '-l', path.join(runDir, 'postgres.log'), '-w', '-t', '20', 'start']);
    sql('postgres', 'CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS; CREATE DATABASE m0_legacy; CREATE DATABASE m0_fresh');
    const projectDir = path.resolve(__dirname, '..');
    const hardening = fs.readFileSync(path.join(projectDir, 'supabase', 'm0-hardening.sql'), 'utf8');
    const schema = fs.readFileSync(path.join(projectDir, 'supabase', 'schema.sql'), 'utf8');

    sql('m0_legacy', LEGACY_SCHEMA);
    for (const role of CLIENTS) {
      for (const table of TABLES) sql('m0_legacy', INSERTS[table], role);
      check(Number(value('m0_legacy', 'SELECT count(*) FROM public.secrets', role)) > 0, 'legacy client reads public secrets');
      check(Number(value('m0_legacy', 'SELECT count(*) FROM public.telemetry', role)) > 0, 'legacy client reads telemetry');
    }
    check(Number(value('m0_legacy', 'SELECT count(*) FROM public.reports', 'authenticated')) > 0, 'legacy authenticated reads all reports');
    console.log('[REPRODUCED] historical policies allow both clients to insert into all tables and authenticated to read reports.');
    const legacyRows = snapshot('m0_legacy');
    sql('m0_legacy', hardening);
    sql('m0_legacy', hardening);
    check(snapshot('m0_legacy') === legacyRows, 'idempotent hardening preserves every existing synthetic row');
    boundaryChecks('m0_legacy');
    futureGrantChecks('m0_legacy');
    check(snapshot('m0_legacy') === legacyRows, 'future grants test cannot mutate existing synthetic rows');
    sql('m0_legacy', hardening);
    boundaryChecks('m0_legacy');

    // Model historical provider defaults to prove the new schema revokes inherited exposure.
    sql('m0_fresh', 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role');
    sql('m0_fresh', schema);
    sql('m0_fresh', schema);
    for (const table of TABLES) {
      check(value('m0_fresh', 'SELECT count(*) FROM public.' + table) === '0', 'fresh schema creates no marketing seed');
      sql('m0_fresh', INSERTS[table]);
    }
    boundaryChecks('m0_fresh');
    futureGrantChecks('m0_fresh');
    console.log('[PASS] ' + checks + ' PostgreSQL assertions. Local synthetic cluster only; cloud RLS, provider roles and existing data remain unverified.');
  } finally {
    if (startAttempted) {
      const stopped = command('pg_ctl', ['-D', dataDir, '-m', 'fast', '-w', '-t', '20', 'stop'], undefined, true);
      safelyStopped = stopped.status === 0;
      if (!safelyStopped) {
        const status = command('pg_ctl', ['-D', dataDir, 'status'], undefined, true);
        safelyStopped = status.status === 3;
      }
    } else safelyStopped = true;
    if (safelyStopped) {
      // Never remove a computed directory before proving ownership and containment.
      const realRunDir = fs.realpathSync(runDir);
      assert(path.dirname(realRunDir) === realWorkDir && path.basename(realRunDir).startsWith('run-'), 'Unsafe cleanup path');
      assert(fs.readFileSync(marker, 'utf8') === 'local synthetic PostgreSQL test only\n', 'Missing ownership marker');
      fs.rmSync(realRunDir, { recursive: true, force: true });
      console.log('[CLEANUP] owned local cluster stopped and its synthetic files removed.');
    } else {
      throw new Error('Could not confirm local PostgreSQL shutdown; preserved ' + runDir + ' for inspection.');
    }
  }
}
main().catch(error => { console.error('[FAIL] ' + error.message); process.exitCode = 1; });

