/**
 * Real-Time Web Audio API Microphone Amplitude Analyser & Permission Manager
 * Captures real physical microphone volume levels for live orb reactions and verifies permission.
 */

export interface MicInitResult {
  success: boolean;
  errorType?: "PERMISSION_DENIED" | "MIC_UNAVAILABLE" | "UNSUPPORTED" | "UNKNOWN";
  message?: string;
  stream?: MediaStream;
}

export class AudioAmplitudeTracker {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphoneStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private animationFrameId: number | null = null;
  private onAmplitudeUpdate: ((volume: number) => void) | null = null;
  private isRunning: boolean = false;

  constructor(onAmplitudeUpdate: (volume: number) => void) {
    this.onAmplitudeUpdate = onAmplitudeUpdate;
  }

  public async start(): Promise<MicInitResult> {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      console.error("[STAGE: ERROR] Web Audio / getUserMedia not supported in this environment.");
      return {
        success: false,
        errorType: "UNSUPPORTED",
        message: "Microphone access is not supported in this browser. Please use Chrome, Edge, or Safari.",
      };
    }

    try {
      console.log("%c[STAGE: MIC_PERMISSION] Requesting microphone access...", "color: #3b82f6; font-weight: bold;");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      this.microphoneStream = stream;
      console.log("%c[STAGE: MIC_PERMISSION] Permission Granted", "color: #10b981; font-weight: bold;");

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();

      // Ensure audio context is running (browsers can suspend audio contexts until user gesture)
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.5;

      this.sourceNode = this.audioContext.createMediaStreamSource(this.microphoneStream);
      this.sourceNode.connect(this.analyser);

      this.isRunning = true;
      this.track();

      console.log("%c[STAGE: MIC_STREAM_READY] Web Audio Analyser tracking amplitude", "color: #10b981; font-weight: bold;");

      return {
        success: true,
        stream,
      };
    } catch (err: any) {
      console.error("[STAGE: ERROR] Microphone access failure:", err);

      const name = err?.name || "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError") {
        return {
          success: false,
          errorType: "PERMISSION_DENIED",
          message: "I need microphone access to talk with you. Please allow microphone permission and try again.",
        };
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError" || name === "NotReadableError") {
        return {
          success: false,
          errorType: "MIC_UNAVAILABLE",
          message: "I couldn't access your microphone. Please check your browser microphone settings.",
        };
      }

      return {
        success: false,
        errorType: "UNKNOWN",
        message: err?.message || "Could not access your microphone. Please check your settings.",
      };
    }
  }

  private track = () => {
    if (!this.isRunning || !this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    // Normalize to 0.0 - 1.0 with a non-linear scale for pleasant visual response
    const normalized = Math.min(1, Math.max(0, average / 128));

    this.onAmplitudeUpdate?.(normalized);

    this.animationFrameId = requestAnimationFrame(this.track);
  };

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach((track) => track.stop());
      this.microphoneStream = null;
    }
    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {}
      this.sourceNode = null;
    }
    if (this.audioContext && this.audioContext.state !== "closed") {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }
    this.analyser = null;
    this.onAmplitudeUpdate?.(0);
  }

  public get isConnected(): boolean {
    return this.isRunning && !!this.microphoneStream;
  }
}
