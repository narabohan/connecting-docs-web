import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// ============================================================================
// Types & Interfaces
// ============================================================================

type SurveyPhase = 'step0' | 'conversation' | 'analyzing' | 'done';

interface ConversationalSurveyProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (runId: string) => void;
  userId?: string;
  userEmail?: string;
  language?: 'KO' | 'EN';
}

interface Demographics {
  country: string;
  countryName: string;
  age_range: '20s' | '30s' | '40s' | '50s+';
  gender: 'female' | 'male' | 'other';
}

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
}

interface SurveyMessage {
  role: 'assistant' | 'user';
  content: string;
}

interface SurveyChatRequest {
  messages: SurveyMessage[];
  signalState: Record<string, unknown> | null;
  demographics: Demographics;
  language: 'KO' | 'EN';
}

// Matches /api/survey-chat response shape exactly
interface SurveyResponse {
  message: string;                      // field is 'message', not 'content'
  signal_state: Record<string, unknown> & {
    recommendation_ready?: boolean;
    triggered_protocols?: string[];
    primary_concern?: string | null;
    secondary_concern?: string | null;
    downtime_tolerance?: string | null;
    budget_level?: string | null;
    treatment_history?: string | null;
    turn_count?: number;
  };
  wizard_data?: Record<string, unknown> | null;
  choice_options?: string[];            // tappable choice chips
}

// Country data with flags and translations
const COUNTRIES = [
  { code: 'KR', name: 'Korea', nameKO: '한국', flag: '🇰🇷' },
  { code: 'US', name: 'USA', nameKO: 'USA', flag: '🇺🇸' },
  { code: 'JP', name: 'Japan', nameKO: 'Japan', flag: '🇯🇵' },
  { code: 'CN', name: 'China', nameKO: 'China', flag: '🇨🇳' },
  { code: 'TW', name: 'Taiwan', nameKO: 'Taiwan', flag: '🇹🇼' },
  { code: 'SG', name: 'Singapore', nameKO: 'Singapore', flag: '🇸🇬' },
  { code: 'TH', name: 'Thailand', nameKO: 'Thailand', flag: '🇹🇭' },
  { code: 'AU', name: 'Australia', nameKO: 'Australia', flag: '🇦🇺' },
  { code: 'GB', name: 'UK', nameKO: 'UK', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', nameKO: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', nameKO: 'France', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', nameKO: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', nameKO: 'Spain', flag: '🇪🇸' },
  { code: 'BR', name: 'Brazil', nameKO: 'Brazil', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', nameKO: 'Mexico', flag: '🇲🇽' },
];

const i18n = {
  KO: {
    step0Title: '맞춤 피부 진단 상담',
    step0Subtitle: '여러분의 피부 정보를 알려주세요',
    countryLabel: '국가 선택',
    ageLabel: '나이대',
    genderLabel: '성별',
    female: '여성',
    male: '남성',
    other: '기타',
    startBtn: '상담 시작하기',
    typingDefault: '안녕하세요! 피부 고민에 대해 편하게 말씀해 주세요 😊',
    analyzing: 'AI 분석 중...',
    sendBtn: '전송',
    placeholder: '입력...',
    errorMessage: '오류가 발생했습니다. 다시 시도해주세요.',
  },
  EN: {
    step0Title: 'Personalized Skin Consultation',
    step0Subtitle: 'Please share your information',
    countryLabel: 'Country',
    ageLabel: 'Age Range',
    genderLabel: 'Gender',
    female: 'Female',
    male: 'Male',
    other: 'Other',
    startBtn: 'Start Consultation',
    typingDefault: 'Hello! Please feel free to tell us about your skin concerns 😊',
    analyzing: 'Analyzing...',
    sendBtn: 'Send',
    placeholder: 'Type here...',
    errorMessage: 'An error occurred. Please try again.',
  },
};

// ============================================================================
// Step 0 — Demographics Frame
// ============================================================================

interface Step0FrameProps {
  demographics: Demographics;
  onDemographicsChange: (d: Demographics) => void;
  onStart: () => void;
  language: 'KO' | 'EN';
  loading?: boolean;
}

const Step0Frame: React.FC<Step0FrameProps> = ({
  demographics,
  onDemographicsChange,
  onStart,
  language,
  loading = false,
}) => {
  const t = i18n[language];

  const handleCountryChange = (code: string) => {
    const country = COUNTRIES.find((c) => c.code === code);
    if (country) {
      onDemographicsChange({
        ...demographics,
        country: code,
        countryName: country.name,
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md"
    >
      <div className="bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t.step0Title}
          </h2>
          <p className="text-sm text-gray-600">{t.step0Subtitle}</p>
        </div>

        {/* Country Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            {t.countryLabel}
          </label>
          <div className="relative">
            <select
              value={demographics.country}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 pr-10 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {language === 'KO' ? c.nameKO : c.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-600">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Age Range */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            {t.ageLabel}
          </label>
          <div className="flex gap-3">
            {(['20s', '30s', '40s', '50s+'] as const).map((age) => (
              <button
                key={age}
                onClick={() =>
                  onDemographicsChange({ ...demographics, age_range: age })
                }
                className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all text-sm ${
                  demographics.age_range === age
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {age}
              </button>
            ))}
          </div>
        </div>

        {/* Gender */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            {t.genderLabel}
          </label>
          <div className="flex gap-3">
            {[
              { value: 'female' as const, label: t.female },
              { value: 'male' as const, label: t.male },
              { value: 'other' as const, label: t.other },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() =>
                  onDemographicsChange({ ...demographics, gender: value })
                }
                className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all text-sm ${
                  demographics.gender === value
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={onStart}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              <span>{i18n[language].analyzing}</span>
            </div>
          ) : (
            t.startBtn
          )}
        </button>
      </div>
    </motion.div>
  );
};

// ============================================================================
// Typing Animation Component
// ============================================================================

interface TypingIndicatorProps {
  isVisible: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-gray-400 rounded-full"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1.4,
            delay: i * 0.2,
            repeat: Infinity,
          }}
        />
      ))}
    </div>
  );
};

// ============================================================================
// Message Bubble Component
// ============================================================================

interface MessageBubbleProps {
  message: Message;
  isNew?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isNew }) => {
  const isAssistant = message.role === 'assistant';

  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 10 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} mb-4`}
    >
      <div
        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl break-words text-sm ${
          isAssistant
            ? 'bg-blue-50 text-gray-800 rounded-tl-none'
            : 'bg-blue-600 text-white rounded-tr-none'
        }`}
      >
        {message.content}
      </div>
    </motion.div>
  );
};

// ============================================================================
// Choice Chips — Tappable A/B/C options below AI messages
// ============================================================================

interface ChoiceChipsProps {
  choices: string[];
  onSelect: (choice: string) => void;
  disabled?: boolean;
}

const ChoiceChips: React.FC<ChoiceChipsProps> = ({ choices, onSelect, disabled }) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="flex flex-wrap gap-2 mt-2 ml-2 mb-2"
  >
    {choices.map((choice, i) => (
      <button
        key={i}
        onClick={() => !disabled && onSelect(choice)}
        disabled={disabled}
        className="px-4 py-2 bg-white border-2 border-blue-200 hover:border-blue-500 hover:bg-blue-50
          text-blue-700 text-sm font-medium rounded-xl transition-all duration-150
          active:scale-95 disabled:opacity-40 min-h-[44px]"
      >
        {choice}
      </button>
    ))}
  </motion.div>
);

// ============================================================================
// Lentigo Multi-Select Checkbox Panel
// ============================================================================

interface LentigoCheckboxProps {
  language: 'KO' | 'EN';
  onSubmit: (answer: string) => void;
  disabled?: boolean;
}

const LENTIGO_OPTIONS_KO = [
  '10년 이상 된 흑자예요',
  '여름/햇볕 후 더 진해져요',
  '가족력이 있어요',
  '레이저 치료를 해본 적 있어요',
  '기미와 혼재되어 있어요',
  '색이 불균일해요',
];

const LENTIGO_OPTIONS_EN = [
  'Present for 10+ years',
  'Darkens after sun exposure',
  'Family history',
  'Prior laser treatment',
  'Mixed with melasma',
  'Irregular color pattern',
];

const LentigoCheckbox: React.FC<LentigoCheckboxProps> = ({ language, onSubmit, disabled }) => {
  const [selected, setSelected] = React.useState<Set<number>>(new Set());
  const options = language === 'KO' ? LENTIGO_OPTIONS_KO : LENTIGO_OPTIONS_EN;

  const toggle = (i: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const handleSubmit = () => {
    const chosen = options.filter((_, i) => selected.has(i));
    if (chosen.length === 0) return;
    onSubmit(chosen.join(', '));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-2 mb-3 bg-amber-50 border border-amber-200 rounded-xl p-4"
    >
      <p className="text-sm font-semibold text-amber-800 mb-3">
        {language === 'KO' ? '🔍 흑자 상세 정보 (해당하는 것 모두 선택)' : '🔍 Lentigo Details (select all that apply)'}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all min-h-[44px]
              ${selected.has(i)
                ? 'bg-amber-300 text-amber-900 font-semibold border-2 border-amber-400'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-amber-300'
              }`}
          >
            <span className="text-lg flex-shrink-0">{selected.has(i) ? '☑' : '☐'}</span>
            <span className="leading-tight">{opt}</span>
          </button>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        disabled={selected.size === 0 || disabled}
        className="mt-3 w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300
          text-white font-semibold rounded-lg text-sm transition-colors"
      >
        {language === 'KO' ? `선택 완료 (${selected.size}개)` : `Submit (${selected.size} selected)`}
      </button>
    </motion.div>
  );
};

// ============================================================================
// Signal Panel — Live progress display
// ============================================================================

interface SignalPanelProps {
  signalState: Record<string, unknown> | null;
  language: 'KO' | 'EN';
}

const SignalPanel: React.FC<SignalPanelProps> = ({ signalState, language }) => {
  if (!signalState) return (
    <div className="p-4 text-gray-400 text-xs text-center mt-8">
      {language === 'KO' ? '상담을 시작하면 분석 신호가 나타납니다' : 'Signals will appear as you chat'}
    </div>
  );

  const s = signalState as any;
  const turnCount = (s.turn_count as number) || 0;
  const estTotal = 6;
  const progress = Math.min(Math.round((turnCount / estTotal) * 100), 95);

  const labelKO: Record<string, string> = {
    primary_concern: '주요 고민',
    secondary_concern: '2차 고민',
    downtime_tolerance: '다운타임',
    budget_level: '예산',
    treatment_history: '시술 이력',
  };
  const labelEN: Record<string, string> = {
    primary_concern: 'Main concern',
    secondary_concern: '2nd concern',
    downtime_tolerance: 'Downtime',
    budget_level: 'Budget',
    treatment_history: 'Tx history',
  };

  const fields = ['primary_concern', 'secondary_concern', 'downtime_tolerance', 'budget_level', 'treatment_history'];
  const labels = language === 'KO' ? labelKO : labelEN;

  const protocols = (s.triggered_protocols as string[]) || [];

  return (
    <div className="p-4 flex flex-col gap-4 overflow-y-auto">
      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{language === 'KO' ? '상담 진행도' : 'Progress'}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-blue-500 rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Signal values */}
      <div className="space-y-2">
        {fields.map(field => {
          const val = s[field];
          const hasVal = val !== null && val !== undefined && val !== '';
          return (
            <div key={field} className="flex flex-col">
              <span className="text-xs text-gray-400 uppercase tracking-wide">{labels[field]}</span>
              <span className={`text-sm font-medium mt-0.5 truncate ${hasVal ? 'text-gray-800' : 'text-gray-300'}`}>
                {hasVal ? String(val) : '—'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Triggered protocols */}
      {protocols.length > 0 && (
        <div>
          <span className="text-xs text-gray-400 uppercase tracking-wide block mb-1">
            {language === 'KO' ? '감지된 프로토콜' : 'Protocols'}
          </span>
          <div className="flex flex-wrap gap-1">
            {protocols.map((p: string) => (
              <span key={p} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Readiness indicator */}
      {s.recommendation_ready && (
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="bg-green-50 border border-green-200 rounded-lg p-3 text-center"
        >
          <div className="text-green-600 font-bold text-sm">
            {language === 'KO' ? '✓ 분석 준비 완료' : '✓ Ready to analyze'}
          </div>
        </motion.div>
      )}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const ConversationalSurvey: React.FC<ConversationalSurveyProps> = ({
  isOpen,
  onClose,
  onComplete,
  userId,
  userEmail,
  language = 'KO',
}) => {
  const t = i18n[language];

  // State management
  const [phase, setPhase] = useState<SurveyPhase>('step0');
  const [demographics, setDemographics] = useState<Demographics>({
    country: 'KR',
    countryName: 'Korea',
    age_range: '30s',
    gender: 'female',
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);
  const [signalState, setSignalState] = useState<Record<string, unknown> | null>(
    null
  );
  const [wizardData, setWizardData] = useState<Record<string, unknown> | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [currentChoices, setCurrentChoices] = useState<string[] | null>(null);
  const [lentigoPanelActive, setLentigoPanelActive] = useState(false);
  const [lentigoPanelDone, setLentigoPanelDone] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-detect country on mount
  useEffect(() => {
    if (!isOpen) return;

    const detectCountry = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error('Geolocation failed');

        const data = await response.json();
        const code = data.country_code || 'KR';
        const name = data.country_name || 'Korea';

        const country = COUNTRIES.find((c) => c.code === code) || COUNTRIES[0];
        setDemographics((prev) => ({
          ...prev,
          country: country.code,
          countryName: country.name,
        }));
      } catch (err) {
        console.warn('Country detection failed, defaulting to Korea:', err);
        // Default to Korea on error
        setDemographics((prev) => ({
          ...prev,
          country: 'KR',
          countryName: 'Korea',
        }));
      }
    };

    detectCountry();
  }, [isOpen]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoadingMessage]);

  // Initialize conversation when entering conversation phase
  useEffect(() => {
    if (phase === 'conversation' && messages.length === 0) {
      initializeConversation();
    }
  }, [phase]);

  // Initialize conversation with first assistant message
  const initializeConversation = async () => {
    setIsLoadingMessage(true);
    setError(null);

    try {
      const response = await fetch('/api/survey-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [],
          signalState: null,
          demographics,
          language,
        } as SurveyChatRequest),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: SurveyResponse = await response.json();

      // Add assistant's first message
      const assistantMsg: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: data.message,           // was: data.content
        timestamp: new Date(),
      };

      setMessages([assistantMsg]);
      setSignalState(data.signal_state);
      setCurrentChoices(data.choice_options || null);

      // Detect lentigo context from triggered protocols
      const protocols = data.signal_state?.triggered_protocols || [];
      if (protocols.includes('PROTO_06') && !lentigoPanelDone) {
        setLentigoPanelActive(true);
      }

      // Check if recommendation is ready after first message
      if (data.signal_state?.recommendation_ready && data.wizard_data) {
        setWizardData(data.wizard_data);
        setPhase('analyzing');
      }
    } catch (err) {
      console.error('Failed to initialize conversation:', err);
      setError(t.errorMessage);
      setPhase('step0');
    } finally {
      setIsLoadingMessage(false);
    }
  };

  // Handle choice chip tap — inject choice as user message
  const handleChoiceSelect = useCallback((choice: string) => {
    setCurrentChoices(null);   // dismiss chips immediately
    setInputValue(choice);
    // Use a micro-delay so state updates before send
    setTimeout(() => {
      // Manually trigger send with the choice value
      setInputValue('');
      // Build and send directly to avoid stale closure
      const sendChoice = async () => {
        setError(null);
        const userMsg: Message = {
          id: `msg-${Date.now()}`,
          role: 'user',
          content: choice,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMsg]);
        setIsLoadingMessage(true);

        try {
          const surveyMessages = messages.map(m => ({ role: m.role, content: m.content })) as SurveyMessage[];
          surveyMessages.push({ role: 'user', content: choice });

          const response = await fetch('/api/survey-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: surveyMessages, signalState, demographics, language }),
          });
          if (!response.ok) throw new Error(`API error: ${response.status}`);
          const data: SurveyResponse = await response.json();

          const assistantMsg: Message = {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: data.message,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, assistantMsg]);
          setSignalState(data.signal_state);
          setCurrentChoices(data.choice_options || null);

          const protocols = data.signal_state?.triggered_protocols || [];
          if (protocols.includes('PROTO_06') && !lentigoPanelDone) {
            setLentigoPanelActive(true);
          }

          if (data.signal_state?.recommendation_ready && data.wizard_data) {
            setWizardData(data.wizard_data);
            setPhase('analyzing');
          }
        } catch (err) {
          console.error('Choice send error:', err);
          setError(t.errorMessage);
        } finally {
          setIsLoadingMessage(false);
        }
      };
      sendChoice();
    }, 10);
  }, [messages, signalState, demographics, language, lentigoPanelDone, t]);

  // Handle lentigo checkbox submission
  const handleLentigoSubmit = useCallback((answer: string) => {
    setLentigoPanelActive(false);
    setLentigoPanelDone(true);
    // Inject as user message
    handleChoiceSelect(answer);
  }, [handleChoiceSelect]);

  // Handle user message submission
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoadingMessage) return;

    setError(null);
    setCurrentChoices(null);  // clear chips on manual send

    // Add user message to chat
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoadingMessage(true);

    try {
      // Prepare API request with full message history
      const surveyMessages: SurveyMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      surveyMessages.push({
        role: 'user',
        content: inputValue,
      });

      const response = await fetch('/api/survey-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: surveyMessages,
          signalState,
          demographics,
          language,
        } as SurveyChatRequest),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: SurveyResponse = await response.json();

      // Add assistant's response
      const assistantMsg: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: data.message,           // was: data.content
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setSignalState(data.signal_state);
      setCurrentChoices(data.choice_options || null);

      // Detect lentigo context
      const protocols = data.signal_state?.triggered_protocols || [];
      if (protocols.includes('PROTO_06') && !lentigoPanelDone) {
        setLentigoPanelActive(true);
      }

      // Check if recommendation is ready — only transition if wizard_data exists
      if (data.signal_state?.recommendation_ready && data.wizard_data) {
        setWizardData(data.wizard_data);
        setPhase('analyzing');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(t.errorMessage);
    } finally {
      setIsLoadingMessage(false);
    }
  }, [inputValue, messages, signalState, demographics, language, isLoadingMessage, lentigoPanelDone, t]);

  // Handle analyze phase
  useEffect(() => {
    if (phase !== 'analyzing' || !wizardData) return;

    const analyzeData = async () => {
      try {
        const response = await fetch('/api/engine/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...wizardData,
            userId,
            userEmail,
            language,  // pass language so background function & report API can detect it
          }),
        });

        if (!response.ok) {
          throw new Error(`Analysis failed: ${response.status}`);
        }

        const result = await response.json();
        const runId = result.runId || result.id;

        if (!runId) {
          throw new Error('No runId returned from analysis');
        }

        // Notify parent of completion
        onComplete(runId);

        // Optionally redirect (parent typically handles this)
        // router.push(`/report/${runId}`);
      } catch (err) {
        console.error('Analysis error:', err);
        setError(t.errorMessage);
        setPhase('conversation');
      }
    };

    analyzeData();
  }, [phase, wizardData, userId, userEmail, onComplete, t]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && phase === 'conversation') {
        e.preventDefault();
        handleSendMessage();
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSendMessage, phase, onClose]);

  // Focus input when conversation starts
  useEffect(() => {
    if (phase === 'conversation') {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [phase]);

  // Render: Closed modal
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full h-full max-w-4xl max-h-screen lg:max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col relative"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex">
              {/* Main chat column */}
              <div className="flex-1 overflow-hidden flex flex-col">
                {/* Step 0 */}
                {phase === 'step0' && (
                  <div className="flex-1 flex items-center justify-center p-6">
                    <Step0Frame
                      demographics={demographics}
                      onDemographicsChange={setDemographics}
                      onStart={() => setPhase('conversation')}
                      language={language}
                      loading={isLoadingMessage}
                    />
                  </div>
                )}

                {/* Conversation Phase */}
                {phase === 'conversation' && (
                  <>
                    {/* Message Area */}
                    <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                      {messages.map((msg, idx) => {
                        const isLast = idx === messages.length - 1;
                        const isAssistant = msg.role === 'assistant';
                        return (
                          <div key={msg.id}>
                            <MessageBubble message={msg} isNew={isLast} />
                            {/* Choice chips below the last assistant message */}
                            {isAssistant && isLast && currentChoices && !isLoadingMessage && (
                              <ChoiceChips
                                choices={currentChoices}
                                onSelect={handleChoiceSelect}
                                disabled={isLoadingMessage}
                              />
                            )}
                          </div>
                        );
                      })}

                      {/* Lentigo multi-select checkbox */}
                      {lentigoPanelActive && !isLoadingMessage && (
                        <LentigoCheckbox
                          language={language}
                          onSubmit={handleLentigoSubmit}
                          disabled={isLoadingMessage}
                        />
                      )}

                      {/* Typing Indicator */}
                      {isLoadingMessage && <TypingIndicator isVisible={true} />}

                      {/* Error Message */}
                      {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                          {error}
                        </div>
                      )}

                      {/* Scroll Anchor */}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="border-t border-gray-200 bg-gray-50 p-4">
                      <div className="flex gap-3">
                        <input
                          ref={inputRef}
                          type="text"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          placeholder={t.placeholder}
                          disabled={isLoadingMessage}
                          className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200 transition"
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={!inputValue.trim() || isLoadingMessage}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold px-5 py-2 rounded-xl transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </>
                )}

              {/* Analyzing Phase */}
              {phase === 'analyzing' && (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center w-full max-w-sm">
                    {/* Animated DNA/scan icon */}
                    <div className="relative w-20 h-20 mx-auto mb-6">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        className="w-20 h-20 border-4 border-blue-100 border-t-blue-500 rounded-full absolute inset-0"
                      />
                      <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="w-12 h-12 border-4 border-blue-200 border-b-blue-600 rounded-full absolute inset-4"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl">🔬</span>
                      </div>
                    </div>

                    <p className="text-gray-800 font-bold text-lg mb-1">
                      {language === 'KO' ? 'AI 피부 분석 중...' : 'Analyzing your skin profile...'}
                    </p>
                    <p className="text-gray-500 text-sm mb-6">
                      {language === 'KO'
                        ? '맞춤 시술 계획을 준비하고 있어요. 약 30초 소요됩니다.'
                        : 'Preparing your personalized treatment plan. About 30 seconds.'}
                    </p>

                    {/* Step progress indicators */}
                    <div className="space-y-2 text-left">
                      {(language === 'KO' ? [
                        '상담 내용 분석 완료 ✓',
                        '임상 데이터베이스 매칭 중...',
                        '맞춤 시술 조합 생성 중...',
                      ] : [
                        'Survey analysis complete ✓',
                        'Matching clinical database...',
                        'Generating treatment plan...',
                      ]).map((step, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.8, duration: 0.4 }}
                          className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                            i === 0
                              ? 'bg-green-50 text-green-700'
                              : 'bg-blue-50 text-blue-600'
                          }`}
                        >
                          {i === 0 ? (
                            <span className="text-green-500">✓</span>
                          ) : (
                            <motion.span
                              animate={{ opacity: [1, 0.3, 1] }}
                              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.4 }}
                            >⚡</motion.span>
                          )}
                          {step}
                        </motion.div>
                      ))}
                    </div>

                    <p className="text-gray-400 text-xs mt-5">
                      {language === 'KO'
                        ? '분석이 완료되면 자동으로 리포트 페이지로 이동합니다'
                        : 'You will be redirected to your report automatically'}
                    </p>
                  </div>
                </div>
              )}
            </div>{/* /main chat column */}

            {/* Signal Panel — desktop only, shown during conversation */}
            {phase === 'conversation' && (
              <div className="hidden lg:flex w-60 border-l border-gray-100 flex-col bg-gray-50 overflow-hidden">
                <div className="p-3 border-b border-gray-100 bg-white flex-shrink-0">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {language === 'KO' ? '상담 신호' : 'Signals'}
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <SignalPanel signalState={signalState} language={language} />
                </div>
              </div>
            )}
          </div>{/* /outer flex */}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConversationalSurvey;
