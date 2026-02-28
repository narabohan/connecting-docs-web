import { REPORT_TRANSLATIONS, LanguageCode } from '@/utils/translations';
import { Activity, Clock, DollarSign, Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface ConstraintSelectorsProps {
    pain: number; // 1 | 2 | 3
    setPain: (val: number) => void;
    downtime: number; // 1 | 2 | 3
    setDowntime: (val: number) => void;
    budget: number; // 1 | 2 | 3
    setBudget: (val: number) => void;
    language: LanguageCode;
}

export default function ConstraintSelectors({
    pain, setPain,
    downtime, setDowntime,
    budget, setBudget,
    language
}: ConstraintSelectorsProps) {
    const t = (REPORT_TRANSLATIONS[language]?.simulation || REPORT_TRANSLATIONS['EN'].simulation).constraints;

    return (
        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 flex flex-col gap-8 h-full">
            {/* Pain */}
            <SelectorGroup
                title={t.pain.title}
                icon={<Activity className="w-4 h-4 text-red-400" />}
                options={t.pain.options}
                value={pain}
                setValue={setPain}
                colorClass="red"
            />

            {/* Downtime */}
            <SelectorGroup
                title={t.downtime.title}
                icon={<Clock className="w-4 h-4 text-blue-400" />}
                options={t.downtime.options}
                value={downtime}
                setValue={setDowntime}
                colorClass="blue"
            />

            {/* Budget */}
            <SelectorGroup
                title={t.budget.title}
                icon={<DollarSign className="w-4 h-4 text-yellow-400" />}
                options={t.budget.options}
                value={budget}
                setValue={setBudget}
                colorClass="yellow"
            />
        </div>
    );
}

const SelectorGroup = ({ title, icon, options, value, setValue, colorClass }: any) => {
    return (
        <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {icon}
                {title}
            </h3>
            <div className="space-y-2">
                {options.map((opt: string, idx: number) => {
                    const step = idx + 1;
                    const isActive = value === step;

                    let bgClass = "bg-white/5 border-white/10 hover:bg-white/10";
                    let textClass = "text-gray-400";

                    if (isActive) {
                        textClass = "text-white font-bold";
                        if (colorClass === 'red') bgClass = "bg-red-500/20 border-red-500 text-red-400";
                        if (colorClass === 'blue') bgClass = "bg-blue-500/20 border-blue-500 text-blue-400";
                        if (colorClass === 'yellow') bgClass = "bg-yellow-500/20 border-yellow-500 text-yellow-400";
                    }

                    return (
                        <motion.button
                            key={idx}
                            onClick={() => setValue(step)}
                            className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all flex justify-between items-center ${bgClass}`}
                            whileTap={{ scale: 0.98 }}
                        >
                            <span className={textClass}>{opt}</span>
                            {isActive && <Check className="w-4 h-4" />}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};
