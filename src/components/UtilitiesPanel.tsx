import { useState, type FormEvent } from 'react';
import {
  Clock,
  Play,
  Pause,
  Trash2,
  Plus,
  CheckSquare,
  Square,
  Phone,
  MessageCircle,
  UserPlus,
  Globe,
  Volume2,
  Info,
} from 'lucide-react';
import type { CopyBundle } from '../lib/i18n';
import type {
  ContactItem,
  JarvisLanguage,
  NoteItem,
  TimerItem,
} from '../types/jarvis';

interface UtilitiesViewProps {
  timers: TimerItem[];
  notes: NoteItem[];
  copy: CopyBundle;
  onAddTimer: (seconds: number, label: string) => void;
  onToggleTimer: (id: string) => void;
  onDeleteTimer: (id: string) => void;
  onAddNote: (text: string, time?: string) => void;
  onToggleNote: (id: string) => void;
  onDeleteNote: (id: string) => void;
}

function formatMMSS(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function UtilitiesView({
  timers,
  notes,
  copy,
  onAddTimer,
  onToggleTimer,
  onDeleteTimer,
  onAddNote,
  onToggleNote,
  onDeleteNote,
}: UtilitiesViewProps) {
  const [noteInput, setNoteInput] = useState('');
  const [timerMinutes, setTimerMinutes] = useState('5');
  const [timerLabel, setTimerLabel] = useState('');

  const handleNoteSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;
    onAddNote(noteInput.trim());
    setNoteInput('');
  };

  const handleTimerSubmit = (e: FormEvent) => {
    e.preventDefault();
    const mins = Math.max(1, Number(timerMinutes) || 1);
    onAddTimer(mins * 60, timerLabel.trim() || `${mins}m Timer`);
    setTimerLabel('');
  };

  return (
    <div className="space-y-6">
      {/* Timers */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            {copy.timersTitle}
          </h2>
          <div className="flex items-center gap-1.5">
            {[1, 5, 10].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onAddTimer(m * 60, `${m}m`)}
                className="min-h-[36px] px-2.5 rounded-lg bg-[#111824] border border-slate-800 hover:border-sky-500/50 text-xs font-mono-tabular text-slate-300"
              >
                +{m}m
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleTimerSubmit} className="flex gap-2">
          <input
            type="number"
            min={1}
            max={180}
            value={timerMinutes}
            onChange={(e) => setTimerMinutes(e.target.value)}
            aria-label="Minutes"
            className="w-20 min-h-[44px] px-3 rounded-xl bg-[#111824] border border-slate-800 text-sm font-mono-tabular text-slate-100 focus:outline-none focus:border-sky-400"
          />
          <input
            type="text"
            value={timerLabel}
            onChange={(e) => setTimerLabel(e.target.value)}
            placeholder="Label (e.g. Tea)"
            className="flex-1 min-w-0 min-h-[44px] px-3 rounded-xl bg-[#111824] border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
          />
          <button
            type="submit"
            aria-label={copy.addTimer}
            className="min-h-[44px] min-w-[44px] px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold flex items-center justify-center"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>

        {timers.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">
            No active timers. Say &ldquo;৫ মিনিটের টাইমার দাও&rdquo; or add one above.
          </p>
        ) : (
          <div className="space-y-2">
            {timers.map((t) => (
              <div
                key={t.id}
                className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                  t.completed
                    ? 'bg-sky-500/15 border-sky-400/50'
                    : 'bg-[#111824] border-slate-800'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-300 truncate">
                    {t.label}
                  </div>
                  <div className="text-xl font-semibold font-mono-tabular text-slate-100">
                    {t.completed ? '00:00 · Done' : formatMMSS(t.remainingSeconds)}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {!t.completed && (
                    <button
                      type="button"
                      onClick={() => onToggleTimer(t.id)}
                      aria-label={t.running ? 'Pause timer' : 'Resume timer'}
                      className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center"
                    >
                      {t.running ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteTimer(t.id)}
                    aria-label="Delete timer"
                    className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-800/70 hover:bg-red-500/20 text-slate-400 hover:text-red-300 flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Notes & Reminders */}
      <section className="space-y-3 pt-2 border-t border-slate-800/80">
        <h2 className="text-sm font-semibold text-slate-200">
          {copy.notesTitle}
        </h2>
        <form onSubmit={handleNoteSubmit} className="flex gap-2">
          <input
            type="text"
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder={copy.addNote}
            className="flex-1 min-w-0 min-h-[44px] px-3.5 rounded-xl bg-[#111824] border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
          />
          <button
            type="submit"
            aria-label="Save note"
            className="min-h-[44px] min-w-[44px] px-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold flex items-center justify-center"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>

        <div className="space-y-2">
          {notes.map((n) => (
            <div
              key={n.id}
              className="p-3 rounded-2xl bg-[#111824] border border-slate-800 flex items-center justify-between gap-3"
            >
              <button
                type="button"
                onClick={() => onToggleNote(n.id)}
                className="flex items-center gap-3 text-left min-w-0 flex-1 min-h-[36px]"
              >
                {n.done ? (
                  <CheckSquare className="w-5 h-5 text-sky-400 shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-slate-500 shrink-0" />
                )}
                <div className="min-w-0">
                  <p
                    className={`text-sm truncate ${
                      n.done ? 'line-through text-slate-500' : 'text-slate-200'
                    }`}
                  >
                    {n.text}
                  </p>
                  {n.reminderTime && (
                    <span className="text-xs text-sky-400 font-mono-tabular">
                      {n.reminderTime}
                    </span>
                  )}
                </div>
              </button>
              <button
                type="button"
                onClick={() => onDeleteNote(n.id)}
                aria-label="Delete note"
                className="min-h-[44px] min-w-[44px] rounded-xl text-slate-500 hover:text-red-300 hover:bg-red-500/10 flex items-center justify-center shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

interface ContactsViewProps {
  contacts: ContactItem[];
  copy: CopyBundle;
  onAddContact: (name: string, phone: string, relation?: string) => void;
  onDeleteContact: (id: string) => void;
}

export function ContactsView({
  contacts,
  copy,
  onAddContact,
  onDeleteContact,
}: ContactsViewProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    onAddContact(name.trim(), phone.trim(), relation.trim() || undefined);
    setName('');
    setPhone('');
    setRelation('');
  };

  return (
    <div className="space-y-5">
      <h2 className="text-sm font-semibold text-slate-200">
        {copy.contactsTitle}
      </h2>

      <form
        onSubmit={handleSubmit}
        className="p-3.5 rounded-2xl bg-[#111824] border border-slate-800 space-y-2.5"
      >
        <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
          <UserPlus className="w-3.5 h-3.5 text-sky-400" />
          {copy.addContact}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (e.g. Abbu / Rahim)"
            required
            className="min-h-[44px] px-3 rounded-xl bg-[#090D14] border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+88017..."
            required
            className="min-h-[44px] px-3 rounded-xl bg-[#090D14] border border-slate-800 text-sm font-mono-tabular text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
          />
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={relation}
            onChange={(e) => setRelation(e.target.value)}
            placeholder="Relation / Nickname (optional)"
            className="flex-1 min-w-0 min-h-[44px] px-3 rounded-xl bg-[#090D14] border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
          />
          <button
            type="submit"
            className="min-h-[44px] px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold whitespace-nowrap shrink-0"
          >
            Save
          </button>
        </div>
      </form>

      <div className="space-y-2">
        {contacts.map((c) => {
          const cleanWa = c.phone.replace(/[^\d]/g, '');
          return (
            <div
              key={c.id}
              className="p-3.5 rounded-2xl bg-[#111824] border border-slate-800 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-100 truncate">
                  {c.name}
                </div>
                <div className="text-xs text-slate-400 font-mono-tabular truncate">
                  {c.phone}
                  {c.relation ? ` · ${c.relation}` : ''}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={`tel:${c.phone}`}
                  aria-label={`${copy.callNow} ${c.name}`}
                  className="min-h-[44px] min-w-[44px] rounded-xl bg-sky-500/15 border border-sky-500/40 text-sky-300 hover:bg-sky-500/25 flex items-center justify-center"
                >
                  <Phone className="w-4 h-4" />
                </a>
                <a
                  href={`https://wa.me/${cleanWa}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${copy.whatsapp} ${c.name}`}
                  className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => onDeleteContact(c.id)}
                  aria-label={`Delete ${c.name}`}
                  className="min-h-[44px] min-w-[44px] rounded-xl text-slate-500 hover:text-red-300 hover:bg-red-500/10 flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface SettingsViewProps {
  language: JarvisLanguage;
  voiceName: string;
  autoSpeak: boolean;
  continuousMode: boolean;
  copy: CopyBundle;
  onChangeLanguage: (lang: JarvisLanguage) => void;
  onChangeVoice: (voice: string) => void;
  onToggleAutoSpeak: () => void;
  onToggleContinuous: () => void;
}

export function SettingsView({
  language,
  voiceName,
  autoSpeak,
  continuousMode,
  copy,
  onChangeLanguage,
  onChangeVoice,
  onToggleAutoSpeak,
  onToggleContinuous,
}: SettingsViewProps) {
  const voices = ['Charon', 'Fenrir', 'Kore', 'Puck', 'Zephyr'];

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-2xl bg-[#111824] border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Globe className="w-4 h-4 text-sky-400" />
          {copy.languageLabel}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onChangeLanguage('bn')}
            className={`min-h-[44px] rounded-xl text-sm font-medium border transition-colors ${
              language === 'bn'
                ? 'bg-sky-500 text-slate-950 border-sky-400 font-semibold'
                : 'bg-[#090D14] text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            বাংলা (Bengali)
          </button>
          <button
            type="button"
            onClick={() => onChangeLanguage('en')}
            className={`min-h-[44px] rounded-xl text-sm font-medium border transition-colors ${
              language === 'en'
                ? 'bg-sky-500 text-slate-950 border-sky-400 font-semibold'
                : 'bg-[#090D14] text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            English
          </button>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-[#111824] border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Volume2 className="w-4 h-4 text-sky-400" />
          {copy.voiceModelLabel}
        </div>
        <div className="flex flex-wrap gap-2">
          {voices.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onChangeVoice(v)}
              className={`min-h-[40px] px-3.5 rounded-xl text-xs font-medium border transition-colors ${
                voiceName === v
                  ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                  : 'bg-[#090D14] border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-[#111824] border border-slate-800 space-y-4">
        <ToggleRow
          label={copy.autoSpeakLabel}
          description={copy.autoSpeakDesc}
          enabled={autoSpeak}
          onToggle={onToggleAutoSpeak}
        />
        <div className="border-t border-slate-800/80 pt-4">
          <ToggleRow
            label={copy.continuousModeLabel}
            description={copy.continuousModeDesc}
            enabled={continuousMode}
            onToggle={onToggleContinuous}
          />
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-[#111824] border border-slate-800 flex items-start gap-3">
        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <p className="text-xs leading-relaxed text-slate-400">
          {copy.mobileBridgeNote}
        </p>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  enabled,
  onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="text-sm font-medium text-slate-200">{label}</div>
        <div className="text-xs text-slate-400">{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={onToggle}
        className={`w-12 h-7 rounded-full p-1 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
          enabled ? 'bg-sky-500' : 'bg-slate-700'
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
