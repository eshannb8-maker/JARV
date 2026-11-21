import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  GoogleGenAI,
  ThinkingLevel,
  Type,
  type Content,
  type FunctionDeclaration,
} from '@google/genai';
import type {
  ContactItem,
  DeviceState,
  ExecutedAction,
  GroundingSource,
  JarvisLanguage,
  NoteItem,
  TimerItem,
} from './src/types/jarvis.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const ttsAi = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  apiVersion: 'v1beta',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const jarvisTools: FunctionDeclaration[] = [
  {
    name: 'toggleDeviceSetting',
    description:
      'Turn ON or OFF a mobile device setting or hardware toggle such as wifi, mobileData, bluetooth, flashlight, dnd (Do Not Disturb), airplaneMode, location, autoRotate, hotspot, or wakeLock (keep screen awake).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        setting: {
          type: Type.STRING,
          description:
            'One of: wifi, mobileData, bluetooth, flashlight, dnd, airplaneMode, location, autoRotate, hotspot, wakeLock',
        },
        enabled: {
          type: Type.BOOLEAN,
          description: 'True to turn ON, false to turn OFF.',
        },
      },
      required: ['setting', 'enabled'],
    },
  },
  {
    name: 'adjustDeviceLevel',
    description:
      'Adjust screen brightness, mediaVolume, or ringVolume to a specific percentage (0 to 100) or relative delta.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        target: {
          type: Type.STRING,
          description: 'One of: brightness, mediaVolume, ringVolume',
        },
        value: {
          type: Type.NUMBER,
          description: 'Target level between 0 and 100.',
        },
      },
      required: ['target', 'value'],
    },
  },
  {
    name: 'makePhoneCall',
    description:
      'Initiate a phone call to a contact name or phone number. Looks up matching contacts if a name or relation (like আব্বু, আম্মু, Mom, Boss) is given.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        recipient: {
          type: Type.STRING,
          description: 'Contact name, relation, or phone number to dial.',
        },
      },
      required: ['recipient'],
    },
  },
  {
    name: 'sendMessage',
    description:
      'Send an SMS, WhatsApp message, or Email to a contact or number/email address.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        channel: {
          type: Type.STRING,
          description: 'One of: whatsapp, sms, email',
        },
        recipient: {
          type: Type.STRING,
          description: 'Contact name, phone number, or email address.',
        },
        messageBody: {
          type: Type.STRING,
          description: 'The text content of the message.',
        },
        subject: {
          type: Type.STRING,
          description: 'Optional subject line when channel is email.',
        },
      },
      required: ['channel', 'recipient', 'messageBody'],
    },
  },
  {
    name: 'openAppOrUrl',
    description:
      'Directly open/launch a mobile app, internal utility, or search inside an app (YouTube, Maps, WhatsApp, Facebook, Messenger, Instagram, TikTok, Telegram, Spotify, Gmail, Play Store, bKash, Nagad, Daraz, Netflix, Zoom, Meet, X, LinkedIn, Camera, Calculator, Phone Dialer, Contacts, Clock/Timers, Notes, Settings, Google).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        appName: {
          type: Type.STRING,
          description:
            'App name: youtube, maps, google, whatsapp, facebook, messenger, instagram, tiktok, telegram, spotify, gmail, playstore, bkash, nagad, daraz, netflix, zoom, meet, x, linkedin, camera, calculator, phone, contacts, clock, notes, calendar, settings',
        },
        query: {
          type: Type.STRING,
          description:
            'Optional search query or destination address inside the app.',
        },
      },
      required: ['appName'],
    },
  },
  {
    name: 'setAlarmOrTimer',
    description:
      'Set a countdown timer (in seconds or minutes) or alarm with a descriptive label.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        durationSeconds: {
          type: Type.NUMBER,
          description: 'Total timer duration in seconds (e.g. 300 for 5 minutes).',
        },
        label: {
          type: Type.STRING,
          description: 'Short label for the timer or alarm.',
        },
      },
      required: ['durationSeconds', 'label'],
    },
  },
  {
    name: 'manageNoteOrReminder',
    description:
      'Create a new note or reminder, or mark a note done / delete it.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        operation: {
          type: Type.STRING,
          description: 'One of: add, complete, delete',
        },
        text: {
          type: Type.STRING,
          description: 'Text content of the note or reminder.',
        },
        reminderTime: {
          type: Type.STRING,
          description: 'Optional time string like "7:30 PM" or "সন্ধ্যা ৭টা".',
        },
      },
      required: ['operation', 'text'],
    },
  },
  {
    name: 'runSmartRoutine',
    description:
      'Activate a multi-step mobile automation routine: morning, driving, sleep, focus, or battery_saver.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        routineId: {
          type: Type.STRING,
          description:
            'One of: morning, driving, sleep, focus, battery_saver',
        },
      },
      required: ['routineId'],
    },
  },
  {
    name: 'triggerDeviceHardware',
    description:
      'Trigger direct browser/device hardware utilities: vibrate (haptic buzz), check_battery (report battery level), get_location (fetch GPS coordinates), copy_text (copy text to clipboard), or share_content (open mobile share dialog).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          description:
            'One of: vibrate, check_battery, get_location, copy_text, share_content',
        },
        textPayload: {
          type: Type.STRING,
          description: 'Text to copy or share when action is copy_text or share_content.',
        },
      },
      required: ['action'],
    },
  },
  {
    name: 'manageContacts',
    description: 'Save a new contact to the user mobile contacts directory.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: {
          type: Type.STRING,
          description: 'Contact full name.',
        },
        phone: {
          type: Type.STRING,
          description: 'Phone number.',
        },
        relation: {
          type: Type.STRING,
          description: 'Optional relation or tag like আব্বু, Friend, Office.',
        },
      },
      required: ['name', 'phone'],
    },
  },
];

function findMatchingContact(
  recipient: string,
  contacts: ContactItem[]
): ContactItem | undefined {
  const needle = recipient.trim().toLowerCase();
  return contacts.find(
    (c) =>
      c.name.toLowerCase().includes(needle) ||
      (c.relation && c.relation.toLowerCase().includes(needle)) ||
      c.phone.replace(/\s+/g, '').includes(needle.replace(/\s+/g, ''))
  );
}

function buildAppLaunchUrl(appName: string, query?: string): {
  url?: string;
  label: string;
} {
  const app = appName.trim().toLowerCase();
  const q = query?.trim() ?? '';
  const encoded = encodeURIComponent(q);

  switch (app) {
    case 'youtube':
      return {
        label: 'YouTube',
        url: q
          ? `https://www.youtube.com/results?search_query=${encoded}`
          : 'https://www.youtube.com',
      };
    case 'maps':
    case 'google maps':
      return {
        label: 'Google Maps',
        url: q
          ? `https://www.google.com/maps/search/?api=1&query=${encoded}`
          : 'https://www.google.com/maps',
      };
    case 'whatsapp':
      return {
        label: 'WhatsApp',
        url: q ? `https://wa.me/?text=${encoded}` : 'https://web.whatsapp.com',
      };
    case 'facebook':
      return {
        label: 'Facebook',
        url: 'https://www.facebook.com',
      };
    case 'messenger':
      return {
        label: 'Messenger',
        url: 'https://www.messenger.com',
      };
    case 'instagram':
      return {
        label: 'Instagram',
        url: 'https://www.instagram.com',
      };
    case 'tiktok':
      return {
        label: 'TikTok',
        url: 'https://www.tiktok.com',
      };
    case 'spotify':
      return {
        label: 'Spotify',
        url: q
          ? `https://open.spotify.com/search/${encoded}`
          : 'https://open.spotify.com',
      };
    case 'gmail':
    case 'email':
      return {
        label: 'Gmail',
        url: 'https://mail.google.com',
      };
    case 'telegram':
      return {
        label: 'Telegram',
        url: 'https://web.telegram.org',
      };
    case 'playstore':
      return {
        label: 'Play Store',
        url: q
          ? `https://play.google.com/store/search?q=${encoded}&c=apps`
          : 'https://play.google.com/store',
      };
    case 'bkash':
      return {
        label: 'bKash',
        url: 'https://www.bkash.com',
      };
    case 'nagad':
      return {
        label: 'Nagad',
        url: 'https://nagad.com.bd',
      };
    case 'daraz':
      return {
        label: 'Daraz',
        url: 'https://www.daraz.com.bd',
      };
    case 'netflix':
      return {
        label: 'Netflix',
        url: 'https://www.netflix.com',
      };
    case 'zoom':
      return {
        label: 'Zoom',
        url: 'https://zoom.us',
      };
    case 'meet':
      return {
        label: 'Google Meet',
        url: 'https://meet.google.com',
      };
    case 'x':
    case 'twitter':
      return {
        label: 'X',
        url: 'https://x.com',
      };
    case 'linkedin':
      return {
        label: 'LinkedIn',
        url: 'https://www.linkedin.com',
      };
    case 'calendar':
      return {
        label: 'Calendar',
        url: 'https://calendar.google.com',
      };
    case 'google':
    case 'browser':
    case 'chrome':
      return {
        label: 'Google',
        url: q
          ? `https://www.google.com/search?q=${encoded}`
          : 'https://www.google.com',
      };
    case 'camera':
    case 'calculator':
    case 'settings':
    case 'phone':
    case 'contacts':
    case 'clock':
    case 'notes':
      return {
        label: appName,
        url: undefined,
      };
    default:
      if (q.startsWith('http://') || q.startsWith('https://')) {
        return { label: appName, url: q };
      }
      return {
        label: appName,
        url: q
          ? `https://www.google.com/search?q=${encodeURIComponent(`${appName} ${q}`)}`
          : `https://www.google.com/search?q=${encodeURIComponent(appName)}`,
      };
  }
}

interface CommandContext {
  device: DeviceState;
  contacts: ContactItem[];
  timers: TimerItem[];
  notes: NoteItem[];
  language: JarvisLanguage;
  coords?: { latitude: number; longitude: number } | null;
}

function executeFunctionCallLocally(
  name: string,
  args: Record<string, unknown>,
  ctx: CommandContext
): { action: ExecutedAction; toolResult: Record<string, unknown> } {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  switch (name) {
    case 'toggleDeviceSetting': {
      const setting = String(args.setting || 'wifi');
      const enabled = Boolean(args.enabled);
      return {
        action: {
          id,
          type: 'toggle_setting',
          title: `${setting} ${enabled ? 'ON' : 'OFF'}`,
          detail: `${setting} set to ${enabled ? 'enabled' : 'disabled'}`,
          payload: { setting, enabled },
          status: 'executed',
        },
        toolResult: { success: true, setting, enabled },
      };
    }

    case 'adjustDeviceLevel': {
      const target = String(args.target || 'brightness');
      const rawVal = Number(args.value ?? 50);
      const value = Math.max(0, Math.min(100, Math.round(rawVal)));
      return {
        action: {
          id,
          type: 'adjust_level',
          title: `${target} -> ${value}%`,
          detail: `Adjusted ${target} to ${value}%`,
          payload: { target, value },
          status: 'executed',
        },
        toolResult: { success: true, target, value },
      };
    }

    case 'makePhoneCall': {
      const recipient = String(args.recipient || '');
      const matched = findMatchingContact(recipient, ctx.contacts);
      const dialNumber = matched ? matched.phone : recipient.replace(/[^\d+]/g, '');
      const displayName = matched ? `${matched.name} (${matched.phone})` : recipient;
      const hasValidNumber = dialNumber.length >= 3;
      const launchUrl = hasValidNumber ? `tel:${dialNumber}` : undefined;
      return {
        action: {
          id,
          type: 'phone_call',
          title: `Call ${matched?.name || recipient}`,
          detail: hasValidNumber
            ? `Dialing ${displayName}`
            : `No saved phone number found for "${recipient}"`,
          payload: {
            recipient: matched?.name || recipient,
            phone: dialNumber,
            found: hasValidNumber,
          },
          launchUrl,
          status: hasValidNumber ? 'ready' : 'info',
        },
        toolResult: hasValidNumber
          ? { success: true, contactName: matched?.name || recipient, phone: dialNumber, telUri: launchUrl }
          : { success: false, reason: 'Contact or phone number not found in directory' },
      };
    }

    case 'sendMessage': {
      const channel = String(args.channel || 'whatsapp').toLowerCase();
      const recipient = String(args.recipient || '');
      const messageBody = String(args.messageBody || '');
      const subject = String(args.subject || '');
      const matched = findMatchingContact(recipient, ctx.contacts);
      const phone = (matched?.phone || recipient).replace(/[^\d+]/g, '');
      const email = matched?.email || (recipient.includes('@') ? recipient : '');

      let launchUrl: string | undefined;
      if (channel === 'whatsapp') {
        const cleanWa = phone.replace(/^\+/, '');
        launchUrl = cleanWa.length >= 6
          ? `https://wa.me/${cleanWa}?text=${encodeURIComponent(messageBody)}`
          : `https://wa.me/?text=${encodeURIComponent(messageBody)}`;
      } else if (channel === 'sms') {
        launchUrl = phone.length >= 3
          ? `sms:${phone}?body=${encodeURIComponent(messageBody)}`
          : `sms:?body=${encodeURIComponent(messageBody)}`;
      } else if (channel === 'email') {
        launchUrl = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(messageBody)}`;
      }

      return {
        action: {
          id,
          type: 'send_message',
          title: `${channel.toUpperCase()} -> ${matched?.name || recipient}`,
          detail: messageBody,
          payload: {
            channel,
            recipient: matched?.name || recipient,
            phone,
            email,
            messageBody,
          },
          launchUrl,
          status: 'ready',
        },
        toolResult: {
          success: true,
          channel,
          recipient: matched?.name || recipient,
          preparedUrl: launchUrl,
        },
      };
    }

    case 'openAppOrUrl': {
      const appName = String(args.appName || 'google');
      const query = args.query ? String(args.query) : undefined;
      const { url, label } = buildAppLaunchUrl(appName, query);
      return {
        action: {
          id,
          type: 'open_app',
          title: query ? `${label}: ${query}` : label,
          detail: query
            ? `${label} · ${query}`
            : ctx.language === 'bn'
              ? `${label} চালু করা হচ্ছে`
              : `Launching ${label}`,
          payload: { appName: appName.toLowerCase(), label, query },
          launchUrl: url,
          status: 'executed',
        },
        toolResult: { success: true, app: label, query: query ?? null, launched: true },
      };
    }

    case 'setAlarmOrTimer': {
      const durationSeconds = Math.max(5, Math.round(Number(args.durationSeconds ?? 60)));
      const label = String(args.label || 'Timer');
      return {
        action: {
          id,
          type: 'set_timer',
          title: `${label} (${Math.ceil(durationSeconds / 60)}m)`,
          detail: `Countdown started for ${durationSeconds} seconds`,
          payload: { durationSeconds, label },
          status: 'executed',
        },
        toolResult: { success: true, durationSeconds, label },
      };
    }

    case 'manageNoteOrReminder': {
      const operation = String(args.operation || 'add');
      const text = String(args.text || '');
      const reminderTime = args.reminderTime ? String(args.reminderTime) : undefined;
      return {
        action: {
          id,
          type: 'manage_note',
          title: operation === 'add' ? 'Note Saved' : `Note ${operation}`,
          detail: reminderTime ? `${text} (${reminderTime})` : text,
          payload: { operation, text, reminderTime },
          status: 'executed',
        },
        toolResult: { success: true, operation, text, reminderTime: reminderTime ?? null },
      };
    }

    case 'runSmartRoutine': {
      const routineId = String(args.routineId || 'morning');
      return {
        action: {
          id,
          type: 'run_routine',
          title: `Routine: ${routineId}`,
          detail: `Activated ${routineId} mobile preset`,
          payload: { routineId },
          status: 'executed',
        },
        toolResult: { success: true, routineId },
      };
    }

    case 'triggerDeviceHardware': {
      const hwAction = String(args.action || 'vibrate');
      const textPayload = args.textPayload ? String(args.textPayload) : undefined;
      return {
        action: {
          id,
          type: 'hardware_action',
          title: `Device: ${hwAction}`,
          detail:
            hwAction === 'check_battery'
              ? `Battery at ${ctx.device.batteryLevel}%${ctx.device.batteryCharging ? ' (Charging)' : ''}`
              : textPayload || `Executed ${hwAction}`,
          payload: { action: hwAction, textPayload },
          status: 'executed',
        },
        toolResult: {
          success: true,
          action: hwAction,
          batteryLevel: ctx.device.batteryLevel,
          batteryCharging: ctx.device.batteryCharging,
          coords: ctx.coords ?? null,
        },
      };
    }

    case 'manageContacts': {
      const contactName = String(args.name || '');
      const phone = String(args.phone || '');
      const relation = args.relation ? String(args.relation) : undefined;
      return {
        action: {
          id,
          type: 'add_contact',
          title: `Saved Contact: ${contactName}`,
          detail: `${phone}${relation ? ` · ${relation}` : ''}`,
          payload: { name: contactName, phone, relation },
          status: 'executed',
        },
        toolResult: { success: true, name: contactName, phone, relation: relation ?? null },
      };
    }

    default:
      return {
        action: {
          id,
          type: 'hardware_action',
          title: name,
          detail: JSON.stringify(args),
          payload: args,
          status: 'info',
        },
        toolResult: { success: false, error: 'Unknown tool' },
      };
  }
}

function getErrorStatus(error: unknown): { status: number; message: string; isQuota: boolean; isAuth: boolean } {
  const rawMsg = error instanceof Error ? error.message : String(error ?? 'Unknown Gemini API error');
  const lower = rawMsg.toLowerCase();
  const isQuota =
    lower.includes('429') ||
    lower.includes('resource_exhausted') ||
    lower.includes('quota') ||
    lower.includes('rate limit');
  const isAuth =
    lower.includes('403') ||
    lower.includes('permission_denied') ||
    lower.includes('api_key_invalid') ||
    lower.includes('api key not valid');

  return {
    status: isQuota ? 429 : isAuth ? 403 : 500,
    message: rawMsg,
    isQuota,
    isAuth,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateWithResilience(
  paramsFactory: (opts: { model: string; useSearch: boolean; thinkingLevel: ThinkingLevel }) => Parameters<typeof ai.models.generateContent>[0]
) {
  const attempts: Array<{ model: string; useSearch: boolean; thinkingLevel: ThinkingLevel; delayMs: number }> = [
    { model: 'gemini-4-hydrogen', useSearch: true, thinkingLevel: ThinkingLevel.LOW, delayMs: 0 },
    { model: 'gemini-3.1-flash-lite', useSearch: false, thinkingLevel: ThinkingLevel.MINIMAL, delayMs: 600 },
    { model: 'gemini-3.1-flash-lite', useSearch: false, thinkingLevel: ThinkingLevel.MINIMAL, delayMs: 1400 },
  ];

  let lastError: unknown;
  for (const attempt of attempts) {
    if (attempt.delayMs > 0) {
      await sleep(attempt.delayMs);
    }
    try {
      const response = await ai.models.generateContent(paramsFactory(attempt));
      return { response, usedModel: attempt.model, usedSearch: attempt.useSearch };
    } catch (err) {
      lastError = err;
      const info = getErrorStatus(err);
      if (!info.isQuota && info.status !== 503 && info.status !== 500) {
        throw err;
      }
      // On quota/rate-limit or transient server errors, continue to next fallback/retry attempt
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  app.post('/api/jarvis/command', async (req, res) => {
    try {
      const { message, history = [], context } = req.body as {
        message: string;
        history?: Array<{ role: 'user' | 'jarvis'; text: string }>;
        context: CommandContext;
      };

      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'Command message is required.' });
        return;
      }

      if (!process.env.GEMINI_API_KEY) {
        res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
        return;
      }

      const lang = context?.language === 'en' ? 'en' : 'bn';
      const nowString = new Date().toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US', {
        dateStyle: 'full',
        timeStyle: 'short',
      });

      const systemInstruction = `You are JARVIS, a loyal, intelligent, ultra-responsive personal mobile AI assistant that controls the user's smartphone A-to-Z.

Current context:
- Current Date & Time: ${nowString}
- User Preferred Language: ${lang === 'bn' ? 'Bengali (বাংলা)' : 'English'} (Always reply in the same language the user spoke or typed in. If they speak Bengali or Banglish, reply in clear, natural, respectful Bengali! If they speak English, reply in crisp, polite English.)
- Device State: ${JSON.stringify(context?.device ?? {})}
- Saved Contacts: ${JSON.stringify((context?.contacts ?? []).map((c) => ({ name: c.name, relation: c.relation, phone: c.phone })))}
- Active Notes: ${JSON.stringify((context?.notes ?? []).slice(0, 8))}
- Active Timers: ${JSON.stringify((context?.timers ?? []).slice(0, 5))}
- User GPS Coordinates (if granted): ${context?.coords ? JSON.stringify(context.coords) : 'Not available'}

Behavior Rules:
1. When the user asks to control ANY mobile feature or open/play ANY app (Wi-Fi, data, bluetooth, flashlight/torch, DND, airplane mode, brightness, volume, call someone, send WhatsApp/SMS/email, open YouTube/play video/music, Maps/directions, Facebook/Messenger/Instagram/TikTok/Spotify/Gmail/Play Store/bKash/Nagad/Camera/Calculator/Phone/Contacts/Timers/Settings/Google Browser, set timer/alarm, save note/reminder, add contact, run routine like sleep/morning/driving/focus, check battery, vibrate, share), ALWAYS call the matching tool(s) immediately!
2. You can call MULTIPLE tools in a single turn if the user gives a compound command (e.g., "ওয়াইফাই অন করো এবং ব্রাইটনেস ৮০% করো").
3. For normal questions, greetings, casual conversation, weather, news, definitions, scores, currency, math, or general Q&A where the user did NOT ask to open an app or browser, converse naturally and directly in words — DO NOT call openAppOrUrl and DO NOT provide links.
4. NEVER print raw URLs or links (no http:// or https://) in your reply, and NEVER tell the user to click a link or button. Confirm directly that the app is now open on screen.
5. Keep every reply warm, natural, conversational, and spoken-ready (1-3 crisp sentences—like Tony Stark's JARVIS talking face-to-face with the user). Avoid markdown formatting (*, #, bullet symbols) since every response is read aloud to the user.`;

      const recentHistory: Content[] = (Array.isArray(history) ? history : [])
        .slice(-6)
        .map((turn) => ({
          role: turn.role === 'user' ? 'user' : 'model',
          parts: [{ text: turn.text }],
        }));

      const contents: Content[] = [
        ...recentHistory,
        { role: 'user', parts: [{ text: message }] },
      ];

      const { response: response1, usedModel, usedSearch } = await generateWithResilience(
        ({ model, useSearch, thinkingLevel }) => ({
          model,
          contents,
          config: {
            systemInstruction,
            tools: useSearch
              ? [{ googleSearch: {} }, { functionDeclarations: jarvisTools }]
              : [{ functionDeclarations: jarvisTools }],
            ...(useSearch ? { toolConfig: { includeServerSideToolInvocations: true } } : {}),
            thinkingConfig: { thinkingLevel },
          },
        })
      );

      const executedActions: ExecutedAction[] = [];
      const sourcesMap = new Map<string, GroundingSource>();

      const extractSources = (resp: typeof response1) => {
        const chunks = resp.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (Array.isArray(chunks)) {
          for (const chunk of chunks) {
            if (chunk.web?.uri && chunk.web?.title) {
              sourcesMap.set(chunk.web.uri, {
                uri: chunk.web.uri,
                title: chunk.web.title,
              });
            }
          }
        }
      };

      extractSources(response1);

      let finalReply = response1.text?.trim() || '';
      const functionCalls = response1.functionCalls;

      if (functionCalls && functionCalls.length > 0) {
        const functionResponses = [];
        for (const call of functionCalls) {
          const { action, toolResult } = executeFunctionCallLocally(
            call.name || '',
            (call.args as Record<string, unknown>) || {},
            context
          );
          executedActions.push(action);
          functionResponses.push({
            functionResponse: {
              id: call.id,
              name: call.name,
              response: toolResult,
            },
          });
        }

        const needsFollowupSummary = functionCalls.some(
          (c) => c.name === 'triggerDeviceHardware'
        );
        const previousContent = response1.candidates?.[0]?.content;
        if (needsFollowupSummary && previousContent && !finalReply) {
          try {
            const response2 = await ai.models.generateContent({
              model: usedModel,
              contents: [
                ...contents,
                previousContent,
                {
                  role: 'user',
                  parts: functionResponses,
                },
              ],
              config: {
                systemInstruction,
                tools: usedSearch
                  ? [{ googleSearch: {} }, { functionDeclarations: jarvisTools }]
                  : [{ functionDeclarations: jarvisTools }],
                ...(usedSearch ? { toolConfig: { includeServerSideToolInvocations: true } } : {}),
                thinkingConfig: {
                  thinkingLevel:
                    usedModel === 'gemini-3.1-flash-lite'
                      ? ThinkingLevel.MINIMAL
                      : ThinkingLevel.LOW,
                },
              },
            });
            extractSources(response2);
            if (response2.text?.trim()) {
              finalReply = response2.text.trim();
            }
          } catch (turn2Err) {
            console.warn('Turn 2 summary skipped due to API error:', turn2Err);
          }
        }
      }

      // Strip any accidental raw URLs if model emitted one
      finalReply = finalReply.replace(/https?:\/\/\S+/gi, '').trim();

      if (!finalReply) {
        if (executedActions.length > 0) {
          const openAppAction = executedActions.find((a) => a.type === 'open_app');
          if (openAppAction && executedActions.length === 1) {
            const appLabel = String(openAppAction.payload.label || openAppAction.title);
            finalReply =
              lang === 'bn'
                ? `${appLabel} চালু করা হয়েছে, স্যার।`
                : `Opening ${appLabel}, sir.`;
          } else {
            const summary = executedActions.map((a) => a.title).join(', ');
            finalReply =
              lang === 'bn'
                ? `সম্পন্ন হয়েছে, স্যার: ${summary}।`
                : `Done, sir: ${summary}.`;
          }
        } else {
          finalReply =
            lang === 'bn'
              ? 'কমান্ড সম্পন্ন হয়েছে, স্যার।'
              : 'Command executed, sir.';
        }
      }

      res.json({
        reply: finalReply,
        actions: executedActions,
        sources: Array.from(sourcesMap.values()),
      });
    } catch (error: unknown) {
      console.error('JARVIS command error:', error);
      const { status, message, isQuota, isAuth } = getErrorStatus(error);
      res.status(status).json({
        error: message,
        code: isQuota ? 'RESOURCE_EXHAUSTED' : isAuth ? 'API_KEY_INVALID' : 'INTERNAL_ERROR',
      });
    }
  });

  app.post('/api/jarvis/transcribe', async (req, res) => {
    try {
      const { audioBase64, mimeType = 'audio/webm', language = 'bn' } = req.body as {
        audioBase64: string;
        mimeType?: string;
        language?: JarvisLanguage;
      };

      if (!audioBase64) {
        res.status(400).json({ error: 'Audio data is required.' });
        return;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: audioBase64,
              },
            },
            {
              text:
                language === 'bn'
                  ? 'Transcribe the spoken audio accurately in Bengali (or English if spoken in English). Return only the exact transcribed text.'
                  : 'Transcribe the spoken audio accurately. Return only the exact transcribed text.',
            },
          ],
        },
      });

      res.json({ text: (response.text ?? '').trim() });
    } catch (error: unknown) {
      console.error('Transcription error:', error);
      const { status, message, isQuota } = getErrorStatus(error);
      res.status(status).json({
        error: message,
        code: isQuota ? 'RESOURCE_EXHAUSTED' : 'TRANSCRIBE_ERROR',
      });
    }
  });

  const ttsModelCooldownUntil: Record<string, number> = {};

  app.post('/api/jarvis/tts', async (req, res) => {
    try {
      const { text, voiceName = 'Charon', language = 'bn' } = req.body as {
        text: string;
        voiceName?: string;
        language?: JarvisLanguage;
      };

      if (!text || !text.trim()) {
        res.status(400).json({ error: 'Text is required for TTS.' });
        return;
      }

      const cleanText = text.replace(/[*_`#]/g, '').slice(0, 600);
      const speechStyle =
        language === 'bn'
          ? 'Calm, intelligent, articulate personal AI assistant speaking natural Bengali'
          : 'Calm, intelligent, composed British-style personal AI assistant';

      const speechConfig = {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName,
            },
          },
        },
      };

      const candidateModels = [
        'gemini-3.8-flash-lite-tts',
        'gemini-3.8-flash-tts',
      ];

      let base64Audio: string | undefined;
      for (const ttsModel of candidateModels) {
        if ((ttsModelCooldownUntil[ttsModel] ?? 0) > Date.now()) {
          continue;
        }
        try {
          let response;
          try {
            response = await ttsAi.models.generateContent({
              model: ttsModel,
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      text: cleanText,
                      speechMetadata: {
                        style: speechStyle,
                      },
                    },
                  ],
                },
              ],
              config: speechConfig,
            });
          } catch (metaErr) {
            const msg = metaErr instanceof Error ? metaErr.message : String(metaErr ?? '');
            if (msg.includes('speechMetadata') || msg.includes('INVALID_ARGUMENT')) {
              response = await ttsAi.models.generateContent({
                model: ttsModel,
                contents: [{ role: 'user', parts: [{ text: cleanText }] }],
                config: speechConfig,
              });
            } else {
              throw metaErr;
            }
          }

          base64Audio =
            response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (base64Audio) {
            break;
          }
        } catch (modelErr: unknown) {
          const info = getErrorStatus(modelErr);
          if (info.isQuota) {
            // Avoid spamming quota-exhausted TTS model and fall back cleanly
            ttsModelCooldownUntil[ttsModel] = Date.now() + 15 * 60 * 1000;
            continue;
          }
          console.warn(`TTS model ${ttsModel} error:`, info.message);
        }
      }

      if (!base64Audio) {
        const fallbackChunks = await synthesizeSpeechFallbackMp3(
          cleanText,
          /[\u0980-\u09FF]/.test(cleanText) || language === 'bn' ? 'bn' : 'en'
        );
        if (fallbackChunks.length > 0) {
          res.json({
            audioBase64: fallbackChunks[0],
            audioChunks: fallbackChunks,
            mimeType: 'audio/mpeg',
          });
          return;
        }
        res.json({ audioBase64: null, fallback: 'browser' });
        return;
      }

      res.json({
        audioBase64: base64Audio,
        audioChunks: [base64Audio],
        mimeType: 'audio/wav',
      });
    } catch (error: unknown) {
      console.warn('TTS fallback triggered:', error);
      res.json({ audioBase64: null, fallback: 'browser' });
    }
  });

  function splitTextForTts(input: string, maxLen = 175): string[] {
    const clean = input.replace(/\s+/g, ' ').trim();
    if (!clean) return [];
    const sentences = clean.split(/(?<=[।.!?])\s+/);
    const chunks: string[] = [];
    let current = '';

    for (const sentence of sentences) {
      if (!sentence) continue;
      if (sentence.length > maxLen) {
        if (current) {
          chunks.push(current.trim());
          current = '';
        }
        const words = sentence.split(/\s+/);
        for (const word of words) {
          if ((current + ' ' + word).trim().length > maxLen) {
            if (current) chunks.push(current.trim());
            current = word;
          } else {
            current = (current ? current + ' ' : '') + word;
          }
        }
      } else if ((current + ' ' + sentence).trim().length > maxLen) {
        if (current) chunks.push(current.trim());
        current = sentence;
      } else {
        current = (current ? current + ' ' : '') + sentence;
      }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks.slice(0, 6);
  }

  async function synthesizeSpeechFallbackMp3(
    text: string,
    tl: 'bn' | 'en'
  ): Promise<string[]> {
    const parts = splitTextForTts(text, 175);
    const results: string[] = [];

    for (const part of parts) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      try {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${tl}&client=tw-ob&q=${encodeURIComponent(part)}`;
        const r = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            Referer: 'https://translate.google.com/',
          },
        });
        if (!r.ok) continue;
        const arrBuf = await r.arrayBuffer();
        if (arrBuf.byteLength > 200) {
          results.push(Buffer.from(arrBuf).toString('base64'));
        }
      } catch {
        // skip chunk on timeout/network failure
      } finally {
        clearTimeout(timer);
      }
    }
    return results;
  }

  app.get('/api/jarvis/youtube', async (req, res) => {
    try {
      const q = String(req.query.q || '').trim() || 'trending music bangladesh';
      const ytRes = await fetch(
        `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9,bn;q=0.8',
          },
        }
      );
      const html = await ytRes.text();
      const match = html.match(/var ytInitialData = (\{[\s\S]*?\});<\/script>/);
      const videos: Array<{
        id: string;
        title: string;
        channel: string;
        duration: string;
        thumbnail: string;
      }> = [];

      if (match && match[1]) {
        try {
          const data = JSON.parse(match[1]) as Record<string, unknown>;
          const walk = (node: unknown) => {
            if (!node || typeof node !== 'object' || videos.length >= 10) return;
            if (Array.isArray(node)) {
              for (const item of node) walk(item);
              return;
            }
            const obj = node as Record<string, unknown>;
            if (obj.videoRenderer && typeof obj.videoRenderer === 'object') {
              const vr = obj.videoRenderer as Record<string, unknown>;
              const vid = String(vr.videoId || '');
              const titleRuns = (vr.title as { runs?: Array<{ text?: string }> })?.runs;
              const title = titleRuns?.map((r) => r.text || '').join('') || '';
              const ownerRuns = (vr.ownerText as { runs?: Array<{ text?: string }> })?.runs;
              const channel = ownerRuns?.map((r) => r.text || '').join('') || '';
              const duration =
                (vr.lengthText as { simpleText?: string })?.simpleText || '';
              if (vid && title && !videos.some((v) => v.id === vid)) {
                videos.push({
                  id: vid,
                  title,
                  channel,
                  duration,
                  thumbnail: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
                });
              }
              return;
            }
            for (const val of Object.values(obj)) {
              walk(val);
            }
          };
          walk(data);
        } catch {
          // fallback regex below
        }
      }

      if (videos.length === 0) {
        const ids = [...new Set([...html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)].map((m) => m[1]))].slice(0, 8);
        for (const vid of ids) {
          videos.push({
            id: vid,
            title: `${q}`,
            channel: 'YouTube',
            duration: '',
            thumbnail: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
          });
        }
      }

      res.json({ query: q, videos });
    } catch (error) {
      console.error('YouTube search error:', error);
      res.status(500).json({ error: 'Unable to load YouTube videos', videos: [] });
    }
  });

  app.get('/api/jarvis/websearch', async (req, res) => {
    try {
      const q = String(req.query.q || '').trim();
      const lang = req.query.lang === 'en' ? 'en' : 'bn';
      if (!q) {
        res.json({ query: '', results: [] });
        return;
      }

      const wikiBase =
        lang === 'bn' && /[\u0980-\u09FF]/.test(q)
          ? 'https://bn.wikipedia.org'
          : 'https://en.wikipedia.org';

      const wikiRes = await fetch(
        `${wikiBase}/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
          q
        )}&srlimit=5&format=json&utf8=1`,
        { headers: { 'User-Agent': 'aistudio-build' } }
      );
      const wikiJson = (await wikiRes.json()) as {
        query?: {
          search?: Array<{ pageid: number; title: string; snippet: string }>;
        };
      };

      const results = (wikiJson.query?.search ?? []).map((item) => ({
        title: item.title,
        snippet: item.snippet.replace(/<[^>]+>/g, ''),
        embedUrl: `${wikiBase}/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
      }));

      res.json({ query: q, results });
    } catch (error) {
      console.error('Web search error:', error);
      res.status(500).json({ error: 'Search failed', results: [] });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`JARVIS server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
