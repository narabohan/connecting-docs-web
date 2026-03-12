// ═══════════════════════════════════════════════════════════════
//  Report v7 — Rendering Pipeline
//  Connects Opus recommendation output → report-v7-premium.html
//  Handles data binding, i18n, and safety flag injection
// ═══════════════════════════════════════════════════════════════

import type { SurveyLang } from '@/types/survey-v2';
import type { SafetyFlag } from '@/types/survey-v2';
import { isTreatmentPlanV2 } from '@/types/survey-v2';
import type {
  OpusRecommendationOutput,
  OpusDeviceRecommendation,
  OpusInjectableRecommendation,
} from '@/pages/api/survey-v2/final-recommendation';
import type { I18nDictionary, I18nPlaceholders } from './report-v7-i18n';
import { applyReportI18n, loadReportDictionary } from './report-v7-i18n';
import {
  buildPatientSafetyBanner,
  renderSafetyBannerHTML,
  renderDoctorSafetyHTML,
} from './report-v7-safety';

// ─── Types ────────────────────────────────────────────────────

export interface RenderReportOptions {
  opusOutput: OpusRecommendationOutput;
  lang: SurveyLang;
  safetyFlags: SafetyFlag[];
  dictionaryPath?: string;
}

export interface RenderResult {
  success: boolean;
  i18nApplied: { textApplied: number; htmlApplied: number };
  safetyBannerInjected: boolean;
  devicesBound: number;
  injectablesBound: number;
  errors: string[];
}

// ─── Score Dimension Labels ──────────────────────────────────

const SCORE_LABELS: Record<SurveyLang, Record<string, string>> = {
  KO: {
    tightening: '탄력', lifting: '리프팅', volume: '볼륨', brightening: '미백',
    texture: '피부결', evidence: '근거', synergy: '시너지', longevity: '지속력',
    roi: 'ROI', trend: '트렌드', popularity: '인기',
  },
  EN: {
    tightening: 'Tightening', lifting: 'Lifting', volume: 'Volume', brightening: 'Brightening',
    texture: 'Texture', evidence: 'Evidence', synergy: 'Synergy', longevity: 'Longevity',
    roi: 'ROI', trend: 'Trend', popularity: 'Popularity',
  },
  JP: {
    tightening: '引き締め', lifting: 'リフト', volume: 'ボリューム', brightening: '美白',
    texture: '肌質', evidence: '根拠', synergy: 'シナジー', longevity: '持続性',
    roi: 'ROI', trend: 'トレンド', popularity: '人気',
  },
  'ZH-CN': {
    tightening: '紧致', lifting: '提升', volume: '丰盈', brightening: '美白',
    texture: '肤质', evidence: '循证', synergy: '协同', longevity: '持久',
    roi: 'ROI', trend: '趋势', popularity: '人气',
  },
};

// ─── Skin Layer Labels ───────────────────────────────────────

const SKIN_LAYER_MAP: Record<string, { label: string; depth: string }> = {
  epi: { label: 'Epidermis', depth: '0~0.3mm' },
  upd: { label: 'Upper Dermis', depth: '0.3~1.5mm' },
  deep: { label: 'Deep Dermis', depth: '1.5~4mm' },
  smas: { label: 'SMAS', depth: '4~5mm' },
};

// ─── DOM Binding Helpers ─────────────────────────────────────

/**
 * Safely set textContent on an element found by selector
 */
function setText(container: Document | HTMLElement, selector: string, text: string): boolean {
  const el = container.querySelector(selector);
  if (el) {
    el.textContent = text;
    return true;
  }
  return false;
}

/**
 * Safely set innerHTML on an element found by selector
 */
function setHTML(container: Document | HTMLElement, selector: string, html: string): boolean {
  const el = container.querySelector(selector);
  if (el) {
    el.innerHTML = html;
    return true;
  }
  return false;
}

/**
 * Set attribute on an element
 */
function setAttr(container: Document | HTMLElement, selector: string, attr: string, value: string): boolean {
  const el = container.querySelector(selector);
  if (el) {
    el.setAttribute(attr, value);
    return true;
  }
  return false;
}

// ─── Device Card Rendering ───────────────────────────────────

function renderDeviceCard(
  container: Document | HTMLElement,
  device: OpusDeviceRecommendation,
  index: number,
  lang: SurveyLang
): boolean {
  const prefix = `#ebd-card-${index + 1}`;
  const card = container.querySelector(prefix);
  if (!card) return false;

  // Basic info
  setText(card as HTMLElement, '[data-field="device-name"]', device.device_name);
  setText(card as HTMLElement, '[data-field="device-subtitle"]', device.subtitle);
  setHTML(card as HTMLElement, '[data-field="device-summary"]', device.summary_html);
  setHTML(card as HTMLElement, '[data-field="device-why-fit"]', device.why_fit_html);
  setHTML(card as HTMLElement, '[data-field="device-ai-desc"]', device.ai_description_html);

  // MOA
  setText(card as HTMLElement, '[data-field="moa-title"]', device.moa_summary_title);
  setText(card as HTMLElement, '[data-field="moa-short"]', device.moa_summary_short);
  setHTML(card as HTMLElement, '[data-field="moa-description"]', device.moa_description_html);

  // Badge
  if (device.badge) {
    const badgeEl = card.querySelector('[data-field="device-badge"]');
    if (badgeEl) {
      badgeEl.textContent = device.badge;
      (badgeEl as HTMLElement).style.display = 'inline-block';
      if (device.badge_color) {
        badgeEl.classList.add(`badge-${device.badge_color}`);
      }
    }
  }

  // Metrics: confidence, pain, downtime, evidence
  setText(card as HTMLElement, '[data-field="confidence"]', `${device.confidence}%`);
  setText(card as HTMLElement, '[data-field="pain-level"]', `${device.pain_level}/5`);
  setText(card as HTMLElement, '[data-field="downtime-level"]', `${device.downtime_level}/5`);
  setText(card as HTMLElement, '[data-field="evidence-level"]', `Lv.${device.evidence_level}`);

  // Skin layer
  const layerInfo = SKIN_LAYER_MAP[device.skin_layer];
  if (layerInfo) {
    setText(card as HTMLElement, '[data-field="skin-layer"]', `${layerInfo.label} (${layerInfo.depth})`);
    setAttr(card as HTMLElement, '[data-field="skin-layer-dot"]', 'data-layer', device.skin_layer);
  }

  // Practical info
  setText(card as HTMLElement, '[data-field="sessions"]', device.practical.sessions);
  setText(card as HTMLElement, '[data-field="interval"]', device.practical.interval);
  setText(card as HTMLElement, '[data-field="duration"]', device.practical.duration);
  setText(card as HTMLElement, '[data-field="onset"]', device.practical.onset);
  setText(card as HTMLElement, '[data-field="maintain"]', device.practical.maintain);

  // Target tags
  const tagsContainer = card.querySelector('[data-field="target-tags"]');
  if (tagsContainer) {
    tagsContainer.innerHTML = device.target_tags
      .map(tag => `<span class="target-tag">${tag}</span>`)
      .join('');
  }

  // Radar scores (for chart.js rendering)
  const scoreLabels = SCORE_LABELS[lang] || SCORE_LABELS['KO'];
  const scoresEl = card.querySelector('[data-field="scores"]');
  if (scoresEl) {
    scoresEl.setAttribute('data-scores', JSON.stringify(device.scores));
    scoresEl.setAttribute('data-labels', JSON.stringify(
      Object.keys(device.scores).map(k => scoreLabels[k] || k)
    ));
  }

  return true;
}

// ─── Injectable Card Rendering ───────────────────────────────

function renderInjectableCard(
  container: Document | HTMLElement,
  injectable: OpusInjectableRecommendation,
  index: number
): boolean {
  const prefix = `#inj-card-${index + 1}`;
  const card = container.querySelector(prefix);
  if (!card) return false;

  setText(card as HTMLElement, '[data-field="inj-name"]', injectable.name);
  setText(card as HTMLElement, '[data-field="inj-subtitle"]', injectable.subtitle);
  setHTML(card as HTMLElement, '[data-field="inj-summary"]', injectable.summary_html);
  setHTML(card as HTMLElement, '[data-field="inj-why-fit"]', injectable.why_fit_html);
  setText(card as HTMLElement, '[data-field="inj-moa-title"]', injectable.moa_summary_title);
  setText(card as HTMLElement, '[data-field="inj-moa-short"]', injectable.moa_summary_short);
  setHTML(card as HTMLElement, '[data-field="inj-moa-description"]', injectable.moa_description_html);

  // Practical info
  setText(card as HTMLElement, '[data-field="inj-sessions"]', injectable.practical.sessions);
  setText(card as HTMLElement, '[data-field="inj-interval"]', injectable.practical.interval);
  setText(card as HTMLElement, '[data-field="inj-onset"]', injectable.practical.onset);
  setText(card as HTMLElement, '[data-field="inj-maintain"]', injectable.practical.maintain);

  // Confidence + evidence
  setText(card as HTMLElement, '[data-field="inj-confidence"]', `${injectable.confidence}%`);
  setText(card as HTMLElement, '[data-field="inj-evidence"]', `Lv.${injectable.evidence_level}`);

  return true;
}

// ─── Treatment Plan Rendering ────────────────────────────────

function renderTreatmentPlan(
  container: Document | HTMLElement,
  output: OpusRecommendationOutput
): boolean {
  const plan = output.treatment_plan;

  // V2 plan with budget + sequenced phases
  if (isTreatmentPlanV2(plan)) {
    return renderTreatmentPlanV2(container, plan);
  }

  // V1 fallback — simple phase list
  const planContainer = container.querySelector('[data-field="treatment-plan"]');
  if (!planContainer) return false;

  const v1Plan = plan as { phases: { phase: number; name: string; period: string; treatments: string[]; goal: string }[] };
  const phasesHtml = v1Plan.phases.map(phase => `
    <div class="treatment-phase" data-phase="${phase.phase}">
      <div class="phase-header">
        <span class="phase-number">Phase ${phase.phase}</span>
        <span class="phase-name">${phase.name}</span>
        <span class="phase-period">${phase.period}</span>
      </div>
      <div class="phase-goal">${phase.goal}</div>
      <ul class="phase-treatments">
        ${phase.treatments.map(t => `<li>${t}</li>`).join('\n')}
      </ul>
    </div>
  `).join('\n');

  planContainer.innerHTML = phasesHtml;
  return true;
}

// ─── Treatment Plan V2 Rendering (Phase 2) ───────────────────

function renderTreatmentPlanV2(
  container: Document | HTMLElement,
  plan: import('@/types/survey-v2').TreatmentPlanV2
): boolean {
  const planContainer = container.querySelector('[data-field="treatment-plan"]');
  if (!planContainer) return false;

  // Phase color class mapping
  const phaseColorClass = (idx: number, total: number): string => {
    if (idx === 0) return 'phase-foundation';
    if (idx >= total - 1) return 'phase-maintenance';
    return 'phase-main';
  };

  // ─── Budget Bar ─────────────────────────
  const bb = plan.budget_breakdown;
  const budgetBarHtml = bb ? `
    <div class="plan-v2-budget">
      <div class="budget-bar">
        <div class="budget-segment foundation" style="width:${bb.foundation_pct}%" title="${bb.foundation_label}"></div>
        <div class="budget-segment main" style="width:${bb.main_pct}%" title="${bb.main_label}"></div>
        <div class="budget-segment maintenance" style="width:${bb.maintenance_pct}%" title="${bb.maintenance_label}"></div>
      </div>
      <div class="budget-labels">
        <span class="bl-item foundation">${bb.foundation_label} (${bb.foundation_pct}%)</span>
        <span class="bl-item main">${bb.main_label} (${bb.main_pct}%)</span>
        <span class="bl-item maintenance">${bb.maintenance_label} (${bb.maintenance_pct}%)</span>
      </div>
      ${bb.roi_note ? `<p class="budget-roi-note">${bb.roi_note}</p>` : ''}
    </div>
  ` : '';

  // ─── Phase Cards ────────────────────────
  const total = plan.phases.length;
  const phasesHtml = plan.phases.map((phase, idx) => {
    const colorClass = phaseColorClass(idx, total);

    const proceduresHtml = phase.procedures.map(proc => `
      <div class="procedure-item">
        <div class="proc-header">
          <span class="proc-category proc-${proc.category}">${proc.category.toUpperCase()}</span>
          <strong>${proc.device_or_injectable}</strong>
        </div>
        <p class="proc-reason">${proc.reason_why}</p>
        <p class="proc-clinical">${proc.clinical_basis}</p>
        ${proc.synergy_note ? `<p class="proc-synergy">${proc.synergy_note}</p>` : ''}
        <div class="proc-meta">
          <span class="proc-downtime">${proc.downtime}</span>
          <span class="proc-cost">${proc.estimated_cost}</span>
        </div>
      </div>
    `).join('\n');

    return `
      <div class="phase-card ${colorClass}">
        <div class="phase-card-header">
          <span class="phase-badge">Phase ${phase.phase_number}</span>
          <span class="phase-timing">${phase.timing}</span>
          <span class="phase-timing-label">${phase.timing_label}</span>
        </div>
        <p class="phase-goal-v2">${phase.phase_goal}</p>
        <div class="phase-procedures">${proceduresHtml}</div>
        <div class="phase-footer">
          <span class="phase-downtime">${phase.total_downtime}</span>
          <span class="phase-cost">${phase.estimated_cost}</span>
          <span class="phase-lifestyle">${phase.lifestyle_note}</span>
        </div>
      </div>
    `;
  }).join('\n');

  // ─── Plan Notes ─────────────────────────
  const notesHtml = `
    ${plan.plan_rationale ? `<p class="plan-rationale">${plan.plan_rationale}</p>` : ''}
    ${plan.seasonal_note ? `<p class="plan-seasonal">${plan.seasonal_note}</p>` : ''}
  `;

  // ─── Assemble ───────────────────────────
  planContainer.innerHTML = `
    <div class="treatment-plan-v2">
      <div class="plan-v2-header">
        <span class="plan-type-badge plan-type-${plan.plan_type}">${plan.plan_type_label}</span>
        <span class="plan-duration">${plan.duration}</span>
        <span class="plan-budget-total">${plan.budget_total}</span>
      </div>
      ${budgetBarHtml}
      <div class="phase-cards-container">${phasesHtml}</div>
      <div class="plan-notes">${notesHtml}</div>
    </div>
  `;

  return true;
}

// ─── Homecare Rendering ──────────────────────────────────────

function renderHomecare(
  container: Document | HTMLElement,
  output: OpusRecommendationOutput
): boolean {
  const hc = output.homecare;

  setHTML(container, '[data-field="homecare-morning"]',
    hc.morning.map(s => `<li>${s}</li>`).join(''));
  setHTML(container, '[data-field="homecare-evening"]',
    hc.evening.map(s => `<li>${s}</li>`).join(''));
  setHTML(container, '[data-field="homecare-weekly"]',
    hc.weekly.map(s => `<li>${s}</li>`).join(''));
  setHTML(container, '[data-field="homecare-avoid"]',
    hc.avoid.map(s => `<li>${s}</li>`).join(''));

  return true;
}

// ─── Signature Solutions ─────────────────────────────────────

function renderSignatureSolutions(
  container: Document | HTMLElement,
  output: OpusRecommendationOutput
): boolean {
  const sigContainer = container.querySelector('[data-field="signature-solutions"]');
  if (!sigContainer) return false;

  sigContainer.innerHTML = output.signature_solutions.map(sol => `
    <div class="signature-card">
      <h4 class="sig-name">${sol.name}</h4>
      <p class="sig-desc">${sol.description}</p>
      <div class="sig-combo">
        <span class="sig-devices">${sol.devices.join(' + ')}</span>
        <span class="sig-plus">×</span>
        <span class="sig-injectables">${sol.injectables.join(' + ')}</span>
      </div>
      <div class="sig-meta">
        <span class="sig-sessions">${sol.total_sessions}</span>
        <span class="sig-synergy">Synergy: ${sol.synergy_score}%</span>
      </div>
    </div>
  `).join('\n');

  return true;
}

// ─── Doctor Tab Rendering ────────────────────────────────────

function renderDoctorTab(
  container: Document | HTMLElement,
  output: OpusRecommendationOutput,
  safetyFlags: SafetyFlag[]
): boolean {
  const doctorTab = container.querySelector('#doctor-tab');
  if (!doctorTab) return false;

  // Clinical summary
  setHTML(doctorTab as HTMLElement, '[data-field="clinical-summary"]',
    output.doctor_tab.clinical_summary);

  // Triggered protocols
  setText(doctorTab as HTMLElement, '[data-field="triggered-protocols"]',
    output.doctor_tab.triggered_protocols.join(', '));

  // Country note
  setHTML(doctorTab as HTMLElement, '[data-field="country-note"]',
    output.doctor_tab.country_note);

  // Parameter guidance
  const paramContainer = doctorTab.querySelector('[data-field="parameter-guidance"]');
  if (paramContainer) {
    paramContainer.innerHTML = Object.entries(output.doctor_tab.parameter_guidance)
      .map(([device, guidance]) => `
        <div class="param-row">
          <strong>${device}:</strong> ${guidance}
        </div>
      `).join('\n');
  }

  // Contraindications
  const contraContainer = doctorTab.querySelector('[data-field="contraindications"]');
  if (contraContainer) {
    contraContainer.innerHTML = output.doctor_tab.contraindications
      .map(c => `<li class="contra-item">${c}</li>`).join('\n');
  }

  // Alternatives
  const altContainer = doctorTab.querySelector('[data-field="alternatives"]');
  if (altContainer) {
    altContainer.innerHTML = output.doctor_tab.alternative_options
      .map(a => `<li class="alt-item">${a}</li>`).join('\n');
  }

  // Safety flags (doctor view — bilingual clinical notes)
  if (safetyFlags.length > 0) {
    const safetyHtml = renderDoctorSafetyHTML(safetyFlags);
    const safetySlot = doctorTab.querySelector('[data-field="safety-flags"]');
    if (safetySlot) {
      safetySlot.innerHTML = safetyHtml;
    }
  }

  return true;
}

// ─── Patient Header Rendering ────────────────────────────────

function renderPatientHeader(
  container: Document | HTMLElement,
  output: OpusRecommendationOutput
): void {
  const p = output.patient;
  setText(container, '[data-field="patient-age"]', p.age);
  setText(container, '[data-field="patient-gender"]', p.gender);
  setText(container, '[data-field="patient-country"]', p.country);
  setText(container, '[data-field="patient-goal"]', p.aesthetic_goal);
  setText(container, '[data-field="patient-concerns"]', p.top3_concerns.join(', '));
  setText(container, '[data-field="patient-fitzpatrick"]', p.fitzpatrick);
}

// ─── Main Render Pipeline ────────────────────────────────────

/**
 * Full report rendering pipeline
 * 1. Load i18n dictionary
 * 2. Apply i18n translations
 * 3. Bind Opus data to DOM
 * 4. Inject safety banners
 */
export async function renderReport(
  document: Document,
  options: RenderReportOptions
): Promise<RenderResult> {
  const errors: string[] = [];
  const { opusOutput, lang, safetyFlags, dictionaryPath } = options;

  // 1. Load & apply i18n
  let dictionary: I18nDictionary;
  try {
    dictionary = await loadReportDictionary(dictionaryPath);
  } catch (e) {
    errors.push(`Failed to load i18n dictionary: ${e}`);
    return { success: false, i18nApplied: { textApplied: 0, htmlApplied: 0 }, safetyBannerInjected: false, devicesBound: 0, injectablesBound: 0, errors };
  }

  const placeholders: I18nPlaceholders = {
    name: opusOutput.patient.age + ' ' + opusOutput.patient.gender,
    age: opusOutput.patient.age,
    fitzpatrick: opusOutput.patient.fitzpatrick,
    confidence: opusOutput.ebd_recommendations[0]?.confidence?.toString() || '0',
  };

  const i18nResult = applyReportI18n(document, dictionary, lang, placeholders);

  // 2. Patient header
  renderPatientHeader(document, opusOutput);

  // 3. EBD device cards
  let devicesBound = 0;
  for (let i = 0; i < opusOutput.ebd_recommendations.length; i++) {
    if (renderDeviceCard(document, opusOutput.ebd_recommendations[i], i, lang)) {
      devicesBound++;
    }
  }

  // 4. Injectable cards
  let injectablesBound = 0;
  for (let i = 0; i < opusOutput.injectable_recommendations.length; i++) {
    if (renderInjectableCard(document, opusOutput.injectable_recommendations[i], i)) {
      injectablesBound++;
    }
  }

  // 5. Signature solutions
  renderSignatureSolutions(document, opusOutput);

  // 6. Treatment plan
  renderTreatmentPlan(document, opusOutput);

  // 7. Homecare
  renderHomecare(document, opusOutput);

  // 8. Safety banner (patient-facing)
  let safetyBannerInjected = false;
  if (safetyFlags.length > 0) {
    const bannerData = buildPatientSafetyBanner(safetyFlags, dictionary, lang);
    const bannerHtml = renderSafetyBannerHTML(bannerData);
    const bannerSlot = document.querySelector('[data-field="safety-banner"]');
    if (bannerSlot) {
      bannerSlot.innerHTML = bannerHtml;
      safetyBannerInjected = true;
    }
  }

  // 9. Doctor tab
  renderDoctorTab(document, opusOutput, safetyFlags);

  return {
    success: errors.length === 0,
    i18nApplied: { textApplied: i18nResult.textApplied, htmlApplied: i18nResult.htmlApplied },
    safetyBannerInjected,
    devicesBound,
    injectablesBound,
    errors,
  };
}

/**
 * Server-side rendering helper
 * For use in Next.js API routes to generate report HTML string
 */
export function generateReportDataBindings(
  opusOutput: OpusRecommendationOutput
): Record<string, string> {
  const bindings: Record<string, string> = {};

  // Patient
  bindings['patient-age'] = opusOutput.patient.age;
  bindings['patient-gender'] = opusOutput.patient.gender;
  bindings['patient-country'] = opusOutput.patient.country;
  bindings['patient-goal'] = opusOutput.patient.aesthetic_goal;
  bindings['patient-concerns'] = opusOutput.patient.top3_concerns.join(', ');
  bindings['patient-fitzpatrick'] = opusOutput.patient.fitzpatrick;

  // EBD devices
  opusOutput.ebd_recommendations.forEach((d, i) => {
    const p = `ebd-${i + 1}`;
    bindings[`${p}-name`] = d.device_name;
    bindings[`${p}-subtitle`] = d.subtitle;
    bindings[`${p}-summary`] = d.summary_html;
    bindings[`${p}-why-fit`] = d.why_fit_html;
    bindings[`${p}-ai-desc`] = d.ai_description_html;
    bindings[`${p}-confidence`] = `${d.confidence}%`;
    bindings[`${p}-moa-title`] = d.moa_summary_title;
    bindings[`${p}-scores`] = JSON.stringify(d.scores);
  });

  // Injectables
  opusOutput.injectable_recommendations.forEach((inj, i) => {
    const p = `inj-${i + 1}`;
    bindings[`${p}-name`] = inj.name;
    bindings[`${p}-subtitle`] = inj.subtitle;
    bindings[`${p}-summary`] = inj.summary_html;
    bindings[`${p}-why-fit`] = inj.why_fit_html;
    bindings[`${p}-confidence`] = `${inj.confidence}%`;
  });

  return bindings;
}
