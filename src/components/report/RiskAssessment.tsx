import { AlertTriangle, Check, XCircle, ShieldCheck } from 'lucide-react';
import { REPORT_TRANSLATIONS, LanguageCode } from '@/utils/translations';

interface RiskFactor {
    level: 'SAFE' | 'CAUTION' | 'DANGER' | 'HIGH' | 'MODERATE' | 'LOW'; // Support both old and new types
    factor: string;
    description: string;
}

interface RiskAssessmentProps {
    risks: RiskFactor[];
    language?: LanguageCode;
}

export default function RiskAssessment({ risks, language = 'EN' }: RiskAssessmentProps) {
    const t = REPORT_TRANSLATIONS[language]?.risks || REPORT_TRANSLATIONS['EN'].risks;

    const getIcon = (level: string) => {
        switch (level) {
            case 'SAFE':
            case 'LOW':
                return <ShieldCheck className="w-5 h-5 text-green-500" />;
            case 'CAUTION':
            case 'MODERATE':
                return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
            case 'DANGER':
            case 'HIGH':
                return <XCircle className="w-5 h-5 text-red-500" />;
            default: return <Check className="w-5 h-5 text-gray-500" />;
        }
    };

    const getLocalizedLevel = (level: string) => {
        switch (level) {
            case 'SAFE':
            case 'LOW':
                return t.safe;
            case 'CAUTION':
            case 'MODERATE':
                return t.caution;
            case 'DANGER':
            case 'HIGH':
                return t.danger;
            default: return level;
        }
    };

    const getColor = (level: string) => {
        switch (level) {
            case 'SAFE':
            case 'LOW':
                return 'bg-green-500/10 text-green-400 border-green-500/20';
            case 'CAUTION':
            case 'MODERATE':
                return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
            case 'DANGER':
            case 'HIGH':
                return 'bg-red-500/10 text-red-400 border-red-500/20';
            default: return 'bg-gray-800 text-gray-400';
        }
    };

    return (
        <div className="w-full">
            <h3 className="text-sm font-mono text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {t.title}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {risks.map((risk, index) => (
                    <div key={index} className={`flex items-start gap-4 p-4 rounded-xl border ${getColor(risk.level)} transition-all hover:bg-opacity-20`}>
                        <div className="mt-0.5">{getIcon(risk.level)}</div>
                        <div>
                            <div className="font-bold text-sm mb-1 tracking-wide">{getLocalizedLevel(risk.level)}: {risk.factor}</div>
                            <div className="text-xs opacity-80">{risk.description}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
