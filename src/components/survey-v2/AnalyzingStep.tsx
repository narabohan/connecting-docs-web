// ═══════════════════════════════════════════════════════════════
//  ConnectingDocs Survey v2 — Analyzing Step (Loading UX)
//  Adaptive multi-phase progress + rotating tips
//  ~30-180s Sonnet API wait time → engaging UX
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SurveyLang } from '@/types/survey-v2';
import { SURVEY_V2_I18N } from '@/utils/survey-v2-i18n';

// ─── Types ───────────────────────────────────────────────────

interface AnalyzingStepProps {
  lang: SurveyLang;
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
}

// ─── Phase Configuration ─────────────────────────────────────
// 6 phases that gradually slow down to cover 30-180s naturally
// Phase durations: 8, 12, 18, 25, 35, 50+ seconds (adaptive)
const PHASE_CONFIG = [
  { durationMs: 8000, icon: '🔬' },   // Phase 0: Skin analysis
  { durationMs: 12000, icon: '🧬' },  // Phase 1: Pattern recognition
  { durationMs: 18000, icon: '📊' },  // Phase 2: Protocol matching
  { durationMs: 25000, icon: '💊' },  // Phase 3: Treatment optimization
  { durationMs: 35000, icon: '🎯' },  // Phase 4: Personalizing
  { durationMs: 50000, icon: '📋' },  // Phase 5: Report generation (stretches)
];

const TOTAL_PHASES = PHASE_CONFIG.length;

// ─── Rotating Tips (per language) ────────────────────────────
const TIPS: Record<SurveyLang, string[]> = {
  KO: [
    'AI가 80개 이상의 임상 프로토콜을 분석하고 있어요',
    '개인 맞춤형 시술 조합을 계산하고 있습니다',
    '최신 한국 의료 장비 데이터를 확인 중이에요',
    '피부 타입에 맞는 최적 에너지 파라미터를 찾고 있어요',
    '안전성과 효과를 모두 고려한 치료 계획을 세우고 있습니다',
    '시술 후 관리까지 포함한 종합 리포트를 준비 중이에요',
    '전문 의료진이 참고할 수 있는 임상 데이터를 정리하고 있어요',
    '당신만을 위한 시그니처 솔루션을 디자인하고 있습니다',
  ],
  EN: [
    'AI is analyzing 80+ clinical protocols for you',
    'Calculating your personalized treatment combinations',
    'Reviewing the latest Korean medical device data',
    'Finding optimal energy parameters for your skin type',
    'Building a treatment plan balancing safety and efficacy',
    'Preparing a comprehensive report including aftercare',
    'Compiling clinical data for your medical consultation',
    'Designing your signature treatment solution',
  ],
  JP: [
    'AIが80以上の臨床プロトコルを分析しています',
    'パーソナライズされた施術の組み合わせを計算中です',
    '最新の韓国医療機器データを確認しています',
    'お肌タイプに最適なエネルギーパラメータを探しています',
    '安全性と効果を両立した治療計画を作成中です',
    'アフターケアまで含めた総合レポートを準備しています',
    '医療専門家向けの臨床データを整理しています',
    'あなただけのシグネチャーソリューションをデザイン中です',
  ],
  'ZH-CN': [
    'AI正在分析80多种临床方案',
    '正在计算您的个性化治疗组合',
    '正在查看最新韩国医疗设备数据',
    '正在为您的肤质寻找最佳能量参数',
    '正在制定兼顾安全与效果的治疗方案',
    '正在准备包含术后护理的综合报告',
    '正在整理专业医疗人员参考的临床数据',
    '正在设计您专属的签名解决方案',
  ],
};

// ─── Phase Labels (per language) ─────────────────────────────
const PHASE_LABELS: Record<SurveyLang, string[]> = {
  KO: [
    '피부 고민 분석 중',
    '피부 패턴 인식 중',
    '프로토콜 매칭 중',
    '시술 최적화 중',
    '맞춤 솔루션 구성 중',
    '리포트 생성 중',
  ],
  EN: [
    'Analyzing skin concerns',
    'Recognizing skin patterns',
    'Matching clinical protocols',
    'Optimizing treatments',
    'Building your solution',
    'Generating report',
  ],
  JP: [
    '肌の悩みを分析中',
    '肌パターンを認識中',
    'プロトコルをマッチング中',
    '施術を最適化中',
    'ソリューションを構成中',
    'レポートを生成中',
  ],
  'ZH-CN': [
    '分析皮肤问题中',
    '识别皮肤模式中',
    '匹配临床方案中',
    '优化治疗方案中',
    '构建定制方案中',
    '生成报告中',
  ],
};

// ─── Error Messages ──────────────────────────────────────────
const ERROR_MESSAGES: Record<SurveyLang, { title: string; body: string; retry: string }> = {
  KO: {
    title: '분석 중 오류가 발생했습니다',
    body: '네트워크 문제이거나 서버가 일시적으로 바쁠 수 있습니다. 다시 시도해 주세요.',
    retry: '다시 분석하기',
  },
  EN: {
    title: 'Analysis encountered an error',
    body: 'This may be a network issue or the server is temporarily busy. Please try again.',
    retry: 'Try Again',
  },
  JP: {
    title: '分析中にエラーが発生しました',
    body: 'ネットワークの問題、またはサーバーが一時的に混雑している可能性があります。',
    retry: 'もう一度分析する',
  },
  'ZH-CN': {
    title: '分析过程中出现错误',
    body: '可能是网络问题或服务器暂时繁忙，请重试。',
    retry: '重新分析',
  },
};

// ─── Component ───────────────────────────────────────────────

export default function AnalyzingStep({
  lang,
  isLoading,
  error,
  onRetry,
}: AnalyzingStepProps) {
  const t = SURVEY_V2_I18N[lang].step5;
  const [phase, setPhase] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef(Date.now());
  const rafRef = useRef<number | null>(null);
  const [completed, setCompleted] = useState(false);

  const tips = TIPS[lang];
  const phaseLabels = PHASE_LABELS[lang];
  const errorMsg = ERROR_MESSAGES[lang];

  // ─── Smooth progress using requestAnimationFrame ─────────
  useEffect(() => {
    if (completed || error) return;

    // Calculate cumulative phase end times
    const phaseEndTimes = PHASE_CONFIG.reduce<number[]>((acc, cfg, i) => {
      const prev = i === 0 ? 0 : acc[i - 1];
      acc.push(prev + cfg.durationMs);
      return acc;
    }, []);
    const totalDuration = phaseEndTimes[phaseEndTimes.length - 1]; // ~148s

    const animate = () => {
      const now = Date.now();
      const elapsedMs = now - startTimeRef.current;
      setElapsed(elapsedMs);

      // Determine current phase
      let currentPhase = 0;
      for (let i = 0; i < phaseEndTimes.length; i++) {
        if (elapsedMs < phaseEndTimes[i]) {
          currentPhase = i;
          break;
        }
        currentPhase = i;
      }

      // Clamp phase (don't go past last phase)
      if (currentPhase !== phase && currentPhase < TOTAL_PHASES) {
        setPhase(currentPhase);
      }

      // Calculate progress (0-95, never hits 100 until API completes)
      // Use ease-out curve: fast at start, slows down
      const linearProgress = Math.min(elapsedMs / totalDuration, 1);
      // Ease-out cubic: 1 - (1-t)^3
      const easedProgress = 1 - Math.pow(1 - linearProgress, 3);
      const displayProgress = Math.min(easedProgress * 95, 95); // Cap at 95%

      setProgress(displayProgress);

      if (elapsedMs < totalDuration + 60000) {
        // Keep animating up to totalDuration + 60s extra (for slow responses)
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [phase, completed, error]);

  // ─── Complete animation when API finishes ──────────────────
  useEffect(() => {
    if (!isLoading && !error && elapsed > 1000) {
      // API completed! Animate to 100%
      setCompleted(true);
      setPhase(TOTAL_PHASES - 1);
      setProgress(100);
    }
  }, [isLoading, error, elapsed]);

  // ─── Rotate tips every 6 seconds ───────────────────────────
  useEffect(() => {
    if (completed || error) return;
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [tips.length, completed, error]);

  // ─── Elapsed time display ──────────────────────────────────
  const elapsedSec = Math.floor(elapsed / 1000);
  const elapsedMin = Math.floor(elapsedSec / 60);
  const elapsedRemSec = elapsedSec % 60;
  const timeStr = elapsedMin > 0
    ? `${elapsedMin}:${String(elapsedRemSec).padStart(2, '0')}`
    : `${elapsedSec}s`;

  // ─── Error State ───────────────────────────────────────────
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-12 gap-6"
      >
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <span className="text-3xl">⚠️</span>
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-900 mb-2">{errorMsg.title}</h2>
          <p className="text-sm text-gray-500 max-w-xs">{errorMsg.body}</p>
          {error && (
            <p className="text-xs text-red-400 mt-2 font-mono max-w-xs truncate">
              {error}
            </p>
          )}
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            {errorMsg.retry}
          </button>
        )}
      </motion.div>
    );
  }

  // ─── Main Loading UI ───────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-8 gap-6"
    >
      {/* ─── Animated Spinner ───────────────────────────── */}
      <div className="relative w-24 h-24">
        {/* Outer ring — slow rotation */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0"
        >
          <svg viewBox="0 0 96 96" className="w-full h-full">
            <circle
              cx="48" cy="48" r="44"
              fill="none" stroke="#EBF5FF" strokeWidth="4"
            />
            <circle
              cx="48" cy="48" r="44"
              fill="none" stroke="#2563EB" strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="69 207"
              opacity="0.8"
            />
          </svg>
        </motion.div>

        {/* Middle ring — counter rotation */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-3"
        >
          <svg viewBox="0 0 72 72" className="w-full h-full">
            <circle
              cx="36" cy="36" r="32"
              fill="none" stroke="#93C5FD" strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="50 150"
              opacity="0.6"
            />
          </svg>
        </motion.div>

        {/* Inner ring — fast rotation */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-6"
        >
          <svg viewBox="0 0 48 48" className="w-full h-full">
            <circle
              cx="24" cy="24" r="20"
              fill="none" stroke="#BFDBFE" strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="31 94"
              opacity="0.4"
            />
          </svg>
        </motion.div>

        {/* Center icon — changes with phase */}
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.span
              key={phase}
              initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.5, rotate: 20 }}
              transition={{ duration: 0.3 }}
              className="text-2xl"
            >
              {completed ? '✨' : PHASE_CONFIG[Math.min(phase, TOTAL_PHASES - 1)].icon}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* ─── Title ──────────────────────────────────────── */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">{t.title}</h2>
        <p className="text-sm text-gray-500 mt-1">{t.subtitle}</p>
      </div>

      {/* ─── Progress Bar ───────────────────────────────── */}
      <div className="w-full max-w-xs">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-medium text-blue-600">
            {Math.round(progress)}%
          </span>
          <span className="text-xs text-gray-400">
            {timeStr}
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{
              duration: completed ? 0.5 : 2,
              ease: completed ? 'easeOut' : 'linear',
            }}
            className={`h-full rounded-full ${
              completed
                ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                : 'bg-gradient-to-r from-blue-500 to-blue-600'
            }`}
          />
        </div>
      </div>

      {/* ─── Phase Steps ────────────────────────────────── */}
      <div className="w-full max-w-xs space-y-2">
        {phaseLabels.map((label, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{
              opacity: phase >= idx ? 1 : 0.3,
              x: 0,
            }}
            transition={{ delay: idx * 0.1, duration: 0.3 }}
            className="flex items-center gap-3"
          >
            {/* Phase indicator */}
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all duration-500 ${
              phase > idx
                ? 'bg-green-500 text-white'
                : phase === idx
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-300'
            }`}>
              {phase > idx ? (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  ✓
                </motion.span>
              ) : (
                <span>{idx + 1}</span>
              )}
            </div>

            {/* Phase label */}
            <span className={`text-sm transition-colors duration-300 ${
              phase > idx
                ? 'text-green-600 font-medium'
                : phase === idx
                ? 'text-gray-800 font-medium'
                : 'text-gray-300'
            }`}>
              {label}
            </span>

            {/* Active pulse dot */}
            {phase === idx && !completed && (
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-auto"
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* ─── Rotating Tip ───────────────────────────────── */}
      {!completed && (
        <div className="w-full max-w-xs mt-2">
          <div className="bg-blue-50 rounded-xl px-4 py-3 min-h-[56px] flex items-center">
            <span className="text-blue-400 mr-2 flex-shrink-0">💡</span>
            <AnimatePresence mode="wait">
              <motion.p
                key={tipIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="text-xs text-blue-700 leading-relaxed"
              >
                {tips[tipIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ─── Completion Message ──────────────────────────── */}
      {completed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <p className="text-sm font-medium text-green-600">
            {lang === 'KO' && '분석이 완료되었습니다! 리포트로 이동합니다...'}
            {lang === 'EN' && 'Analysis complete! Redirecting to your report...'}
            {lang === 'JP' && '分析が完了しました！レポートに移動します...'}
            {lang === 'ZH-CN' && '分析完成！正在跳转到报告页面...'}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
