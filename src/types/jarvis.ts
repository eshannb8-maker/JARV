export type JarvisLanguage = 'bn' | 'en';

export type SettingKey =
  | 'wifi'
  | 'mobileData'
  | 'bluetooth'
  | 'flashlight'
  | 'dnd'
  | 'airplaneMode'
  | 'location'
  | 'autoRotate'
  | 'hotspot'
  | 'wakeLock';

export type LevelKey = 'brightness' | 'mediaVolume' | 'ringVolume';

export type RoutineId = 'morning' | 'driving' | 'sleep' | 'focus' | 'battery_saver';

export interface DeviceState {
  wifi: boolean;
  mobileData: boolean;
  bluetooth: boolean;
  flashlight: boolean;
  dnd: boolean;
  airplaneMode: boolean;
  location: boolean;
  autoRotate: boolean;
  hotspot: boolean;
  wakeLock: boolean;
  brightness: number;
  mediaVolume: number;
  ringVolume: number;
  batteryLevel: number;
  batteryCharging: boolean;
  torchSupported: boolean;
  activeRoutine: RoutineId | null;
}

export interface ContactItem {
  id: string;
  name: string;
  relation?: string;
  phone: string;
  email?: string;
}

export interface TimerItem {
  id: string;
  label: string;
  totalSeconds: number;
  remainingSeconds: number;
  running: boolean;
  completed: boolean;
  createdAt: number;
}

export interface NoteItem {
  id: string;
  text: string;
  reminderTime?: string;
  done: boolean;
  createdAt: number;
}

export type JarvisActionType =
  | 'toggle_setting'
  | 'adjust_level'
  | 'phone_call'
  | 'send_message'
  | 'open_app'
  | 'set_timer'
  | 'manage_note'
  | 'run_routine'
  | 'hardware_action'
  | 'add_contact';

export interface ExecutedAction {
  id: string;
  type: JarvisActionType;
  title: string;
  detail: string;
  payload: Record<string, unknown>;
  launchUrl?: string;
  status: 'executed' | 'ready' | 'info';
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ChatTurn {
  id: string;
  role: 'user' | 'jarvis';
  text: string;
  timestamp: number;
  actions?: ExecutedAction[];
  sources?: GroundingSource[];
  error?: boolean;
}

export interface JarvisCommandResponse {
  reply: string;
  actions: ExecutedAction[];
  sources: GroundingSource[];
}
