import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    FilePieChart,
    Zap,
    TrendingUp,
    Globe,
    ArrowUpRight,
    Clock,
    CheckCircle2,
    Database
} from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface Stats {
    totalPatients: number;
    totalReports: number;
    totalMatches: number;
    signaturePoolSize: number;
    recentLeads: Array<{
        id: string;
        email: string;
        goal: string;
        country: string;
        timestamp: string;
        status: string;
    }>;
}

const FounderDashboard = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/admin/stats');
                const data = await res.json();
                setStats(data);
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
            </div>
        );
    }

    const cards = [
        { title: 'Inbound Leads', value: stats?.totalPatients || 0, icon: Users, color: 'text-blue-400' },
        { title: 'Intelligence Reports', value: stats?.totalReports || 0, icon: FilePieChart, color: 'text-purple-400' },
        { title: 'Doctor Matches', value: stats?.totalMatches || 0, icon: CheckCircle2, color: 'text-green-400' },
        { title: 'Signature Pool', value: stats?.signaturePoolSize || 0, icon: Database, color: 'text-orange-400' },
    ];

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
            {/* Header */}
            <div className="flex flex-col space-y-2">
                <h1 className="text-4xl font-bold tracking-tighter text-white">Founder's Intelligence HQ</h1>
                <p className="text-gray-400">Real-time pulse of ConnectingDocs medical intelligence ecosystem.</p>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, i) => (
                    <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-[#0f0f0f] border border-white/5 p-6 rounded-2xl group hover:border-cyan-500/30 transition-all"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <card.icon className={`w-5 h-5 ${card.color}`} />
                            <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-cyan-400" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{card.title}</p>
                            <p className="text-3xl font-bold text-white tracking-tight">{card.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Leads */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Clock className="w-5 h-5 text-cyan-400" />
                            Recent Clinical Inbounds
                        </h2>
                    </div>
                    <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/5 text-gray-400 uppercase text-xs tracking-widest font-bold">
                                <tr>
                                    <th className="px-6 py-4">Lead</th>
                                    <th className="px-6 py-4">Primary Goal</th>
                                    <th className="px-6 py-4">Country</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-gray-300">
                                {stats?.recentLeads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 font-mono text-cyan-200/80">{lead.email}</td>
                                        <td className="px-6 py-4">{lead.goal}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Globe className="w-3 h-3 text-gray-500" />
                                                {lead.country}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-cyan-500/10 text-cyan-400 text-[10px] font-bold rounded-full uppercase">
                                                {lead.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* System Activity / Insights */}
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-400" />
                        AI Insights
                    </h2>
                    <div className="bg-[#0f0f0f] border border-white/5 p-6 rounded-2xl space-y-6">
                        <div className="space-y-4">
                            <div className="p-4 bg-white/5 rounded-xl space-y-2">
                                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Clinical Engine</p>
                                <p className="text-sm text-gray-300">
                                    The signature protocol pool was recently expanded to <strong>{stats?.signaturePoolSize || 0}</strong> items. Match accuracy is trending up.
                                </p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-xl space-y-2">
                                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Conversion Pulse</p>
                                <p className="text-sm text-gray-300">
                                    Top-tier leads are showing preference for <strong>Combination Therapies</strong> (MNRF + Skin Booster).
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2 text-cyan-400 group cursor-pointer hover:text-cyan-300 transition-colors">
                                <span className="text-sm font-bold">View Full Analytics in Airtable</span>
                                <ArrowUpRight className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FounderDashboard;
