import React, { useState, useEffect, useRef } from 'react';
import {
  UndressedPhase,
  UndressedMessage,
  AIMessage,
  UndressedPartner,
  VaultSlotData,
  SubCategory,
  AI_SCRIPTS
} from '../types/undressed';
import { undressedStore } from '../store/undressedStore';

interface UndressedSessionRoomProps {
  subCategory: SubCategory;
  roomId: string;
  partner: UndressedPartner;
  mySlots: { [key in 1 | 2 | 3]: VaultSlotData };
  onSendMessage: (payload: { type: 'text' | 'voice'; message?: string; audioData?: string; duration?: number }) => void;
  onLeaveRoom: () => void;
}

export const UndressedSessionRoom: React.FC<UndressedSessionRoomProps> = ({
  subCategory,
  roomId,
  partner,
  mySlots,
  onSendMessage,
  onLeaveRoom
}) => {
  const [phase, setPhase] = useState<UndressedPhase>('PHASE_1');
  const [timeRemaining, setTimeRemaining] = useState<number>(
    subCategory.engineConfig?.totalDurationSeconds || 600
  );
  const [turnTimeRemaining, setTurnTimeRemaining] = useState<number>(
    subCategory.engineConfig?.responseWindowSeconds || 45
  );
  const [inputLocked, setInputLocked] = useState<boolean>(true);
  const [inputLockCountdown, setInputLockCountdown] = useState<number>(5);
  const [messages, setMessages] = useState<UndressedMessage[]>([]);
  const [aiAnnouncements, setAiAnnouncements] = useState<AIMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');

  // Audio recording state (5s max)
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);
  const [audioSeconds, setAudioSeconds] = useState<number>(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioModalOpen, setAudioModalOpen] = useState<boolean>(false);

  // Blackout Moment (Soul Talk: 5 seconds screen blackout)
  const [blackoutActive, setBlackoutActive] = useState<boolean>(false);
  // Fullscreen Photo Modal (Soul Talk: Slot 1 fullscreen)
  const [fullscreenPhotoUrl, setFullscreenPhotoUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerIntervalRef = useRef<any>(null);

  const isSoulTalk = subCategory.id === 'soul_talk';
  const totalDuration = subCategory.engineConfig?.totalDurationSeconds || 600;

  // Subscribe to store
  useEffect(() => {
    const unsub = undressedStore.subscribe((state) => {
      setPhase(state.phase);
      setTimeRemaining(state.timeRemaining);
      setTurnTimeRemaining(state.turnTimeRemaining);
      setInputLocked(state.inputLocked);
      setInputLockCountdown(state.inputLockCountdown);
      setMessages(state.messages);
      setAiAnnouncements(state.aiAnnouncements);
    });
    return () => unsub();
  }, []);

  // Scroll to bottom on message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiAnnouncements]);

  // Audio recorder functions (Standard Web HTML5 MediaStream Recording API)
  const startAudioRecording = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunksRef.current = [];
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setAudioBlob(blob);
          const reader = new FileReader();
          reader.onloadend = () => {
            setAudioBase64(reader.result as string);
          };
          reader.readAsDataURL(blob);
          stream.getTracks().forEach((track) => track.stop());
        };

        recorder.start();
        setIsRecordingAudio(true);
        setAudioSeconds(0);

        // 5s max timer
        let count = 0;
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = setInterval(() => {
          count += 1;
          setAudioSeconds(count);
          if (count >= 5) {
            stopAudioRecording();
          }
        }, 1000);
      } catch (err) {
        console.warn('Microphone access denied or error:', err);
      }
    }
  };

  const stopAudioRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecordingAudio(false);
  };

  const sendVoiceNote = () => {
    if (!audioBase64 || !audioBlob) return;
    onSendMessage({
      type: 'voice',
      audioData: audioBase64,
      duration: Math.min(audioSeconds, 5)
    });
    setAudioModalOpen(false);
    setAudioBlob(null);
    setAudioBase64(null);
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || inputLocked) return;
    onSendMessage({
      type: 'text',
      message: inputText.trim()
    });
    setInputText('');
  };

  // Circular HUD calculations
  const progressPct = ((totalDuration - timeRemaining) / totalDuration) * 100;
  const strokeDashoffset = 283 - (283 * progressPct) / 100;
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="relative w-full h-full min-h-[90vh] flex flex-col justify-between bg-[#0b0d10] text-white p-2 sm:p-4 overflow-hidden">
      {/* 5-SECOND BLACKOUT MOMENT (SOUL TALK) */}
      {blackoutActive && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <span className="w-4 h-4 rounded-full bg-street-orange animate-ping mb-4" />
          <h2 className="font-street font-black text-2xl uppercase tracking-widest text-zinc-300">
            SILENZIO.
          </h2>
          <p className="font-mono text-xs text-zinc-500 mt-2">Lo specchio del tempo sta per rivelarsi.</p>
        </div>
      )}

      {/* FULLSCREEN PHOTO MODAL */}
      {fullscreenPhotoUrl && (
        <div
          onClick={() => setFullscreenPhotoUrl(null)}
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-2xl cursor-pointer"
        >
          <img
            src={fullscreenPhotoUrl}
            alt="Dettaglio Sbloccato"
            className="max-w-full max-h-[80vh] object-contain rounded-2xl border-2 border-street-orange shadow-[0_0_50px_rgba(255,101,47,0.4)]"
          />
          <span className="mt-4 text-xs font-mono text-zinc-400">Clicca ovunque per chiudere</span>
        </div>
      )}

      {/* 1. TOP BAR: CIRCULAR HUD & PARTNER QUICK VIEW */}
      <header className="w-full bg-[#121520]/90 backdrop-blur-xl border border-zinc-800 rounded-2xl p-3 flex items-center justify-between shadow-lg">
        {/* Partner Info */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-street-orange/40 flex items-center justify-center text-lg">
            <span>{partner.avatar || '⚡'}</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-street font-black text-sm text-white uppercase truncate">
                {partner.moniker}
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-street-orange/20 text-street-orange border border-street-orange/30">
                {subCategory.engineConfig?.roomType === 'after_dark' ? 'AFTER DARK' : 'SOUL TALK'}
              </span>
            </div>
            <p className="text-[10px] font-mono text-zinc-400">Fase: {phase.replace('_', ' ')}</p>
          </div>
        </div>

        {/* Circular HUD Timer in Top Center */}
        <div className="flex items-center gap-3">
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle cx="50" cy="50" r="45" stroke="#202630" strokeWidth="8" fill="transparent" />
              {/* Animated Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="#ff652f"
                strokeWidth="8"
                strokeLinecap="round"
                fill="transparent"
                strokeDasharray="283"
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-mono font-bold text-xs text-white leading-none">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onLeaveRoom}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white text-xs font-mono transition cursor-pointer"
          >
            Esci
          </button>
        </div>
      </header>

      {/* 2. 3-SLOT CARDS BAR (GRADUAL BLUR SHIELD) */}
      <section className="w-full grid grid-cols-3 gap-2 my-2.5">
        {([1, 2, 3] as const).map((slotIdx) => {
          const slotDef = subCategory.engineConfig?.slotsDefinition[slotIdx - 1];
          const partnerSlot = partner.slots[slotIdx];
          const isUnlocked = Boolean(partnerSlot && partnerSlot.unlocked);
          const hasImage = Boolean(partnerSlot && partnerSlot.url);

          return (
            <div
              key={slotIdx}
              onClick={() => isUnlocked && hasImage && setFullscreenPhotoUrl(partnerSlot.url)}
              className={`relative rounded-xl border p-2 flex flex-col items-center text-center overflow-hidden transition ${
                isUnlocked
                  ? 'bg-[#151922] border-street-orange cursor-pointer shadow-[0_0_15px_rgba(255,101,47,0.2)]'
                  : 'bg-[#0e1017] border-zinc-800/80'
              }`}
            >
              {/* Media Thumbnail with Dynamic Blur */}
              <div className="relative w-full h-16 sm:h-20 rounded-lg overflow-hidden bg-black flex items-center justify-center">
                {hasImage ? (
                  <img
                    src={partnerSlot.url!}
                    alt={slotDef?.name || `Slot ${slotIdx}`}
                    className="w-full h-full object-cover select-none pointer-events-none transition-all duration-700"
                    style={{
                      filter: isUnlocked ? 'none' : 'blur(28px) brightness(0.6)',
                      transform: isUnlocked ? 'scale(1)' : 'scale(1.1)'
                    }}
                    onContextMenu={(e) => e.preventDefault()}
                  />
                ) : (
                  <span className="text-xl opacity-30">🔒</span>
                )}

                {/* Protective Anti-Inspection Overlay if Locked */}
                {!isUnlocked && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center">
                    <span className="text-sm">🔒</span>
                    <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-wider mt-0.5">
                      BLOCCATO
                    </span>
                  </div>
                )}
              </div>

              {/* Slot Title */}
              <span className="font-street font-black text-[10px] text-white uppercase truncate mt-1.5 w-full">
                {slotDef?.name || `Slot ${slotIdx}`}
              </span>
            </div>
          );
        })}
      </section>

      {/* 3. CENTRAL MESSAGES FEED WITH AI DIRECTOR SYSTEM BOX */}
      <main className="flex-1 w-full overflow-y-auto px-1 py-2 space-y-3.5 max-h-[50vh] no-scrollbar">
        {/* AI Announcements List */}
        {aiAnnouncements.map((ai) => (
          <div
            key={ai.id}
            className="w-full my-2 p-4 bg-gradient-to-br from-[#12141c] via-[#10131b] to-[#1a1315] border-2 border-street-orange/80 rounded-2xl shadow-[0_0_25px_rgba(255,101,47,0.25)] text-center relative overflow-hidden"
          >
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-street-orange/20 text-street-orange font-mono text-[10px] font-bold uppercase tracking-wider mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-street-orange animate-ping" />
              <span>REGIA IA // STREET GAME MASTER</span>
            </div>
            <p className="font-street font-black text-sm sm:text-base text-zinc-100 uppercase tracking-wide leading-snug">
              "{ai.text}"
            </p>
            {ai.readingLockoutSeconds && inputLocked && (
              <p className="text-[10px] font-mono text-street-orange mt-2 flex items-center justify-center gap-1">
                <span>⏳ Lettura forzata: input bloccato per {inputLockCountdown}s</span>
              </p>
            )}
          </div>
        ))}

        {/* Regular Messages */}
        {messages.map((m) => {
          const isMe = m.senderId === 'me' || m.senderMoniker === 'Tu';
          return (
            <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <span className="text-[9px] font-mono text-zinc-500 mb-0.5">{m.senderMoniker}</span>
              {m.type === 'voice' ? (
                <div
                  className={`p-3 rounded-2xl border flex items-center gap-3 ${
                    isMe
                      ? 'bg-street-orange text-black border-street-orange font-bold'
                      : 'bg-[#151922] text-white border-zinc-800'
                  }`}
                >
                  <span className="text-base">🎙️</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-mono">Nota Vocale ({m.audioDurationSeconds || 5}s)</span>
                    <audio src={m.audioUrl} controls className="h-6 w-36 mt-1" />
                  </div>
                </div>
              ) : (
                <div
                  className={`p-3 rounded-2xl max-w-[82%] text-xs sm:text-sm font-sans leading-relaxed shadow-md ${
                    isMe
                      ? 'bg-street-orange text-black font-medium rounded-br-none'
                      : 'bg-[#151922] text-zinc-100 border border-zinc-800 rounded-bl-none'
                  }`}
                >
                  {m.text}
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </main>

      {/* 4. BOTTOM INPUT BAR WITH TURN COUNTDOWN & INPUT LOCKOUT */}
      <footer className="w-full pt-2">
        {/* Turn Countdown Indicator */}
        <div className="flex items-center justify-between px-2 mb-1 text-[11px] font-mono">
          <span className="text-zinc-400">
            {inputLocked ? (
              <span className="text-street-orange font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-street-orange animate-pulse" />
                Input bloccato dall'IA ({inputLockCountdown}s)
              </span>
            ) : (
              <span>Turno di risposta attivo</span>
            )}
          </span>
          <span
            className={`font-bold ${
              turnTimeRemaining <= 10 ? 'text-red-400 animate-pulse' : 'text-street-orange'
            }`}
          >
            Tempo turno: {turnTimeRemaining}s
          </span>
        </div>

        {/* Input Bar Form */}
        <form onSubmit={handleSendText} className="flex items-center gap-2">
          {/* 5-second Audio Voice Note Trigger (for Phase 3) */}
          {subCategory.engineConfig?.roomType === 'after_dark' && (
            <button
              type="button"
              onClick={() => setAudioModalOpen(true)}
              className="w-11 h-11 rounded-xl bg-zinc-900 hover:bg-street-orange/20 border border-zinc-800 hover:border-street-orange text-zinc-300 hover:text-street-orange flex items-center justify-center text-lg transition shrink-0 cursor-pointer"
              title="Registra vocale di 5 secondi"
            >
              🎙️
            </button>
          )}

          {/* Text Input */}
          <input
            type="text"
            disabled={inputLocked}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              inputLocked
                ? "Ascolta l'annuncio dell'IA prima di rispondere..."
                : 'Scrivi qui la tua risposta autentica...'
            }
            className={`flex-1 rounded-xl px-4 py-3 text-xs sm:text-sm font-sans focus:outline-none transition border ${
              inputLocked
                ? 'bg-zinc-950 border-zinc-900 text-zinc-600 cursor-not-allowed'
                : 'bg-[#121520] border-zinc-800 focus:border-street-orange text-white'
            }`}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={inputLocked || !inputText.trim()}
            className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black transition shrink-0 ${
              inputLocked || !inputText.trim()
                ? 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                : 'bg-street-orange hover:bg-orange-500 text-black shadow-[0_0_15px_rgba(255,101,47,0.4)] cursor-pointer'
            }`}
          >
            ➤
          </button>
        </form>
      </footer>

      {/* 5. 5-SECOND AUDIO RECORDER MODAL */}
      {audioModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
          <div className="w-full max-w-sm bg-[#0e1017] border-2 border-street-orange rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-street-orange/20 border border-street-orange mx-auto flex items-center justify-center text-2xl text-street-orange">
              🎙️
            </div>
            <h3 className="font-street font-black text-lg uppercase text-white">
              Sussurro Vocale (Max 5s)
            </h3>
            <p className="text-xs font-mono text-zinc-400">
              Registra una parola, un respiro o una frase rapida. L'audio si interromperà automaticamente a 5 secondi.
            </p>

            {/* Visual Wave / Seconds Counter */}
            <div className="py-4">
              <div className="text-3xl font-mono font-black text-street-orange">
                0:0{audioSeconds} / 0:05
              </div>
              {isRecordingAudio && (
                <div className="flex items-center justify-center gap-1.5 mt-3">
                  <span className="w-2 h-6 bg-red-500 rounded animate-pulse" />
                  <span className="w-2 h-8 bg-red-500 rounded animate-pulse delay-75" />
                  <span className="w-2 h-4 bg-red-500 rounded animate-pulse delay-150" />
                  <span className="w-2 h-7 bg-red-500 rounded animate-pulse delay-100" />
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              {!isRecordingAudio && !audioBlob && (
                <button
                  type="button"
                  onClick={startAudioRecording}
                  className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold uppercase rounded-xl transition cursor-pointer"
                >
                  Inizia a Registrare
                </button>
              )}
              {isRecordingAudio && (
                <button
                  type="button"
                  onClick={stopAudioRecording}
                  className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs font-bold uppercase rounded-xl transition cursor-pointer"
                >
                  Ferma Ora
                </button>
              )}
              {audioBlob && !isRecordingAudio && (
                <button
                  type="button"
                  onClick={sendVoiceNote}
                  className="px-6 py-3 bg-street-orange hover:bg-orange-500 text-black font-street font-black text-xs uppercase rounded-xl transition shadow-[0_0_15px_rgba(255,101,47,0.4)] cursor-pointer"
                >
                  Invia Sussurro
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  stopAudioRecording();
                  setAudioModalOpen(false);
                }}
                className="px-4 py-3 bg-zinc-900 text-zinc-400 hover:text-white font-mono text-xs rounded-xl transition cursor-pointer"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
