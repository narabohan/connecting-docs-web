module.exports=[70406,(e,t,n)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},86447,e=>e.a(async(t,n)=>{try{let t=await e.y("@anthropic-ai/sdk-8a97726827ff28fc");e.n(t),n()}catch(e){n(e)}},!0),72351,e=>e.a(async(t,n)=>{try{var i=e.i(86447),a=t([i]);[i]=a.then?(await a)():a;let s=new i.default({apiKey:process.env.ANTHROPIC_API_KEY}),o={JP:{pain_tolerance:"minimal",style:"natural",treatment_rhythm:"incremental"},CN:{style:"dramatic",downtime_tolerance:"flexible"},SG:{downtime_tolerance:"minimal"},TH:{downtime_tolerance:"minimal"},VN:{downtime_tolerance:"minimal"},KR:{},US:{},AU:{}},l=`You are a pre-consultation AI assistant for a Korean medical aesthetics clinic. Your role is to analyze a patient's free-text response about their skin concerns.

Given:
- Patient demographics (gender, age, country)
- Their free-text response about skin concerns

Output a JSON object with these fields:
- q1_primary_goal: One of ["Contouring/lifting", "Volume/elasticity", "Brightening/radiance", "Skin texture/pores", "Anti-aging/prevention", "Acne/scarring"]
- q1_goal_secondary: Same options or null
- concern_area_hint: Brief description of specific areas mentioned
- emotion_tone: One of ["urgent", "casual", "serious", "exploratory"]
- prior_alignment: Compare response with demographic priors. "aligned" if consistent, "diverged" if surprising, "neutral" if insufficient info
- already_known_signals: Array of signal types clearly expressed (e.g., "q1_primary_goal", "concern_area", "pain_tolerance", "style", "scar_type", "pigment_detail")
- needs_confirmation: Array of signal types still needed. Choose from BOTH generic and clinical-depth signals:
  Generic: "concern_area", "skin_profile", "past_experience", "volume_logic", "pigment_pattern", "style", "pain_tolerance", "downtime_tolerance", "treatment_rhythm"
  Clinical depth (use when the primary goal clearly maps to a clinical domain):
    - "tightening_zone" — if goal involves lifting/contouring and specific zone is unclear
    - "scar_type" — if acne/scarring is mentioned but scar type is unspecified
    - "pigment_detail" — if brightening is the goal but specific pigment type is unclear
    - "aging_priority" — if anti-aging is the goal but priority (wrinkles vs sagging vs volume) is unclear
    - "texture_concern" — if texture/pore issues are mentioned but type is unspecified
    - "laxity_severity" — if sagging/lifting is discussed but severity is unknown
    - "treatment_budget" — if no budget preference is expressed

─── Doctor Intelligence Signals (Issue 0-5) ───
Analyze the patient's text to infer these 3 additional fields for doctor-facing intelligence:

- expectation_tag: One of ["REALISTIC", "AMBITIOUS", "CAUTION"]
  - REALISTIC: Patient has measured, natural-improvement expectations (e.g., "자연스럽게 개선", "subtle change")
  - AMBITIOUS: Patient wants dramatic transformation (e.g., "완전히 달라지고 싶어", "want to look 10 years younger")
  - CAUTION: Unrealistic expectations detected (e.g., "한번에 다 해결", "one session fix everything"). Flag for doctor to manage expectations.

- communication_style: One of ["LOGICAL", "EMOTIONAL", "ANXIOUS"]
  - LOGICAL: Uses factual, specific language. Mentions devices/procedures by name, asks about evidence/data.
  - EMOTIONAL: Focuses on feelings, self-image, social situations. Rich in emotional context.
  - ANXIOUS: Expresses fear, doubt, past bad experiences. Mentions pain, side effects, risks prominently.
  Determine from the overall tone, vocabulary, sentence structure, and emotional content of the text.

- lifestyle_context: A short string (max 80 chars) capturing the specific real-life situation or moment the patient mentions as their trigger. Extract their exact lifestyle context.
  Examples: "사진 찍을 때 팔자주름이 보여서", "wedding in 2 months", "job interviews coming up"
  If no specific lifestyle moment is mentioned, set to null.

Respond ONLY with valid JSON, no other text.`;async function r(e,t){if("POST"!==e.method)return t.status(405).json({error:"Method not allowed"});try{let{demographics:n,open_question_response:i}=e.body;if(!n||!i)return t.status(400).json({error:"Missing required fields"});let{detected_country:a,d_gender:r,d_age:c,detected_language:p}=n,d=o[a]||{},u=Object.entries(d).map(([e,t])=>`${e}: ${t}`).join(", "),g=`
Patient Demographics:
- Gender: ${r}
- Age: ${c}
- Country: ${a}
- Language: ${p}
${u?`- Demographic Priors: ${u}`:""}

Patient Response:
"${i}"

Analyze this response and return the JSON analysis.`,m=(await s.messages.create({model:"claude-haiku-4-5-20251001",max_tokens:1024,system:l,messages:[{role:"user",content:g}]})).content[0];if("text"!==m.type)throw Error("Unexpected response type");let f=m.text.trim();f.startsWith("```")&&(f=f.replace(/^```(?:json)?\n?/,"").replace(/\n?```$/,""));let y=JSON.parse(f),h={...d};return t.status(200).json({analysis:y,prior_block:h})}catch(e){return console.error("[analyze-open] Error:",e),t.status(500).json({error:"Failed to analyze response",details:e instanceof Error?e.message:"Unknown error"})}}e.s(["default",()=>r]),n()}catch(e){n(e)}},!1),62457,e=>e.a(async(t,n)=>{try{var i=e.i(26747),a=e.i(90406),r=e.i(44898),s=e.i(62950),o=e.i(72351),l=e.i(7031),c=e.i(81927),p=e.i(46432),d=t([o]);[o]=d.then?(await d)():d;let g=(0,s.hoist)(o,"default"),m=(0,s.hoist)(o,"config"),f=new r.PagesAPIRouteModule({definition:{kind:a.RouteKind.PAGES_API,page:"/api/survey-v2/analyze-open",pathname:"/api/survey-v2/analyze-open",bundlePath:"",filename:""},userland:o,distDir:".next",relativeProjectDir:""});async function u(e,t,n){f.isDev&&(0,p.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let a="/api/survey-v2/analyze-open";a=a.replace(/\/index$/,"")||"/";let r=await f.prepare(e,t,{srcPage:a});if(!r){t.statusCode=400,t.end("Bad Request"),null==n.waitUntil||n.waitUntil.call(n,Promise.resolve());return}let{query:s,params:o,prerenderManifest:d,routerServerContext:u}=r;try{let n=e.method||"GET",i=(0,l.getTracer)(),r=i.getActiveScopeSpan(),p=f.instrumentationOnRequestError.bind(f),g=async r=>f.render(e,t,{query:{...s,...o},params:o,allowedRevalidateHeaderKeys:[],multiZoneDraftMode:!1,trustHostHeader:!1,previewProps:d.preview,propagateError:!1,dev:f.isDev,page:"/api/survey-v2/analyze-open",internalRevalidate:null==u?void 0:u.revalidate,onError:(...t)=>p(e,...t)}).finally(()=>{if(!r)return;r.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let e=i.getRootSpanAttributes();if(!e)return;if(e.get("next.span_type")!==c.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${e.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let s=e.get("next.route");if(s){let e=`${n} ${s}`;r.setAttributes({"next.route":s,"http.route":s,"next.span_name":e}),r.updateName(e)}else r.updateName(`${n} ${a}`)});r?await g(r):await i.withPropagatedContext(e.headers,()=>i.trace(c.BaseServerSpan.handleRequest,{spanName:`${n} ${a}`,kind:l.SpanKind.SERVER,attributes:{"http.method":n,"http.target":e.url}},g))}catch(e){if(f.isDev)throw e;(0,i.sendError)(t,500,"Internal Server Error")}finally{null==n.waitUntil||n.waitUntil.call(n,Promise.resolve())}}e.s(["config",0,m,"default",0,g,"handler",()=>u]),n()}catch(e){n(e)}},!1)];

//# sourceMappingURL=%5Broot-of-the-server%5D__e248eb25._.js.map