import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  Mic,
  Sliders,
  Clock,
  Users,
  Settings,
  Volume2,
  VolumeX,
  ExternalLink,
  Phone,
  CheckCircle2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  AcousticCore,
  LiveVideoBackdrop,
  type CorePhase,
} from './components/AcousticCore';
import {
  MobileControlPanel,
  CalculatorModal,
  CameraModal,
  PhoneDialerModal,
} from './components/MobileControlPanel';
import {
  UtilitiesView,
  ContactsView,
  SettingsView,
} from './components/UtilitiesPanel';
import { COPY } from './lib/i18n';
import {
  detectDirectWebAppCommand,
  launchUriScheme,
  openInNewTab,
  resolveAppSpec,
} from './lib/appLauncher';
import {
  getCurrentCoordinates,
  playTimerChime,
  readDeviceBattery,
  sendBrowserNotification,
  setCameraTorch,
  setScreenWakeLock,
  triggerHaptics,
} from './lib/hardware';
import type {
  ChatTurn,
  ContactItem,
  DeviceState,
  ExecutedAction,
  JarvisCommandResponse,
  JarvisLanguage,
  LevelKey,
  NoteItem,
  RoutineId,
  SettingKey,
  TimerItem,
} from './types/jarvis';

type ActiveTab = 'assistant' | 'controls' | 'utilities' | 'contacts' | 'settings';
type RightTab = 'controls' | 'utilities' | 'contacts' | 'settings';

const STORAGE_KEYS = {
  language: 'jarvis_lang_v1',
  voice: 'jarvis_voice_v1',
  autoSpeak: 'jarvis_autospeak_v1',
  continuous: 'jarvis_continuous_v1',
  contacts: 'jarvis_contacts_v1',
  notes: 'jarvis_notes_v1',
  device: 'jarvis_device_v1',
};

const DEFAULT_DEVICE: DeviceState = {
  wifi: true,
  mobileData: true,
  bluetooth: false,
  flashlight: false,
  dnd: false,
  airplaneMode: false,
  location: true,
  autoRotate: true,
  hotspot: false,
  wakeLock: false,
  brightness: 80,
  mediaVolume: 70,
  ringVolume: 75,
  batteryLevel: 85,
  batteryCharging: false,
  torchSupported: false,
  activeRoutine: null,
};

const DEFAULT_CONTACTS: ContactItem[] = [
  { id: 'c1', name: 'আব্বু (Father)', relation: 'আব্বু dad father abbu', phone: '+8801711000001' },
  { id: 'c2', name: 'আম্মু (Mother)', relation: 'আম্মু mom mother ammu', phone: '+8801711000002' },
  { id: 'c3', name: 'Rahim Bhai', relation: 'office friend রহিম', phone: '+8801811000003' },
];

const DEFAULT_NOTES: NoteItem[] = [
  {
    id: 'n1',
    text: 'ব্যাংক থেকে জরুরি কাগজ সংগ্রহ করা',
    reminderTime: '৪:০০ PM',
    done: false,
    createdAt: Date.now() - 3600000,
  },
];

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((ev: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function getStoredJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [language, setLanguage] = useState<JarvisLanguage>(() =>
    getStoredJson<JarvisLanguage>(STORAGE_KEYS.language, 'bn')
  );
  const [voiceName, setVoiceName] = useState<string>(() =>
    getStoredJson<string>(STORAGE_KEYS.voice, 'Charon')
  );
  const [autoSpeak, setAutoSpeak] = useState<boolean>(() =>
    getStoredJson<boolean>(STORAGE_KEYS.autoSpeak, true)
  );
  const [continuousMode, setContinuousMode] = useState<boolean>(() =>
    getStoredJson<boolean>(STORAGE_KEYS.continuous, false)
  );

  const [device, setDevice] = useState<DeviceState>(() => ({
    ...DEFAULT_DEVICE,
    ...getStoredJson<Partial<DeviceState>>(STORAGE_KEYS.device, {}),
    flashlight: false,
    wakeLock: false,
  }));

  const [contacts, setContacts] = useState<ContactItem[]>(() =>
    getStoredJson<ContactItem[]>(STORAGE_KEYS.contacts, DEFAULT_CONTACTS)
  );
  const [notes, setNotes] = useState<NoteItem[]>(() =>
    getStoredJson<NoteItem[]>(STORAGE_KEYS.notes, DEFAULT_NOTES)
  );
  const [timers, setTimers] = useState<TimerItem[]>([]);

  const [mobileTab, setMobileTab] = useState<ActiveTab>('assistant');
  const [desktopRightTab, setDesktopRightTab] = useState<RightTab>('controls');
  const [activeModal, setActiveModal] = useState<'camera' | 'calculator' | 'dialer' | null>(null);

  const copy = COPY[language];

  const [turns, setTurns] = useState<ChatTurn[]>(() => [
    {
      id: 'welcome',
      role: 'jarvis',
      text: COPY[getStoredJson<JarvisLanguage>(STORAGE_KEYS.language, 'bn')].welcomeMessage,
      timestamp: Date.now(),
    },
  ]);

  const [liveTranscript, setLiveTranscript] = useState('');
  const [phase, setPhase] = useState<CorePhase>('idle');
  const [audioLevel, setAudioLevel] = useState(0);
  const [micBanner, setMicBanner] = useState<string | null>(null);
  const [pendingTabFallback, setPendingTabFallback] = useState<{
    label: string;
    url: string;
  } | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const persistentAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speakTimerRef = useRef<number | null>(null);
  const speakRunIdRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastCommandRef = useRef<string>('');
  const liveTranscriptRef = useRef<string>('');
  const preLaunchedAppRef = useRef<string | null>(null);
  const preLaunchedByStopRef = useRef<boolean>(false);
  const shouldResumeAfterSpeakRef = useRef(false);

  // Sync HTML lang attribute
  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem(STORAGE_KEYS.language, JSON.stringify(language));
  }, [language]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.voice, JSON.stringify(voiceName));
  }, [voiceName]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.autoSpeak, JSON.stringify(autoSpeak));
  }, [autoSpeak]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.continuous, JSON.stringify(continuousMode));
  }, [continuousMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.contacts, JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.device, JSON.stringify(device));
  }, [device]);

  // Read live device battery on mount & periodically
  useEffect(() => {
    let active = true;
    const syncBattery = async () => {
      const info = await readDeviceBattery();
      if (active) {
        setDevice((prev) => ({
          ...prev,
          batteryLevel: info.level,
          batteryCharging: info.charging,
        }));
      }
    };
    syncBattery();
    const id = setInterval(syncBattery, 30000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  // Live countdown timer loop
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) =>
        prev.map((t) => {
          if (!t.running || t.completed) return t;
          if (t.remainingSeconds <= 1) {
            playTimerChime();
            triggerHaptics([200, 100, 200, 100, 300]);
            sendBrowserNotification('JARVIS Timer', `${t.label} completed!`);
            return { ...t, remainingSeconds: 0, running: false, completed: true };
          }
          return { ...t, remainingSeconds: t.remainingSeconds - 1 };
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Scroll chat to bottom on new turn
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, phase]);

  // Preload SpeechSynthesis voices so Bengali/English fallback speaks immediately
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const loadVoices = () => {
      try {
        window.speechSynthesis.getVoices();
      } catch {
        // ignore
      }
    };
    loadVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', loadVoices);
    };
  }, []);

  const stopAudioMeter = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  const primeAudioPlayback = useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        if (!playbackCtxRef.current || playbackCtxRef.current.state === 'closed') {
          playbackCtxRef.current = new AudioCtx();
        }
        const ctx = playbackCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        // Play a silent 1-sample buffer synchronously inside user tap to unlock mobile autoplay
        const buffer = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.connect(ctx.destination);
        src.start(0);
      }
    } catch {
      // ignore
    }
    try {
      // Also bless a single persistent <audio> element during user gesture for mobile Chrome/Safari
      const userAct = (
        navigator as unknown as { userActivation?: { isActive?: boolean } }
      ).userActivation;
      const canPrimeElement = !userAct || Boolean(userAct.isActive);
      if (!persistentAudioRef.current) {
        persistentAudioRef.current = new Audio();
      }
      const el = persistentAudioRef.current;
      if (canPrimeElement) {
        el.muted = true;
        el.src =
          'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
        const p = el.play();
        if (p) {
          p.then(() => {
            el.pause();
            el.muted = false;
          }).catch(() => {
            el.muted = false;
          });
        } else {
          el.muted = false;
        }
      }
    } catch {
      // ignore
    }
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.resume();
      }
    } catch {
      // ignore
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    speakRunIdRef.current += 1;
    if (speakTimerRef.current) {
      window.clearTimeout(speakTimerRef.current);
      speakTimerRef.current = null;
    }
    if (activeAudioSourceRef.current) {
      try {
        activeAudioSourceRef.current.onended = null;
        activeAudioSourceRef.current.stop();
        activeAudioSourceRef.current.disconnect();
      } catch {
        // ignore
      }
      activeAudioSourceRef.current = null;
    }
    if (ttsAudioRef.current) {
      ttsAudioRef.current.onended = null;
      ttsAudioRef.current.onerror = null;
      ttsAudioRef.current.pause();
      ttsAudioRef.current.currentTime = 0;
      ttsAudioRef.current = null;
    }
    if (persistentAudioRef.current) {
      persistentAudioRef.current.onended = null;
      persistentAudioRef.current.onerror = null;
      persistentAudioRef.current.pause();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
    setAudioLevel(0);
    setPhase((prev) => (prev === 'speaking' ? 'idle' : prev));
  }, []);

  const handleToggleSetting = useCallback(
    async (key: SettingKey, forcedValue?: boolean) => {
      let nextVal = false;
      setDevice((prev) => {
        nextVal = forcedValue !== undefined ? forcedValue : !prev[key];
        if (key === 'airplaneMode' && nextVal) {
          return {
            ...prev,
            airplaneMode: true,
            wifi: false,
            mobileData: false,
            bluetooth: false,
            hotspot: false,
            activeRoutine: null,
          };
        }
        return { ...prev, [key]: nextVal, activeRoutine: null };
      });

      triggerHaptics(35);
      if (key === 'flashlight') {
        const supported = await setCameraTorch(
          forcedValue !== undefined ? forcedValue : !device.flashlight
        );
        setDevice((prev) => ({ ...prev, torchSupported: supported }));
      } else if (key === 'wakeLock') {
        await setScreenWakeLock(
          forcedValue !== undefined ? forcedValue : !device.wakeLock
        );
      }
    },
    [device.flashlight, device.wakeLock]
  );

  const handleChangeLevel = useCallback((key: LevelKey, value: number) => {
    const clamped = Math.max(5, Math.min(100, Math.round(value)));
    setDevice((prev) => ({ ...prev, [key]: clamped, activeRoutine: null }));
  }, []);

  const handleAddTimer = useCallback((seconds: number, label: string) => {
    const newTimer: TimerItem = {
      id: `tm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label,
      totalSeconds: seconds,
      remainingSeconds: seconds,
      running: true,
      completed: false,
      createdAt: Date.now(),
    };
    setTimers((prev) => [newTimer, ...prev]);
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const handleRunRoutine = useCallback(
    async (routineId: RoutineId) => {
      triggerHaptics([40, 30, 50]);
      setDevice((prev) => {
        switch (routineId) {
          case 'morning':
            return {
              ...prev,
              wifi: true,
              dnd: false,
              airplaneMode: false,
              brightness: 80,
              mediaVolume: 70,
              activeRoutine: 'morning',
            };
          case 'driving':
            return {
              ...prev,
              bluetooth: true,
              mobileData: true,
              wifi: false,
              dnd: true,
              location: true,
              mediaVolume: 90,
              activeRoutine: 'driving',
            };
          case 'sleep':
            return {
              ...prev,
              dnd: true,
              flashlight: false,
              brightness: 15,
              mediaVolume: 10,
              ringVolume: 10,
              wakeLock: false,
              activeRoutine: 'sleep',
            };
          case 'focus':
            return {
              ...prev,
              dnd: true,
              brightness: 65,
              mediaVolume: 20,
              ringVolume: 15,
              wakeLock: true,
              activeRoutine: 'focus',
            };
          case 'battery_saver':
            return {
              ...prev,
              brightness: 25,
              bluetooth: false,
              flashlight: false,
              hotspot: false,
              activeRoutine: 'battery_saver',
            };
        }
      });

      if (routineId === 'sleep' || routineId === 'battery_saver') {
        await setCameraTorch(false);
        await setScreenWakeLock(false);
      } else if (routineId === 'focus') {
        await setScreenWakeLock(true);
        handleAddTimer(25 * 60, language === 'bn' ? 'ফোকাস সেশন' : 'Focus Session');
      }
    },
    [handleAddTimer, language]
  );

  const applyActionsFromJarvis = useCallback(
    async (actions: ExecutedAction[]) => {
      for (const action of actions) {
        const p = action.payload;
        switch (action.type) {
          case 'toggle_setting': {
            const setting = String(p.setting) as SettingKey;
            const enabled = Boolean(p.enabled);
            await handleToggleSetting(setting, enabled);
            break;
          }
          case 'adjust_level': {
            const target = String(p.target) as LevelKey;
            const val = Number(p.value ?? 50);
            handleChangeLevel(target, val);
            break;
          }
          case 'set_timer': {
            const secs = Number(p.durationSeconds ?? 60);
            const label = String(p.label ?? 'Timer');
            handleAddTimer(secs, label);
            break;
          }
          case 'manage_note': {
            const op = String(p.operation ?? 'add');
            const text = String(p.text ?? '');
            const reminderTime = p.reminderTime ? String(p.reminderTime) : undefined;
            if (op === 'add' && text) {
              setNotes((prev) => [
                {
                  id: `nt-${Date.now()}`,
                  text,
                  reminderTime,
                  done: false,
                  createdAt: Date.now(),
                },
                ...prev,
              ]);
            } else if (op === 'complete' && text) {
              setNotes((prev) =>
                prev.map((n) =>
                  n.text.toLowerCase().includes(text.toLowerCase())
                    ? { ...n, done: true }
                    : n
                )
              );
            } else if (op === 'delete' && text) {
              setNotes((prev) =>
                prev.filter(
                  (n) => !n.text.toLowerCase().includes(text.toLowerCase())
                )
              );
            }
            break;
          }
          case 'run_routine': {
            const rid = String(p.routineId) as RoutineId;
            await handleRunRoutine(rid);
            break;
          }
          case 'add_contact': {
            const name = String(p.name ?? '');
            const phone = String(p.phone ?? '');
            const relation = p.relation ? String(p.relation) : undefined;
            if (name && phone) {
              setContacts((prev) => [
                {
                  id: `ct-${Date.now()}`,
                  name,
                  phone,
                  relation,
                },
                ...prev,
              ]);
            }
            break;
          }
          case 'hardware_action': {
            const act = String(p.action ?? '');
            if (act === 'vibrate') {
              triggerHaptics([120, 60, 120, 60, 180]);
            } else if (act === 'copy_text' && p.textPayload) {
              navigator.clipboard?.writeText(String(p.textPayload)).catch(() => {});
            } else if (act === 'share_content' && p.textPayload && navigator.share) {
              navigator.share({ text: String(p.textPayload) }).catch(() => {});
            } else if (act === 'check_battery') {
              const info = await readDeviceBattery();
              setDevice((prev) => ({
                ...prev,
                batteryLevel: info.level,
                batteryCharging: info.charging,
              }));
            }
            break;
          }
          case 'phone_call': {
            if (action.launchUrl) {
              launchUriScheme(action.launchUrl);
            } else {
              setActiveModal('dialer');
            }
            break;
          }
          case 'send_message': {
            if (action.launchUrl) {
              launchUriScheme(action.launchUrl);
            }
            break;
          }
          case 'open_app': {
            const appName = String(p.appName || '');
            const query = p.query ? String(p.query) : undefined;
            const { spec } = resolveAppSpec(appName, query);
            if (preLaunchedAppRef.current === spec.id) {
              preLaunchedAppRef.current = null;
            } else {
              openAppImmediately(appName, query);
            }
            break;
          }
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handleAddTimer, handleChangeLevel, handleRunRoutine, handleToggleSetting]
  );

  const speakResponse = useCallback(
    async (text: string, onComplete?: () => void, forceSpeak = false) => {
      if ((!autoSpeak && !forceSpeak) || !text.trim()) {
        onComplete?.();
        return;
      }

      stopSpeaking();
      setPhase('speaking');

      // Gentle simulated speaking wave
      let tick = 0;
      const waveTimer = window.setInterval(() => {
        tick += 0.35;
        setAudioLevel(0.35 + Math.abs(Math.sin(tick)) * 0.45);
      }, 70);

      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        window.clearInterval(waveTimer);
        if (speakTimerRef.current) {
          window.clearTimeout(speakTimerRef.current);
          speakTimerRef.current = null;
        }
        utteranceRef.current = null;
        setAudioLevel(0);
        setPhase('idle');
        onComplete?.();
      };

      const speakWithBrowserSynthesis = () => {
        if (!('speechSynthesis' in window)) {
          finish();
          return;
        }
        const synth = window.speechSynthesis;
        const hasBengali = /[\u0980-\u09FF]/.test(text);
        const targetPrefix = hasBengali || language === 'bn' ? 'bn' : 'en';

        const pickVoice = () => {
          const voices = synth.getVoices();
          if (targetPrefix === 'bn') {
            return (
              voices.find((v) => v.lang.toLowerCase() === 'bn-bd') ||
              voices.find((v) => v.lang.toLowerCase().startsWith('bn')) ||
              null
            );
          }
          return (
            voices.find((v) => v.lang.toLowerCase() === 'en-gb') ||
            voices.find((v) => v.lang.toLowerCase() === 'en-us') ||
            voices.find((v) => v.lang.toLowerCase().startsWith('en')) ||
            null
          );
        };

        const utter = new SpeechSynthesisUtterance(text);
        const matchedVoice = pickVoice();
        if (matchedVoice) {
          utter.voice = matchedVoice;
          utter.lang = matchedVoice.lang;
        } else {
          utter.lang = targetPrefix === 'bn' ? 'bn-BD' : 'en-US';
        }
        utter.volume = Math.max(0.3, device.mediaVolume / 100);
        utter.rate = 1.0;
        utter.onend = finish;
        utter.onerror = finish;
        utteranceRef.current = utter;

        // Safety watchdog in case browser lacks TTS voices and never fires onend
        const maxWaitMs = Math.min(25000, Math.max(4000, text.length * 140));
        speakTimerRef.current = window.setTimeout(finish, maxWaitMs);

        // Wait 60ms after cancel() so Chrome doesn't drop the new utterance
        window.setTimeout(() => {
          if (finished) return;
          try {
            synth.resume();
            synth.speak(utter);
          } catch {
            finish();
          }
        }, 60);
      };

      const runId = ++speakRunIdRef.current;

      try {
        const res = await fetch('/api/jarvis/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voiceName, language }),
        });

        if (runId !== speakRunIdRef.current || finished) return;

        if (!res.ok) {
          speakWithBrowserSynthesis();
          return;
        }

        const data = (await res.json()) as {
          audioBase64?: string | null;
          audioChunks?: string[];
          mimeType?: string;
          fallback?: string;
        };

        const chunksBase64 =
          data.audioChunks && data.audioChunks.length > 0
            ? data.audioChunks
            : data.audioBase64
              ? [data.audioBase64]
              : [];

        if (chunksBase64.length === 0) {
          speakWithBrowserSynthesis();
          return;
        }

        const mimeType = data.mimeType || 'audio/wav';
        const volumeLevel = Math.max(0.55, device.mediaVolume / 100);

        const decodeBase64Bytes = (b64: string): ArrayBuffer => {
          const binary = atob(b64);
          const buffer = new ArrayBuffer(binary.length);
          const view = new Uint8Array(buffer);
          for (let i = 0; i < binary.length; i++) {
            view[i] = binary.charCodeAt(i);
          }
          return buffer;
        };

        const playChunkWithAudioElement = (buffer: ArrayBuffer): Promise<void> =>
          new Promise((resolve, reject) => {
            if (runId !== speakRunIdRef.current || finished) {
              resolve();
              return;
            }
            const blob = new Blob([buffer], { type: mimeType });
            const blobUrl = URL.createObjectURL(blob);
            const audio = persistentAudioRef.current ?? new Audio();
            audio.muted = false;
            audio.volume = volumeLevel;
            audio.src = blobUrl;
            ttsAudioRef.current = audio;

            const cleanup = () => {
              audio.onended = null;
              audio.onerror = null;
              URL.revokeObjectURL(blobUrl);
            };
            audio.onended = () => {
              cleanup();
              resolve();
            };
            audio.onerror = () => {
              cleanup();
              reject(new Error('Audio element playback failed'));
            };
            const playPromise = audio.play();
            if (playPromise) {
              playPromise.catch((err) => {
                cleanup();
                reject(err);
              });
            }
          });

        const playChunkWithContext = async (
          ctx: AudioContext,
          buffer: ArrayBuffer
        ): Promise<void> => {
          const audioBuffer = await ctx.decodeAudioData(buffer.slice(0));
          if (runId !== speakRunIdRef.current || finished) return;
          await new Promise<void>((resolve) => {
            const source = ctx.createBufferSource();
            const gain = ctx.createGain();
            gain.gain.value = volumeLevel;
            source.buffer = audioBuffer;
            source.connect(gain);
            gain.connect(ctx.destination);
            activeAudioSourceRef.current = source;
            source.onended = () => {
              activeAudioSourceRef.current = null;
              resolve();
            };
            source.start(0);
          });
        };

        let ctx = playbackCtxRef.current;
        if (ctx && ctx.state === 'suspended') {
          await ctx.resume().catch(() => {});
        }
        const canUseCtx = Boolean(ctx && ctx.state === 'running');

        for (const chunkB64 of chunksBase64) {
          if (runId !== speakRunIdRef.current || finished) return;
          const bytes = decodeBase64Bytes(chunkB64);
          if (canUseCtx && ctx) {
            try {
              await playChunkWithContext(ctx, bytes);
              continue;
            } catch {
              ctx = null;
            }
          }
          await playChunkWithAudioElement(bytes);
        }

        finish();
      } catch {
        if (runId === speakRunIdRef.current && !finished) {
          speakWithBrowserSynthesis();
        }
      }
    },
    [autoSpeak, device.mediaVolume, language, stopSpeaking, voiceName]
  );

  // Forward ref for continuous hands-free listening
  const startListeningRef = useRef<() => void>(() => {});

  const attemptOpenNewTab = useCallback((url: string, label: string) => {
    const hadActivation = openInNewTab(url);
    if (!hadActivation) {
      setPendingTabFallback({ label, url });
    } else {
      setPendingTabFallback(null);
    }
  }, []);

  const sendCommand = useCallback(
    async (commandText: string, fromUserGesture = false) => {
      const cleaned = commandText.trim();
      if (!cleaned) return;

      if (fromUserGesture) {
        primeAudioPlayback();
      }

      if (preLaunchedByStopRef.current) {
        preLaunchedByStopRef.current = false;
      } else {
        preLaunchedAppRef.current = null;
        setPendingTabFallback(null);
        if (fromUserGesture) {
          const direct = detectDirectWebAppCommand(cleaned);
          if (direct) {
            preLaunchedAppRef.current = direct.appId;
            attemptOpenNewTab(direct.url, direct.label);
          }
        }
      }

      lastCommandRef.current = cleaned;
      setMicBanner(null);
      setLiveTranscript('');
      liveTranscriptRef.current = '';
      stopSpeaking();
      setPhase('processing');

      const userTurn: ChatTurn = {
        id: `u-${Date.now()}`,
        role: 'user',
        text: cleaned,
        timestamp: Date.now(),
      };
      setTurns((prev) => [...prev, userTurn]);

      try {
        const coords = device.location ? await getCurrentCoordinates() : null;
        const historyPayload = turns.slice(-6).map((t) => ({
          role: t.role,
          text: t.text,
        }));

        const res = await fetch('/api/jarvis/command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: cleaned,
            history: historyPayload,
            context: {
              device,
              contacts,
              timers,
              notes,
              language,
              coords,
            },
          }),
        });

        const data = (await res.json()) as JarvisCommandResponse & {
          error?: string;
          code?: string;
        };
        if (!res.ok) {
          const err = new Error(data.error || 'Failed to reach JARVIS server') as Error & {
            code?: string;
            status?: number;
          };
          err.code = data.code;
          err.status = res.status;
          throw err;
        }

        if (data.actions && data.actions.length > 0) {
          await applyActionsFromJarvis(data.actions);
        }

        const jarvisTurn: ChatTurn = {
          id: `j-${Date.now()}`,
          role: 'jarvis',
          text: data.reply,
          timestamp: Date.now(),
          actions: data.actions,
          sources: data.sources,
        };
        setTurns((prev) => [...prev, jarvisTurn]);

        shouldResumeAfterSpeakRef.current = continuousMode;
        await speakResponse(data.reply, () => {
          if (shouldResumeAfterSpeakRef.current) {
            shouldResumeAfterSpeakRef.current = false;
            setTimeout(() => startListeningRef.current(), 350);
          }
        });
      } catch (err: unknown) {
        const typedErr = err as Error & { code?: string; status?: number };
        const msg = typedErr?.message || 'Request failed';
        const isQuota =
          typedErr?.code === 'RESOURCE_EXHAUSTED' ||
          typedErr?.status === 429 ||
          msg.includes('429') ||
          msg.includes('RESOURCE_EXHAUSTED');
        const isAuth =
          typedErr?.code === 'API_KEY_INVALID' ||
          typedErr?.status === 403 ||
          msg.includes('API_KEY_INVALID') ||
          msg.includes('PERMISSION_DENIED');

        setPhase('idle');
        const friendlyText = isQuota
          ? language === 'bn'
            ? 'জেমিনি এপিআই কোটা বা রেট লিমিট শেষ হয়ে গেছে (429)। কিছুক্ষণ অপেক্ষা করে আবার চেষ্টা করুন, অথবা Settings > Secrets প্যানেলে বিলিং-সক্রিয় এপিআই কী নির্বাচন করুন।'
            : 'Gemini API quota or rate limit exceeded (429). Please wait a moment and retry, or select a billing-enabled API key in the Settings > Secrets panel.'
          : isAuth
            ? language === 'bn'
              ? 'এপিআই কী সঠিক নয় বা অনুমতি নেই। অনুগ্রহ করে Settings > Secrets প্যানেল থেকে বৈধ জেমিনি এপিআই কী পরীক্ষা করুন।'
              : 'API key is invalid or lacks permission. Please verify your Gemini API key in the Settings > Secrets panel.'
            : language === 'bn'
              ? `দুঃখিত স্যার, সমস্যা হয়েছে: ${msg}`
              : `Apologies, sir. Something went wrong: ${msg}`;

        setTurns((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: 'jarvis',
            text: friendlyText,
            timestamp: Date.now(),
            error: true,
          },
        ]);
      }
    },
    [
      applyActionsFromJarvis,
      attemptOpenNewTab,
      contacts,
      continuousMode,
      device,
      language,
      notes,
      primeAudioPlayback,
      speakResponse,
      stopSpeaking,
      timers,
      turns,
    ]
  );

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    stopAudioMeter();
  }, [stopAudioMeter]);

  const startMicMeter = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length / 255;
        setAudioLevel(Math.min(1, avg * 2.2));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
      return stream;
    } catch {
      return null;
    }
  }, []);

  const startListeningPulse = useCallback(() => {
    let t = 0;
    const pulse = () => {
      t += 0.08;
      setAudioLevel(0.28 + Math.abs(Math.sin(t)) * 0.42);
      rafRef.current = requestAnimationFrame(pulse);
    };
    rafRef.current = requestAnimationFrame(pulse);
  }, []);

  const startMediaRecorderFallback = useCallback(async () => {
    const stream = await startMicMeter();
    if (!stream) {
      setPhase('idle');
      setMicBanner(copy.micPermissionError);
      return;
    }

    try {
      const chunks: BlobPart[] = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunks.push(ev.data);
      };

      recorder.onstop = async () => {
        stopAudioMeter();
        setLiveTranscript('');
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        if (blob.size < 400) {
          setPhase('idle');
          return;
        }
        setPhase('processing');
        try {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const result = String(reader.result || '');
            const base64 = result.split(',')[1] || '';
            const res = await fetch('/api/jarvis/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                audioBase64: base64,
                mimeType: blob.type || 'audio/webm',
                language,
              }),
            });
            if (!res.ok) {
              setPhase('idle');
              setMicBanner(copy.noSpeechFallback);
              return;
            }
            const data = (await res.json()) as { text?: string };
            if (data.text?.trim()) {
              sendCommand(data.text.trim(), true);
            } else {
              setPhase('idle');
              setMicBanner(copy.noSpeechFallback);
            }
          };
          reader.readAsDataURL(blob);
        } catch {
          setPhase('idle');
          setMicBanner(copy.noSpeechFallback);
        }
      };

      recorder.start();
      setLiveTranscript(copy.recordingFallbackHint);
    } catch {
      stopAudioMeter();
      setPhase('idle');
      setMicBanner(copy.micPermissionError);
    }
  }, [
    copy.micPermissionError,
    copy.noSpeechFallback,
    copy.recordingFallbackHint,
    language,
    sendCommand,
    startMicMeter,
    stopAudioMeter,
  ]);

  const startListening = useCallback(() => {
    primeAudioPlayback();
    setMicBanner(null);
    setPendingTabFallback(null);
    preLaunchedByStopRef.current = false;
    preLaunchedAppRef.current = null;
    stopSpeaking();
    triggerHaptics(30);
    setPhase('listening');
    setLiveTranscript('');
    liveTranscriptRef.current = '';

    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance })
        .SpeechRecognition ||
      (
        window as unknown as {
          webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
        }
      ).webkitSpeechRecognition;

    if (SpeechRec) {
      const rec = new SpeechRec();
      rec.lang = language === 'bn' ? 'bn-BD' : 'en-US';
      rec.continuous = false;
      rec.interimResults = true;

      let latestTranscript = '';
      let dispatched = false;

      rec.onresult = (event) => {
        let combined = '';
        let hasFinal = false;
        for (let i = 0; i < event.results.length; i++) {
          const item = event.results[i];
          combined += item[0].transcript;
          if (item.isFinal) {
            hasFinal = true;
          }
        }
        latestTranscript = combined;
        liveTranscriptRef.current = combined;
        setLiveTranscript(combined);

        if (hasFinal && combined.trim() && !dispatched) {
          dispatched = true;
          stopAudioMeter();
          recognitionRef.current = null;
          try {
            rec.stop();
          } catch {
            // ignore
          }
          sendCommand(combined.trim(), true);
        }
      };

      rec.onerror = (ev) => {
        stopAudioMeter();
        recognitionRef.current = null;
        const code = ev?.error || '';
        if (code === 'audio-capture' || code === 'network' || code === 'service-not-allowed') {
          dispatched = true;
          startMediaRecorderFallback();
          return;
        }
        if (code === 'not-allowed') {
          setPhase('idle');
          setMicBanner(copy.micPermissionError);
          return;
        }
        if (code === 'no-speech') {
          setPhase('idle');
          setMicBanner(copy.noSpeechFallback);
          return;
        }
        setPhase('idle');
      };

      rec.onend = () => {
        stopAudioMeter();
        recognitionRef.current = null;
        if (dispatched) return;
        const textToSend = (latestTranscript || liveTranscriptRef.current).trim();
        liveTranscriptRef.current = '';
        if (textToSend) {
          dispatched = true;
          sendCommand(textToSend, true);
        } else {
          preLaunchedByStopRef.current = false;
          preLaunchedAppRef.current = null;
          setPhase('idle');
        }
      };

      recognitionRef.current = rec;
      try {
        rec.start();
        startListeningPulse();
        return;
      } catch {
        recognitionRef.current = null;
      }
    }

    startMediaRecorderFallback();
  }, [
    copy.micPermissionError,
    copy.noSpeechFallback,
    language,
    primeAudioPlayback,
    sendCommand,
    startListeningPulse,
    startMediaRecorderFallback,
    stopAudioMeter,
    stopSpeaking,
  ]);

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  const handleToggleListen = () => {
    if (phase === 'listening') {
      const pendingSpeech = liveTranscriptRef.current.trim();
      if (pendingSpeech) {
        const direct = detectDirectWebAppCommand(pendingSpeech);
        if (direct) {
          preLaunchedAppRef.current = direct.appId;
          preLaunchedByStopRef.current = true;
          attemptOpenNewTab(direct.url, direct.label);
        }
      }
      stopListening();
    } else if (phase === 'idle') {
      startListening();
    }
  };

  const handleNewChat = () => {
    stopSpeaking();
    setTurns([
      {
        id: `welcome-${Date.now()}`,
        role: 'jarvis',
        text: copy.welcomeMessage,
        timestamp: Date.now(),
      },
    ]);
  };

  const openAppImmediately = useCallback(
    (appName: string, query?: string) => {
      const { spec, resolvedWebUrl } = resolveAppSpec(appName, query);

      if (spec.internalModal) {
        setActiveModal(spec.internalModal);
        return;
      }

      if (spec.internalTab) {
        setMobileTab(spec.internalTab);
        setDesktopRightTab(spec.internalTab);
        return;
      }

      if (resolvedWebUrl) {
        attemptOpenNewTab(resolvedWebUrl, spec.label);
      }
    },
    [attemptOpenNewTab]
  );

  const handleOpenExternalApp = (appName: string, query?: string) => {
    openAppImmediately(appName, query);
  };

  const handleNavClick = (tab: ActiveTab) => {
    setMobileTab(tab);
    if (tab !== 'assistant') {
      setDesktopRightTab(tab);
    }
  };

  // Ambient screen brightness simulation (subtle dimming overlay when user lowers brightness)
  const brightnessDimOpacity = Math.max(0, (100 - device.brightness) * 0.0055);

  return (
    <div className="min-h-screen text-slate-100 flex flex-col relative overflow-x-hidden">
      <LiveVideoBackdrop phase={phase} audioLevel={audioLevel} />

      {/* Ambient brightness overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-50 bg-black transition-opacity duration-200"
        style={{ opacity: brightnessDimOpacity }}
      />

      {/* Top Bar Contract: 3 zones, 1 row, <= 56px */}
      <header className="sticky top-0 z-30 h-14 bg-black/40 backdrop-blur-md border-b border-white/15">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('assistant');
            }}
            className="text-lg font-bold tracking-tight text-white drop-shadow whitespace-nowrap shrink-0"
          >
            {copy.brand}
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {(
              [
                ['assistant', copy.nav.assistant],
                ['controls', copy.nav.controls],
                ['utilities', copy.nav.utilities],
                ['contacts', copy.nav.contacts],
                ['settings', copy.nav.settings],
              ] as Array<[ActiveTab, string]>
            ).map(([id, label]) => {
              const active =
                id === 'assistant'
                  ? mobileTab === 'assistant'
                  : desktopRightTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleNavClick(id)}
                  className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                    active
                      ? 'text-sky-300 border-sky-400'
                      : 'text-slate-200/85 border-transparent hover:text-white'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={handleNewChat}
            className="px-3.5 py-2 rounded-xl bg-black/45 hover:bg-black/65 border border-white/15 text-xs font-medium text-slate-100 whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{copy.newSession}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-4 pb-24 lg:pb-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Center: Voice Core + Conversation & Action Feed */}
        <section
          className={`relative z-10 lg:col-span-7 flex flex-col min-h-[calc(100vh-11rem)] lg:min-h-[calc(100vh-6.5rem)] rounded-3xl bg-black/25 border border-white/15 overflow-hidden ${
            mobileTab === 'assistant' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Voice Core Header Strip */}
          <div className="px-4 pt-2 pb-3 border-b border-white/10 bg-transparent">
            <div className="flex items-center justify-between text-xs text-slate-200 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
              <span className="font-mono-tabular px-2 py-0.5 rounded-md bg-black/35 border border-white/10">
                {copy.battery} {device.batteryLevel}%
              </span>
              <button
                type="button"
                onClick={() => {
                  const next = !autoSpeak;
                  setAutoSpeak(next);
                  if (next) {
                    primeAudioPlayback();
                    speakResponse(
                      language === 'bn'
                        ? 'ভয়েস উত্তর চালু করা হয়েছে, স্যার।'
                        : 'Voice replies enabled, sir.',
                      undefined,
                      true
                    );
                  } else {
                    stopSpeaking();
                  }
                }}
                className="min-h-[34px] px-2.5 rounded-lg bg-black/35 hover:bg-black/55 border border-white/10 flex items-center gap-1.5 text-slate-100 transition-colors"
              >
                {autoSpeak ? (
                  <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>{autoSpeak ? copy.voiceActive : copy.voiceMuted}</span>
              </button>
            </div>

            <AcousticCore
              phase={phase}
              audioLevel={audioLevel}
              copy={copy}
              onToggleListen={handleToggleListen}
              onStopSpeaking={stopSpeaking}
            />

            {liveTranscript && (
              <div className="mx-auto max-w-md px-3.5 py-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-xs text-sky-200 text-center">
                {liveTranscript}
              </div>
            )}

            {micBanner && (
              <div className="mt-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 text-center">
                {micBanner}
              </div>
            )}

            {pendingTabFallback && (
              <div className="mt-2 px-3 py-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-between gap-3">
                <p className="text-[11px] text-sky-100 leading-snug">
                  {language === 'bn'
                    ? `ভয়েস কমান্ডের পর ব্রাউজার নতুন ট্যাব ব্লক করলে সাইটের জন্য Pop-ups Allow দিন অথবা এখানে ট্যাপ করে ${pendingTabFallback.label} খুলুন।`
                    : `If your browser blocked the voice-triggered tab, allow Pop-ups for this site or tap to open ${pendingTabFallback.label}.`}
                </p>
                <a
                  href={pendingTabFallback.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setPendingTabFallback(null)}
                  className="shrink-0 min-h-[34px] px-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <span>{pendingTabFallback.label}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* Conversation & Executed Action Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[420px] lg:max-h-[460px] bg-[#060911]/55 backdrop-blur-sm">
            {turns.map((turn) => (
              <div
                key={turn.id}
                className={`flex flex-col ${
                  turn.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    turn.role === 'user'
                      ? 'bg-sky-500/95 text-slate-950 font-medium shadow-md'
                      : turn.error
                        ? 'bg-red-950/70 border border-red-500/40 text-red-200 backdrop-blur-sm'
                        : 'bg-[#0D131E]/80 border border-white/10 text-slate-100 backdrop-blur-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{turn.text}</p>
                  {turn.role === 'jarvis' && !turn.error && (
                    <div className="mt-2 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          primeAudioPlayback();
                          speakResponse(turn.text, undefined, true);
                        }}
                        aria-label={language === 'bn' ? 'শুনুন' : 'Listen'}
                        className="min-h-[30px] px-2.5 rounded-lg bg-slate-800/70 hover:bg-slate-700/80 text-[11px] text-sky-300 inline-flex items-center gap-1 transition-colors"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>{language === 'bn' ? 'শুনুন' : 'Speak'}</span>
                      </button>
                    </div>
                  )}
                  {turn.error && lastCommandRef.current && (
                    <button
                      type="button"
                      onClick={() => sendCommand(lastCommandRef.current, true)}
                      disabled={phase === 'processing'}
                      className="mt-2.5 min-h-[36px] px-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-400/40 text-xs font-medium text-red-100 inline-flex items-center gap-1.5 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{language === 'bn' ? 'আবার চেষ্টা করুন' : 'Retry'}</span>
                    </button>
                  )}
                </div>

                {/* Executed Mobile Actions */}
                {turn.actions && turn.actions.length > 0 && (
                  <div className="mt-2 w-full max-w-[88%] space-y-1.5">
                    {turn.actions.map((act) => (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => {
                          if (act.type === 'open_app') {
                            openAppImmediately(
                              String(act.payload.appName || ''),
                              act.payload.query ? String(act.payload.query) : undefined
                            );
                          } else if (act.launchUrl) {
                            launchUriScheme(act.launchUrl);
                          }
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#111824] border border-slate-800 hover:border-sky-500/40 flex items-center justify-between gap-3 text-left transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-200 truncate">
                              {act.title}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {act.detail}
                            </div>
                          </div>
                        </div>
                        {act.type === 'phone_call' ? (
                          <Phone className="w-4 h-4 text-sky-400 shrink-0" />
                        ) : act.launchUrl ? (
                          <ExternalLink className="w-4 h-4 text-sky-400 shrink-0" />
                        ) : null}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Command Chips */}
          <div className="px-4 py-2.5 border-t border-white/10 bg-[#060911]/70 backdrop-blur-sm">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              {copy.quickPrompts.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => sendCommand(q, true)}
                  disabled={phase === 'processing'}
                  className="min-h-[34px] px-3 rounded-lg bg-black/45 border border-white/10 hover:border-sky-400/60 text-xs text-slate-200 whitespace-nowrap shrink-0 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Right Column (Desktop) / Tabbed View (Mobile): A-to-Z Mobile Hub */}
        <section
          className={`relative z-10 lg:col-span-5 rounded-3xl bg-[#090D14]/68 backdrop-blur-md border border-white/10 p-4 sm:p-5 ${
            mobileTab !== 'assistant' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Desktop Panel Tabs */}
          <div className="hidden lg:grid grid-cols-4 gap-1 p-1 rounded-xl bg-black/40 border border-white/10 mb-5">
            {(
              [
                ['controls', copy.nav.controls],
                ['utilities', copy.nav.utilities],
                ['contacts', copy.nav.contacts],
                ['settings', copy.nav.settings],
              ] as Array<[RightTab, string]>
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setDesktopRightTab(id)}
                className={`min-h-[38px] px-2 rounded-lg text-xs font-medium truncate transition-colors ${
                  desktopRightTab === id
                    ? 'bg-slate-800 text-sky-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {(mobileTab === 'controls' ||
            (mobileTab === 'assistant' && desktopRightTab === 'controls')) && (
            <MobileControlPanel
              device={device}
              copy={copy}
              onToggleSetting={(k) => handleToggleSetting(k)}
              onChangeLevel={handleChangeLevel}
              onRunRoutine={handleRunRoutine}
              onOpenExternalApp={handleOpenExternalApp}
              onOpenInternalModal={(m) => setActiveModal(m)}
            />
          )}

          {(mobileTab === 'utilities' ||
            (mobileTab === 'assistant' && desktopRightTab === 'utilities')) && (
            <UtilitiesView
              timers={timers}
              notes={notes}
              copy={copy}
              onAddTimer={handleAddTimer}
              onToggleTimer={(id) =>
                setTimers((prev) =>
                  prev.map((t) =>
                    t.id === id ? { ...t, running: !t.running } : t
                  )
                )
              }
              onDeleteTimer={(id) =>
                setTimers((prev) => prev.filter((t) => t.id !== id))
              }
              onAddNote={(text, time) =>
                setNotes((prev) => [
                  {
                    id: `nt-${Date.now()}`,
                    text,
                    reminderTime: time,
                    done: false,
                    createdAt: Date.now(),
                  },
                  ...prev,
                ])
              }
              onToggleNote={(id) =>
                setNotes((prev) =>
                  prev.map((n) => (n.id === id ? { ...n, done: !n.done } : n))
                )
              }
              onDeleteNote={(id) =>
                setNotes((prev) => prev.filter((n) => n.id !== id))
              }
            />
          )}

          {(mobileTab === 'contacts' ||
            (mobileTab === 'assistant' && desktopRightTab === 'contacts')) && (
            <ContactsView
              contacts={contacts}
              copy={copy}
              onAddContact={(name, phone, relation) =>
                setContacts((prev) => [
                  { id: `ct-${Date.now()}`, name, phone, relation },
                  ...prev,
                ])
              }
              onDeleteContact={(id) =>
                setContacts((prev) => prev.filter((c) => c.id !== id))
              }
            />
          )}

          {(mobileTab === 'settings' ||
            (mobileTab === 'assistant' && desktopRightTab === 'settings')) && (
            <SettingsView
              language={language}
              voiceName={voiceName}
              autoSpeak={autoSpeak}
              continuousMode={continuousMode}
              copy={copy}
              onChangeLanguage={setLanguage}
              onChangeVoice={setVoiceName}
              onToggleAutoSpeak={() => setAutoSpeak((v) => !v)}
              onToggleContinuous={() => setContinuousMode((v) => !v)}
            />
          )}
        </section>
      </main>

      {/* Mobile Thumb-Zone Bottom Tab Bar (64px) */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090D14]/95 backdrop-blur-md border-t border-slate-800 pb-safe"
      >
        <div className="grid grid-cols-5 h-16 items-center">
          {(
            [
              ['assistant', Mic, copy.nav.assistant],
              ['controls', Sliders, copy.nav.controls],
              ['utilities', Clock, copy.nav.utilities],
              ['contacts', Users, copy.nav.contacts],
              ['settings', Settings, copy.nav.settings],
            ] as Array<[ActiveTab, typeof Mic, string]>
          ).map(([id, Icon, label]) => {
            const active = mobileTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleNavClick(id)}
                className={`min-h-[48px] flex flex-col items-center justify-center gap-1 px-1 transition-colors ${
                  active ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium truncate max-w-full">
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {activeModal === 'calculator' && (
        <CalculatorModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'camera' && (
        <CameraModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'dialer' && (
        <PhoneDialerModal onClose={() => setActiveModal(null)} />
      )}
    </div>
  );
}
