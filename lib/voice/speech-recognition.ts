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
  private shouldKeepListening: boolean = false;
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

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      this.callbacks.onError?.(
        "Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari."
      );
      return;
    }

    try {
      this.recognition = new SpeechRecognitionAPI();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.language;
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.callbacks.onStart?.();
      };

      this.recognition.onspeechstart = () => {
        // Interruption trigger
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

        if (finalTranscript) {
          this.callbacks.onResult?.(finalTranscript.trim(), true);
        } else if (interimTranscript) {
          this.callbacks.onResult?.(interimTranscript.trim(), false);
        }
      };

      this.recognition.onerror = (event: any) => {
        // Handle benign errors like no-speech
        if (event.error === "no-speech") {
          return;
        }

        if (event.error === "not-allowed") {
          this.callbacks.onError?.(
            "Microphone permission was denied. Please allow microphone access in your browser settings to speak with Aria."
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
        // Auto-restart if call is still active
        if (this.shouldKeepListening) {
          try {
            this.recognition?.start();
          } catch {
            // Already started or restarting
          }
        } else {
          this.callbacks.onEnd?.();
        }
      };

      this.shouldKeepListening = true;
      this.recognition.start();
    } catch (err: any) {
      this.callbacks.onError?.(err?.message || "Failed to start speech recognition.");
    }
  }

  public stop() {
    this.shouldKeepListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
      this.recognition = null;
    }
    this.isListening = false;
  }

  public get active(): boolean {
    return this.isListening;
  }
}
