'use strict';

const net = require('net');
// Express already uses this installed package for its trust-proxy implementation.
const proxyaddr = require('proxy-addr');

const PRODUCTION_ORIGINS = Object.freeze([
  'https://streetalk-live.vercel.app',
  'https://streetalk.onrender.com'
]);

function exactOrigin(value) {
  if (typeof value !== 'string' || value === 'null') return null;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && url.origin === value ? url : null;
  } catch {
    return null;
  }
}

function createNetworkPolicy({
  nodeEnv = process.env.NODE_ENV,
  allowedOrigins = process.env.ALLOWED_ORIGINS || '',
  trustedProxies = process.env.TRUSTED_PROXIES || ''
} = {}) {
  const origins = new Set(PRODUCTION_ORIGINS);
  for (const origin of allowedOrigins.split(',').map(value => value.trim()).filter(Boolean)) {
    if (!exactOrigin(origin)) throw new Error('ALLOWED_ORIGINS must contain exact HTTP(S) origins');
    origins.add(origin);
  }

  const proxies = trustedProxies.split(',').map(value => value.trim()).filter(Boolean);
  for (const entry of proxies) {
    const parts = entry.split('/');
    const version = net.isIP(parts[0]);
    const maxPrefix = version === 4 ? 32 : 128;
    if (!version || parts.length > 2 || (parts.length === 2 &&
      (!/^\d+$/.test(parts[1]) || Number(parts[1]) < 1 || Number(parts[1]) > maxPrefix))) {
      throw new Error('TRUSTED_PROXIES must contain explicit IP addresses or bounded CIDRs');
    }
  }
  const trustProxy = proxyaddr.compile(proxies);

  function isOriginAllowed(origin) {
    // Native clients may omit Origin. This browser boundary is not authentication.
    if (origin === undefined) return true;
    const url = exactOrigin(origin);
    if (!url) return false;
    if (origins.has(origin)) return true;
    return nodeEnv !== 'production' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  }

  function getClientIp(socket) {
    const request = socket.request;
    const remoteAddress = request?.socket?.remoteAddress || socket.conn?.remoteAddress || socket.handshake?.address;
    if (!net.isIP(remoteAddress)) return 'unknown';
    const headers = request?.headers || socket.handshake?.headers || {};
    try {
      // Start at the actual peer, walking XFF from right to left only while trusted.
      // cf-connecting-ip is deliberately not accepted as an independent authority.
      const address = proxyaddr({ socket: { remoteAddress }, headers }, trustProxy);
      return net.isIP(address) ? address : remoteAddress;
    } catch {
      return remoteAddress;
    }
  }

  return { isOriginAllowed, getClientIp, trustProxy };
}

module.exports = { createNetworkPolicy, PRODUCTION_ORIGINS };
