import { useEffect } from 'react';

export default function TallyEmbed() {
    useEffect(() => {
        // Load Tally script dynamically
        const script = document.createElement('script');
        script.src = "https://tally.so/widgets/embed.js";
        script.async = true;
        document.body.appendChild(script);

        return () => {
            // Cleanup script on unmount
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        }
    }, []);

    return (
        <section id="start" className="py-32 bg-slate-950 border-t border-slate-900 relative">
            <div className="absolute inset-0 bg-primary/5 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-slate-950 to-slate-950 pointer-events-none" />

            <div className="container mx-auto px-6 text-center relative z-10">
                <div className="mb-12">
                    <span className="inline-block py-1 px-3 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400 mb-4">
                        READY_TO_ANALYZE
                    </span>
                    <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        Start Your Analysis
                    </h2>
                    <p className="text-slate-500 mt-4">Takes 2 minutes. Receive your intelligence report instantly.</p>
                </div>

                <div className="w-full max-w-3xl mx-auto bg-white rounded-xl overflow-hidden shadow-2xl shadow-primary/10 ring-1 ring-slate-800">
                    <iframe
                        data-tally-src="https://tally.so/embed/J9ze6R?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
                        loading="lazy"
                        width="100%"
                        height="600"
                        frameBorder="0"
                        marginHeight={0}
                        marginWidth={0}
                        title="Connecting Docs Pre-consulting"
                        className="w-full h-[700px] md:h-[800px]"
                    ></iframe>
                </div>
            </div>
        </section>
    )
}
