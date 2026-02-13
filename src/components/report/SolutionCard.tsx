import { Check, Zap, Award, Lock, ArrowRight } from 'lucide-react';
import { REPORT_TRANSLATIONS, LanguageCode } from '@/utils/translations';

interface SolutionCardProps {
    id: string;
    rank: number;
    name: string;
    matchScore: number;
    composition: string[];
    description: string;
    tags: string[]; // e.g. "Low Pain", "Zero Downtime"
    isLocked?: boolean;
    language?: LanguageCode;
}

export default function SolutionCard({
    id, rank, name, matchScore, composition, description, tags, isLocked = false, language = 'EN'
}: SolutionCardProps) {
    const t = REPORT_TRANSLATIONS[language]?.solutions || REPORT_TRANSLATIONS['EN'].solutions;

    if (isLocked) {
        return (
            <div className="min-w-[300px] bg-[#0A0A0A] border border-white/5 rounded-xl p-6 relative overflow-hidden group hover:border-blue-500/30 transition-all">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-6">
                    <Lock className="w-8 h-8 text-gray-500 mb-2 group-hover:text-blue-500 transition-colors" />
                    <div className="text-sm font-bold text-gray-400 mb-1">Advanced Protocol</div>
                    <div className="text-xs text-gray-600">Unlock to view details</div>
                </div>

                {/* Background Content (Blurred) */}
                <div className="opacity-20 blur-sm pointer-events-none">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-gray-800 h-4 w-8 rounded"></div>
                        <div className="bg-gray-800 h-4 w-12 rounded"></div>
                    </div>
                    <div className="bg-gray-800 h-6 w-3/4 rounded mb-2"></div>
                    <div className="bg-gray-800 h-4 w-full rounded mb-4"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-w-[320px] bg-[#0A0A0A] border border-white/10 rounded-xl p-6 hover:border-blue-500/50 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-5 h-5 text-blue-500 -rotate-45" />
            </div>

            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-xs font-bold">
                        {rank}
                    </span>
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Protocol ID: {id.slice(-4)}</span>
                </div>
                <div className="flex items-center gap-1 bg-blue-500/10 text-blue-400 px-2 py-1 rounded text-xs font-bold border border-blue-500/20">
                    <Award className="w-3 h-3" />
                    {matchScore}% {t.match}
                </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                {name}
            </h3>

            <div className="flex flex-wrap gap-2 mb-4">
                {composition.map((device, i) => (
                    <span key={i} className="text-xs flex items-center gap-1 text-gray-300 bg-white/5 px-2 py-1 rounded border border-white/5">
                        <Zap className="w-3 h-3 text-yellow-500" />
                        {device}
                    </span>
                ))}
            </div>

            <p className="text-sm text-gray-400 leading-relaxed mb-6 h-10 overflow-hidden text-ellipsis line-clamp-2">
                {description}
            </p>

            <div className="flex flex-wrap gap-2 mt-auto">
                {tags.map((tag, i) => (
                    <span key={i} className="text-[10px] uppercase tracking-wider text-gray-500 border border-gray-800 px-2 py-1 rounded">
                        {tag}
                    </span>
                ))}
            </div>
        </div>
    );
}
