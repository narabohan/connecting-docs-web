// ═══════════════════════════════════════════════════════════════
//  Doctor Patient Detail View
//  /doctor/patient/[id] — Shows AI analysis from doctor perspective
//  Includes: Clinical Intelligence, Equipment Pool, Protocol Cards
//  Protected: requires doctor role
// ═══════════════════════════════════════════════════════════════

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { withRoleGuard } from '@/lib/withRoleGuard';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft,
  AlertTriangle,
  Beaker,
  Crosshair,
  FileText,
  User,
  Shield,
  Calendar,
  CheckCircle,
  Loader2,
  Clock,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────

interface PatientData {
  report_id: string;
  demographics: {
    age: string;
    gender: string;
    country: string;
    language: string;
  };
  safety_flags: string[];
  recommendation: any; // OpusRecommendationOutput
  open_question: string;
  consultation: {
    id: string;
    status: string;
    requested_at: string;
  } | null;
  created_at: string;
}

// ─── Component ──────────────────────────────────────────────

function DoctorPatientView() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();

  const [data, setData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'devices' | 'protocol' | 'notes'>('overview');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!id) return;
    fetchPatientData(id as string);
  }, [id]);

  const fetchPatientData = async (reportId: string) => {
    try {
      const res = await fetch(`/api/doctor/patient?report_id=${reportId}`);
      if (!res.ok) throw new Error('Failed to fetch patient data');
      const result = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Loading / Error States ───────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white gap-4">
        <p className="text-red-400">{error || 'Patient data not found'}</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-6 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const rec = data.recommendation;
  const patient = rec?.patient;
  const doctorTab = rec?.doctor_tab;

  // ─── Main Layout ──────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Head>
        <title>Patient {data.report_id} | Doctor View</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      {/* ─── Header ─── */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div>
              <h1 className="font-bold text-lg">Patient Report</h1>
              <p className="text-xs text-gray-500 font-mono">{data.report_id}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {data.consultation && (
              <span className={`text-xs px-3 py-1 rounded-full border font-bold ${
                data.consultation.status === 'pending'
                  ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                  : data.consultation.status === 'confirmed'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
              }`}>
                {data.consultation.status === 'pending' ? '상담 대기' :
                 data.consultation.status === 'confirmed' ? '상담 확정' : data.consultation.status}
              </span>
            )}
            <span className="px-3 py-1 bg-[#00FFA0]/20 text-[#00FFA0] text-xs font-bold rounded border border-[#00FFA0]/30">
              DOCTOR VIEW
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* ─── Patient Summary Bar ─── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { icon: <User className="w-4 h-4" />, label: 'Age', value: patient?.age || data.demographics.age },
            { icon: <User className="w-4 h-4" />, label: 'Gender', value: patient?.gender || data.demographics.gender },
            { icon: <Crosshair className="w-4 h-4" />, label: 'Goal', value: patient?.aesthetic_goal || '-' },
            { icon: <Shield className="w-4 h-4" />, label: 'Fitzpatrick', value: patient?.fitzpatrick || '-' },
            { icon: <Calendar className="w-4 h-4" />, label: 'Date', value: new Date(data.created_at).toLocaleDateString() },
          ].map((item, i) => (
            <div key={i} className="bg-[#111] p-4 rounded-xl border border-white/5">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                {item.icon} {item.label}
              </div>
              <div className="text-white font-bold text-sm">{item.value}</div>
            </div>
          ))}
        </div>

        {/* ─── Safety Flags Alert ─── */}
        {data.safety_flags.length > 0 && (
          <div className="mb-8 bg-[#1A1510] border border-[#FFA000]/30 rounded-xl p-5">
            <h3 className="flex items-center gap-2 text-[#FFA000] font-bold mb-3">
              <AlertTriangle className="w-5 h-5" />
              Safety Flags ({data.safety_flags.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.safety_flags.map((flag, i) => (
                <span key={i} className="px-3 py-1 bg-[#FFA000]/10 text-[#FFA000] text-xs rounded-full border border-[#FFA000]/20">
                  {flag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ─── Tabs ─── */}
        <div className="flex border-b border-white/10 mb-8 overflow-x-auto">
          {[
            { id: 'overview', label: 'Clinical Overview', icon: <Beaker className="w-4 h-4" /> },
            { id: 'devices', label: 'Device Recommendations', icon: <Crosshair className="w-4 h-4" /> },
            { id: 'protocol', label: 'Protocol Builder', icon: <CheckCircle className="w-4 h-4" /> },
            { id: 'notes', label: 'Notes', icon: <FileText className="w-4 h-4" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-[#00FFA0] text-[#00FFA0] bg-white/5'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── Tab Content ─── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Patient concern */}
            <div className="bg-[#111] p-6 rounded-xl border border-white/5">
              <h3 className="text-sm font-bold text-gray-400 mb-2">Patient&apos;s Concern (Raw Input)</h3>
              <p className="text-white text-lg leading-relaxed">
                {data.open_question || 'No free-text input provided'}
              </p>
            </div>

            {/* Clinical summary from doctor_tab */}
            {doctorTab && (
              <>
                <div className="bg-[#111] p-6 rounded-xl border border-white/5">
                  <h3 className="text-sm font-bold text-gray-400 mb-3">Clinical Summary</h3>
                  <div
                    className="text-gray-300 leading-relaxed prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: doctorTab.clinical_summary || '' }}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-[#111] p-6 rounded-xl border border-white/5">
                    <h3 className="text-sm font-bold text-gray-400 mb-3">Triggered Protocols</h3>
                    <div className="flex flex-wrap gap-2">
                      {doctorTab.triggered_protocols?.map((p: string, i: number) => (
                        <span key={i} className="px-3 py-1.5 bg-cyan-500/10 text-cyan-400 text-sm rounded-lg border border-cyan-500/20">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#111] p-6 rounded-xl border border-white/5">
                    <h3 className="text-sm font-bold text-gray-400 mb-3">Country Context</h3>
                    <div
                      className="text-gray-300 text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: doctorTab.country_note || '-' }}
                    />
                  </div>
                </div>

                {/* Contraindications */}
                {doctorTab.contraindications?.length > 0 && (
                  <div className="bg-[#1a1015] p-6 rounded-xl border border-red-500/20">
                    <h3 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Contraindications
                    </h3>
                    <ul className="space-y-2">
                      {doctorTab.contraindications.map((c: string, i: number) => (
                        <li key={i} className="text-red-300/80 text-sm flex items-start gap-2">
                          <span className="mt-1 w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'devices' && rec && (
          <div className="space-y-6">
            {/* EBD Devices */}
            <h3 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
              <Crosshair className="w-5 h-5" />
              EBD Devices ({rec.ebd_recommendations?.length || 0})
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {rec.ebd_recommendations?.map((device: any, i: number) => (
                <div key={i} className="bg-[#111] p-6 rounded-xl border border-cyan-500/20 hover:border-cyan-500/40 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-white">{device.device_name}</h4>
                    <span className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-full">
                      {device.confidence}%
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">{device.subtitle}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-black/30 p-2 rounded">
                      <span className="text-gray-500">Layer</span>
                      <div className="text-white font-bold">{device.skin_layer}</div>
                    </div>
                    <div className="bg-black/30 p-2 rounded">
                      <span className="text-gray-500">Evidence</span>
                      <div className="text-white font-bold">Lv.{device.evidence_level}</div>
                    </div>
                    <div className="bg-black/30 p-2 rounded">
                      <span className="text-gray-500">Pain</span>
                      <div className="text-white font-bold">{device.pain_level}/5</div>
                    </div>
                    <div className="bg-black/30 p-2 rounded">
                      <span className="text-gray-500">Downtime</span>
                      <div className="text-white font-bold">{device.downtime_level}/5</div>
                    </div>
                  </div>

                  {/* Parameter guidance from doctor_tab */}
                  {doctorTab?.parameter_guidance?.[device.device_name] && (
                    <div className="mt-3 p-3 bg-[#00FFA0]/5 border border-[#00FFA0]/20 rounded-lg">
                      <span className="text-xs text-[#00FFA0] font-bold">Parameter Guidance</span>
                      <p className="text-gray-300 text-xs mt-1">
                        {doctorTab.parameter_guidance[device.device_name]}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Injectables */}
            <h3 className="text-lg font-bold text-rose-400 flex items-center gap-2 mt-8">
              <Beaker className="w-5 h-5" />
              스킨부스터/인젝터블 ({rec.injectable_recommendations?.length || 0})
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {rec.injectable_recommendations?.map((inj: any, i: number) => (
                <div key={i} className="bg-[#111] p-6 rounded-xl border border-rose-500/20 hover:border-rose-500/40 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-white">{inj.name}</h4>
                    <span className="text-xs px-2 py-1 bg-rose-500/20 text-rose-400 rounded-full">
                      {inj.confidence}%
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-2">{inj.subtitle}</p>
                  <div className="text-xs text-gray-500">
                    Sessions: {inj.practical?.sessions} · Interval: {inj.practical?.interval}
                  </div>
                </div>
              ))}
            </div>

            {/* Alternatives */}
            {doctorTab?.alternative_options?.length > 0 && (
              <div className="mt-6 bg-[#111] p-6 rounded-xl border border-white/5">
                <h3 className="text-sm font-bold text-gray-400 mb-3">Alternative Options</h3>
                <ul className="space-y-2">
                  {doctorTab.alternative_options.map((alt: string, i: number) => (
                    <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                      <span className="mt-1 w-1.5 h-1.5 bg-gray-500 rounded-full flex-shrink-0" />
                      {alt}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'protocol' && (
          <div className="space-y-6">
            {/* Signature Solutions */}
            <h3 className="text-lg font-bold text-amber-400 mb-4">Signature Solutions</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {rec?.signature_solutions?.map((sol: any, i: number) => (
                <div key={i} className="bg-[#111] p-6 rounded-xl border border-amber-500/20">
                  <h4 className="font-bold text-white mb-2">{sol.name}</h4>
                  <p className="text-gray-400 text-sm mb-3">{sol.description}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {sol.devices?.map((d: string, j: number) => (
                      <span key={j} className="px-2 py-1 bg-cyan-500/10 text-cyan-400 text-xs rounded">
                        {d}
                      </span>
                    ))}
                    {sol.injectables?.map((inj: string, j: number) => (
                      <span key={j} className="px-2 py-1 bg-rose-500/10 text-rose-400 text-xs rounded">
                        {inj}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>Sessions: {sol.total_sessions}</span>
                    <span>Synergy: {sol.synergy_score}%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Treatment Plan */}
            <h3 className="text-lg font-bold text-white mt-8 mb-4">Treatment Plan</h3>
            <div className="space-y-4">
              {rec?.treatment_plan?.phases?.map((phase: any, i: number) => (
                <div key={i} className="bg-[#111] p-6 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-8 h-8 bg-cyan-500/20 text-cyan-400 rounded-lg flex items-center justify-center text-sm font-bold">
                      {phase.phase}
                    </span>
                    <div>
                      <h4 className="font-bold text-white">{phase.name}</h4>
                      <span className="text-xs text-gray-500">{phase.period}</span>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mb-2">{phase.goal}</p>
                  <ul className="space-y-1">
                    {phase.treatments?.map((t: string, j: number) => (
                      <li key={j} className="text-gray-300 text-sm flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 mt-1 text-emerald-400 flex-shrink-0" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8">
              <button className="flex-1 py-3 bg-[#00FFA0]/20 text-[#00FFA0] font-bold rounded-xl border border-[#00FFA0]/30 hover:bg-[#00FFA0]/30 transition-colors">
                프로토콜 확정
              </button>
              <button className="flex-1 py-3 bg-cyan-500/20 text-cyan-400 font-bold rounded-xl border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors">
                환자에게 전송
              </button>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div className="bg-[#111] p-6 rounded-xl border border-white/5">
              <h3 className="text-sm font-bold text-gray-400 mb-3">Clinical Coordination Notes</h3>
              <textarea
                className="w-full h-48 bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#00FFA0]/50 resize-none"
                placeholder="Add clinical coordination notes, package recommendations, or follow-up schedules..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="flex justify-end mt-3">
                <button className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg border border-white/10 transition-colors">
                  Save Notes
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-[#111] p-6 rounded-xl border border-white/5">
              <h3 className="text-sm font-bold text-gray-400 mb-4">Activity Timeline</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-white">Report generated</p>
                    <p className="text-xs text-gray-500">{new Date(data.created_at).toLocaleString()}</p>
                  </div>
                </div>
                {data.consultation && (
                  <div className="flex items-start gap-3">
                    <User className="w-4 h-4 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-white">Consultation requested</p>
                      <p className="text-xs text-gray-500">
                        {new Date(data.consultation.requested_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default withRoleGuard(DoctorPatientView, ['doctor', 'admin']);
