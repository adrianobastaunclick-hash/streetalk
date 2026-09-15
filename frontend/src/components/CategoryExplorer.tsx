import React, { useState } from 'react';
import {
  MacroCategory,
  SubCategory,
  MACRO_CATEGORIES_CATALOG
} from '../types/undressed';
import { undressedStore } from '../store/undressedStore';

interface CategoryExplorerProps {
  onSelectRoom?: (subCategory: SubCategory) => void;
  className?: string;
}

export const CategoryExplorer: React.FC<CategoryExplorerProps> = ({
  onSelectRoom,
  className = ''
}) => {
  const [activeMacroId, setActiveMacroId] = useState<string>('flirt_connections');
  const [expandedSubId, setExpandedSubId] = useState<string | null>('after_dark');

  const activeMacro =
    MACRO_CATEGORIES_CATALOG.find((m) => m.id === activeMacroId) ||
    MACRO_CATEGORIES_CATALOG[0];

  const handleSelectRoom = (sub: SubCategory) => {
    undressedStore.openVault(sub);
    if (onSelectRoom) {
      onSelectRoom(sub);
    }
  };

  return (
    <div className={`w-full max-w-4xl mx-auto flex flex-col gap-6 text-white ${className}`}>
      {/* HEADER SECTION */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-street-orange/15 border border-street-orange/40 text-street-orange font-mono text-[11px] font-bold uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-street-orange animate-pulse" />
          <span>UNDRESSED ENGINE // ARCHITETTURA STANZE</span>
        </div>
        <h2 className="font-street font-black text-2xl sm:text-4xl uppercase tracking-tight">
          Scegli la tua frequenza nella notte
        </h2>
        <p className="text-zinc-400 font-sans text-xs sm:text-sm max-w-xl mx-auto">
          Scendi nei livelli della città: chat rapide di testo, tavoli di discussione o l'incontro guidato dall'IA.
        </p>
      </div>

      {/* MACRO-CATEGORIES TABS (LEVEL 1) */}
      <div
        className="flex items-center justify-center gap-2 border-b border-zinc-800 pb-3 overflow-x-auto no-scrollbar"
        role="tablist"
        aria-label="Macro Categorie di Streetalk"
      >
        {MACRO_CATEGORIES_CATALOG.map((macro) => {
          const isActive = macro.id === activeMacroId;
          return (
            <button
              key={macro.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                setActiveMacroId(macro.id);
                setExpandedSubId(macro.subcategories[0]?.id || null);
              }}
              className={`px-4 sm:px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-street-orange text-black shadow-[0_0_20px_rgba(255,101,47,0.35)]'
                  : 'bg-[#121520] hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <span>{macro.id === 'flirt_connections' ? '🔥' : macro.id === 'confession_wall' ? '📜' : '👥'}</span>
              <span>{macro.title}</span>
              {macro.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                    isActive ? 'bg-black/30 text-black font-extrabold' : 'bg-street-orange/20 text-street-orange'
                  }`}
                >
                  {macro.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* MACRO TAGLINE BANNER */}
      {activeMacro.id === 'flirt_connections' && (
        <div className="bg-gradient-to-r from-orange-500/10 via-[#151922] to-orange-500/10 border border-street-orange/40 rounded-2xl p-4 text-center">
          <p className="font-street font-bold text-sm sm:text-base text-zinc-200 uppercase tracking-wide">
            "10 minuti al buio. Tre verità svelate. Tu e uno sconosciuto: restate o vi rivestite?"
          </p>
        </div>
      )}

      {/* SUBCATEGORIES CARDS / ACCORDION (LEVEL 2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {activeMacro.subcategories.map((sub) => {
          const isUndressed = sub.mode === 'undressed_engine';
          const isExpanded = expandedSubId === sub.id;

          return (
            <div
              key={sub.id}
              className={`bg-[#121520] border rounded-2xl p-5 sm:p-6 transition-all duration-200 flex flex-col justify-between ${
                isUndressed
                  ? 'border-street-orange/40 hover:border-street-orange shadow-[0_4px_25px_rgba(0,0,0,0.6)]'
                  : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div>
                {/* Badges Bar */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {sub.id === 'after_dark' && (
                      <>
                        <span className="px-2 py-0.5 rounded bg-street-orange/20 border border-street-orange/50 text-street-orange font-mono text-[10px] font-bold">
                          [ 10 MIN ]
                        </span>
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-[10px] font-bold">
                          [ ADRENALINA FISICA ]
                        </span>
                      </>
                    )}
                    {sub.id === 'soul_talk' && (
                      <>
                        <span className="px-2 py-0.5 rounded bg-street-orange/20 border border-street-orange/50 text-street-orange font-mono text-[10px] font-bold">
                          [ 15 MIN ]
                        </span>
                        <span className="px-2 py-0.5 rounded bg-teal-500/20 border border-teal-500/40 text-teal-300 font-mono text-[10px] font-bold">
                          [ INTIMITÀ PURA ]
                        </span>
                      </>
                    )}
                    {!isUndressed && (
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono text-[10px]">
                        CHAT STANDARD
                      </span>
                    )}
                  </div>
                  {isUndressed && (
                    <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Regia IA
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="font-street font-black text-xl text-white uppercase tracking-tight mb-2">
                  {sub.title}
                </h3>

                {/* Description */}
                <p className="text-zinc-300 text-xs sm:text-sm font-sans leading-relaxed mb-4">
                  {sub.description}
                </p>

                {/* Undressed Specs Summary (Accordion view) */}
                {isUndressed && sub.engineConfig && (
                  <div className="bg-black/50 border border-zinc-800/90 rounded-xl p-3 mb-4 space-y-2 text-[11px] font-mono">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>Timer globale:</span>
                      <strong className="text-white">
                        {Math.floor(sub.engineConfig.totalDurationSeconds / 60)} minuti
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>Turno di risposta:</span>
                      <strong className="text-street-orange">
                        {sub.engineConfig.responseWindowSeconds} secondi
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>Pre-match Vault:</span>
                      <strong className="text-zinc-200">3 slot obbligatori</strong>
                    </div>

                    {/* Slot preview hints */}
                    <div className="pt-2 border-t border-zinc-800/80 space-y-1 text-[10px]">
                      {sub.engineConfig.slotsDefinition.map((slot) => (
                        <div key={slot.index} className="text-zinc-400 flex items-start gap-1">
                          <span className="text-street-orange font-bold">Slot {slot.index}:</span>
                          <span className="text-zinc-300 truncate">{slot.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-2">
                {isUndressed ? (
                  <button
                    type="button"
                    onClick={() => handleSelectRoom(sub)}
                    className="w-full py-3 px-4 bg-street-orange hover:bg-orange-500 text-black font-street font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,101,47,0.3)] active:scale-95 cursor-pointer"
                  >
                    <span>⚡ APRI VAULT &amp; ENTRA</span>
                    <span>➔</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined' && (window as any).switchView) {
                        (window as any).switchView(sub.mode === 'confession_wall' ? 'bacheca' : 'app');
                      }
                    }}
                    className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs uppercase rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Entra nella Stanza</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
