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

  // Turn-taking speech buffer & silence detector
  // Ensures ARIA listens to the customer's full thought/sentence before replying
  private silenceTimer: NodeJS.Timeout | null = null;
  private silenceTimeoutMs: number = 1800; // Wait 1.8s of silence before concluding customer finished speaking
  private priorSessionsFinal: string = "";
  private currentSessionFinal: string = "";
  private currentSessionInterim: string = "";
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
    this.priorSessionsFinal = "";
    this.currentSessionFinal = "";
    this.currentSessionInterim = "";
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

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

        let sessionFinal = "";
        let sessionInterim = "";

        // Read all results in the current recognition session
        for (let i = 0; i < event.results.length; ++i) {
          const item = event.results[i];
          const text = item[0]?.transcript || "";
          if (item.isFinal) {
            sessionFinal += " " + text;
          } else {
            sessionInterim += " " + text;
          }
        }

        this.currentSessionFinal = sessionFinal.trim();
        this.currentSessionInterim = sessionInterim.trim();

        // Combine any prior sessions with current session for the full live thought
        const fullSpokenText = [
          this.priorSessionsFinal,
          this.currentSessionFinal,
          this.currentSessionInterim,
        ]
          .filter(Boolean)
          .join(" ")
          .trim();

        if (!fullSpokenText) {
          return;
        }

        this.hasDispatchedUtterance = false;

        // Provide real-time live transcript to UI while customer is still speaking
        this.callbacks.onResult?.(fullSpokenText, false);

        // Reset silence timer: ARIA patiently waits 1.8s after the customer pauses
        // before concluding the sentence is complete and dispatching to AI
        if (this.silenceTimer) {
          clearTimeout(this.silenceTimer);
          this.silenceTimer = null;
        }

        this.silenceTimer = setTimeout(() => {
          this.dispatchFinalUtterance("Silence Detected (1.8s)");
        }, this.silenceTimeoutMs);
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

        // Preserve any pending speech from this session across recognizer restarts
        if (this.currentSessionFinal || this.currentSessionInterim) {
          const sessionText = [this.currentSessionFinal, this.currentSessionInterim]
            .filter(Boolean)
            .join(" ")
            .trim();
          if (sessionText) {
            this.priorSessionsFinal = [this.priorSessionsFinal, sessionText]
              .filter(Boolean)
              .join(" ")
              .trim();
            this.currentSessionFinal = "";
            this.currentSessionInterim = "";
          }
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
          // If stopping completely and speech was buffered, commit it
          if (this.priorSessionsFinal && !this.hasDispatchedUtterance) {
            this.dispatchFinalUtterance("Stream Stopped");
          }
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
   * Commit the buffered utterance as final once customer has completely finished speaking
   */
  private dispatchFinalUtterance(reason: string = "Silence Detected"): string | null {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    if (this.hasDispatchedUtterance || this.isPausedForTTS) {
      return null;
    }

    const fullUtterance = [
      this.priorSessionsFinal,
      this.currentSessionFinal,
      this.currentSessionInterim,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (!fullUtterance) {
      return null;
    }

    // Mark as dispatched and clear buffer
    this.hasDispatchedUtterance = true;
    this.priorSessionsFinal = "";
    this.currentSessionFinal = "";
    this.currentSessionInterim = "";

    console.log(
      `%c[STAGE: FINAL_TRANSCRIPT (${reason})] "${fullUtterance}"`,
      "color: #059669; font-weight: bold;"
    );

    this.callbacks.onResult?.(fullUtterance, true);
    return fullUtterance;
  }

  /**
   * Manually commit any currently spoken transcript immediately (e.g. user clicks "Send Now")
   */
  public commitCurrentTranscript(): string | null {
    return this.dispatchFinalUtterance("Manual Commit / Send Now");
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
    this.priorSessionsFinal = "";
    this.currentSessionFinal = "";
    this.currentSessionInterim = "";
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
    this.priorSessionsFinal = "";
    this.currentSessionFinal = "";
    this.currentSessionInterim = "";
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
    this.priorSessionsFinal = "";
    this.currentSessionFinal = "";
    this.currentSessionInterim = "";
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
