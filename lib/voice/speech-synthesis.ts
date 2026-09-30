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

  private loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
    
    // Priority: Indian English female voice (e.g. Heera, Neerja, en-IN female)
    const indianEnglishVoice = this.voices.find(
      (v) =>
        (v.lang === "en-IN" || v.lang.includes("en-IN") || v.name.toLowerCase().includes("india")) &&
        (v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("neerja") || v.name.toLowerCase().includes("heera") || v.name.toLowerCase().includes("google"))
    );

    const genericIndianVoice = this.voices.find(
      (v) => v.lang === "en-IN" || v.lang.includes("en-IN") || v.name.toLowerCase().includes("india")
    );

    const pleasantEnglishVoice = this.voices.find(
      (v) =>
        (v.lang.startsWith("en-") || v.lang === "en") &&
        (v.name.toLowerCase().includes("natural") ||
          v.name.toLowerCase().includes("female") ||
          v.name.toLowerCase().includes("samantha") ||
          v.name.toLowerCase().includes("google uk english female") ||
          v.name.toLowerCase().includes("zira"))
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
    return this.selectedVoice?.name || "Default Browser Voice";
  }

  public speak(text: string) {
    if (!this.synth) {
      this.callbacks.onError?.("Speech synthesis not supported in this browser.");
      return;
    }

    // Cancel any previous audio
    this.cancel();

    // Clean text of markdown characters or asterisk artifacts for smooth speech
    const cleanText = text
      .replace(/[*#_`~[\]]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.05; // Slightly warm/bright tone for friendly Aria persona

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.callbacks.onStart?.();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      this.callbacks.onEnd?.();
    };

    utterance.onerror = (e) => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (e.error !== "canceled" && e.error !== "interrupted") {
        this.callbacks.onError?.(`Speech error: ${e.error}`);
      }
    };

    utterance.onboundary = (e) => {
      this.callbacks.onBoundary?.(e.charIndex);
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public cancel() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
    }
  }

  public get speaking(): boolean {
    return this.isSpeaking;
  }
}
