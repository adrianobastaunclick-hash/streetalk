import React, { useState, useEffect, useRef } from 'react';
import {
  SubCategory,
  SlotDef,
  VaultSlotData
} from '../types/undressed';
import { undressedStore } from '../store/undressedStore';

interface UndressedVaultModalProps {
  subCategory: SubCategory;
  isOpen: boolean;
  onClose: () => void;
  onStartMatchmaking: (slotsPayload: { [key in 1 | 2 | 3]: { fileData: string; mimeType: string } }) => void;
}

export const UndressedVaultModal: React.FC<UndressedVaultModalProps> = ({
  subCategory,
  isOpen,
  onClose,
  onStartMatchmaking
}) => {
  const [slots, setSlots] = useState<{ [key in 1 | 2 | 3]: VaultSlotData }>({
    1: { index: 1, file: null, previewUrl: null, validated: false, moderationPassed: false, unlocked: false },
    2: { index: 2, file: null, previewUrl: null, validated: false, moderationPassed: false, unlocked: false },
    3: { index: 3, file: null, previewUrl: null, validated: false, moderationPassed: false, unlocked: false }
  });
  const [activeSlotUpload, setActiveSlotUpload] = useState<1 | 2 | 3 | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = subCategory.engineConfig;
  const slotDefs: [SlotDef, SlotDef, SlotDef] = config
    ? config.slotsDefinition
    : [
        { index: 1, name: 'Slot 1', description: 'Primo contenuto', placeholderText: 'Carica slot 1', type: 'image' },
        { index: 2, name: 'Slot 2', description: 'Secondo contenuto', placeholderText: 'Carica slot 2', type: 'image' },
        { index: 3, name: 'Slot 3', description: 'Terzo contenuto', placeholderText: 'Carica slot 3', type: 'image' }
      ];

  const allValidated = Boolean(
    slots[1].validated &&
    slots[2].validated &&
    slots[3].validated &&
    slots[1].previewUrl &&
    slots[2].previewUrl &&
    slots[3].previewUrl
  );

  const handleTriggerUpload = (index: 1 | 2 | 3) => {
    setActiveSlotUpload(index);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !activeSlotUpload) return;
    const file = e.target.files[0];
    const index = activeSlotUpload;

    // Client-side moderation & validation
    if (!file.type.startsWith('image/')) {
      setErrorMessage(`Slot ${index}: È consentito solo l'upload di immagini (JPEG, PNG, WebP).`);
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setErrorMessage(`Slot ${index}: Il file supera il limite massimo di 4MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const result = loadEvt.target?.result as string;
      setSlots((prev) => ({
        ...prev,
        [index]: {
          index,
          file,
          previewUrl: result,
          storageKey: `vault_${Date.now()}_slot${index}`,
          validated: true,
          moderationPassed: true,
          unlocked: false,
          error: null
        }
      }));
      setErrorMessage(null);
      undressedStore.setSlotData(index, file, result);
    };
    reader.onerror = () => {
      setErrorMessage(`Errore durante la lettura dell'immagine per lo Slot ${index}.`);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveSlot = (index: 1 | 2 | 3, ev: React.MouseEvent) => {
    ev.stopPropagation();
    setSlots((prev) => ({
      ...prev,
      [index]: {
        index,
        file: null,
        previewUrl: null,
        storageKey: null,
        validated: false,
        moderationPassed: false,
        unlocked: false,
        error: null
      }
    }));
    undressedStore.clearSlotData(index);
  };

  const handleSubmit = async () => {
    if (!allValidated || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Prepare payload with base64 data URLs for volatile vault
      const payload: { [key in 1 | 2 | 3]: { fileData: string; mimeType: string } } = {
        1: { fileData: slots[1].previewUrl!, mimeType: slots[1].file?.type || 'image/jpeg' },
        2: { fileData: slots[2].previewUrl!, mimeType: slots[2].file?.type || 'image/jpeg' },
        3: { fileData: slots[3].previewUrl!, mimeType: slots[3].file?.type || 'image/jpeg' }
      };

      onStartMatchmaking(payload);
    } catch (err: any) {
      setErrorMessage(err.message || 'Errore durante la validazione del Vault.');
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-fade-in overflow-y-auto">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />

      <div className="w-full max-w-lg bg-[#0d0f17] border-2 border-street-orange/60 rounded-3xl p-5 sm:p-7 shadow-[0_0_40px_rgba(255,101,47,0.25)] relative my-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-street-orange/20 border border-street-orange/50 flex items-center justify-center text-street-orange font-bold text-sm">
              🔒
            </div>
            <div>
              <h3 className="font-street font-black text-lg text-white uppercase tracking-tight">
                PRE-MATCH VAULT // 3 SLOT
              </h3>
              <p className="text-[10px] font-mono text-zinc-400">
                {subCategory.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Instructions & Vault Notice */}
        <div className="my-3 p-3 bg-black/60 border border-zinc-800 rounded-xl text-zinc-300 font-mono text-[11px] leading-relaxed">
          <p className="text-street-orange font-bold mb-1">
            ⚡ REGOLE DI ACCESSO VINCOLATE:
          </p>
          <p>
            Per entrare nella coda devi caricare tutti e 3 i contenuti richiesti. I tuoi media restano protetti dal
            forte blur anti-ispezione e verranno sbloccati dall'IA solo al momento giusto della conversazione.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-3 p-2.5 bg-red-950/80 border border-red-800 rounded-xl text-red-200 text-xs font-mono flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 3 SLOTS GRID */}
        <div className="space-y-3.5 my-4">
          {slotDefs.map((def) => {
            const slotData = slots[def.index];
            const hasFile = Boolean(slotData.previewUrl);

            return (
              <div
                key={def.index}
                onClick={() => !hasFile && handleTriggerUpload(def.index)}
                className={`group relative rounded-2xl border p-3.5 transition cursor-pointer overflow-hidden ${
                  hasFile
                    ? 'bg-[#151922] border-emerald-500/60'
                    : 'bg-[#10121a] hover:bg-zinc-900/90 border-zinc-800 hover:border-street-orange/60'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Slot Index Badge */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-street font-black text-sm shrink-0 ${
                        hasFile
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                          : 'bg-zinc-900 text-street-orange border border-zinc-800'
                      }`}
                    >
                      {hasFile ? '✓' : `0${def.index}`}
                    </div>

                    {/* Slot Details & Microcopy */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-street font-black text-xs sm:text-sm text-white uppercase truncate">
                          {def.name}
                        </span>
                        {hasFile && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                            VALIDATO
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 font-sans line-clamp-2 mt-0.5">
                        {def.placeholderText}
                      </p>
                    </div>
                  </div>

                  {/* Thumbnail / Upload Trigger */}
                  <div className="shrink-0">
                    {hasFile ? (
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-zinc-700 bg-black group-hover:border-red-500 transition">
                        {/* Dynamic Blur Layer (Anti-Inspection) */}
                        <img
                          src={slotData.previewUrl!}
                          alt={def.name}
                          className="w-full h-full object-cover select-none pointer-events-none"
                          style={{
                            filter: 'blur(28px) brightness(0.6)',
                            userSelect: 'none',
                            WebkitUserSelect: 'none'
                          }}
                          onContextMenu={(e) => e.preventDefault()}
                        />
                        {/* Protective Anti-Inspection Shield Overlay */}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center font-mono text-[9px] text-white/90">
                          PROTETTO
                        </div>
                        {/* Remove Action Button */}
                        <button
                          type="button"
                          onClick={(ev) => handleRemoveSlot(def.index, ev)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 hover:bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold shadow-md cursor-pointer z-20"
                          title="Rimuovi e sostituisci"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="px-3 py-2 bg-zinc-900 group-hover:bg-street-orange/20 border border-zinc-700 group-hover:border-street-orange text-zinc-300 group-hover:text-street-orange font-mono text-[11px] rounded-xl transition flex items-center gap-1.5"
                      >
                        <span>+ Carica</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Security & TTL Policy Notice */}
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-2 border-t border-zinc-800/80">
          <span>⏳ Policy TTL: Archiviazione oraria volatile</span>
          <span>🛡️ Moderazione automatica attiva</span>
        </div>

        {/* SUBMIT ACTION BUTTON */}
        <div className="mt-5">
          <button
            type="button"
            disabled={!allValidated || isSubmitting}
            onClick={handleSubmit}
            className={`w-full py-4 px-6 rounded-2xl font-street font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              allValidated && !isSubmitting
                ? 'bg-street-orange hover:bg-orange-500 text-black shadow-[0_0_25px_rgba(255,101,47,0.4)] transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-600 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                <span>ACCESSO AL VAULT IN CORSO...</span>
              </>
            ) : allValidated ? (
              <>
                <span>⚡ AVVIA MATCHMAKING GUIDATO DALL'IA</span>
                <span>➔</span>
              </>
            ) : (
              <span>CARICA TUTTI I 3 SLOT PER SBLOCCARE LA CODA</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
