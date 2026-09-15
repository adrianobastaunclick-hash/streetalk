import {
  MacroCategory,
  SubCategory,
  UndressedRoomType,
  UndressedPhase,
  VaultSlotData,
  AIMessage,
  UndressedMessage,
  UndressedPartner,
  VerdictState,
  VerdictDecision,
  MACRO_CATEGORIES_CATALOG,
  AI_SCRIPTS
} from '../types/undressed';

export interface UndressedState {
  // Navigation
  activeMacroId: string;
  selectedSubCategory: SubCategory | null;
  vaultModalOpen: boolean;

  // Vault 3 Slots
  slots: {
    1: VaultSlotData;
    2: VaultSlotData;
    3: VaultSlotData;
  };
  vaultUploading: boolean;
  vaultError: string | null;

  // Realtime Session
  phase: UndressedPhase;
  roomId: string | null;
  totalDurationSeconds: number;
  timeRemaining: number;
  turnDurationSeconds: number;
  turnTimeRemaining: number;
  inputLocked: boolean;
  inputLockCountdown: number;
  aiAnnouncements: AIMessage[];
  messages: UndressedMessage[];
  partner: UndressedPartner | null;
  verdict: VerdictState;
  audioModalOpen: boolean;
  audioRecordingTime: number;

  // Actions
  selectMacroCategory: (macroId: string) => void;
  openVault: (subCategory: SubCategory) => void;
  closeVault: () => void;
  setSlotData: (index: 1 | 2 | 3, file: File, previewUrl: string, storageKey?: string) => void;
  clearSlotData: (index: 1 | 2 | 3) => void;
  validateAllSlots: () => boolean;
  resetVault: () => void;

  // Realtime State Machine Triggers
  setQueued: () => void;
  setMatched: (roomId: string, partner: UndressedPartner) => void;
  setPhase: (phase: UndressedPhase, timeRemaining?: number, aiAnnouncement?: string) => void;
  syncTimers: (globalRemaining: number, turnRemaining: number) => void;
  setInputLockout: (locked: boolean, countdownSeconds?: number) => void;
  unlockPartnerSlot: (index: 1 | 2 | 3, url: string) => void;
  addMessage: (msg: UndressedMessage) => void;
  setVerdictChoice: (choice: VerdictDecision) => void;
  resolveVerdict: (result: 'connected' | 'destroyed') => void;
  setAudioModal: (open: boolean) => void;
  resetSession: () => void;
}

const defaultSlots: { 1: VaultSlotData; 2: VaultSlotData; 3: VaultSlotData } = {
  1: { index: 1, file: null, previewUrl: null, validated: false, moderationPassed: false, unlocked: false },
  2: { index: 2, file: null, previewUrl: null, validated: false, moderationPassed: false, unlocked: false },
  3: { index: 3, file: null, previewUrl: null, validated: false, moderationPassed: false, unlocked: false }
};

const defaultVerdict: VerdictState = {
  active: false,
  secondsRemaining: 30,
  myChoice: 'pending',
  partnerChoice: 'pending',
  resolved: false
};

class UndressedStore {
  private state: UndressedState;
  private listeners: Set<(state: UndressedState) => void> = new Set();

  constructor() {
    const defaultMacro = MACRO_CATEGORIES_CATALOG[0];
    const defaultSub = defaultMacro.subcategories[0];

    this.state = {
      activeMacroId: defaultMacro.id,
      selectedSubCategory: defaultSub,
      vaultModalOpen: false,

      slots: { ...defaultSlots },
      vaultUploading: false,
      vaultError: null,

      phase: 'QUEUED',
      roomId: null,
      totalDurationSeconds: 600,
      timeRemaining: 600,
      turnDurationSeconds: 45,
      turnTimeRemaining: 45,
      inputLocked: false,
      inputLockCountdown: 0,
      aiAnnouncements: [],
      messages: [],
      partner: null,
      verdict: { ...defaultVerdict },
      audioModalOpen: false,
      audioRecordingTime: 0,

      selectMacroCategory: this.selectMacroCategory.bind(this),
      openVault: this.openVault.bind(this),
      closeVault: this.closeVault.bind(this),
      setSlotData: this.setSlotData.bind(this),
      clearSlotData: this.clearSlotData.bind(this),
      validateAllSlots: this.validateAllSlots.bind(this),
      resetVault: this.resetVault.bind(this),

      setQueued: this.setQueued.bind(this),
      setMatched: this.setMatched.bind(this),
      setPhase: this.setPhase.bind(this),
      syncTimers: this.syncTimers.bind(this),
      setInputLockout: this.setInputLockout.bind(this),
      unlockPartnerSlot: this.unlockPartnerSlot.bind(this),
      addMessage: this.addMessage.bind(this),
      setVerdictChoice: this.setVerdictChoice.bind(this),
      resolveVerdict: this.resolveVerdict.bind(this),
      setAudioModal: this.setAudioModal.bind(this),
      resetSession: this.resetSession.bind(this)
    };
  }

  public getState(): UndressedState {
    return this.state;
  }

  public subscribe(listener: (state: UndressedState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setState(partial: Partial<UndressedState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((listener) => listener(this.state));
  }

  public selectMacroCategory(macroId: string) {
    const macro = MACRO_CATEGORIES_CATALOG.find((m) => m.id === macroId);
    if (!macro) return;
    this.setState({
      activeMacroId: macroId,
      selectedSubCategory: macro.subcategories[0] || null
    });
  }

  public openVault(subCategory: SubCategory) {
    const config = subCategory.engineConfig;
    const duration = config ? config.totalDurationSeconds : 600;
    const turnWindow = config ? config.responseWindowSeconds : 45;

    this.setState({
      selectedSubCategory: subCategory,
      vaultModalOpen: true,
      vaultError: null,
      totalDurationSeconds: duration,
      timeRemaining: duration,
      turnDurationSeconds: turnWindow,
      turnTimeRemaining: turnWindow
    });
  }

  public closeVault() {
    this.setState({ vaultModalOpen: false });
  }

  public setSlotData(index: 1 | 2 | 3, file: File, previewUrl: string, storageKey?: string) {
    // Client-side quick moderation: max 4MB, valid image mime
    const isImage = file.type.startsWith('image/');
    const isUnderLimit = file.size <= 4 * 1024 * 1024;
    const valid = isImage && isUnderLimit;

    const updated = {
      ...this.state.slots,
      [index]: {
        index,
        file,
        previewUrl,
        storageKey: storageKey || `vault_${Date.now()}_slot${index}`,
        validated: valid,
        moderationPassed: valid,
        unlocked: false,
        error: !isImage ? 'Formato non supportato' : !isUnderLimit ? 'Dimensione > 4MB' : null
      }
    };

    this.setState({ slots: updated, vaultError: null });
  }

  public clearSlotData(index: 1 | 2 | 3) {
    const oldUrl = this.state.slots[index].previewUrl;
    if (oldUrl && oldUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(oldUrl);
      } catch {}
    }

    const updated = {
      ...this.state.slots,
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
    };
    this.setState({ slots: updated });
  }

  public validateAllSlots(): boolean {
    const { slots } = this.state;
    return Boolean(
      slots[1].validated &&
      slots[2].validated &&
      slots[3].validated &&
      slots[1].previewUrl &&
      slots[2].previewUrl &&
      slots[3].previewUrl
    );
  }

  public resetVault() {
    [1, 2, 3].forEach((idx) => {
      const url = this.state.slots[idx as 1 | 2 | 3].previewUrl;
      if (url && url.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      }
    });
    this.setState({ slots: { ...defaultSlots }, vaultError: null, vaultUploading: false });
  }

  public setQueued() {
    this.setState({ phase: 'QUEUED', vaultModalOpen: false });
  }

  public setMatched(roomId: string, partner: UndressedPartner) {
    const sub = this.state.selectedSubCategory;
    const isSoul = sub?.id === 'soul_talk';
    const startScript = isSoul ? AI_SCRIPTS.soul_talk.start : AI_SCRIPTS.after_dark.start;

    const aiMsg: AIMessage = {
      id: `ai_${Date.now()}`,
      text: startScript,
      phase: 'PHASE_1',
      timestamp: Date.now(),
      readingLockoutSeconds: 5,
      isSystemPrompt: true
    };

    this.setState({
      phase: 'PHASE_1',
      roomId,
      partner,
      messages: [],
      aiAnnouncements: [aiMsg],
      inputLocked: true,
      inputLockCountdown: 5
    });
  }

  public setPhase(phase: UndressedPhase, timeRemaining?: number, aiAnnouncement?: string) {
    const announcements = [...this.state.aiAnnouncements];
    let lockout = 0;

    if (aiAnnouncement) {
      lockout = 6;
      announcements.push({
        id: `ai_${Date.now()}`,
        text: aiAnnouncement,
        phase,
        timestamp: Date.now(),
        readingLockoutSeconds: lockout,
        isSystemPrompt: true
      });
    }

    this.setState({
      phase,
      ...(timeRemaining !== undefined ? { timeRemaining } : {}),
      aiAnnouncements: announcements,
      inputLocked: lockout > 0,
      inputLockCountdown: lockout,
      ...(phase === 'VERDICT'
        ? {
            verdict: {
              active: true,
              secondsRemaining: 30,
              myChoice: 'pending',
              partnerChoice: 'pending',
              resolved: false
            }
          }
        : {})
    });
  }

  public syncTimers(globalRemaining: number, turnRemaining: number) {
    let lockout = this.state.inputLockCountdown;
    let isLocked = this.state.inputLocked;

    if (lockout > 0) {
      lockout -= 1;
      if (lockout <= 0) {
        lockout = 0;
        isLocked = false;
      }
    }

    let verdictState = { ...this.state.verdict };
    if (this.state.phase === 'VERDICT' && verdictState.active && verdictState.secondsRemaining > 0) {
      verdictState.secondsRemaining -= 1;
    }

    this.setState({
      timeRemaining: globalRemaining,
      turnTimeRemaining: turnRemaining,
      inputLockCountdown: lockout,
      inputLocked: isLocked,
      verdict: verdictState
    });
  }

  public setInputLockout(locked: boolean, countdownSeconds: number = 0) {
    this.setState({ inputLocked: locked, inputLockCountdown: countdownSeconds });
  }

  public unlockPartnerSlot(index: 1 | 2 | 3, url: string) {
    if (!this.state.partner) return;
    const updatedPartner = {
      ...this.state.partner,
      slots: {
        ...this.state.partner.slots,
        [index]: {
          ...this.state.partner.slots[index],
          url,
          unlocked: true
        }
      }
    };
    this.setState({ partner: updatedPartner });
  }

  public addMessage(msg: UndressedMessage) {
    this.setState({ messages: [...this.state.messages, msg] });
  }

  public setVerdictChoice(choice: VerdictDecision) {
    this.setState({
      verdict: {
        ...this.state.verdict,
        myChoice: choice
      }
    });
  }

  public resolveVerdict(result: 'connected' | 'destroyed') {
    this.setState({
      phase: result === 'connected' ? 'CONNECTED' : 'DESTROYED',
      verdict: {
        ...this.state.verdict,
        resolved: true,
        result
      }
    });
  }

  public setAudioModal(open: boolean) {
    this.setState({ audioModalOpen: open, audioRecordingTime: 0 });
  }

  public resetSession() {
    this.resetVault();
    this.setState({
      phase: 'QUEUED',
      roomId: null,
      timeRemaining: this.state.totalDurationSeconds,
      turnTimeRemaining: this.state.turnDurationSeconds,
      inputLocked: false,
      inputLockCountdown: 0,
      aiAnnouncements: [],
      messages: [],
      partner: null,
      verdict: { ...defaultVerdict },
      audioModalOpen: false
    });
  }
}

export const undressedStore = new UndressedStore();
