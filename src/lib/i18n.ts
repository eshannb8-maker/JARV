import type { JarvisLanguage, RoutineId, SettingKey } from '../types/jarvis';

export interface CopyBundle {
  brand: string;
  nav: {
    assistant: string;
    controls: string;
    utilities: string;
    contacts: string;
    settings: string;
  };
  newSession: string;
  listening: string;
  processing: string;
  speaking: string;
  tapToSpeak: string;
  tapToStop: string;
  inputPlaceholder: string;
  send: string;
  voiceMuted: string;
  voiceActive: string;
  quickPromptsTitle: string;
  quickPrompts: string[];
  settingsLabels: Record<SettingKey, string>;
  levels: {
    brightness: string;
    mediaVolume: string;
    ringVolume: string;
  };
  routinesTitle: string;
  routines: Record<RoutineId, { name: string; desc: string }>;
  appsTitle: string;
  timersTitle: string;
  notesTitle: string;
  contactsTitle: string;
  addTimer: string;
  addNote: string;
  addContact: string;
  callNow: string;
  whatsapp: string;
  openLink: string;
  battery: string;
  charging: string;
  welcomeMessage: string;
  micPermissionError: string;
  noSpeechFallback: string;
  recordingFallbackHint: string;
  languageLabel: string;
  voiceModelLabel: string;
  autoSpeakLabel: string;
  autoSpeakDesc: string;
  continuousModeLabel: string;
  continuousModeDesc: string;
  mobileBridgeNote: string;
}

export const COPY: Record<JarvisLanguage, CopyBundle> = {
  bn: {
    brand: 'JARVIS',
    nav: {
      assistant: 'ভয়েস হাব',
      controls: 'কন্ট্রোল',
      utilities: 'টাইমার ও নোট',
      contacts: 'কন্টাক্টস',
      settings: 'সেটিংস',
    },
    newSession: 'নতুন চ্যাট',
    listening: 'শুনছি... কথা বলুন',
    processing: 'কমান্ড প্রসেস হচ্ছে...',
    speaking: 'জার্ভিস বলছে...',
    tapToSpeak: 'কথা বলতে ট্যাপ করুন',
    tapToStop: 'থামাতে ট্যাপ করুন',
    inputPlaceholder: 'যেকোনো নির্দেশ লিখুন বা মাইকে বলুন...',
    send: 'পাঠান',
    voiceMuted: 'ভয়েস বন্ধ',
    voiceActive: 'ভয়েস চালু',
    quickPromptsTitle: 'দ্রুত কমান্ড',
    quickPrompts: [
      'ফ্ল্যাশলাইট অন করো এবং ব্রাইটনেস ৮০% দাও',
      'আব্বুকে কল দাও',
      '৫ মিনিটের একটি টাইমার সেট করো',
      'ইউটিউবে বাংলা গান সার্চ করো',
      'ফোন স্লিপ মোডে দাও',
      'আজ ঢাকার আবহাওয়া কেমন?',
    ],
    settingsLabels: {
      wifi: 'ওয়াই-ফাই',
      mobileData: 'মোবাইল ডেটা',
      bluetooth: 'ব্লুটুথ',
      flashlight: 'ফ্ল্যাশলাইট',
      dnd: 'ডু নট ডিস্টার্ব',
      airplaneMode: 'এয়ারপ্লেন মোড',
      location: 'লোকেশন',
      autoRotate: 'অটো-রোটেট',
      hotspot: 'হটস্পট',
      wakeLock: 'স্ক্রিন অন রাখো',
    },
    levels: {
      brightness: 'স্ক্রিন ব্রাইটনেস',
      mediaVolume: 'মিডিয়া ভলিউম',
      ringVolume: 'রিংটোন ভলিউম',
    },
    routinesTitle: 'স্মার্ট মোড',
    routines: {
      morning: { name: 'গুড মর্নিং', desc: 'ওয়াই-ফাই অন, ব্রাইটনেস ৮০%' },
      driving: { name: 'ড্রাইভিং মোড', desc: 'ব্লুটুথ ও ডেটা অন, ভলিউম ৯০%' },
      sleep: { name: 'স্লিপ মোড', desc: 'ডিএনডি অন, ব্রাইটনেস ১৫%' },
      focus: { name: 'ফোকাস মোড', desc: 'ডিএনডি অন, ২৫ মিনিট টাইমার' },
      battery_saver: { name: 'ব্যাটারি সেভার', desc: 'ব্রাইটনেস ২৫%, ব্লুটুথ অফ' },
    },
    appsTitle: 'অ্যাপ ও টুলস',
    timersTitle: 'টাইমার ও অ্যালার্ম',
    notesTitle: 'নোট ও রিমাইন্ডার',
    contactsTitle: 'সেভ করা কন্টাক্টস',
    addTimer: 'টাইমার যোগ করুন',
    addNote: 'নোট লিখুন...',
    addContact: 'নতুন কন্টাক্ট যোগ করুন',
    callNow: 'কল করুন',
    whatsapp: 'হোয়াটসঅ্যাপ',
    openLink: 'চালু করুন',
    battery: 'ব্যাটারি',
    charging: 'চার্জিং',
    welcomeMessage:
      'আসসালামু আলাইকুম স্যার। আমি জার্ভিস। ইউটিউব বা ওয়েবসাইট খোলা, টাইমার, নোট, সেটিংস কিংবা যেকোনো প্রশ্নের জন্য আমাকে বাংলায় বা ইংরেজিতে বলুন।',
    micPermissionError:
      'মাইক্রোফোন ব্যবহারের অনুমতি পাওয়া যায়নি। ব্রাউজারের অ্যাড্রেস বার থেকে মাইক অনুমতি দিন অথবা নিচে টাইপ করুন।',
    noSpeechFallback: 'কণ্ঠস্বর স্পষ্ট শোনা যায়নি। অনুগ্রহ করে আবার বলুন।',
    recordingFallbackHint: 'অডিও রেকর্ড হচ্ছে — কথা বলা শেষে স্টপ বাটনে ক্লিক করুন।',
    languageLabel: 'অ্যাপের ভাষা',
    voiceModelLabel: 'জার্ভিসের কণ্ঠস্বর',
    autoSpeakLabel: 'উত্তর মুখে পড়ে শোনাবে',
    autoSpeakDesc: 'প্রতিটি নির্দেশের পর জার্ভিস ভয়েসে উত্তর দেবে',
    continuousModeLabel: 'উত্তর শেষে আবার শুনবে',
    continuousModeDesc: 'হ্যান্ডস-ফ্রি কথোপকথনের জন্য অটো-লিসেন চালু থাকবে',
    mobileBridgeNote:
      'ইউটিউব, গুগল, ম্যাপস, হোয়াটসঅ্যাপ, কল, এসএমএস, ক্যামেরা, ব্যাটারি ও স্ক্রিন ওয়েক-লক সরাসরি ব্রাউজার থেকে কাজ করে। সিস্টেম-লেভেল ওয়াই-ফাই বা ব্লুটুথ ব্রাউজার নিরাপত্তার কারণে কন্ট্রোল প্যানেল থেকে নিয়ন্ত্রিত হয়।',
  },
  en: {
    brand: 'JARVIS',
    nav: {
      assistant: 'Voice Hub',
      controls: 'Controls',
      utilities: 'Timers & Notes',
      contacts: 'Contacts',
      settings: 'Settings',
    },
    newSession: 'New Chat',
    listening: 'Listening... speak now',
    processing: 'Processing command...',
    speaking: 'JARVIS speaking...',
    tapToSpeak: 'Tap to speak',
    tapToStop: 'Tap to stop',
    inputPlaceholder: 'Type any command or speak into the mic...',
    send: 'Send',
    voiceMuted: 'Voice Muted',
    voiceActive: 'Voice On',
    quickPromptsTitle: 'Quick Commands',
    quickPrompts: [
      'Turn on flashlight and set brightness to 80%',
      'Call Mom',
      'Set a 5 minute timer for tea',
      'Search YouTube for lo-fi focus music',
      'Activate sleep mode',
      'What is the weather in Dhaka today?',
    ],
    settingsLabels: {
      wifi: 'Wi-Fi',
      mobileData: 'Mobile Data',
      bluetooth: 'Bluetooth',
      flashlight: 'Flashlight',
      dnd: 'Do Not Disturb',
      airplaneMode: 'Airplane Mode',
      location: 'Location',
      autoRotate: 'Auto-Rotate',
      hotspot: 'Hotspot',
      wakeLock: 'Keep Screen On',
    },
    levels: {
      brightness: 'Screen Brightness',
      mediaVolume: 'Media Volume',
      ringVolume: 'Ringtone Volume',
    },
    routinesTitle: 'Smart Modes',
    routines: {
      morning: { name: 'Good Morning', desc: 'Wi-Fi on, Brightness 80%' },
      driving: { name: 'Driving Mode', desc: 'Bluetooth & Data on, Vol 90%' },
      sleep: { name: 'Sleep Mode', desc: 'DND on, Brightness 15%' },
      focus: { name: 'Focus Mode', desc: 'DND on, 25m focus timer' },
      battery_saver: { name: 'Battery Saver', desc: 'Brightness 25%, Bluetooth off' },
    },
    appsTitle: 'Apps & Utilities',
    timersTitle: 'Timers & Alarms',
    notesTitle: 'Notes & Reminders',
    contactsTitle: 'Contacts Directory',
    addTimer: 'Add Timer',
    addNote: 'Write a quick note...',
    addContact: 'Add New Contact',
    callNow: 'Call Now',
    whatsapp: 'WhatsApp',
    openLink: 'Launch',
    battery: 'Battery',
    charging: 'Charging',
    welcomeMessage:
      'Good day, sir. I am JARVIS. Speak or type any instruction in Bengali or English to open apps, search the web, manage timers, notes, calls, or ask anything.',
    micPermissionError:
      'Microphone permission was denied. Please allow microphone access in your browser address bar or type below.',
    noSpeechFallback: 'Could not catch that clearly. Please speak again.',
    recordingFallbackHint: 'Recording audio — click the Stop button when you finish speaking.',
    languageLabel: 'Interface Language',
    voiceModelLabel: 'JARVIS Voice Persona',
    autoSpeakLabel: 'Spoken Voice Replies',
    autoSpeakDesc: 'JARVIS reads every response aloud automatically',
    continuousModeLabel: 'Hands-Free Follow-Up',
    continuousModeDesc: 'Automatically resume listening after JARVIS finishes speaking',
    mobileBridgeNote:
      'YouTube, Google, Maps, WhatsApp, Calls, SMS, Camera, Battery status, and Screen Wake Lock work directly from your browser. OS-level radios (Wi-Fi/Bluetooth) are managed in your Command Hub due to browser sandboxing.',
  },
};
