export interface SpeechSynthesisCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
  onBoundary?: (charIndex: number) => void;
}

export class VoiceSynthesizer {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking: boolean = false;
  private callbacks: SpeechSynthesisCallbacks = {};
  private voices: SpeechSynthesisVoice[] = [];
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private watchdogTimer: NodeJS.Timeout | null = null;

  constructor(callbacks: SpeechSynthesisCallbacks = {}) {
    this.callbacks = callbacks;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  public static isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  public loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
    
    // Priority 1: Indian English female or natural voice (e.g. Heera, Neerja, en-IN)
    const indianEnglishVoice = this.voices.find(
      (v) =>
        (v.lang === "en-IN" || v.lang.replace(/_/g, "-") === "en-IN" || v.name.toLowerCase().includes("india")) &&
        (v.name.toLowerCase().includes("female") ||
          v.name.toLowerCase().includes("neerja") ||
          v.name.toLowerCase().includes("heera") ||
          v.name.toLowerCase().includes("google") ||
          v.name.toLowerCase().includes("natural"))
    );

    // Priority 2: Any en-IN voice
    const genericIndianVoice = this.voices.find(
      (v) => v.lang === "en-IN" || v.lang.replace(/_/g, "-") === "en-IN" || v.name.toLowerCase().includes("india")
    );

    // Priority 3: Pleasant English voice
    const pleasantEnglishVoice = this.voices.find(
      (v) =>
        (v.lang.startsWith("en-") || v.lang === "en") &&
        (v.name.toLowerCase().includes("natural") ||
          v.name.toLowerCase().includes("female") ||
          v.name.toLowerCase().includes("samantha") ||
          v.name.toLowerCase().includes("zira") ||
          v.name.toLowerCase().includes("karen") ||
          v.name.toLowerCase().includes("google"))
    );

    this.selectedVoice = indianEnglishVoice || genericIndianVoice || pleasantEnglishVoice || this.voices[0] || null;
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  public setVoice(voice: SpeechSynthesisVoice) {
    this.selectedVoice = voice;
  }

  public getSelectedVoiceName(): string {
    return this.selectedVoice ? `${this.selectedVoice.name} (${this.selectedVoice.lang})` : "Default Browser Voice";
  }

  public speak(text: string) {
    if (!this.synth) {
      console.error("[STAGE: ERROR] Speech synthesis not supported in this browser.");
      this.callbacks.onError?.("Speech synthesis not supported in this browser.");
      return;
    }

    // Cancel any ongoing audio and clear watchdog
    this.cancel();

    // Reload voices in case browser populated them lazily
    if (this.voices.length === 0) {
      this.loadVoices();
    }

    // Clean text of markdown formatting, emojis, and asterisks for natural voice delivery
    const cleanText = text
      .replace(/[*#_`~[\]]/g, "")
      .replace(/₹/g, "Rupees ")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanText) {
      this.callbacks.onEnd?.();
      return;
    }

    console.log(`%c[STAGE: TTS_STARTED] Speaking: "${cleanText.slice(0, 60)}..."`, "color: #7c3aed; font-weight: bold;");

    try {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
        utterance.lang = this.selectedVoice.lang || "en-IN";
      } else {
        utterance.lang = "en-IN";
      }
      
      utterance.rate = 1.0;
      utterance.pitch = 1.05; // Slightly bright, warm tone for Aria persona

      utterance.onstart = () => {
        this.isSpeaking = true;
        console.log("%c[STAGE: TTS_AUDIO_PLAYING]", "color: #8b5cf6; font-weight: bold;");
        this.callbacks.onStart?.();
      };

      utterance.onend = () => {
        if (this.watchdogTimer) {
          clearTimeout(this.watchdogTimer);
          this.watchdogTimer = null;
        }
        this.isSpeaking = false;
        this.currentUtterance = null;
        (window as any).__ariaActiveUtterance = null;
        console.log("%c[STAGE: TTS_FINISHED]", "color: #6366f1; font-weight: bold;");
        this.callbacks.onEnd?.();
      };

      utterance.onerror = (e) => {
        if (this.watchdogTimer) {
          clearTimeout(this.watchdogTimer);
          this.watchdogTimer = null;
        }
        this.isSpeaking = false;
        this.currentUtterance = null;
        (window as any).__ariaActiveUtterance = null;

        if (e.error !== "canceled" && e.error !== "interrupted") {
          console.error(`%c[STAGE: ERROR] TTS playback error: ${e.error}`, "color: #ef4444; font-weight: bold;");
          this.callbacks.onError?.(`Speech error: ${e.error}`);
        } else {
          console.log("[STAGE: TTS_CANCELLED_BY_USER_BARGE_IN]");
        }
      };

      utterance.onboundary = (e) => {
        this.callbacks.onBoundary?.(e.charIndex);
      };

      // Workaround for Chrome bug where long utterances get paused or garbage collected mid-sentence
      this.currentUtterance = utterance;
      (window as any).__ariaActiveUtterance = utterance;

      // Resume synth in case Chrome auto-paused it
      try {
        if (this.synth.paused) {
          this.synth.resume();
        }
      } catch {}

      // Watchdog timer: safety timeout prevents UI remaining stuck in "Speaking" forever
      const wordCount = cleanText.split(/\s+/).length;
      const estimatedDurationMs = Math.max(3000, (wordCount / 2) * 1000 + 4000);

      this.watchdogTimer = setTimeout(() => {
        if (this.isSpeaking) {
          console.warn("[STAGE: TTS_FINISHED] Watchdog fallback triggered.");
          this.cancel();
          this.callbacks.onEnd?.();
        }
      }, estimatedDurationMs);

      this.synth.speak(utterance);
    } catch (err: any) {
      console.error("[STAGE: ERROR] Exception in speechSynthesis.speak:", err);
      this.isSpeaking = false;
      this.callbacks.onError?.(err?.message || "Failed to initialize TTS audio.");
    }
  }

  public cancel() {
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {}
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (typeof window !== "undefined") {
        (window as any).__ariaActiveUtterance = null;
      }
    }
  }

  public get speaking(): boolean {
    return this.isSpeaking;
  }
}
