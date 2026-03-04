import React, { useRef, useEffect, useState } from 'react';

interface KoreaTripPickerProps {
    value: string; // 'YYYY-MM-DD'
    onChange: (date: string) => void;
    language?: string;
}

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_KO = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

const generateDays = (year: number, month: number) => {
    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
};

export default function KoreaTripPicker({ value, onChange, language = 'KO' }: KoreaTripPickerProps) {
    const ITEM_HEIGHT = 40;
    const CONTAINER_HEIGHT = 200;
    const SPACER_HEIGHT = (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2;

    const [selectedYear, setSelectedYear] = useState<number>(0);
    const [selectedMonth, setSelectedMonth] = useState<number>(0); // 1-12
    const [selectedDay, setSelectedDay] = useState<number>(0);

    const yearRef = useRef<HTMLDivElement>(null);
    const monthRef = useRef<HTMLDivElement>(null);
    const dayRef = useRef<HTMLDivElement>(null);

    const isInternalUpdate = useRef(false);

    const currentYear = new Date().getFullYear();
    const years = [currentYear, currentYear + 1, currentYear + 2];

    // Initial parsing
    useEffect(() => {
        if (!value) return;
        const [y, m, d] = value.split('-');
        if (y && m && d) {
            setSelectedYear(Number(y));
            setSelectedMonth(Number(m));
            setSelectedDay(Number(d));
        }
    }, [value]);

    const monthsList = language === 'KO' ? MONTHS_KO : MONTHS_EN;
    const daysList = generateDays(selectedYear || currentYear, selectedMonth || 1);

    // Sync scroll positions initially or when props change
    useEffect(() => {
        if (!selectedYear || !selectedMonth || !selectedDay) return;

        isInternalUpdate.current = true;

        if (yearRef.current) {
            const idx = years.indexOf(selectedYear);
            if (idx >= 0) yearRef.current.scrollTop = idx * ITEM_HEIGHT;
        }
        if (monthRef.current) {
            monthRef.current.scrollTop = (selectedMonth - 1) * ITEM_HEIGHT;
        }
        if (dayRef.current) {
            const safeDay = Math.min(selectedDay, daysList.length);
            dayRef.current.scrollTop = (safeDay - 1) * ITEM_HEIGHT;
        }

        setTimeout(() => { isInternalUpdate.current = false; }, 100);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedYear, selectedMonth, selectedDay]);

    const handleScroll = (type: 'year' | 'month' | 'day', ref: React.RefObject<HTMLDivElement>) => {
        if (!ref.current || isInternalUpdate.current) return;

        const scrollTop = ref.current.scrollTop;
        const index = Math.round(scrollTop / ITEM_HEIGHT);

        let newY = selectedYear;
        let newM = selectedMonth;
        let newD = selectedDay;

        if (type === 'year') {
            const mappedYear = years[Math.min(index, years.length - 1)];
            if (mappedYear !== newY) newY = mappedYear;
        } else if (type === 'month') {
            const mappedMonth = Math.min(index + 1, 12);
            if (mappedMonth !== newM) newM = mappedMonth;
        } else if (type === 'day') {
            const mappedDay = Math.min(index + 1, daysList.length);
            if (mappedDay !== newD) newD = mappedDay;
        }

        if (newY !== selectedYear || newM !== selectedMonth || newD !== selectedDay) {
            const maxDaysInNewMonth = new Date(newY, newM, 0).getDate();
            const safeDay = Math.min(newD, maxDaysInNewMonth);

            // Format to YYYY-MM-DD
            const formatted = `${newY}-${String(newM).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
            onChange(formatted);
        }
    };

    const PickerColumn = ({ items, type, value, listRef }: { items: any[], type: 'year' | 'month' | 'day', value: number, listRef: any }) => {
        return (
            <div
                ref={listRef}
                onScroll={() => {
                    // Slight debounce for smooth selection
                    if (listRef.current?.scrollTimeout) clearTimeout(listRef.current.scrollTimeout);
                    listRef.current.scrollTimeout = setTimeout(() => handleScroll(type, listRef), 100);
                }}
                className="flex-1 h-[200px] overflow-y-scroll snap-y snap-mandatory hide-scrollbar relative picker-col"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                <div style={{ height: SPACER_HEIGHT }} />
                {items.map((item, idx) => {
                    let isSelected = false;
                    if (type === 'year') isSelected = years[idx] === value;
                    if (type === 'month') isSelected = (idx + 1) === value;
                    if (type === 'day') isSelected = (idx + 1) === value;

                    return (
                        <div
                            key={idx}
                            style={{ height: ITEM_HEIGHT }}
                            className={`snap-center flex items-center justify-center transition-all duration-200 cursor-pointer ${isSelected
                                    ? 'text-cyan-400 font-bold bg-white/10 rounded-lg text-lg scale-110'
                                    : 'text-white/50 text-sm hover:text-white/70'
                                }`}
                            onClick={() => {
                                // Fallback click-to-select support
                                if (listRef.current) {
                                    listRef.current.scrollTo({ top: idx * ITEM_HEIGHT, behavior: 'smooth' });
                                }
                            }}
                        >
                            {/* Hide native scrollbar in CSS but add some width */}
                            <span className="select-none">{item}</span>
                        </div>
                    );
                })}
                <div style={{ height: SPACER_HEIGHT }} />
            </div>
        );
    };

    return (
        <div className="relative w-full max-w-sm mx-auto bg-black/40 border border-white/10 rounded-2xl p-2 select-none overflow-hidden">
            <style dangerouslySetInnerHTML={{
                __html: `
                .hide-scrollbar::-webkit-scrollbar { display: none; }
            `}} />

            {/* Center highlight bar for context */}
            <div className="absolute top-1/2 left-0 w-full h-[40px] -translate-y-1/2 border-y border-white/5 pointer-events-none z-0" />

            <div className="flex w-full items-center justify-between relative z-10">
                <PickerColumn items={monthsList} type="month" value={selectedMonth} listRef={monthRef} />
                <PickerColumn items={daysList} type="day" value={selectedDay} listRef={dayRef} />
                <PickerColumn items={years} type="year" value={selectedYear} listRef={yearRef} />
            </div>
        </div>
    );
}
