interface BatteryManagerLike extends EventTarget {
  charging: boolean;
  level: number;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<BatteryManagerLike>;
}

let activeTorchTrack: MediaStreamTrack | null = null;
let activeWakeLock: WakeLockSentinel | null = null;

export async function readDeviceBattery(): Promise<{
  level: number;
  charging: boolean;
  supported: boolean;
}> {
  try {
    const nav = navigator as NavigatorWithBattery;
    if (typeof nav.getBattery === 'function') {
      const battery = await nav.getBattery();
      return {
        level: Math.round(battery.level * 100),
        charging: battery.charging,
        supported: true,
      };
    }
  } catch {
    // Graceful fallback when Battery API is unavailable
  }
  return { level: 84, charging: false, supported: false };
}

export async function setCameraTorch(enable: boolean): Promise<boolean> {
  try {
    if (!enable) {
      if (activeTorchTrack) {
        try {
          await activeTorchTrack.applyConstraints({
            advanced: [{ torch: false } as MediaTrackConstraintSet],
          });
        } catch {
          // ignore
        }
        activeTorchTrack.stop();
        activeTorchTrack = null;
      }
      return true;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      return false;
    }

    if (!activeTorchTrack) {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      const track = stream.getVideoTracks()[0];
      if (!track) return false;
      const capabilities = track.getCapabilities?.() as { torch?: boolean } | undefined;
      if (!capabilities?.torch) {
        track.stop();
        return false;
      }
      activeTorchTrack = track;
    }

    await activeTorchTrack.applyConstraints({
      advanced: [{ torch: true } as MediaTrackConstraintSet],
    });
    return true;
  } catch {
    return false;
  }
}

export async function setScreenWakeLock(enable: boolean): Promise<boolean> {
  try {
    if (!enable) {
      if (activeWakeLock) {
        await activeWakeLock.release();
        activeWakeLock = null;
      }
      return true;
    }
    if ('wakeLock' in navigator && navigator.wakeLock) {
      activeWakeLock = await navigator.wakeLock.request('screen');
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function triggerHaptics(pattern: number | number[] = [45, 30, 60]): boolean {
  try {
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      return navigator.vibrate(pattern);
    }
  } catch {
    // ignore
  }
  return false;
}

export function getCurrentCoordinates(): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: Number(pos.coords.latitude.toFixed(5)),
          longitude: Number(pos.coords.longitude.toFixed(5)),
        }),
      () => resolve(null),
      { timeout: 5000, maximumAge: 60000 }
    );
  });
}

export function playTimerChime(): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [880, 1174.66, 1318.51];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = ctx.currentTime + idx * 0.16;
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.2, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.48);
    });
  } catch {
    // ignore
  }
}

export async function sendBrowserNotification(title: string, body: string): Promise<void> {
  try {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  } catch {
    // ignore
  }
}
