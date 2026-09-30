// Browser Web Speech API type definitions
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface SpeechRecognitionCallbacks {
  onStart?: () => void;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
  onSpeechStart?: () => void;
}

export class VoiceRecognizer {
  private recognition: any = null;
  private isListening: boolean = false;
  private isStarting: boolean = false;
  private shouldKeepListening: boolean = false;
  private isPausedForTTS: boolean = false;
  private callbacks: SpeechRecognitionCallbacks;
  private language: string = "en-IN"; // Prefer Indian English

  // Silence auto-finalizer & transcript state
  private silenceTimer: NodeJS.Timeout | null = null;
  private pendingInterimTranscript: string = "";
  private hasDispatchedUtterance: boolean = false;

  constructor(callbacks: SpeechRecognitionCallbacks) {
    this.callbacks = callbacks;
  }

  public static isSupported(): boolean {
    if (typeof window === "undefined") return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  public setLanguage(lang: string) {
    this.language = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public start() {
    if (typeof window === "undefined") return;

    if (this.isListening || this.isStarting) {
      return;
    }

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      console.error("[STAGE: ERROR] Speech recognition is not supported in this browser.");
      this.callbacks.onError?.(
        "Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge."
      );
      return;
    }

    this.isStarting = true;
    this.shouldKeepListening = true;
    this.isPausedForTTS = false;
    this.hasDispatchedUtterance = false;

    try {
      if (this.recognition) {
        try {
          this.recognition.abort();
        } catch {}
        this.recognition = null;
      }

      this.recognition = new SpeechRecognitionAPI();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.language;
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.isStarting = false;
        console.log(`%c[STAGE: LISTENING_STARTED] Recognition active (${this.language})`, "color: #10b981; font-weight: bold;");
        this.callbacks.onStart?.();
      };

      this.recognition.onspeechstart = () => {
        this.callbacks.onSpeechStart?.();
      };

      this.recognition.onresult = (event: any) => {
        if (this.isPausedForTTS) {
          return;
        }

        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const text = item[0]?.transcript || "";
          if (item.isFinal) {
            finalTranscript += text;
          } else {
            interimTranscript += text;
          }
        }

        // If browser provided final transcript, dispatch immediately
        if (finalTranscript.trim()) {
          if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
          }
          this.pendingInterimTranscript = "";
          this.hasDispatchedUtterance = true;
          console.log(`%c[STAGE: FINAL_TRANSCRIPT] "${finalTranscript.trim()}"`, "color: #059669; font-weight: bold;");
          this.callbacks.onResult?.(finalTranscript.trim(), true);
          return;
        }

        // Handle interim partial transcript
        if (interimTranscript.trim()) {
          this.pendingInterimTranscript = interimTranscript.trim();
          this.hasDispatchedUtterance = false;
          console.log(`[STAGE: PARTIAL_TRANSCRIPT] "${interimTranscript.trim()}"`);
          this.callbacks.onResult?.(interimTranscript.trim(), false);

          // Reset silence timer: if user stops speaking for 1200ms, auto-commit as final
          if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
          }

          this.silenceTimer = setTimeout(() => {
            if (
              this.pendingInterimTranscript.trim() &&
              !this.hasDispatchedUtterance &&
              !this.isPausedForTTS &&
              this.shouldKeepListening
            ) {
              const textToCommit = this.pendingInterimTranscript.trim();
              console.log(
                `%c[STAGE: FINAL_TRANSCRIPT (Silence Detected)] "${textToCommit}"`,
                "color: #059669; font-weight: bold;"
              );
              this.pendingInterimTranscript = "";
              this.hasDispatchedUtterance = true;
              this.callbacks.onResult?.(textToCommit, true);
            }
          }, 1200);
        }
      };

      this.recognition.onerror = (event: any) => {
        this.isStarting = false;

        // "no-speech" is normal when user is quiet between sentences
        if (event.error === "no-speech") {
          return;
        }

        // "aborted" happens when we stop manually during TTS
        if (event.error === "aborted") {
          return;
        }

        console.error(`%c[STAGE: ERROR] Speech Recognition Error: ${event.error}`, "color: #ef4444; font-weight: bold;");

        if (event.error === "not-allowed") {
          this.shouldKeepListening = false;
          this.callbacks.onError?.(
            "Microphone permission was denied. Please allow microphone access in your browser settings to speak with ARIA."
          );
        } else if (event.error === "network") {
          // If en-IN fails over network, try falling back to standard English
          if (this.language !== "en-US") {
            console.warn("[STAGE: RETRY] Retrying speech recognition with en-US fallback...");
            this.language = "en-US";
            setTimeout(() => {
              if (this.shouldKeepListening && !this.isPausedForTTS) {
                this.start();
              }
            }, 300);
            return;
          }
          this.callbacks.onError?.(
            "Speech recognition network timeout. Please check your internet connection."
          );
        } else {
          this.callbacks.onError?.(`Microphone error: ${event.error}`);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.isStarting = false;

        // If recognizer ended while there was pending interim speech not yet dispatched, dispatch it!
        if (
          this.pendingInterimTranscript.trim() &&
          !this.hasDispatchedUtterance &&
          !this.isPausedForTTS &&
          this.shouldKeepListening
        ) {
          const textToCommit = this.pendingInterimTranscript.trim();
          console.log(
            `%c[STAGE: FINAL_TRANSCRIPT (Stream End)] "${textToCommit}"`,
            "color: #059669; font-weight: bold;"
          );
          this.pendingInterimTranscript = "";
          this.hasDispatchedUtterance = true;
          this.callbacks.onResult?.(textToCommit, true);
        }

        // Auto-restart loop if user is still on active call and not paused for TTS
        if (this.shouldKeepListening && !this.isPausedForTTS) {
          setTimeout(() => {
            if (this.shouldKeepListening && !this.isPausedForTTS && !this.isListening) {
              try {
                this.recognition?.start();
              } catch {
                this.start();
              }
            }
          }, 150);
        } else {
          this.callbacks.onEnd?.();
        }
      };

      this.recognition.start();
    } catch (err: any) {
      this.isStarting = false;
      this.isListening = false;
      console.error("[STAGE: ERROR] Recognition start threw exception:", err);

      if (err?.name === "InvalidStateError") {
        // Recognition already running or recovering
        setTimeout(() => {
          if (this.shouldKeepListening && !this.isPausedForTTS && !this.isListening) {
            try {
              this.recognition?.start();
            } catch {}
          }
        }, 300);
      } else {
        this.callbacks.onError?.(err?.message || "Failed to start speech recognition.");
      }
    }
  }

  /**
   * Manually commit any currently spoken interim transcript immediately
   */
  public commitCurrentTranscript(): string | null {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.pendingInterimTranscript.trim() && !this.hasDispatchedUtterance) {
      const text = this.pendingInterimTranscript.trim();
      this.pendingInterimTranscript = "";
      this.hasDispatchedUtterance = true;
      console.log(`%c[STAGE: FINAL_TRANSCRIPT (Manual Commit)] "${text}"`, "color: #059669; font-weight: bold;");
      this.callbacks.onResult?.(text, true);
      return text;
    }
    return null;
  }

  /**
   * Temporarily pauses listening while ARIA is speaking (avoids feedback loop)
   */
  public pauseForTTS() {
    this.isPausedForTTS = true;
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    this.pendingInterimTranscript = "";
    this.hasDispatchedUtterance = false;

    if (this.recognition && this.isListening) {
      try {
        this.recognition.abort();
      } catch {}
      this.isListening = false;
    }
  }

  /**
   * Resumes listening after ARIA finishes speaking
   */
  public resumeAfterTTS() {
    this.isPausedForTTS = false;
    this.shouldKeepListening = true;
    this.pendingInterimTranscript = "";
    this.hasDispatchedUtterance = false;

    if (!this.isListening && !this.isStarting) {
      this.start();
    }
  }

  public stop() {
    this.shouldKeepListening = false;
    this.isPausedForTTS = false;
    this.isStarting = false;
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    this.pendingInterimTranscript = "";
    this.hasDispatchedUtterance = false;

    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {}
      this.recognition = null;
    }
    this.isListening = false;
  }

  public get active(): boolean {
    return this.isListening;
  }

  public get pausedForTTS(): boolean {
    return this.isPausedForTTS;
  }
}
