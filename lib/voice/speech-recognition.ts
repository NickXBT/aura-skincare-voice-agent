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

    try {
      // Re-instantiate recognition instance for fresh state
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
        console.log(`%c[STAGE: LISTENING_STARTED] Language: ${this.language}`, "color: #10b981; font-weight: bold;");
        this.callbacks.onStart?.();
      };

      this.recognition.onspeechstart = () => {
        this.callbacks.onSpeechStart?.();
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const text = item[0].transcript;
          if (item.isFinal) {
            finalTranscript += text;
          } else {
            interimTranscript += text;
          }
        }

        if (finalTranscript.trim()) {
          console.log(`%c[STAGE: FINAL_TRANSCRIPT] "${finalTranscript.trim()}"`, "color: #059669; font-weight: bold;");
          this.callbacks.onResult?.(finalTranscript.trim(), true);
        } else if (interimTranscript.trim()) {
          console.log(`[STAGE: PARTIAL_TRANSCRIPT] "${interimTranscript.trim()}"`);
          this.callbacks.onResult?.(interimTranscript.trim(), false);
        }
      };

      this.recognition.onerror = (event: any) => {
        this.isStarting = false;

        // "no-speech" is a normal browser pause event, ignore silently
        if (event.error === "no-speech") {
          return;
        }

        // "aborted" happens when we stop manually during TTS, ignore
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

        // Auto-restart loop if user is still on active call and not intentionally paused for TTS
        if (this.shouldKeepListening && !this.isPausedForTTS) {
          try {
            this.recognition?.start();
          } catch (err: any) {
            // If already started or browser is warming up, retry shortly
            setTimeout(() => {
              if (this.shouldKeepListening && !this.isPausedForTTS && !this.isListening) {
                try {
                  this.recognition?.start();
                } catch {}
              }
            }, 250);
          }
        } else {
          this.callbacks.onEnd?.();
        }
      };

      this.recognition.start();
    } catch (err: any) {
      this.isStarting = false;
      this.isListening = false;
      console.error("[STAGE: ERROR] Recognition start threw exception:", err);
      // If recognition was already started in DOM, mark listening
      if (err?.name === "InvalidStateError") {
        this.isListening = true;
      } else {
        this.callbacks.onError?.(err?.message || "Failed to start speech recognition.");
      }
    }
  }

  /**
   * Temporarily pauses listening while ARIA is speaking (avoids feedback loop)
   */
  public pauseForTTS() {
    this.isPausedForTTS = true;
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
    if (this.shouldKeepListening && !this.isListening) {
      this.start();
    }
  }

  public stop() {
    this.shouldKeepListening = false;
    this.isPausedForTTS = false;
    this.isStarting = false;
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
