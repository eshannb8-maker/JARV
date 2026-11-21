import { useState, useRef, useEffect } from 'react';
import {
  Wifi,
  Signal,
  Bluetooth,
  Flashlight,
  BellOff,
  Plane,
  MapPin,
  RotateCw,
  Radio,
  Monitor,
  Sun,
  Volume2,
  Bell,
  Sunrise,
  Car,
  Moon,
  Target,
  BatteryCharging,
  Youtube,
  Map,
  MessageCircle,
  Camera,
  Calculator,
  Search,
  Mail,
  Music,
  X,
  Delete,
  Phone,
  Globe,
} from 'lucide-react';
import type { CopyBundle } from '../lib/i18n';
import type { DeviceState, LevelKey, RoutineId, SettingKey } from '../types/jarvis';

interface MobileControlPanelProps {
  device: DeviceState;
  copy: CopyBundle;
  onToggleSetting: (key: SettingKey) => void;
  onChangeLevel: (key: LevelKey, value: number) => void;
  onRunRoutine: (routineId: RoutineId) => void;
  onOpenExternalApp: (appName: string, query?: string) => void;
  onOpenInternalModal?: (modal: 'camera' | 'calculator' | 'dialer') => void;
}

const SETTING_ICONS: Record<SettingKey, typeof Wifi> = {
  wifi: Wifi,
  mobileData: Signal,
  bluetooth: Bluetooth,
  flashlight: Flashlight,
  dnd: BellOff,
  airplaneMode: Plane,
  location: MapPin,
  autoRotate: RotateCw,
  hotspot: Radio,
  wakeLock: Monitor,
};

const ROUTINE_ICONS: Record<RoutineId, typeof Sunrise> = {
  morning: Sunrise,
  driving: Car,
  sleep: Moon,
  focus: Target,
  battery_saver: BatteryCharging,
};

export function MobileControlPanel({
  device,
  copy,
  onToggleSetting,
  onChangeLevel,
  onRunRoutine,
  onOpenExternalApp,
  onOpenInternalModal,
}: MobileControlPanelProps) {
  const [localModal, setLocalModal] = useState<'camera' | 'calculator' | 'dialer' | null>(null);

  const openModal = (modal: 'camera' | 'calculator' | 'dialer') => {
    if (onOpenInternalModal) {
      onOpenInternalModal(modal);
    } else {
      setLocalModal(modal);
    }
  };

  const settingKeys: SettingKey[] = [
    'wifi',
    'mobileData',
    'bluetooth',
    'flashlight',
    'dnd',
    'airplaneMode',
    'location',
    'hotspot',
    'autoRotate',
    'wakeLock',
  ];

  const routineIds: RoutineId[] = [
    'morning',
    'driving',
    'sleep',
    'focus',
    'battery_saver',
  ];

  const appLaunchers = [
    { id: 'phone', label: 'Phone', icon: Phone, action: () => openModal('dialer') },
    { id: 'youtube', label: 'YouTube', icon: Youtube, action: () => onOpenExternalApp('youtube') },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, action: () => onOpenExternalApp('whatsapp') },
    { id: 'facebook', label: 'Facebook', icon: Globe, action: () => onOpenExternalApp('facebook') },
    { id: 'maps', label: 'Maps', icon: Map, action: () => onOpenExternalApp('maps') },
    { id: 'camera', label: 'Camera', icon: Camera, action: () => openModal('camera') },
    { id: 'calculator', label: 'Calculator', icon: Calculator, action: () => openModal('calculator') },
    { id: 'spotify', label: 'Spotify', icon: Music, action: () => onOpenExternalApp('spotify') },
    { id: 'gmail', label: 'Gmail', icon: Mail, action: () => onOpenExternalApp('gmail') },
    { id: 'google', label: 'Google', icon: Search, action: () => onOpenExternalApp('google') },
  ];

  return (
    <div className="space-y-6">
      {/* System Toggles Grid */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-200">
            {copy.nav.controls}
          </h2>
          <span className="text-xs text-slate-400 font-mono-tabular">
            {copy.battery} {device.batteryLevel}%
            {device.batteryCharging ? ` · ${copy.charging}` : ''}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2.5">
          {settingKeys.map((key) => {
            const Icon = SETTING_ICONS[key];
            const active = device[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => onToggleSetting(key)}
                aria-pressed={active}
                className={`min-h-[54px] px-3.5 py-2.5 rounded-2xl border text-left flex items-center gap-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                  active
                    ? 'bg-sky-500/15 border-sky-400/50 text-slate-100'
                    : 'bg-[#111824] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    active
                      ? 'bg-sky-500 text-slate-950'
                      : 'bg-slate-800/80 text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium truncate">
                    {copy.settingsLabels[key]}
                  </div>
                  <div
                    className={`text-[11px] font-mono-tabular ${
                      active ? 'text-sky-300' : 'text-slate-500'
                    }`}
                  >
                    {active ? 'ON' : 'OFF'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Brightness & Volume Levels */}
      <section className="p-4 rounded-2xl bg-[#111824] border border-slate-800/90 space-y-4">
        <SliderRow
          icon={Sun}
          label={copy.levels.brightness}
          value={device.brightness}
          onChange={(v) => onChangeLevel('brightness', v)}
        />
        <SliderRow
          icon={Volume2}
          label={copy.levels.mediaVolume}
          value={device.mediaVolume}
          onChange={(v) => onChangeLevel('mediaVolume', v)}
        />
        <SliderRow
          icon={Bell}
          label={copy.levels.ringVolume}
          value={device.ringVolume}
          onChange={(v) => onChangeLevel('ringVolume', v)}
        />
      </section>

      {/* Smart Modes / Routines */}
      <section>
        <h3 className="text-sm font-semibold text-slate-200 mb-3">
          {copy.routinesTitle}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
          {routineIds.map((rid) => {
            const Icon = ROUTINE_ICONS[rid];
            const isActive = device.activeRoutine === rid;
            return (
              <button
                key={rid}
                type="button"
                onClick={() => onRunRoutine(rid)}
                className={`min-h-[52px] px-3.5 py-2.5 rounded-2xl border flex items-center justify-between gap-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                  isActive
                    ? 'bg-sky-500/15 border-sky-400/50 text-slate-100'
                    : 'bg-[#111824] border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive
                        ? 'bg-sky-500 text-slate-950'
                        : 'bg-slate-800/80 text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">
                      {copy.routines[rid].name}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {copy.routines[rid].desc}
                    </div>
                  </div>
                </div>
                <span
                  className={`text-[11px] font-medium shrink-0 ${
                    isActive ? 'text-sky-300' : 'text-slate-500'
                  }`}
                >
                  {isActive ? 'Active' : 'Apply'}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Apps & Tools Launcher */}
      <section>
        <h3 className="text-sm font-semibold text-slate-200 mb-3">
          {copy.appsTitle}
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {appLaunchers.map((app) => {
            const Icon = app.icon;
            return (
              <button
                key={app.id}
                type="button"
                onClick={app.action}
                className="min-h-[68px] p-2 rounded-2xl bg-[#111824] border border-slate-800 hover:border-slate-700 hover:bg-[#161F2E] flex flex-col items-center justify-center gap-1.5 text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              >
                <Icon className="w-5 h-5 text-sky-400" />
                <span className="text-[11px] font-medium truncate max-w-full">
                  {app.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {localModal === 'calculator' && (
        <CalculatorModal onClose={() => setLocalModal(null)} />
      )}
      {localModal === 'camera' && (
        <CameraModal onClose={() => setLocalModal(null)} />
      )}
      {localModal === 'dialer' && (
        <PhoneDialerModal onClose={() => setLocalModal(null)} />
      )}
    </div>
  );
}

function SliderRow({
  icon: Icon,
  label,
  value,
  onChange,
}: {
  icon: typeof Sun;
  label: string;
  value: number;
  onChange: (val: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-2 text-slate-300 font-medium">
          <Icon className="w-4 h-4 text-sky-400" />
          {label}
        </span>
        <span className="font-mono-tabular text-slate-300">{value}%</span>
      </div>
      <input
        type="range"
        min={5}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
      />
    </div>
  );
}

export function CalculatorModal({ onClose }: { onClose: () => void }) {
  const [expr, setExpr] = useState('0');

  const append = (ch: string) => {
    setExpr((prev) => (prev === '0' && ch !== '.' ? ch : prev + ch));
  };

  const evaluate = () => {
    try {
      const sanitized = expr.replace(/[^0-9+\-*/().%]/g, '');
      if (!sanitized) return;
      const result = Function(`"use strict"; return (${sanitized})`)();
      if (typeof result === 'number' && Number.isFinite(result)) {
        setExpr(String(Number(result.toFixed(6))));
      } else {
        setExpr('Error');
      }
    } catch {
      setExpr('Error');
    }
  };

  const keys = [
    'C', '(', ')', '/',
    '7', '8', '9', '*',
    '4', '5', '6', '-',
    '1', '2', '3', '+',
    '0', '.', 'DEL', '=',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-xs rounded-3xl bg-[#111824] border border-slate-700 p-4 space-y-3 shadow-2xl">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-200">Calculator</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close calculator"
            className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-300 hover:bg-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-3 rounded-2xl bg-[#090D14] border border-slate-800 text-right font-mono-tabular text-2xl text-slate-100 overflow-x-auto">
          {expr}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {keys.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                if (k === 'C') setExpr('0');
                else if (k === 'DEL')
                  setExpr((p) => (p.length > 1 ? p.slice(0, -1) : '0'));
                else if (k === '=') evaluate();
                else append(k);
              }}
              className={`min-h-[46px] rounded-xl font-mono-tabular text-sm font-semibold flex items-center justify-center transition-colors ${
                k === '='
                  ? 'bg-sky-500 text-slate-950 hover:bg-sky-400'
                  : ['/', '*', '-', '+'].includes(k)
                    ? 'bg-slate-800 text-sky-300 hover:bg-slate-700'
                    : 'bg-slate-900 text-slate-200 border border-slate-800 hover:bg-slate-800'
              }`}
            >
              {k === 'DEL' ? <Delete className="w-4 h-4" /> : k}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CameraModal({ onClose }: { onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<string | null>(null);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        activeStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => {
        setError('Camera access denied or unavailable on this device.');
      });

    return () => {
      activeStream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      setSnapshot(canvas.toDataURL('image/jpeg', 0.9));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-[#111824] border border-slate-700 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-200">Camera</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close camera"
            className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error ? (
          <div className="p-6 rounded-2xl bg-[#090D14] text-sm text-slate-300 text-center">
            {error}
          </div>
        ) : snapshot ? (
          <div className="space-y-3">
            <img
              src={snapshot}
              alt="Captured photo"
              className="w-full rounded-2xl object-cover max-h-72"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSnapshot(null)}
                className="flex-1 min-h-[44px] rounded-xl bg-slate-800 text-slate-200 text-sm font-medium"
              >
                Retake
              </button>
              <a
                href={snapshot}
                download={`jarvis-photo-${Date.now()}.jpg`}
                className="flex-1 min-h-[44px] rounded-xl bg-sky-500 text-slate-950 text-sm font-semibold flex items-center justify-center"
              >
                Download
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full rounded-2xl bg-black max-h-72 object-cover"
            />
            <button
              type="button"
              onClick={capturePhoto}
              className="w-full min-h-[48px] rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-sm font-semibold"
            >
              Capture Photo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function PhoneDialerModal({ onClose }: { onClose: () => void }) {
  const [digits, setDigits] = useState('');
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-xs rounded-3xl bg-[#111824] border border-slate-700 p-4 space-y-3 shadow-2xl">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-200">Phone Dialer</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialer"
            className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-300 hover:bg-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="min-h-[52px] px-3 py-2 rounded-2xl bg-[#090D14] border border-slate-800 flex items-center justify-between gap-2">
          <input
            type="tel"
            value={digits}
            onChange={(e) => setDigits(e.target.value)}
            placeholder="+880..."
            className="w-full bg-transparent text-xl font-mono-tabular text-slate-100 focus:outline-none"
          />
          {digits && (
            <button
              type="button"
              onClick={() => setDigits((d) => d.slice(0, -1))}
              aria-label="Backspace"
              className="w-9 h-9 rounded-lg text-slate-400 hover:text-slate-200 flex items-center justify-center shrink-0"
            >
              <Delete className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {keys.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setDigits((d) => d + k)}
              className="min-h-[48px] rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 font-mono-tabular text-lg font-semibold text-slate-100"
            >
              {k}
            </button>
          ))}
        </div>

        <a
          href={digits ? `tel:${digits}` : undefined}
          onClick={(e) => {
            if (!digits) e.preventDefault();
          }}
          className={`w-full min-h-[48px] rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
            digits
              ? 'bg-sky-500 hover:bg-sky-400 text-slate-950'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>Call</span>
        </a>
      </div>
    </div>
  );
}

