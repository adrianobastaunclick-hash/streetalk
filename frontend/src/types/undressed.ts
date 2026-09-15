/**
 * STREETALK | Undressed Engine & Hierarchical Rooms Schema
 * Mobile-First Realtime WebApp Architecture
 */

export interface MacroCategory {
  id: string; // es. 'flirt_connections', 'confession_wall', 'agora'
  title: string;
  slug: string;
  description: string;
  badge?: string;
  subcategories: SubCategory[];
}

export interface SubCategory {
  id: string;
  slug: string;
  title: string;
  description: string;
  mode: 'standard_chat' | 'undressed_engine' | 'confession_wall';
  engineConfig?: UndressedConfig;
}

export interface UndressedConfig {
  roomType: 'after_dark' | 'soul_talk';
  totalDurationSeconds: number; // 600s (10 min) per After Dark, 900s (15 min) per Soul Talk
  responseWindowSeconds: number; // 45s per After Dark, 60-90s per Soul Talk
  slotsDefinition: [SlotDef, SlotDef, SlotDef];
}

export interface SlotDef {
  index: 1 | 2 | 3;
  name: string;
  description: string;
  placeholderText: string;
  type: 'image';
}

export type UndressedRoomType = 'after_dark' | 'soul_talk';

export type UndressedPhase =
  | 'QUEUED'
  | 'MATCHED'
  | 'PHASE_1'
  | 'PHASE_2'
  | 'PHASE_3'
  | 'VERDICT'
  | 'CONNECTED'
  | 'DESTROYED';

export interface VaultSlotData {
  index: 1 | 2 | 3;
  file: File | null;
  previewUrl: string | null;
  storageKey?: string | null;
  validated: boolean;
  moderationPassed: boolean;
  unlocked: boolean;
  error?: string | null;
}

export interface AIMessage {
  id: string;
  text: string;
  phase: UndressedPhase;
  timestamp: number;
  readingLockoutSeconds?: number;
  highlightWords?: string[];
  isSystemPrompt?: boolean;
}

export interface UndressedMessage {
  id: string;
  senderId: string;
  senderMoniker: string;
  type: 'text' | 'voice' | 'ai_system' | 'slot_reveal';
  text?: string;
  audioUrl?: string;
  audioDurationSeconds?: number;
  slotIndex?: 1 | 2 | 3;
  timestamp: number;
}

export interface UndressedPartner {
  moniker: string;
  avatar: string;
  mood: string;
  slots: {
    [key in 1 | 2 | 3]: {
      url: string | null;
      unlocked: boolean;
      name: string;
      description: string;
    };
  };
}

export type VerdictDecision = 'yes' | 'no' | 'pending' | 'timeout';

export interface VerdictState {
  active: boolean;
  secondsRemaining: number;
  myChoice: VerdictDecision;
  partnerChoice: VerdictDecision;
  resolved: boolean;
  result?: 'connected' | 'destroyed';
}

/**
 * Macro-Categories Catalog with Exact Copywriting
 */
export const MACRO_CATEGORIES_CATALOG: MacroCategory[] = [
  {
    id: 'flirt_connections',
    slug: 'flirt-connessioni',
    title: 'FLIRT & CONNESSIONI',
    badge: 'ESCLUSIVO UNDRESSED',
    description: '10 minuti al buio. Tre verità svelate. Tu e uno sconosciuto: restate o vi rivestite?',
    subcategories: [
      {
        id: 'after_dark',
        slug: 'after-dark',
        title: 'After Dark | Tensione a Orologeria',
        description: 'Niente volti, niente chiacchiere da bar. Solo dettagli, ombre e 45 secondi a risposta. Riuscirai a reggere lo sguardo dell\'IA prima che scada il tempo?',
        mode: 'undressed_engine',
        engineConfig: {
          roomType: 'after_dark',
          totalDurationSeconds: 600, // 10 min
          responseWindowSeconds: 45,
          slotsDefinition: [
            {
              index: 1,
              name: 'Il Dettaglio',
              description: 'Macro ravvicinata su labbra, collo/clavicola o mani.',
              placeholderText: 'Il Dettaglio — Uno sguardo, il collo, le mani, le labbra. Il tuo punto di non ritorno.',
              type: 'image'
            },
            {
              index: 2,
              name: 'L\'Ombra',
              description: 'Silhouette in penombra o profilo dell\'outfit (nessun volto visibile frontale).',
              placeholderText: 'L\'Ombra — Silhouette, penombra o il profilo del tuo outfit. Fai intravedere, non rivelare.',
              type: 'image'
            },
            {
              index: 3,
              name: 'Il Segno',
              description: 'Tatuaggio, cicatrice o frammento nascosto.',
              placeholderText: 'Il Segno — Un tatuaggio, una cicatrice, un frammento nascosto. Racconta una storia sulla tua pelle.',
              type: 'image'
            }
          ]
        }
      },
      {
        id: 'soul_talk',
        slug: 'soul-talk',
        title: 'Soul Talk | Lo Specchio del Tempo',
        description: 'Chi eri prima di imparare a proteggerti? Mostra chi sei stato da bambino, condividi le tue crepe e scopri se esiste ancora qualcuno capace di guardarti per davvero.',
        mode: 'undressed_engine',
        engineConfig: {
          roomType: 'soul_talk',
          totalDurationSeconds: 900, // 15 min
          responseWindowSeconds: 90,
          slotsDefinition: [
            {
              index: 1,
              name: 'L\'Origine',
              description: 'Foto d\'infanzia da piccoli (scansione o foto scattata a una vecchia polaroid/foto cartacea) oppure un oggetto iconico dell\'infanzia.',
              placeholderText: 'L\'Origine — Una vecchia foto di te da piccolo (anche scansionata o fotografata da un album) o un oggetto d\'infanzia. Prima di ogni maschera.',
              type: 'image'
            },
            {
              index: 2,
              name: 'Il Presente',
              description: 'Macro naturale degli occhi o sorriso spontaneo, senza filtri.',
              placeholderText: 'Il Presente — Una macro pulita dei tuoi occhi oggi. Senza filtri, senza pose da social.',
              type: 'image'
            },
            {
              index: 3,
              name: 'Il Rifugio',
              description: 'Angolo sicuro della propria stanza, un libro aperto, una tazza o la finestra al tramonto.',
              placeholderText: 'Il Rifugio — La pagina di un libro, una tazza fumante o l\'angolo della stanza dove ti senti al sicuro.',
              type: 'image'
            }
          ]
        }
      }
    ]
  },
  {
    id: 'confession_wall',
    slug: 'confession-wall',
    title: 'CONFESSIONI & SFOGO',
    badge: '180 SECONDI',
    description: 'Scambia un pensiero inconfessabile in totale anonimato. Senza foto, senza account, senza log.',
    subcategories: [
      {
        id: 'standard_cazzeggio',
        slug: 'cazzeggio',
        title: 'Cazzeggio Notturno',
        description: 'Chiacchiere leggere tra sconosciuti per passare la notte.',
        mode: 'standard_chat'
      },
      {
        id: 'standard_sfogati',
        slug: 'sfogati',
        title: 'Sfogati Libero',
        description: 'Confessioni e pensieri intimi senza paura del giudizio.',
        mode: 'standard_chat'
      }
    ]
  },
  {
    id: 'agora',
    slug: 'agora-underground',
    title: 'AGORÀ & TAVOLI APERTI',
    badge: 'COMMUNITY',
    description: 'Tavoli di discussione underground creati dalla community e dai Fondatori.',
    subcategories: [
      {
        id: 'agora_bacheca',
        slug: 'bacheca-pubblica',
        title: 'Bacheca della Notte',
        description: 'Leggi e reagisci alle confessioni anonime più votate della strada.',
        mode: 'confession_wall'
      }
    ]
  }
];

/**
 * Copywriting & AI Director Scripts
 */
export const AI_SCRIPTS = {
  after_dark: {
    start: 'Porte chiuse. Schermo acceso. Avete 10 minuti e nessuna maschera. Livello 1: Le parole prima dei corpi. Rispondete in 45 secondi.',
    phase2_unlock: 'I contorni cominciano a definirsi. Guardate i dettagli dell\'altro. Descrivete esattamente cosa state provando senza usare parole scontate.',
    phase3_voice: 'Il tempo del testo è sospeso. Sblocco del segno finale. Registrate un sussurro vocale di 5 secondi: fate sentire chi c\'è dietro lo schermo.',
    verdict: 'Il tempo è scaduto. Il gioco è finito. La scelta adesso è reale. 30 secondi per decidere.'
  },
  soul_talk: {
    start: 'Benvenuti nella stanza della verità. Lasciate fuori chi fingete di essere ogni giorno. Livello 1: Trovate un punto di contatto.',
    phase2_mirror: 'Fermatevi. Guardate lo schermo. Prima di incontrare il mondo, eravate questo. Avete 60 secondi: cosa direste a quel bambino se poteste parlargli adesso?',
    phase3_refuge: 'Il presente e il rifugio si aprono. Avete visto le crepe: è il momento di condividere una vulnerabilità autentica.',
    verdict: 'Il tempo è scaduto. Il gioco è finito. La scelta adesso è reale. 30 secondi per decidere.'
  }
};
