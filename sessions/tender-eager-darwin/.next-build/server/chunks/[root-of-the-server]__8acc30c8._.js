module.exports=[70406,(e,t,n)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},42849,(e,t,n)=>{t.exports=e.x("airtable-9fd4456b18d345df",()=>require("airtable-9fd4456b18d345df"))},86447,e=>e.a(async(t,n)=>{try{let t=await e.y("@anthropic-ai/sdk-8a97726827ff28fc");e.n(t),n()}catch(e){n(e)}},!0),79689,e=>e.a(async(t,n)=>{try{var a=e.i(86447),i=e.i(42849),r=t([a]);[a]=r.then?(await r)():r;let s=new a.default({apiKey:process.env.CLAUDE_API_KEY||""}),l=new i.default({apiKey:process.env.AIRTABLE_API_KEY}).base(process.env.AIRTABLE_BASE_ID||"");async function o(e,t){if("POST"!==e.method)return t.status(405).json({error:"Method not allowed"});let{deviceName:n,userData:a}=e.body;try{let e=await l("EBD_Device").select({filterByFormula:`{name} = '${n}'`,maxRecords:1}).firstPage(),i=e[0]?.fields||{name:n},r=`You are the "ConnectingDocs" Clinical Intelligence Engine.
Your task is to explain why a specific aesthetic device is NOT recommended for a patient, or what precautions are needed.

=== PATIENT PROFILE ===
- Goals: ${a.primaryGoal}, ${a.secondaryGoal}
- Concerns: ${a.areas?.join(", ")}
- Skin Type: ${a.skinType}
- Preferences: Pain Tolerance (${a.painTolerance}), Downtime (${a.downtimeTolerance})
- History: ${a.treatmentHistory?.join(", ")}

=== TARGET EQUIPMENT ===
- Name: ${n}
- Indications: ${i.indications||"General aesthetic"}
- Pain/Downtime: ${i.pain_level||"Varies"} / ${i.downtime_level||"Varies"}
- Features: ${i.notes||"N/A"}

=== RESPONSE STRUCTURE (JSON ONLY) ===
Provide a detailed, structured reasoning comparison.
1. Characteristics & Indications of the device.
2. Pain & Downtime profile.
3. Comparative Reasoning: Why it doesn't match the patient's profile (e.g., "Too painful for your tolerance," "Targets different layers than your concern," etc.)
4. Suitability Score: A percentage (0-100%).
5. Precautions: Important things to know if the patient insists on this treatment.

{
  "deviceName": "...",
  "characteristics": "...",
  "painDowntime": "...",
  "reasoningSteps": [
    "Step 1: Alignment check with [Concern]...",
    "Step 2: Risk assessment for [Skin Type]...",
    "Step 3: Preference check [Pain/Downtime]..."
  ],
  "suitabilityScore": 45,
  "precautions": "...",
  "conclusion": "..."
}`,o=await s.messages.create({model:"claude-3-5-sonnet-20241022",max_tokens:1500,temperature:0,system:r,messages:[{role:"user",content:`Why is ${n} not the top recommendation for me?`}]}),c=JSON.parse("text"===o.content[0].type?o.content[0].text:"{}");t.status(200).json(c)}catch(e){console.error("[EXPLAIN_UNRECOMMENDED] Error:",e),t.status(500).json({error:"Failed to generate explanation"})}}e.s(["default",()=>o]),n()}catch(e){n(e)}},!1),94252,e=>e.a(async(t,n)=>{try{var a=e.i(26747),i=e.i(90406),r=e.i(44898),o=e.i(62950),s=e.i(79689),l=e.i(7031),c=e.i(81927),d=e.i(46432),p=t([s]);[s]=p.then?(await p)():p;let m=(0,o.hoist)(s,"default"),h=(0,o.hoist)(s,"config"),f=new r.PagesAPIRouteModule({definition:{kind:i.RouteKind.PAGES_API,page:"/api/engine/explain-unrecommended",pathname:"/api/engine/explain-unrecommended",bundlePath:"",filename:""},userland:s,distDir:"/sessions/tender-eager-darwin/.next-build",relativeProjectDir:""});async function u(e,t,n){f.isDev&&(0,d.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let i="/api/engine/explain-unrecommended";i=i.replace(/\/index$/,"")||"/";let r=await f.prepare(e,t,{srcPage:i});if(!r){t.statusCode=400,t.end("Bad Request"),null==n.waitUntil||n.waitUntil.call(n,Promise.resolve());return}let{query:o,params:s,prerenderManifest:p,routerServerContext:u}=r;try{let n=e.method||"GET",a=(0,l.getTracer)(),r=a.getActiveScopeSpan(),d=f.instrumentationOnRequestError.bind(f),m=async r=>f.render(e,t,{query:{...o,...s},params:s,allowedRevalidateHeaderKeys:[],multiZoneDraftMode:!1,trustHostHeader:!1,previewProps:p.preview,propagateError:!1,dev:f.isDev,page:"/api/engine/explain-unrecommended",internalRevalidate:null==u?void 0:u.revalidate,onError:(...t)=>d(e,...t)}).finally(()=>{if(!r)return;r.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let e=a.getRootSpanAttributes();if(!e)return;if(e.get("next.span_type")!==c.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${e.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let o=e.get("next.route");if(o){let e=`${n} ${o}`;r.setAttributes({"next.route":o,"http.route":o,"next.span_name":e}),r.updateName(e)}else r.updateName(`${n} ${i}`)});r?await m(r):await a.withPropagatedContext(e.headers,()=>a.trace(c.BaseServerSpan.handleRequest,{spanName:`${n} ${i}`,kind:l.SpanKind.SERVER,attributes:{"http.method":n,"http.target":e.url}},m))}catch(e){if(f.isDev)throw e;(0,a.sendError)(t,500,"Internal Server Error")}finally{null==n.waitUntil||n.waitUntil.call(n,Promise.resolve())}}e.s(["config",0,h,"default",0,m,"handler",()=>u]),n()}catch(e){n(e)}},!1)];

//# sourceMappingURL=%5Broot-of-the-server%5D__8acc30c8._.js.map