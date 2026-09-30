/**
 * Real-Time Web Audio API Microphone Amplitude Analyser
 * Captures real physical microphone volume levels for live orb reactions.
 */
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

  public async start(): Promise<boolean> {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      return false;
    }

    try {
      this.microphoneStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.5;

      this.sourceNode = this.audioContext.createMediaStreamSource(this.microphoneStream);
      this.sourceNode.connect(this.analyser);

      this.isRunning = true;
      this.track();
      return true;
    } catch (err) {
      console.warn("Could not attach Web Audio Analyser (mic may be restricted):", err);
      return false;
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
}
