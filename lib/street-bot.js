/**
 * STREETALK // StreetBot — Motore di Moderazione in Tempo Reale (Art. 4)
 * Analizza il flusso dei messaggi in RAM, blocca insulti/minacce/flood/spam e
 * gestisce la progressione sanzionatoria dei 3 sgarri (Warning -> IP Jail -> Permaban).
 * Conforme al Regolamento UE 2022/2065 (DSA) con diritto di revisione umana.
 */

class StreetBot {
  constructor() {
    // Memoria volatile per strike e ban (Zero-Database)
    this.strikesByIp = new Map();
    this.permanentBans = new Set();
    this.floodTracker = new Map(); // socketId -> Array of timestamps and message hashes

    // Durata della sospensione al 2° sgarro (15 minuti)
    this.JAIL_DURATION_MS = 15 * 60 * 1000;

    // Pattern di rilevamento violazioni Art. 4
    this.threatPatterns = [
      /\b(ti\s+(ammazzo|uccido|accoltello|spacco|sgozzo|brucio|rovino))\b/i,
      /\b(muori|ammazzati|crepa|suicidati)\b/i,
      /\b(ti\s+vengo\s+a\s+(prendere|cercare))\b/i
    ];

    this.insultPatterns = [
      /\b(bastard[oaie]|cattiv[oa]|stronz[oaie]|merd[aoie]|coglione|coglioni|troi[ae]|puttan[ae]|zoccol[ae]|cagna|frocio|frocetti|ricchione|negro|negri)\b/i,
      /\b(mongoloide|ritardat[oa]|down)\b/i,
      /\b(figli[oa]\s+di\s+puttana|figli[oa]\s+di\s+troia|vaffanculo|cretin[oaie]|deficiente)\b/i
    ];

    this.spamPatterns = [
      /\b(https?:\/\/[^\s]+)/i,
      /\b(www\.[^\s]+)/i,
      /\b(t\.me\/[^\s]+|wa\.me\/[^\s]+|telegram\.me\/[^\s]+)\b/i,
      /\b([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})\b/i,
      /\b(onlyfans\.com|tiktok\.com\/@[^\s]+|instagram\.com\/[^\s]+)\b/i
    ];

    // Doxxing (numeri telefonici, carte, CF)
    this.doxxingPatterns = [
      /\b(?:(?:\+|00)39[\s.-]?)?3\d{2}[\s.-]?\d{6,7}\b/, // Cellulari italiani
      /\b(?:[0-9]{4}[\s-]?){3}[0-9]{4}\b/, // Carte di credito
      /\b[A-Z]{6}[0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]\b/i // Codice Fiscale
    ];
  }

  /**
   * Verifica se un IP è soggetto a ban permanente (3° sgarro)
   */
  isBanned(ip) {
    if (!ip) return false;
    return this.permanentBans.has(ip);
  }

  /**
   * Restituisce il numero corrente di strike per un dato IP
   */
  getStrikes(ip) {
    if (!ip) return 0;
    const record = this.strikesByIp.get(ip);
    return record ? record.count : 0;
  }

  /**
   * Analizza un messaggio in transito in tempo reale
   * Restituisce { violated: boolean, reason: string|null, category: string|null }
   */
  analyze(text, socketId) {
    if (!text || typeof text !== 'string') {
      return { violated: false, reason: null, category: null };
    }

    const trimmed = text.trim();

    // 1. Controllo Flood & Ripetizione caratteri
    if (/(.)\1{14,}/.test(trimmed)) {
      return {
        violated: true,
        reason: 'Flood o ripetizione esagerata di caratteri vietata (Art. 4).',
        category: 'flood'
      };
    }

    // 2. Controllo frequenza rapida messaggi (Flood socket)
    if (socketId) {
      const now = Date.now();
      const history = this.floodTracker.get(socketId) || [];
      const recent = history.filter(item => now - item.timestamp < 3000);
      
      // Se invia più di 12 messaggi in 3 secondi (ritmo anomalo da bot flood)
      if (recent.length >= 12) {
        return {
          violated: true,
          reason: 'Flood rilevato: frequenza messaggi anomala (Art. 4).',
          category: 'flood'
        };
      }

      // Se invia messaggi identici ripetuti 3 volte di fila
      const sameContent = recent.filter(item => item.text === trimmed);
      if (sameContent.length >= 3) {
        return {
          violated: true,
          reason: 'Invio ripetuto dello stesso messaggio bloccato (Art. 4).',
          category: 'flood'
        };
      }

      recent.push({ timestamp: now, text: trimmed });
      this.floodTracker.set(socketId, recent);
    }

    // 3. Controllo Minacce Gravi
    for (const pattern of this.threatPatterns) {
      if (pattern.test(trimmed)) {
        return {
          violated: true,
          reason: 'Minacce di violenza o condotta intimidatoria severamente vietata (Art. 4).',
          category: 'threat'
        };
      }
    }

    // 4. Controllo Insulti e Linguaggio d'Odio
    for (const pattern of this.insultPatterns) {
      if (pattern.test(trimmed)) {
        return {
          violated: true,
          reason: 'Insulti, denigrazioni o linguaggio d\'odio non tollerati (Art. 4).',
          category: 'insult'
        };
      }
    }

    // 5. Controllo Spam / Link Commerciali
    for (const pattern of this.spamPatterns) {
      if (pattern.test(trimmed)) {
        return {
          violated: true,
          reason: 'Link esterni, spam e autopromozione vietati (Art. 4).',
          category: 'spam'
        };
      }
    }

    // 6. Controllo Doxxing / Dati Personali
    for (const pattern of this.doxxingPatterns) {
      if (pattern.test(trimmed)) {
        return {
          violated: true,
          reason: 'Diffusione di dati personali (telefoni, carte o codici) vietata (Art. 4).',
          category: 'doxxing'
        };
      }
    }

    return { violated: false, reason: null, category: null };
  }

  /**
   * Registra uno sgarro a carico di un IP ed esegue la progressione a 3 strike:
   * - 1° Sgarro: Avviso a schermo + blocco messaggio
   * - 2° Sgarro: Sospensione temporanea (IP Jail 15m)
   * - 3° Sgarro: Ban permanente definitivo
   */
  recordStrike(ip, reason = 'Violazione delle Regole della Strada (Art. 4)') {
    if (!ip) {
      return { strike: 1, action: 'warn', message: reason };
    }

    const currentRecord = this.strikesByIp.get(ip) || { count: 0, history: [] };
    currentRecord.count += 1;
    currentRecord.lastStrikeAt = Date.now();
    currentRecord.history.push({
      timestamp: Date.now(),
      reason,
      strike: currentRecord.count
    });

    this.strikesByIp.set(ip, currentRecord);

    if (currentRecord.count === 1) {
      return {
        strike: 1,
        action: 'warn',
        reason,
        message: '1° Sgarro: messaggio bloccato. La chat richiede rispetto (Art. 4). Al 2° scatta la sospensione temporanea, al 3° il ban permanente.'
      };
    } else if (currentRecord.count === 2) {
      return {
        strike: 2,
        action: 'jail',
        reason,
        jailDurationMs: this.JAIL_DURATION_MS,
        message: '2° Sgarro: sospensione temporanea (IP Jail 15 minuti) per violazione dell\'Art. 4. Revisione umana: contatto@streetalk.live.'
      };
    } else {
      // 3° sgarro o superiore: Permaban
      this.permanentBans.add(ip);
      return {
        strike: currentRecord.count,
        action: 'permaban',
        reason,
        message: '3° Sgarro: BAN PERMANENTE. Sei stato escluso da STREETALK per ripetute violazioni dell\'Art. 4. Diritto di ricorso: contatto@streetalk.live.'
      };
    }
  }

  /**
   * Ripulisce il flood tracker quando un socket si disconnette
   */
  cleanSocket(socketId) {
    if (socketId) {
      this.floodTracker.delete(socketId);
    }
  }

  /**
   * Reset totale dello stato in memoria (utilizzato nei test per garantire zero leak)
   */
  reset() {
    this.strikesByIp.clear();
    this.permanentBans.clear();
    this.floodTracker.clear();
  }
}

const streetBot = new StreetBot();
module.exports = {
  StreetBot,
  streetBot
};
