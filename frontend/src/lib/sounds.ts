class SoundManager {
  private audioCtx: AudioContext | null = null;
  private ringtoneInterval: number | null = null;

  private getContext() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  private playNote(ctx: AudioContext, freq: number, startTime: number, duration: number, vol: number = 0.2) {
    // To sound more like a marimba/WhatsApp tone, we use a sine wave with a very fast attack and steep decay
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = "sine"; // Sine gives the cleanest "pop" or "bell" sound
    osc.frequency.setValueAtTime(freq, startTime);
    
    gain.gain.setValueAtTime(0, startTime);
    // Extremely fast attack
    gain.gain.linearRampToValueAtTime(vol, startTime + 0.01);
    // Steep exponential decay for a plucky, percussive sound
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  playNotification() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      // WhatsApp-style message received sound (a quick ascending "pop-pop")
      this.playNote(ctx, 783.99, now, 0.15, 0.5);       // G5
      this.playNote(ctx, 1046.50, now + 0.12, 0.25, 0.5); // C6
    } catch (e) {
      console.warn("Audio play failed (likely autoplay policy)", e);
    }
  }

  private playRingChime() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      
      // WhatsApp-style ringing: A fast, repeating 4-note arpeggio
      let time = now;
      for (let i = 0; i < 4; i++) {
        this.playNote(ctx, 659.25, time, 0.15, 0.4);       // E5
        this.playNote(ctx, 830.61, time + 0.12, 0.15, 0.4); // G#5
        this.playNote(ctx, 987.77, time + 0.24, 0.15, 0.4); // B5
        this.playNote(ctx, 830.61, time + 0.36, 0.15, 0.4); // G#5
        time += 0.48; // Space between arpeggios
      }
    } catch (e) {
      console.warn("Audio play failed", e);
    }
  }

  startRinging() {
    this.stopRinging();
    this.playRingChime();
    // Replay the fast ringing sequence every 3 seconds
    this.ringtoneInterval = window.setInterval(() => {
      this.playRingChime();
    }, 3000);
  }

  stopRinging() {
    if (this.ringtoneInterval !== null) {
      window.clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
  }
}

export const sounds = new SoundManager();
