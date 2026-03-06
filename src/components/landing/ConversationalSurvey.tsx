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
  };
  wizard_data?: Record<string, unknown> | null;
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
      setSignalState(data.signal_state); // was: data.signalState

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

  // Handle user message submission
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoadingMessage) return;

    setError(null);

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
      setSignalState(data.signal_state); // was: data.signalState

      // Check if recommendation is ready — only transition if wizard_data exists
      // (If survey-chat fails, recommendation_ready may be true but wizard_data null
      //  which would cause infinite 'analyzing' screen with no action)
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
  }, [inputValue, messages, signalState, demographics, language, isLoadingMessage, t]);

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
            className="w-full h-full max-w-2xl max-h-screen lg:max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col relative"
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
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.map((msg, idx) => (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        isNew={idx === messages.length - 1}
                      />
                    ))}

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
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold px-6 py-2 rounded-xl transition-colors"
                      >
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
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Analyzing Phase */}
              {phase === 'analyzing' && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"
                    />
                    <p className="text-gray-700 font-semibold text-lg">
                      {t.analyzing}
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      {language === 'KO'
                        ? '데이터 분석 중입니다...'
                        : 'Processing your data...'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConversationalSurvey;
