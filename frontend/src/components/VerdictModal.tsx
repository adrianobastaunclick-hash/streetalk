import React, { useState, useEffect } from 'react';
import { SubCategory, VerdictDecision } from '../types/undressed';
import { undressedStore } from '../store/undressedStore';

interface VerdictModalProps {
  subCategory: SubCategory;
  isOpen: boolean;
  onDecision: (choice: 'yes' | 'no') => void;
  onCleanAndExit: () => void;
  onContinueToInbox?: () => void;
}

export const VerdictModal: React.FC<VerdictModalProps> = ({
  subCategory,
  isOpen,
  onDecision,
  onCleanAndExit,
  onContinueToInbox
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(30);
  const [myChoice, setMyChoice] = useState<VerdictDecision>('pending');
  const [resolvedResult, setResolvedResult] = useState<'connected' | 'destroyed' | null>(null);

  const isAfterDark = subCategory.id === 'after_dark';
  const yesLabel = isAfterDark ? 'ACCENDI LA LUCE' : 'RESTA CON ME';
  const noLabel = isAfterDark ? 'SPEGNI TUTTO' : 'BUON VIAGGIO';

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Timeout = automatic No / Destroy
          if (myChoice === 'pending') {
            handleChoice('no');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const unsub = undressedStore.subscribe((state) => {
      if (state.verdict.resolved && state.verdict.result) {
        setResolvedResult(state.verdict.result);
      }
    });

    return () => {
      clearInterval(interval);
      unsub();
    };
  }, [isOpen, myChoice]);

  const handleChoice = (choice: 'yes' | 'no') => {
    setMyChoice(choice);
    undressedStore.setVerdictChoice(choice);
    onDecision(choice);

    if (choice === 'no') {
      // Instant zero footprint destruction
      setResolvedResult('destroyed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-fade-in">
      <div className="w-full max-w-lg bg-[#0e1018] border-2 border-street-orange/80 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-[0_0_50px_rgba(255,101,47,0.35)] relative overflow-hidden">
        {/* Background glow vignette */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-street-orange/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-street-orange/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-street-orange/20 border border-street-orange/40 text-street-orange font-mono text-xs font-bold uppercase tracking-widest">
          <span>⚖️ IL VERDETTO FINALE</span>
        </div>

        {/* AI Final Question */}
        <div className="space-y-2">
          <h2 className="font-street font-black text-2xl sm:text-3xl text-white uppercase tracking-tight">
            "Il tempo è scaduto. Il gioco è finito."
          </h2>
          <p className="font-sans text-xs sm:text-sm text-zinc-300 max-w-md mx-auto leading-relaxed">
            La scelta adesso è reale. Avete 30 secondi: un solo rifiuto o il silenzio distruggeranno la stanza e
            cancelleranno ogni traccia dal server all'istante.
          </p>
        </div>

        {/* 30s Countdown Visual Indicator */}
        {!resolvedResult && (
          <div className="flex flex-col items-center justify-center gap-1.5">
            <span className="text-4xl font-mono font-black text-street-orange animate-pulse">
              {String(secondsRemaining).padStart(2, '0')}s
            </span>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
              Scelta sincronizzata bilaterale
            </span>
          </div>
        )}

        {/* PENDING DECISION BUTTONS */}
        {!resolvedResult && myChoice === 'pending' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* NO CHOICE */}
            <button
              type="button"
              onClick={() => handleChoice('no')}
              className="py-4 px-5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white font-street font-bold text-xs sm:text-sm uppercase tracking-wider rounded-2xl transition transform hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
            >
              [ {noLabel} ]
            </button>

            {/* YES CHOICE */}
            <button
              type="button"
              onClick={() => handleChoice('yes')}
              className="py-4 px-5 bg-street-orange hover:bg-orange-500 text-black font-street font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl transition transform hover:scale-105 active:scale-95 shadow-[0_0_25px_rgba(255,101,47,0.5)] cursor-pointer"
            >
              [ {yesLabel} ]
            </button>
          </div>
        )}

        {/* WAITING FOR PARTNER */}
        {!resolvedResult && myChoice === 'yes' && (
          <div className="p-4 bg-[#151924] border border-street-orange/40 rounded-2xl text-center space-y-2">
            <span className="w-5 h-5 rounded-full border-2 border-street-orange border-t-transparent animate-spin inline-block" />
            <p className="font-mono text-xs text-white font-bold">
              Hai scelto: [ {yesLabel} ]
            </p>
            <p className="text-[11px] font-mono text-zinc-400">
              In attesa della decisione del partner... (30s)
            </p>
          </div>
        )}

        {/* RESOLUTION: MATCH CONFIRMED (DOUBLE YES) */}
        {resolvedResult === 'connected' && (
          <div className="p-5 bg-emerald-950/70 border-2 border-emerald-500 rounded-2xl text-center space-y-3 animate-fade-in">
            <span className="text-3xl">✨</span>
            <h3 className="font-street font-black text-xl text-white uppercase">
              CONNESSIONE CONFERMATA!
            </h3>
            <p className="text-xs font-mono text-emerald-200 leading-relaxed">
              Entrambi avete scelto di continuare. Tutti i filtri blur sui 3 slot sono stati rimossi. La conversazione è ora
              un thread privato permanente salvato nei tuoi contatti.
            </p>
            <button
              type="button"
              onClick={onContinueToInbox || onCleanAndExit}
              className="mt-2 py-3 px-6 bg-emerald-500 hover:bg-emerald-400 text-black font-street font-black text-xs uppercase rounded-xl transition cursor-pointer shadow-lg"
            >
              Vai alla Chat Permanente ➔
            </button>
          </div>
        )}

        {/* RESOLUTION: DESTROYED (SINGLE NO OR TIMEOUT) */}
        {resolvedResult === 'destroyed' && (
          <div className="p-5 bg-red-950/70 border-2 border-red-500 rounded-2xl text-center space-y-3 animate-fade-in">
            <span className="text-3xl">💥</span>
            <h3 className="font-street font-black text-xl text-white uppercase">
              ZERO FOOTPRINT // DISTRUZIONE TOTALE
            </h3>
            <p className="text-xs font-mono text-red-200 leading-relaxed">
              Accordo non raggiunto. La stanza è stata chiusa, i 3 file eliminati dallo storage volatile e la cache locale
              azzerata. Nessun log è stato conservato.
            </p>
            <button
              type="button"
              onClick={onCleanAndExit}
              className="mt-2 py-3 px-6 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-mono text-xs uppercase rounded-xl transition cursor-pointer"
            >
              Torna alla Home
            </button>
          </div>
        )}

        {/* Zero-Footprint Guarantee Note */}
        <div className="pt-2 border-t border-zinc-800 text-[10px] font-mono text-zinc-500">
          🛡️ STREETALK PROTOCOL // MEMORIA VOLATILE RAM // ZERO TRACCE
        </div>
      </div>
    </div>
  );
};
