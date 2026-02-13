import { AlignJustify, Award, Globe, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ValueProp() {
    const cards = [
        {
            icon: <AlignJustify className="w-8 h-8 text-blue-500" />,
            title: "Clinical Alignment",
            body: "We replaced sales coordinators with data. We analyze 8 key skin variables to provide a 'Reason-Why' report.",
            delay: 0.1,
            colSpan: "md:col-span-1"
        },
        {
            icon: <Award className="w-8 h-8 text-yellow-500" />,
            title: "Signature Solutions",
            body: "Productized Expertise. We curate proprietary protocols from the top 1% of Korean masters. Access invisible know-how.",
            delay: 0.2,
            colSpan: "md:col-span-1"
        },
        {
            icon: <Globe className="w-8 h-8 text-green-500" />,
            title: "Global CCR System",
            body: "Seamless follow-up. We translate treatment data into FHIR standards for your return home.",
            delay: 0.3,
            colSpan: "md:col-span-1"
        }
    ];

    return (
        <section className="py-24 bg-[#0A0A0A] relative border-t border-white/5">
            <div className="container mx-auto px-6 max-w-7xl">
                <div className="mb-16 md:flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                            The Logic: <br /> Why Medical Tourism Fails
                        </h2>
                        <p className="text-gray-400 text-lg max-w-xl">
                            Most clinics sell machines. We sell the logic behind the settings.
                        </p>
                    </div>

                    <div className="hidden md:block">
                        <div className="text-right text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">System Status</div>
                        <div className="flex items-center gap-2 text-green-500 text-sm font-medium">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            Operational
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {cards.map((card, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: card.delay, duration: 0.5 }}
                            className={`group bg-[#111] border border-white/5 rounded-2xl p-8 hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden ${card.colSpan}`}
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowUpRight className="text-white/20 w-6 h-6" />
                            </div>

                            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                {card.icon}
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-3">{card.title}</h3>
                            <p className="text-gray-400 leading-relaxed">
                                {card.body}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
