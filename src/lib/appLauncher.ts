export interface AppLaunchSpec {
  id: string;
  label: string;
  androidPackage?: string;
  iosScheme?: string;
  webUrl: string;
  internalModal?: 'camera' | 'calculator' | 'dialer';
  internalTab?: 'controls' | 'utilities' | 'contacts' | 'settings';
}

const APP_CATALOG: Record<string, AppLaunchSpec> = {
  youtube: {
    id: 'youtube',
    label: 'YouTube',
    androidPackage: 'com.google.android.youtube',
    iosScheme: 'youtube://',
    webUrl: 'https://www.youtube.com',
  },
  maps: {
    id: 'maps',
    label: 'Google Maps',
    androidPackage: 'com.google.android.apps.maps',
    iosScheme: 'comgooglemaps://',
    webUrl: 'https://www.google.com/maps',
  },
  whatsapp: {
    id: 'whatsapp',
    label: 'WhatsApp',
    androidPackage: 'com.whatsapp',
    iosScheme: 'whatsapp://',
    webUrl: 'https://web.whatsapp.com',
  },
  facebook: {
    id: 'facebook',
    label: 'Facebook',
    androidPackage: 'com.facebook.katana',
    iosScheme: 'fb://',
    webUrl: 'https://www.facebook.com',
  },
  messenger: {
    id: 'messenger',
    label: 'Messenger',
    androidPackage: 'com.facebook.orca',
    iosScheme: 'fb-messenger://',
    webUrl: 'https://www.messenger.com',
  },
  instagram: {
    id: 'instagram',
    label: 'Instagram',
    androidPackage: 'com.instagram.android',
    iosScheme: 'instagram://',
    webUrl: 'https://www.instagram.com',
  },
  tiktok: {
    id: 'tiktok',
    label: 'TikTok',
    androidPackage: 'com.zhiliaoapp.musically',
    iosScheme: 'snssdk1233://',
    webUrl: 'https://www.tiktok.com',
  },
  telegram: {
    id: 'telegram',
    label: 'Telegram',
    androidPackage: 'org.telegram.messenger',
    iosScheme: 'tg://',
    webUrl: 'https://web.telegram.org',
  },
  spotify: {
    id: 'spotify',
    label: 'Spotify',
    androidPackage: 'com.spotify.music',
    iosScheme: 'spotify://',
    webUrl: 'https://open.spotify.com',
  },
  gmail: {
    id: 'gmail',
    label: 'Gmail',
    androidPackage: 'com.google.android.gm',
    iosScheme: 'googlegmail://',
    webUrl: 'https://mail.google.com',
  },
  playstore: {
    id: 'playstore',
    label: 'Play Store',
    androidPackage: 'com.android.vending',
    webUrl: 'https://play.google.com/store',
  },
  bkash: {
    id: 'bkash',
    label: 'bKash',
    androidPackage: 'com.bKash.customerapp',
    iosScheme: 'bkash://',
    webUrl: 'https://www.bkash.com',
  },
  nagad: {
    id: 'nagad',
    label: 'Nagad',
    androidPackage: 'com.konasl.nagad',
    webUrl: 'https://nagad.com.bd',
  },
  daraz: {
    id: 'daraz',
    label: 'Daraz',
    androidPackage: 'com.daraz.android',
    iosScheme: 'daraz://',
    webUrl: 'https://www.daraz.com.bd',
  },
  netflix: {
    id: 'netflix',
    label: 'Netflix',
    androidPackage: 'com.netflix.mediaclient',
    iosScheme: 'nflx://',
    webUrl: 'https://www.netflix.com',
  },
  zoom: {
    id: 'zoom',
    label: 'Zoom',
    androidPackage: 'us.zoom.videomeetings',
    iosScheme: 'zoomus://',
    webUrl: 'https://zoom.us',
  },
  meet: {
    id: 'meet',
    label: 'Google Meet',
    androidPackage: 'com.google.android.apps.meetings',
    webUrl: 'https://meet.google.com',
  },
  x: {
    id: 'x',
    label: 'X',
    androidPackage: 'com.twitter.android',
    iosScheme: 'twitter://',
    webUrl: 'https://x.com',
  },
  linkedin: {
    id: 'linkedin',
    label: 'LinkedIn',
    androidPackage: 'com.linkedin.android',
    iosScheme: 'linkedin://',
    webUrl: 'https://www.linkedin.com',
  },
  calendar: {
    id: 'calendar',
    label: 'Calendar',
    androidPackage: 'com.google.android.calendar',
    iosScheme: 'calshow://',
    webUrl: 'https://calendar.google.com',
  },
  google: {
    id: 'google',
    label: 'Google',
    androidPackage: 'com.google.android.googlequicksearchbox',
    iosScheme: 'google://',
    webUrl: 'https://www.google.com',
  },
  camera: {
    id: 'camera',
    label: 'Camera',
    webUrl: '',
    internalModal: 'camera',
  },
  calculator: {
    id: 'calculator',
    label: 'Calculator',
    webUrl: '',
    internalModal: 'calculator',
  },
  phone: {
    id: 'phone',
    label: 'Phone',
    webUrl: '',
    internalModal: 'dialer',
  },
  contacts: {
    id: 'contacts',
    label: 'Contacts',
    webUrl: '',
    internalTab: 'contacts',
  },
  settings: {
    id: 'settings',
    label: 'Settings',
    webUrl: '',
    internalTab: 'controls',
  },
  clock: {
    id: 'clock',
    label: 'Clock & Timers',
    webUrl: '',
    internalTab: 'utilities',
  },
  notes: {
    id: 'notes',
    label: 'Notes',
    webUrl: '',
    internalTab: 'utilities',
  },
};

function normalizeAppKey(raw: string): string {
  const s = raw.normalize('NFC').trim().toLowerCase();
  if (s.includes('youtube') || s.includes('ইউটিউব') || s.includes('ইউ টিউব') || s.includes('ইয়ুটিউব')) return 'youtube';
  if (s.includes('map') || s.includes('ম্যাপ')) return 'maps';
  if (s.includes('whatsapp') || s.includes('হোয়াটসঅ্যাপ') || s.includes('হোয়াটস অ্যাপ') || s.includes('ওয়াটসঅ্যাপ')) return 'whatsapp';
  if (s.includes('messenger') || s.includes('মেসেঞ্জার') || s.includes('ম্যাসেঞ্জার')) return 'messenger';
  if (s.includes('facebook') || s.includes('ফেসবুক') || s.includes('ফেস বুক') || s === 'fb' || s === 'এফবি') return 'facebook';
  if (s.includes('instagram') || s.includes('ইনস্টাগ্রাম') || s.includes('ইন্সটাগ্রাম') || s === 'insta') return 'instagram';
  if (s.includes('tiktok') || s.includes('টিকটক') || s.includes('টিক টক')) return 'tiktok';
  if (s.includes('telegram') || s.includes('টেলিগ্রাম')) return 'telegram';
  if (s.includes('spotify') || s.includes('স্পটিফাই') || s.includes('music')) return 'spotify';
  if (s.includes('gmail') || s.includes('email') || s.includes('ইমেইল') || s.includes('জিমেইল')) return 'gmail';
  if (s.includes('play') || s.includes('প্লে স্টোর') || s.includes('প্লেস্টোর')) return 'playstore';
  if (s.includes('bkash') || s.includes('বিকাশ')) return 'bkash';
  if (s.includes('nagad') || s.includes('নগদ')) return 'nagad';
  if (s.includes('daraz') || s.includes('দারাজ')) return 'daraz';
  if (s.includes('netflix') || s.includes('নেটফ্লিক্স')) return 'netflix';
  if (s.includes('zoom') || s.includes('জুম')) return 'zoom';
  if (s.includes('meet') || s.includes('মিট')) return 'meet';
  if (s === 'x' || s.includes('twitter') || s.includes('টুইটার')) return 'x';
  if (s.includes('linkedin')) return 'linkedin';
  if (s.includes('calendar') || s.includes('ক্যালেন্ডার')) return 'calendar';
  if (s.includes('camera') || s.includes('ক্যামেরা')) return 'camera';
  if (s.includes('calc') || s.includes('ক্যালকুলেটর')) return 'calculator';
  if (s.includes('phone') || s.includes('dial') || s.includes('ফোন') || s.includes('ডায়াল')) return 'phone';
  if (s.includes('contact') || s.includes('কন্টাক্ট')) return 'contacts';
  if (s.includes('setting') || s.includes('সেটিংস') || s.includes('কন্ট্রোল')) return 'settings';
  if (s.includes('clock') || s.includes('alarm') || s.includes('timer') || s.includes('ঘড়ি') || s.includes('টাইমার')) return 'clock';
  if (s.includes('note') || s.includes('reminder') || s.includes('নোট')) return 'notes';
  if (s.includes('google') || s.includes('chrome') || s.includes('browser') || s.includes('গুগল') || s.includes('গুগুল') || s.includes('ক্রোম') || s.includes('ব্রাউজার')) return 'google';
  return s;
}

export function resolveAppSpec(appName: string, query?: string): {
  spec: AppLaunchSpec;
  resolvedWebUrl: string;
} {
  const key = normalizeAppKey(appName);
  const spec: AppLaunchSpec = APP_CATALOG[key] ?? {
    id: key,
    label: appName,
    webUrl: query
      ? `https://www.google.com/search?q=${encodeURIComponent(`${appName} ${query}`)}`
      : `https://www.google.com/search?q=${encodeURIComponent(appName)}`,
  };

  const q = query?.trim() ?? '';
  const enc = encodeURIComponent(q);

  let resolvedWebUrl = spec.webUrl;
  if (q && spec.id === 'youtube') {
    resolvedWebUrl = `https://www.youtube.com/results?search_query=${enc}`;
  } else if (q && spec.id === 'maps') {
    resolvedWebUrl = `https://www.google.com/maps/search/?api=1&query=${enc}`;
  } else if (q && spec.id === 'whatsapp') {
    resolvedWebUrl = `https://wa.me/?text=${enc}`;
  } else if (q && spec.id === 'spotify') {
    resolvedWebUrl = `https://open.spotify.com/search/${enc}`;
  } else if (q && spec.id === 'google') {
    resolvedWebUrl =
      q.startsWith('http://') || q.startsWith('https://')
        ? q
        : `https://www.google.com/search?q=${enc}`;
  } else if (q && spec.id === 'playstore') {
    resolvedWebUrl = `https://play.google.com/store/search?q=${enc}&c=apps`;
  } else if (q && spec.id === 'facebook') {
    resolvedWebUrl = `https://www.facebook.com/search/top?q=${enc}`;
  } else if (q && spec.id === 'daraz') {
    resolvedWebUrl = `https://www.daraz.com.bd/catalog/?q=${enc}`;
  }

  return { spec, resolvedWebUrl };
}

/**
 * Opens an external URL in a new browser tab without using window.open.
 * Returns false if browser transient user activation was inactive (meaning
 * the browser's popup blocker may suppress the tab unless popups are allowed).
 */
export function openInNewTab(url: string): boolean {
  if (!url) return true;
  const userActivation = (
    navigator as unknown as { userActivation?: { isActive?: boolean } }
  ).userActivation;
  const hasActivation = userActivation ? Boolean(userActivation.isActive) : true;

  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return hasActivation;
}

export function launchUriScheme(uri: string): void {
  if (!uri) return;
  const isNativeScheme =
    uri.startsWith('tel:') ||
    uri.startsWith('sms:') ||
    uri.startsWith('mailto:') ||
    uri.startsWith('whatsapp:');

  if (isNativeScheme) {
    window.location.assign(uri);
    return;
  }

  openInNewTab(uri);
}

const SYNC_APP_PATTERNS: Array<{ appId: string; regex: RegExp; locativeRegex?: RegExp }> = [
  {
    appId: 'youtube',
    regex: /\b(youtube|yt)\b|ইউ\s*টিউব[ে]?|ইয়ু\s*টিউব[ে]?/i,
    locativeRegex: /ইউ\s*টিউবে|ইয়ু\s*টিউবে|\b(?:on|in)\s+(?:youtube|yt)\b/i,
  },
  {
    appId: 'maps',
    regex: /\b(google\s*maps|maps)\b|গুগল\s*ম্যাপস?[ে]?|ম্যাপ[সে]?/i,
    locativeRegex: /ম্যাপে|ম্যাপসে|\b(?:on|in)\s+(?:google\s*maps|maps)\b/i,
  },
  {
    appId: 'facebook',
    regex: /\b(facebook|fb)\b|ফেস\s*বুক[ে]?|এফবি/i,
    locativeRegex: /ফেস\s*বুকে|\b(?:on|in)\s+(?:facebook|fb)\b/i,
  },
  {
    appId: 'messenger',
    regex: /\bmessenger\b|মেসেঞ্জার[ে]?|ম্যাসেঞ্জার[ে]?/i,
  },
  {
    appId: 'whatsapp',
    regex: /\bwhatsapp\b|হোয়াটস\s*অ্যাপ[ে]?|ওয়াটস\s*অ্যাপ[ে]?/i,
  },
  {
    appId: 'instagram',
    regex: /\b(instagram|insta)\b|ইনস্টাগ্রাম[ে]?|ইন্সটাগ্রাম[ে]?/i,
  },
  {
    appId: 'tiktok',
    regex: /\btiktok\b|টিক\s*টক[ে]?/i,
  },
  {
    appId: 'telegram',
    regex: /\btelegram\b|টেলিগ্রাম[ে]?/i,
  },
  {
    appId: 'spotify',
    regex: /\bspotify\b|স্পটিফাই(?:তে|য়ে|য়)?/i,
    locativeRegex: /স্পটিফাই(?:তে|য়ে)|\b(?:on|in)\s+spotify\b/i,
  },
  {
    appId: 'gmail',
    regex: /\bgmail\b|জিমেইল[ে]?/i,
  },
  {
    appId: 'playstore',
    regex: /\bplay\s*store\b|প্লে\s*স্টোর[ে]?/i,
    locativeRegex: /প্লে\s*স্টোরে/i,
  },
  {
    appId: 'daraz',
    regex: /\bdaraz\b|দারাজ[ে]?/i,
    locativeRegex: /দারাজে/i,
  },
  {
    appId: 'netflix',
    regex: /\bnetflix\b|নেটফ্লিক্স[ে]?/i,
  },
  {
    appId: 'bkash',
    regex: /\bbkash\b|বিকাশ/i,
  },
  {
    appId: 'nagad',
    regex: /\bnagad\b|নগদ/i,
  },
  {
    appId: 'zoom',
    regex: /\bzoom\b|জুম/i,
  },
  {
    appId: 'meet',
    regex: /\b(?:google\s*)?meet\b|গুগল\s*মিট/i,
  },
  {
    appId: 'google',
    regex: /\b(google|chrome|browser)\b|গুগল[ে]?|গুগুল[ে]?|ক্রোম[ে]?|ব্রাউজার[ে]?/i,
    locativeRegex: /গুগলে|গুগুলে|ক্রোমে|ব্রাউজারে|\b(?:on|in)\s+google\b/i,
  },
];

const ACTION_VERBS_REGEX =
  /\b(open|launch|search|play|show|find|go|watch|listen|browse|visit|kholo|koro|dao|chalo|chalao)\b|খোলো|খুলো|খুলুন|খুলে\s*দাও|খুলে\s*দে|খুলতে|চালু|চালাও|চালিয়ে\s*দাও|ওপেন|সার্চ|খোঁজ|খুঁজে|দেখাও|দেখবো|শোনাও|শুনবো|শুনতে|ছাড়ো|লাগাও|আনো|বের\s*করো|নিয়ে\s*যাও|দাও|যাও/i;

const QUESTION_BLOCK_REGEX =
  /\b(who|when|history|invented|founder|owner|why|how\s+many|income|earn)\b|কবে|কত\s*সালে|কে\s*আবিষ্কার|ইতিহাস|মালিক\s*কে|টাকা\s*আয়|কীভাবে\s*খোলে|কিভাবে\s*কাজ/i;

const STRIP_WORDS_REGEX =
  /\b(?:open|launch|search|for|on|in|to|play|show|find|go|watch|listen|browse|visit|kholo|koro|dao|chalo|chalao|youtube|yt|google\s*maps|maps|google|chrome|browser|facebook|fb|messenger|whatsapp|instagram|insta|tiktok|telegram|spotify|gmail|play\s*store|daraz|netflix|bkash|nagad|zoom|meet|please|jarvis|app|website)\b|ইউ\s*টিউব[ে]?|ইয়ু\s*টিউব[ে]?|গুগল\s*ম্যাপস?[ে]?|ম্যাপ[সে]?|গুগল[ে]?|গুগুল[ে]?|ক্রোম[ে]?|ব্রাউজার[ে]?|ফেস\s*বুক[ে]?|এফবি|মেসেঞ্জার[ে]?|ম্যাসেঞ্জার[ে]?|হোয়াটস\s*অ্যাপ[ে]?|ওয়াটস\s*অ্যাপ[ে]?|ইনস্টাগ্রাম[ে]?|ইন্সটাগ্রাম[ে]?|টিক\s*টক[ে]?|টেলিগ্রাম[ে]?|স্পটিফাই(?:তে|য়ে|য়)?|জিমেইল[ে]?|প্লে\s*স্টোর[ে]?|দারাজ[ে]?|নেটফ্লিক্স[ে]?|বিকাশ|নগদ|জুম|গুগল\s*মিট|খুলে\s*দাও|খুলে\s*দে|চালু\s*করো|চালিয়ে\s*দাও|ওপেন\s*করো|সার্চ\s*করো|খুঁজে\s*দাও|বের\s*করো|নিয়ে\s*যাও|করে\s*দাও|খোলো|খুলো|খুলুন|খুলতে|চালু|চালাও|ওপেন|সার্চ|খোঁজো|খোঁজ|দেখাও|দেখবো|শোনাও|শুনবো|শুনতে|ছাড়ো|লাগাও|আনো|দাও|যাও|জার্ভিস|অ্যাপ|ওয়েবসাইট|(?:^|\s)(?:এ|তে|থেকে|দিয়ে|নিয়ে|গিয়ে|এখন|করো|এবং|আমাকে|একটা|একটি)(?=\s|$)/gi;

const DOMAIN_REGEX = /\b([a-z0-9-]+\.(?:com|org|net|edu|gov|io|ai|bd|com\.bd))\b/i;

export function detectDirectWebAppCommand(text: string): {
  appId: string;
  label: string;
  query?: string;
  url: string;
} | null {
  const trimmed = text.normalize('NFC').trim();
  if (!trimmed || QUESTION_BLOCK_REGEX.test(trimmed)) {
    return null;
  }

  for (const { appId, regex, locativeRegex } of SYNC_APP_PATTERNS) {
    if (regex.test(trimmed)) {
      const hasActionVerb = ACTION_VERBS_REGEX.test(trimmed);
      const hasLocative = locativeRegex ? locativeRegex.test(trimmed) : false;
      const wordCount = trimmed.split(/\s+/).length;
      if (!hasActionVerb && !hasLocative && wordCount > 4) {
        continue;
      }

      const cleanedQuery = trimmed
        .replace(STRIP_WORDS_REGEX, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const { spec, resolvedWebUrl } = resolveAppSpec(
        appId,
        cleanedQuery.length >= 2 ? cleanedQuery : undefined
      );
      if (!resolvedWebUrl) return null;
      return {
        appId,
        label: spec.label,
        query: cleanedQuery.length >= 2 ? cleanedQuery : undefined,
        url: resolvedWebUrl,
      };
    }
  }

  // Direct domain command e.g. "prothomalo.com খোলো" or "open wikipedia.org"
  const domainMatch = trimmed.match(DOMAIN_REGEX);
  if (domainMatch && ACTION_VERBS_REGEX.test(trimmed)) {
    const domain = domainMatch[1].toLowerCase();
    return {
      appId: domain,
      label: domain,
      url: `https://${domain}`,
    };
  }

  return null;
}
