'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LanguageCode } from '@/utils/translations';

interface SkinLayerSectionProps {
    activeLayers: string | string[];
    language?: LanguageCode;
    protocolName?: string;
}

const LAYER_INFO: Record<string, { label: Record<LanguageCode, string>; depth: string; color: string }> = {
    Stratum_Corneum: {
        label: { EN: 'Stratum Corneum', KO: '각질층', JP: '角質層', CN: '角质层' },
        depth: '0.01-0.02mm', color: '#6fe1ff'
    },
    Epidermis: {
        label: { EN: 'Epidermis', KO: '표피층', JP: '表皮', CN: '表皮层' },
        depth: '0.1-0.2mm', color: '#22d3ee'
    },
    DE_Junction: {
        label: { EN: 'DE Junction', KO: '기저막', JP: '基底膜', CN: '基底膜' },
        depth: '0.2-0.3mm', color: '#38bdf8'
    },
    Papillary_Dermis: {
        label: { EN: 'Papillary Dermis', KO: '유두진피', JP: '乳頭真皮', CN: '真皮乳头层' },
        depth: '0.3-0.5mm', color: '#818cf8'
    },
    Reticular_Dermis: {
        label: { EN: 'Reticular Dermis', KO: '망상진피', JP: '網状真皮', CN: '真皮网状层' },
        depth: '0.5-2.0mm', color: '#a78bfa'
    },
    SubQ_Fat: {
        label: { EN: 'SubQ Fat', KO: '피하지방', JP: '皮下脂肪', CN: '皮下脂肪' },
        depth: '2-5mm', color: '#fbbf24'
    },
    SMAS: {
        label: { EN: 'SMAS', KO: 'SMAS층', JP: 'SMAS層', CN: 'SMAS层' },
        depth: '4.5mm', color: '#f87171'
    },
    Muscle: {
        label: { EN: 'Muscle', KO: '근육층', JP: '筋肉層', CN: '肌肉层' },
        depth: '5mm+', color: '#ef4444'
    }
};

const ZONES = [
    { id: 'Stratum_Corneum', points: "84,213 85,246 152,265 218,270 262,277 290,292 342,296 378,294 427,302 496,317 542,311 587,306 649,288 705,278 728,282 791,261 832,255 887,242 893,239 893,239 892,207 805,191 729,184 685,178 622,165 575,160 541,156 495,149 484,145 434,156 359,171 245,184 153,203 85,212 85,212 85,212" },
    { id: 'Epidermis', points: "84,249 157,266 249,277 302,293 341,296 381,292 498,318 581,308 712,279 732,284 797,261 882,246 893,243 895,313 873,300 856,320 852,332 840,325 835,296 822,306 818,335 806,337 794,311 786,307 776,320 770,331 760,336 739,363 707,359 703,339 690,336 682,327 662,346 654,353 635,342 614,371 601,371 594,364 583,378 557,360 546,356 529,384 507,393 477,394 461,375 441,354 413,375 400,379 386,349 374,336 354,360 341,350 324,368 293,367 276,357 271,339 250,343 238,329 227,313 210,317 203,339 191,344 183,331 171,321 159,323 146,329 138,310 126,296 112,295 97,314 83,309 85,277 88,249" },
    { id: 'DE_Junction', points: "83,309 98,314 117,301 139,320 148,335 169,329 196,350 218,321 246,342 266,345 296,371 323,371 349,360 381,349 397,380 428,372 441,364 456,381 474,393 492,396 511,395 526,390 533,387 544,373 553,366 560,370 570,374 583,378 593,374 605,373 611,375 622,368 637,354 641,351 650,356 661,353 664,344 670,336 678,331 686,334 693,341 700,343 708,353 721,361 726,361 737,365 746,360 754,352 766,343 773,336 776,328 780,321 786,315 786,314 791,320 794,324 801,330 809,334 821,325 826,309 834,299 847,322 851,328 861,308 871,296 886,304 892,314 889,316 873,313 866,313 862,328 849,334 832,328 828,322 822,337 809,342 796,341 790,335 784,344 776,352 768,358 760,366 751,371 744,373 734,375 722,375 712,372 701,365 691,356 683,347 676,353 668,360 657,364 647,368 640,367 632,373 625,379 613,382 594,385 585,388 577,389 564,386 555,382 548,388 540,396 533,401 518,406 500,408 486,408 472,404 460,397 453,392 443,384 434,386 421,387 407,390 392,392 388,382 384,372 381,363 374,365 367,368 349,371 346,372 341,374 334,377 324,380 312,380 295,379 281,370 268,359 253,352 232,344 218,342 207,352 191,360 171,347 163,341 153,347 141,345 135,338 127,327 119,318 112,323 106,332 92,332 83,331 81,316" },
    { id: 'Papillary_Dermis', points: "88,336 106,331 123,329 140,344 149,350 166,352 176,357 200,354 212,347 238,352 257,359 275,367 291,377 300,380 341,379 353,373 382,368 395,394 418,392 440,388 458,395 476,406 496,408 512,407 534,402 548,394 560,392 583,393 612,387 640,381 662,367 684,358 703,371 732,375 760,371 780,353 791,343 823,346 834,328 858,331 868,323 880,315 889,320 891,351 892,377 506,453 90,384 87,336" },
    { id: 'Reticular_Dermis', points: "88,388 500,456 893,379 886,616 515,736 98,624 89,387" },
    { id: 'SubQ_Fat', points: "98,629 486,740 886,628 892,746 515,877 92,759 89,632" },
    { id: 'SMAS', points: "90,761 508,883 889,758 893,769 512,902 88,773 89,759" },
    { id: 'Muscle', points: "87,778 505,907 892,775 890,824 507,970 88,830 88,776" }
];

export default function SkinLayerSection({ activeLayers = [], language = 'EN', protocolName }: SkinLayerSectionProps) {
    const [hoveredLayer, setHoveredLayer] = useState<string | null>(null);
    const active = Array.isArray(activeLayers) ? activeLayers : (typeof activeLayers === 'string' ? [activeLayers] : []);

    const TITLE: Record<LanguageCode, string> = {
        EN: 'DEPTH PENETRATION SCAN',
        KO: '침투 깊이 분석',
        JP: 'ターゲット深度',
        CN: '目标深度',
    };

    return (
        <div className="flex flex-col h-full bg-[#03060A] rounded-2xl border border-white/5 overflow-hidden shadow-[0_0_50px_rgba(0,255,255,0.02)_inset]">
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-md relative z-20">
                <div className="flex flex-col">
                    <span className="text-[10px] font-mono tracking-[0.2em] text-[#00F0FF] flex items-center gap-2 font-bold uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse" />
                        {TITLE[language] || TITLE.EN}
                    </span>
                    <span className="text-[8px] text-white/30 font-mono mt-0.5 tracking-widest uppercase">Targeting Optimization</span>
                </div>
                {protocolName && (
                    <span className="text-[9px] font-mono text-white/40 italic uppercase">{protocolName}</span>
                )}
            </div>

            {/* Interactive 3D Skin Map Area */}
            <div className="flex-1 relative flex items-center justify-center p-4 bg-black overflow-hidden">
                <div className="relative w-full aspect-square max-w-[400px]">
                    {/* Base Image */}
                    <img
                        src="/images/concepts/skin_layer_blueprint.png"
                        alt="3D Skin Cross-section"
                        className="w-full h-full object-cover opacity-90 transition-all duration-1000"
                        style={{ filter: active.length > 0 ? 'brightness(0.8) contrast(1.1)' : 'brightness(0.6) grayscale(0.5)' }}
                    />

                    {/* Dark gradient mask */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-40 pointer-events-none" />

                    {/* SVG Precision Overlays */}
                    <svg
                        viewBox="0 0 1000 1000"
                        className="absolute inset-0 w-full h-full cursor-pointer z-20"
                    >
                        <defs>
                            <filter id="activeGlow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="8" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </defs>

                        {ZONES.map((zone) => {
                            const info = LAYER_INFO[zone.id];
                            const isExternalActive = active.includes(zone.id);
                            // Mapping legacy broad categories if needed
                            const isDermisActive = active.includes('Dermis') && (zone.id === 'Papillary_Dermis' || zone.id === 'Reticular_Dermis' || zone.id === 'DE_Junction');
                            const isEpidermisActive = active.includes('Epidermis') && (zone.id === 'Stratum_Corneum' || zone.id === 'Epidermis');

                            const isActive = isExternalActive || isDermisActive || isEpidermisActive || hoveredLayer === zone.id;

                            return (
                                <g
                                    key={zone.id}
                                    onMouseEnter={() => setHoveredLayer(zone.id)}
                                    onMouseLeave={() => setHoveredLayer(null)}
                                >
                                    <polygon
                                        points={zone.points}
                                        fill={isActive ? info.color : "transparent"}
                                        fillOpacity={isActive ? (hoveredLayer === zone.id ? 0.4 : 0.25) : 0}
                                        stroke={isActive ? info.color : "rgba(255,255,255,0.03)"}
                                        strokeWidth={isActive ? "3" : "0.5"}
                                        filter={isActive ? "url(#activeGlow)" : "none"}
                                        className="transition-all duration-500 ease-out"
                                    />

                                    {/* Tooltip on hover */}
                                    {hoveredLayer === zone.id && (
                                        <g>
                                            <rect x="100" y="50" width="280" height="60" rx="8" fill="black" stroke={info.color} strokeWidth="2" opacity="0.9" />
                                            <text x="120" y="85" fill="white" fontSize="24" fontFamily="monospace" fontWeight="bold">
                                                {info.label[language] || info.label.EN}
                                            </text>
                                            <text x="120" y="105" fill={info.color} fontSize="16" fontFamily="monospace">
                                                DEPTH: {info.depth}
                                            </text>
                                        </g>
                                    )}
                                </g>
                            );
                        })}
                    </svg>

                    {/* HUD Scan Line for depth penetration feeling */}
                    {active.length > 0 && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            <motion.div
                                animate={{ y: [0, 400, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                className="w-full h-[1px] bg-[#00F0FF]/30 blur-[2px]"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Depth Legend Bar */}
            <div className="px-5 py-3 border-t border-white/5 bg-black/60 flex flex-wrap gap-x-4 gap-y-2 z-20">
                {Object.entries(LAYER_INFO).slice(1, 8).map(([id, info]) => {
                    // Check if this layer or its parent is active
                    const isDirectActive = active.includes(id);
                    const isParentActive = (active.includes('Dermis') && (id === 'Papillary_Dermis' || id === 'Reticular_Dermis')) ||
                        (active.includes('Epidermis') && id === 'Epidermis');
                    const isActive = isDirectActive || isParentActive;

                    return (
                        <motion.div
                            key={id}
                            className="flex items-center gap-1.5"
                            style={{ opacity: isActive ? 1 : 0.3 }}
                        >
                            <div className="w-2 h-2 rounded-full" style={{ background: info.color, boxShadow: isActive ? `0 0 8px ${info.color}` : 'none' }} />
                            <span className="text-[8px] font-mono text-white tracking-widest uppercase">
                                {info.label[language] || info.label.EN}
                            </span>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
