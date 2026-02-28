import Link from 'next/link';
import { useEffect } from 'react';

export default function BottomCTA() {
    useEffect(() => {
        // Load Tally widget script for popup
        const script = document.createElement('script');
        script.src = "https://tally.so/widgets/embed.js";
        script.async = true;
        document.body.appendChild(script);

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    return (
        <section id="start" className="py-24 bg-[#050505] border-t border-white/5 flex justify-center">
            <div className="container mx-auto px-6 max-w-4xl">
                <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-3xl p-12 text-center relative overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-blue-500/5 blur-3xl pointer-events-none" />

                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 relative z-10">
                        Ready to Analyze?
                    </h2>
                    <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto relative z-10">
                        Stop guessing with your face. Start designing with data.
                    </p>

                    <div className="flex flex-col items-center gap-4 relative z-10">
                        <button
                            data-tally-open="J9ze6R"
                            data-tally-layout="modal"
                            data-tally-width="800"
                            data-tally-auto-close="2000"
                            className="w-full md:w-auto px-12 py-5 bg-white text-black font-bold text-lg rounded-full hover:bg-gray-200 transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                        >
                            Start Your Analysis
                        </button>
                        <div className="text-sm text-gray-500 font-medium">
                            Takes 2 minutes. Receive report instantly.
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
