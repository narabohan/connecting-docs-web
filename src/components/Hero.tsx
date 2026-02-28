import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Activity, BarChart3, Fingerprint, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Hero() {
    const [typedText, setTypedText] = useState('');
    const codeText = "SIG-LMD-702";

    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            setTypedText(codeText.slice(0, i + 1));
            i++;
            if (i > codeText.length) clearInterval(interval);
        }, 150);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-[#0A0A0A]">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-900/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-900/10 rounded-full blur-[150px]" />
            </div>

            <div className="container mx-auto px-6 z-10 grid md:grid-cols-2 gap-12 items-center">
                {/* Left: Text Content */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-left"
                >
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1] text-white">
                        Stop Guessing. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
                            Start Designing.
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-gray-400 mb-10 leading-relaxed max-w-lg">
                        The Global Medical Intelligence Platform. Don't look for the cheapest machine. Find the Master who understands your clinical logic.
                    </p>

                    <button
                        data-tally-open="J9ze6R"
                        data-tally-layout="modal"
                        data-tally-width="800"
                        data-tally-auto-close="2000"
                        className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-bold text-lg transition-all hover:bg-gray-200 hover:scale-105"
                    >
                        Start Pre-consulting
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </motion.div>

                {/* Right: Visual HUD */}
                <div className="flex justify-center relative">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="relative w-full max-w-md"
                    >
                        {/* HUD Card */}
                        <div className="bg-[#0f0f0f]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden group hover:border-blue-500/30 transition-colors duration-500">
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                                <div className="flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
                                    <span className="text-xs font-mono text-blue-500 tracking-widest">ANALYSIS_MODE: RUNNING</span>
                                </div>
                                <div className="flex gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500/20" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/20" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500/20" />
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                {/* Profile Match */}
                                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                    <div className="flex items-center justify-between mb-2">
                                        <Fingerprint className="w-4 h-4 text-gray-500" />
                                        <span className="text-xs text-gray-500 uppercase">Match</span>
                                    </div>
                                    <div className="text-3xl font-bold text-white mb-1">98%</div>
                                    <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: "98%" }}
                                            transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                                            className="h-full bg-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Risk Factor */}
                                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                    <div className="flex items-center justify-between mb-2">
                                        <ShieldCheck className="w-4 h-4 text-gray-500" />
                                        <span className="text-xs text-gray-500 uppercase">Risk</span>
                                    </div>
                                    <div className="text-3xl font-bold text-green-400 mb-1">Low</div>
                                    <div className="text-xs text-gray-400">Stable Vitals</div>
                                </div>
                            </div>

                            {/* Protocol Console */}
                            <div className="bg-black/40 rounded-xl p-4 border border-white/5 font-mono text-xs text-gray-400">
                                <div className="mb-2 opacity-50">&gt; Initiating clinical mapping...</div>
                                <div className="mb-2 opacity-70">&gt; Verifying master credentials... OK</div>
                                <div className="text-blue-400">
                                    &gt; Constructing Protocol ID: <span className="text-white bg-blue-500/20 px-1">{typedText}</span><span className="animate-pulse">_</span>
                                </div>
                            </div>

                            {/* Decorative Scan Line */}
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-500/20 blur-[1px] animate-scan-down pointer-events-none opacity-20" />
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
