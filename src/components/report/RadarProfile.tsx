import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { REPORT_TRANSLATIONS, LanguageCode } from '@/utils/translations';

interface RadarProfileProps {
    data: {
        subject: string;
        A: number;
        fullMark: number;
    }[];
    language: LanguageCode;
}

export default function RadarProfile({ data, language }: RadarProfileProps) {
    const t = REPORT_TRANSLATIONS[language]?.radar || REPORT_TRANSLATIONS['EN'].radar;

    // Map the English subject keys to the localized ones
    const localizedData = data.map(item => {
        let localizedSubject = item.subject;
        // Using includes to match partial strings if needed, or exact match
        if (item.subject.includes('Pain')) localizedSubject = t.axes.pain;
        if (item.subject.includes('Downtime')) localizedSubject = t.axes.downtime;
        if (item.subject.includes('Efficacy')) localizedSubject = t.axes.efficacy;
        if (item.subject.includes('Skin Fit')) localizedSubject = t.axes.skinFit;
        if (item.subject.includes('Budget')) localizedSubject = t.axes.budget;

        return { ...item, subject: localizedSubject };
    });

    // Custom tick renderer for the axis labels
    const renderCustomTick = ({ x, y, payload }: any) => {
        return (
            <text x={x} y={y} dy={4} fill="#9ca3af" fontSize={10} textAnchor="middle">
                {payload.value}
            </text>
        );
    };

    return (
        <div className="w-full h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={localizedData}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="subject" tick={renderCustomTick} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                        name="Patient Profile"
                        dataKey="A"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="#3b82f6"
                        fillOpacity={0.3}
                    />
                </RadarChart>
            </ResponsiveContainer>

            {/* Overlay Analysis */}
            <div className="absolute top-2 right-2 text-xs font-mono text-blue-500 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                {t.overlay}
            </div>
        </div>
    );
}
