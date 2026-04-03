// ═══════════════════════════════════════════════════════════════
//  Robust JSON Parse — extracted for bundle size reduction
//  Handles truncated AI responses with aggressive repair strategies
// ═══════════════════════════════════════════════════════════════

export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: string[] };

export function robustJsonParse<T>(rawText: string): ParseResult<T> {
  const errors: string[] = [];
  let jsonStr = rawText.trim();

  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  const firstBrace = jsonStr.indexOf('{');
  if (firstBrace < 0) return { ok: false, errors: ['No JSON object found'] };
  if (firstBrace > 0) jsonStr = jsonStr.substring(firstBrace);

  try { return { ok: true, value: JSON.parse(jsonStr) }; }
  catch (e) { errors.push(`Direct: ${e instanceof Error ? e.message : 'unknown'}`); }

  const repaired = aggressiveRepair(jsonStr);
  if (repaired) {
    try { return { ok: true, value: JSON.parse(repaired) }; }
    catch (e) { errors.push(`Repair: ${e instanceof Error ? e.message : 'unknown'}`); }
  }

  const stripped = stripToLastComplete(jsonStr);
  if (stripped && stripped !== repaired) {
    try { return { ok: true, value: JSON.parse(stripped) }; }
    catch (e) { errors.push(`Strip: ${e instanceof Error ? e.message : 'unknown'}`); }
  }

  return { ok: false, errors };
}

function countBrackets(str: string) {
  let inStr = false, esc = false, braces = 0, brackets = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (esc) { esc = false; continue; }
    if (c === '\\' && inStr) { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === '{') braces++; else if (c === '}') braces--;
    else if (c === '[') brackets++; else if (c === ']') brackets--;
  }
  return { braces, brackets };
}

function aggressiveRepair(jsonStr: string): string | null {
  let inStr = false, esc = false, lastSafe = 0;
  const bk: string[] = [];
  for (let i = 0; i < jsonStr.length; i++) {
    const c = jsonStr[i];
    if (esc) { esc = false; continue; }
    if (c === '\\' && inStr) { esc = true; continue; }
    if (c === '"') { inStr = !inStr; if (!inStr) lastSafe = i + 1; continue; }
    if (inStr) continue;
    if (c === '{' || c === '[') { bk.push(c); lastSafe = i + 1; }
    else if (c === '}' || c === ']') { bk.pop(); lastSafe = i + 1; }
    else if (c === ',' || c === ':') { lastSafe = i + 1; }
  }
  let t = inStr && lastSafe > 0 ? jsonStr.substring(0, lastSafe) : jsonStr;
  t = t.replace(/[,:\s]+$/, '');
  const { braces, brackets } = countBrackets(t);
  const closing = ']'.repeat(Math.max(0, brackets)) + '}'.repeat(Math.max(0, braces));
  return closing ? t + closing : t;
}

function stripToLastComplete(jsonStr: string): string | null {
  let best = -1, inStr = false, esc = false, depth = 0;
  for (let i = 0; i < jsonStr.length; i++) {
    const c = jsonStr[i];
    if (esc) { esc = false; continue; }
    if (c === '\\' && inStr) { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === '{' || c === '[') depth++;
    else if (c === '}' || c === ']') { depth--; if (depth <= 1) best = i; }
  }
  if (best <= 0) return null;
  let t = jsonStr.substring(0, best + 1).replace(/[,\s]+$/, '');
  const { braces, brackets } = countBrackets(t);
  return t + ']'.repeat(Math.max(0, brackets)) + '}'.repeat(Math.max(0, braces));
}
