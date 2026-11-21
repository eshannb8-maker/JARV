import { useEffect, useRef } from 'react';
import { Mic, Square, Volume2, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import type { CopyBundle } from '../lib/i18n';

export type CorePhase = 'idle' | 'listening' | 'processing' | 'speaking';

interface AcousticCoreProps {
  phase: CorePhase;
  audioLevel: number; // 0..1
  copy: CopyBundle;
  onToggleListen: () => void;
  onStopSpeaking: () => void;
}

const OUTER_TICKS = 28;

export function LiveVideoBackdrop({
  phase,
  audioLevel,
}: {
  phase: CorePhase;
  audioLevel: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const phaseRef = useRef<CorePhase>(phase);
  const audioLevelRef = useRef<number>(audioLevel);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    audioLevelRef.current = audioLevel;
  }, [audioLevel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const particles = Array.from({ length: 34 }, (_, i) => ({
      x: ((i * 73) % 100) / 100,
      y: ((i * 41) % 100) / 100,
      r: 1 + (i % 3) * 0.85,
      vy: 0.00045 + (i % 5) * 0.00022,
      vx: (i % 2 === 0 ? 1 : -1) * (0.00016 + (i % 4) * 0.00009),
      hue: i % 3 === 0 ? '253, 224, 71' : '251, 191, 36',
      phase: i * 0.65,
    }));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    let time = 0;
    const render = () => {
      time += 0.022;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width || 900;
      const h = rect.height || 650;

      ctx.clearRect(0, 0, w, h);

      const level = audioLevelRef.current;
      const activePhase = phaseRef.current;
      const intensity =
        activePhase === 'listening' || activePhase === 'speaking'
          ? 0.7 + level * 0.75
          : 0.45;

      // Ambient crimson aura synchronized with voice core
      const coreX = w >= 1024 ? w * 0.3 : w * 0.5;
      const coreY = h * 0.34;
      const bloomRadius = (150 + Math.sin(time * 2.1) * 16 + level * 48) * 1.1;
      const grad = ctx.createRadialGradient(
        coreX,
        coreY,
        14,
        coreX,
        coreY,
        bloomRadius
      );
      grad.addColorStop(0, `rgba(239, 68, 68, ${0.28 * intensity})`);
      grad.addColorStop(0.55, `rgba(220, 38, 38, ${0.12 * intensity})`);
      grad.addColorStop(1, 'rgba(220, 38, 38, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Subtle holographic scan sweep across full main viewport
      const sweepY = ((time * 32) % (h + 60)) - 30;
      const sweepGrad = ctx.createLinearGradient(0, sweepY - 18, 0, sweepY + 18);
      sweepGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
      sweepGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.06)');
      sweepGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = sweepGrad;
      ctx.fillRect(0, sweepY - 18, w, 36);

      // Floating luminous motes
      for (const p of particles) {
        p.y -= p.vy * (1 + level * 1.5);
        p.x += p.vx + Math.sin(time + p.phase) * 0.00022;
        if (p.y < -0.05) p.y = 1.05;
        if (p.x < -0.05) p.x = 1.05;
        if (p.x > 1.05) p.x = -0.05;

        const alpha = 0.28 + 0.38 * Math.abs(Math.sin(time * 1.4 + p.phase));
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.hue}, ${alpha.toFixed(2)})`;
        ctx.fill();
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden z-0 bg-[#090D14]"
    >
      <motion.img
        src="/assets/aistudio/images__4__454c5a99.jpg"
        alt=""
        animate={{
          scale: [1.03, 1.09, 1.05, 1.08, 1.03],
          x: [0, -8, 6, -4, 0],
          y: [0, -6, 4, -5, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="w-full h-full object-cover object-center opacity-95 will-change-transform"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/20 to-black/60" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}

export function AcousticCore({
  phase,
  audioLevel,
  copy,
  onToggleListen,
  onStopSpeaking,
}: AcousticCoreProps) {
  const isListening = phase === 'listening';
  const isProcessing = phase === 'processing';
  const isSpeaking = phase === 'speaking';

  const statusText = isListening
    ? copy.listening
    : isProcessing
      ? copy.processing
      : isSpeaking
        ? copy.speaking
        : copy.tapToSpeak;

  const handlePress = () => {
    if (isSpeaking) {
      onStopSpeaking();
    } else if (!isProcessing) {
      onToggleListen();
    }
  };

  const scaleBoost = isListening
    ? 1.04 + audioLevel * 0.16
    : isSpeaking
      ? 1.02 + audioLevel * 0.12
      : 1;

  return (
    <div className="relative flex flex-col items-center justify-between pt-3 pb-3 px-4 min-h-[250px] sm:min-h-[280px] select-none">
      {/* Floating status prompt */}
      <div className="relative z-10 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
        <p className="text-xs sm:text-sm font-medium text-slate-100/95 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] tracking-wide">
          {statusText}
        </p>
      </div>

      {/* Continuously animated red orbital record core */}
      <div className="relative z-10 my-3 flex items-center justify-center w-44 h-44 sm:w-48 sm:h-48">
        {/* Continuous breathing crimson halo */}
        <motion.div
          aria-hidden="true"
          animate={{
            scale: [1 * scaleBoost, 1.18 * scaleBoost, 1 * scaleBoost],
            opacity: [0.55, 0.92, 0.55],
          }}
          transition={{
            duration: isListening ? 0.9 : 2.1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="pointer-events-none absolute w-28 h-28 rounded-full bg-red-600/50 blur-xl"
        />

        {/* Ring 1: Outer crimson radar segments (always rotating clockwise) */}
        <motion.svg
          viewBox="0 0 220 220"
          aria-hidden="true"
          animate={{
            rotate: 360,
            scale: scaleBoost,
          }}
          transition={{
            rotate: {
              duration: isListening ? 4.5 : 10,
              repeat: Infinity,
              ease: 'linear',
            },
            scale: { duration: 0.12, ease: 'easeOut' },
          }}
          className="pointer-events-none absolute inset-0 w-full h-full"
        >
          <circle
            cx="110"
            cy="110"
            r="98"
            fill="none"
            stroke="rgba(239, 68, 68, 0.78)"
            strokeWidth="2.5"
            strokeDasharray="24 14 8 14"
            strokeLinecap="round"
          />
          {Array.from({ length: OUTER_TICKS }).map((_, idx) => {
            const angle = (idx / OUTER_TICKS) * Math.PI * 2;
            const boost =
              isListening || isSpeaking
                ? 5 + Math.abs(Math.sin(idx * 0.8 + audioLevel * 9)) * (5 + audioLevel * 10)
                : 3 + (idx % 3 === 0 ? 3 : 0);
            const r1 = 83;
            const r2 = r1 + boost;
            return (
              <line
                key={idx}
                x1={110 + Math.cos(angle) * r1}
                y1={110 + Math.sin(angle) * r1}
                x2={110 + Math.cos(angle) * r2}
                y2={110 + Math.sin(angle) * r2}
                stroke={idx % 2 === 0 ? 'rgba(248, 113, 113, 0.92)' : 'rgba(239, 68, 68, 0.6)'}
                strokeWidth="2"
                strokeLinecap="round"
              />
            );
          })}
        </motion.svg>

        {/* Ring 2: Counter-rotating red/white gyro arcs */}
        <motion.svg
          viewBox="0 0 220 220"
          aria-hidden="true"
          animate={{ rotate: -360 }}
          transition={{
            duration: isListening ? 3.2 : 6.5,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="pointer-events-none absolute inset-0 w-full h-full"
        >
          <circle
            cx="110"
            cy="110"
            r="72"
            fill="none"
            stroke="rgba(255, 255, 255, 0.86)"
            strokeWidth="1.5"
            strokeDasharray="52 20 28 24"
            strokeLinecap="round"
          />
          <ellipse
            cx="110"
            cy="110"
            rx="78"
            ry="66"
            fill="none"
            stroke="rgba(254, 202, 202, 0.6)"
            strokeWidth="1.2"
            strokeDasharray="90 36"
          />
          <circle cx="182" cy="110" r="3" fill="#ff4d4d" />
          <circle cx="38" cy="110" r="2.5" fill="#ffffff" />
        </motion.svg>

        {/* Ring 3: Fast inner white-hot orbital ring */}
        <motion.svg
          viewBox="0 0 220 220"
          aria-hidden="true"
          animate={{ rotate: 360 }}
          transition={{
            duration: isListening ? 2.4 : 4.2,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="pointer-events-none absolute inset-0 w-full h-full"
        >
          <ellipse
            cx="110"
            cy="110"
            rx="60"
            ry="74"
            fill="none"
            stroke="rgba(255, 255, 255, 0.78)"
            strokeWidth="1.3"
            strokeDasharray="65 30"
          />
        </motion.svg>

        {/* Always-active glowing red record button */}
        <motion.button
          type="button"
          onClick={handlePress}
          disabled={isProcessing}
          aria-label={statusText}
          animate={{
            scale: isListening
              ? [1, 1.07 + audioLevel * 0.08, 1]
              : [1, 1.04, 1],
          }}
          transition={{
            duration: isListening ? 0.8 : 1.8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative z-10 w-24 h-24 rounded-full flex items-center justify-center text-white bg-gradient-to-br from-[#ff3b3b] via-[#ef4444] to-[#b91c1c] border-2 border-red-200/70 shadow-[0_0_34px_rgba(239,68,68,0.9),0_0_68px_rgba(220,38,38,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070A12] active:scale-95 disabled:opacity-80"
        >
          {isProcessing ? (
            <Loader2 className="w-9 h-9 animate-spin drop-shadow" />
          ) : isListening ? (
            <Square className="w-7 h-7 fill-current drop-shadow" />
          ) : isSpeaking ? (
            <Volume2 className="w-9 h-9 drop-shadow" />
          ) : (
            <Mic className="w-9 h-9 drop-shadow" />
          )}
        </motion.button>
      </div>

      {/* Bottom tactile hint */}
      <div className="relative z-10 min-h-[24px] flex items-center justify-center">
        {isListening ? (
          <button
            type="button"
            onClick={onToggleListen}
            className="text-xs font-medium text-red-200 hover:text-white underline-offset-4 hover:underline px-3 py-0.5 rounded-md bg-black/45"
          >
            {copy.tapToStop}
          </button>
        ) : (
          <span className="text-[11px] font-medium text-slate-200/85 drop-shadow">
            {isSpeaking ? copy.speaking : copy.tapToSpeak}
          </span>
        )}
      </div>
    </div>
  );
}
