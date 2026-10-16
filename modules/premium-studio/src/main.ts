import './styles.css';
import { api, image } from '@appdeploy/client';
const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `<div class="app"><header class="header"><strong>CHATBLIZ · DIGITAL STUDIO</strong><span id="status" class="status">Camera disconnected</span></header><main class="workspace"><section class="camera-wall"><div class="camera-tile" id="cam1"><b>CAM 1</b><video id="source1" autoplay muted playsinline></video><button id="select1">PREVIEW CAM 1</button></div><div class="camera-tile" id="cam2"><b>CAM 2 · Disconnected</b><video id="source2" autoplay muted playsinline></video><button id="select2">PREVIEW CAM 2</button></div><div class="camera-tile" id="cam3"><b>CAM 3 · Disconnected</b><video id="source3" autoplay muted playsinline></video><button id="select3">PREVIEW CAM 3</button></div></section><section class="monitors"><div class="monitor"><h2>PREVIEW</h2><small>Next scene</small><div class="screen"><video id="preview" autoplay muted playsinline></video><div class="empty" id="pe">Connect camera</div></div></div><div class="switch"><button id="take">TAKE →</button><button id="swap">SWAP</button></div><div class="monitor live"><h2>PROGRAM</h2><small>Recording output</small><div class="screen"><video id="program" autoplay muted playsinline></video><div class="empty" id="ge">No program source</div></div></div></section><section class="controls"><h3>STUDIO OPERATIONS</h3><div id="buttons" class="buttons"></div></section><footer class="footer"><span class="status" id="detail">Camera: offline · Mic: offline · Recording: stopped</span><button id="connect">CONNECT CAMERA</button><button id="record" class="danger">● RECORD</button><button id="stop" disabled>■ STOP</button></footer></main><section id="panel" class="panel hidden" aria-live="polite"></section></div>`;
const $ = (id: string) => document.getElementById(id)!;
const tools = [
  ['📷', 'Cameras'],
  ['🎤', 'Audio'],
  ['💡', 'Lighting'],
  ['🎬', 'Scenes'],
  ['🤖', 'AI Director'],
  ['🎞', 'AI Video Generator'],
  ['👗', 'AI Photoshoot'],
  ['🎥', 'AI Autopilot'],
  ['🖼', 'Graphics'],
  ['🤝', 'Sponsors'],
  ['📺', 'Ad Scheduler'],
  ['💬', 'Chat'],
  ['⏺', 'Record'],
  ['📡', 'Go Live'],
  ['🌐', 'Social Growth Hub'],
  ['🔗', 'Partner & OAuth Setup'],
  ['🏆', 'GitHub Module Arena'],
  ['🎙', 'Podcast'],
  ['✂', 'Edit'],
  ['🎨', 'Branding'],
  ['☁', 'Publish'],
  ['📊', 'Analytics'],
  ['⚙', 'Settings'],
];
$('buttons').innerHTML = tools
  .map(
    ([icon, name]) =>
      `<button data-tool="${name}"><span>${icon}</span>${name}</button>`
  )
  .join('');
let camera: MediaStream | null = null;
let programStream: MediaStream | null = null;
let recorder: MediaRecorder | null = null;
let chunks: Blob[] = [];
let audioOn = false;
let phoneMic: MediaStream | null = null;
let speakerMonitor = false;
let monitorVolume = 0.5;
const speakerAudio = document.createElement('audio');
speakerAudio.autoplay = false;
speakerAudio.volume = monitorVolume;
document.body.appendChild(speakerAudio);
function updateSpeakerMonitor() {
  const selected = cameraStreams[previewSelection];
  const remoteAudio = selected?.getAudioTracks().length ? selected : null;
  speakerAudio.srcObject = speakerMonitor && remoteAudio && remoteAudio !== phoneMic ? remoteAudio : null;
  if (speakerAudio.srcObject) speakerAudio.play().catch(() => {});
  else speakerAudio.pause();
}
let facing: 'user' | 'environment' = 'user';
async function ensurePhoneMic() {
  if (phoneMic?.getAudioTracks().some(t => t.readyState === 'live')) return;
  phoneMic = await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});
  phoneMic.getAudioTracks().forEach(t => t.enabled = !muted);
  audioOn = phoneMic.getAudioTracks().length > 0;
  update();
}
async function playCameraVideo(el: HTMLVideoElement, stream: MediaStream) { el.muted = true; el.autoplay = true; el.playsInline = true; el.srcObject = stream; try { await el.play(); } catch(e) { console.warn('Camera playback requires interaction',e); } }
async function switchPhoneCamera() {
  if (recorder?.state === 'recording') { alert('Stop recording before switching the phone camera.'); return; }
  const next = facing === 'user' ? 'environment' : 'user';
  const old = cameraStreams[0];
  if (old) old.getVideoTracks().forEach(t => t.stop());
  try {
    const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:next}},audio:false});
    if (!stream.getVideoTracks().length) throw new Error('No video track returned');
    facing = next;
    cameraStreams[0] = stream;
    camera = stream;
    await playCameraVideo($('source1') as HTMLVideoElement,stream);
    $('cam1').querySelector('b')!.textContent = 'CAM 1 · ' + (facing === 'user' ? 'Front' : 'Back');
    setPreview(0);
    if (programSelection === 0) {programStream=stream;await playCameraVideo(pg,stream);}
    update();
  } catch(e) { cameraStreams[0]=null; camera=null; pv.srcObject=null; $('pe').textContent='Camera unavailable — tap CONNECT CAMERA';$('pe').classList.remove('hidden');update();alert('Cannot switch camera: '+String(e));}
}
const cameraStreams: (MediaStream | null)[] = [null, null, null];
let previewSelection = 0;
let selectedDeviceIds: string[] = [];
let recordingUrl: string | null = null;
let lastRecording: Blob | null = null;
let lastMime = 'video/webm';
let showTitle = false;
let studioBanner = localStorage.getItem('studioBanner') || '';
let showBanner = false;
let studioTitle = localStorage.getItem('studioTitle') || 'CHATBLIZ STUDIO';
let muted = false;
let screenStream: MediaStream | null = null;
let recordingCanvas: HTMLCanvasElement | null = null;
let recordingLoop = 0;
let recordingOutput: MediaStream | null = null;
let programSelection = -1;
type AdTask = {id:string;name:string;message:string;offset:number;duration:number;status:'scheduled'|'aired'|'missed';airedAt?:string};
let adTasks:AdTask[] = JSON.parse(localStorage.getItem('chatblizAds')||'[]');
let recordingStartedAt = 0;
let activeAd:AdTask|null = null;
function persistAds(){localStorage.setItem('chatblizAds',JSON.stringify(adTasks));}
function scheduledAdAt(seconds:number){for(const task of adTasks){if(task.status==='scheduled'&&seconds>=task.offset){task.status='aired';task.airedAt=new Date().toISOString();persistAds();} }return adTasks.find(t=>t.status==='aired'&&seconds>=t.offset&&seconds<t.offset+t.duration)||null;}
function adSchedulerPanel(){show('Advertising Scheduler','<p>Schedule banner adverts by elapsed recording time. Keep this browser tab open and record the Program for ads to air. Live streaming is not yet connected.</p><label>Advert name<input id="adName" placeholder="Sponsor name"></label><label>Banner message<input id="adMessage" placeholder="Visit our sponsor"></label><label>Air after recording starts (seconds)<input id="adOffset" type="number" min="0" value="15"></label><label>Duration (seconds)<input id="adDuration" type="number" min="1" max="120" value="10"></label><button id="saveAd">Schedule advert</button><div id="adList"></div>');const render=()=>{const list=$('adList');list.replaceChildren();for(const task of adTasks){const p=document.createElement('p');p.textContent=task.name+' · '+task.offset+'s · '+task.duration+'s · '+task.status+(task.airedAt?' · '+task.airedAt:'');list.appendChild(p);}};render();$('saveAd').onclick=()=>{const name=($('adName') as HTMLInputElement).value.trim().slice(0,50),message=($('adMessage') as HTMLInputElement).value.trim().slice(0,90),offset=Number(($('adOffset') as HTMLInputElement).value),duration=Number(($('adDuration') as HTMLInputElement).value);if(!name||!message||!Number.isFinite(offset)||offset<0||!Number.isFinite(duration)||duration<1||duration>120){alert('Enter a name, message, valid start time and duration (1–120 seconds).');return;}adTasks.push({id:crypto.randomUUID(),name,message,offset,duration,status:'scheduled'});persistAds();render();};}
async function availableDevices() {
  try { return (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'videoinput'); }
  catch { return []; }
}
function setPreview(index: number) {
  const stream = cameraStreams[index];
  if (!stream || !stream.getVideoTracks().some(t => t.readyState === 'live')) {
    alert('Camera ' + (index + 1) + ' is not connected. Connect a local camera first.');
    return;
  }
  previewSelection = index;
  void playCameraVideo(pv,stream);
  updateSpeakerMonitor();
  $('pe').classList.add('hidden');
}
async function connectSlot(index: number, deviceId?: string) {
  try {
    const previous = cameraStreams[index];
    const constraints: MediaStreamConstraints = {
      video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: index === 0 ? 'user' : 'environment' },
      audio: false,
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    if (previous && previous !== programStream) previous.getTracks().forEach(t => t.stop());
    cameraStreams[index] = stream;
    await playCameraVideo($('source' + (index + 1)) as HTMLVideoElement,stream);
    $('cam' + (index + 1)).querySelector('b')!.textContent = 'CAM ' + (index + 1) + ' · Connected';
    if (index === 0) { camera = stream; await ensurePhoneMic().catch(() => {audioOn=false;}); }
    setPreview(index);
    update();
  } catch (e) { alert('Camera ' + (index + 1) + ' could not connect: ' + String(e)); }
}
async function cameraPanel() {
  const devices = await availableDevices();
  const options = devices.map((d, i) => '<option value="' + i + '">' + (d.label || 'Camera device ' + (i + 1)) + '</option>').join('');
  show('Camera sources', '<p>Android phone: open this HTTPS studio link in Chrome, allow camera and microphone, then tap CONNECT PHONE CAMERA. The camera runs on the device opening this page. Remote phone-to-computer pairing is not yet connected.</p><button id="quickPhone">📱 CONNECT PHONE CAMERA</button><button id="copyPhoneLink">Copy Studio link for Android</button><button id="flipCamera">↻ Switch FRONT / BACK camera</button><button id="phoneMicrophone">Connect phone microphone</button><label>Camera slot <select id="slot"><option value="0">CAM 1</option><option value="1">CAM 2</option><option value="2">CAM 3</option></select></label><label>Device <select id="device"><option value="">Default camera</option>' + options + '</select></label><button id="assignCamera">Connect selected camera</button>');
  $('quickPhone').onclick = async()=>{await connect();if(cameraStreams[0]){setPreview(0);alert('Phone camera connected. Tap TAKE to place it in Program.');}};
  $('copyPhoneLink').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);alert('Studio link copied. Open it on your Android phone.');}catch{alert('Open this Studio URL on your Android phone: '+location.href);}};
  $('flipCamera').onclick = switchPhoneCamera;
  $('phoneMicrophone').onclick = async () => {try {await ensurePhoneMic();alert('Phone microphone connected');}catch(e){alert('Microphone permission failed: '+String(e));}};
  $('assignCamera').onclick = async () => {
    const slot = Number(($('slot') as HTMLSelectElement).value);
    const value = ($('device') as HTMLSelectElement).value;
    await connectSlot(slot, value === '' ? undefined : devices[Number(value)]?.deviceId);
  };
}
function moduleArena(){show('GitHub Module Arena','<p>Search public GitHub repositories for a task, compare repository health signals, and show the top-ranked candidate. This is discovery and metadata ranking—not sandbox execution, security certification or a verified performance benchmark.</p><textarea id="arenaTask" placeholder="Describe the task, e.g. video editing, camera streaming, SEO analysis, podcast automation"></textarea><button id="arenaBattle">Discover & rank modules</button><div id="arenaResult" aria-live="polite"></div>');$('arenaBattle').onclick=async()=>{const task=(($('arenaTask') as HTMLTextAreaElement).value||'').trim();const output=$('arenaResult');if(task.length<3){output.textContent='Describe a task with at least three characters.';return;}const button=$('arenaBattle') as HTMLButtonElement;button.disabled=true;output.textContent='Searching public GitHub repositories…';try{const query=task.replace(/[^a-zA-Z0-9 .+#-]/g,' ').split(/\s+/).filter(Boolean).slice(0,8).join(' ');const response=await fetch('https://api.github.com/search/repositories?q='+encodeURIComponent(query)+'&sort=stars&per_page=20',{headers:{Accept:'application/vnd.github+json'}});if(!response.ok)throw new Error('GitHub search HTTP '+response.status+'. Public API limits may apply.');const data=await response.json() as {items?:Array<{full_name:string;html_url:string;description:string|null;stargazers_count:number;forks_count:number;open_issues_count:number;archived:boolean;disabled:boolean;pushed_at:string;license?:{spdx_id?:string}|null}>};const now=Date.now();const entries=(data.items||[]).filter(r=>!r.archived&&!r.disabled).map(r=>{const days=Math.max(0,(now-Date.parse(r.pushed_at))/86400000);const stars=Math.min(30,Math.log10(1+r.stargazers_count)*8);const forks=Math.min(12,Math.log10(1+r.forks_count)*4);const freshness=Math.max(0,30-days/18);const issuePenalty=Math.min(10,r.open_issues_count/100);const license=r.license?.spdx_id&&r.license.spdx_id!=='NOASSERTION'?12:0;return{repo:r,score:Math.round(stars+forks+freshness+license-issuePenalty),days:Math.round(days)};}).sort((x,y)=>y.score-x.score);output.replaceChildren();if(!entries.length){output.textContent='No eligible public repositories found. Try a more specific task.';return;}const winner=entries[0];const heading=document.createElement('h3');heading.textContent='🏆 #1 Discovery Candidate: '+winner.repo.full_name;const p=document.createElement('p');p.textContent='Metadata score '+winner.score+' · Stars '+winner.repo.stargazers_count+' · Forks '+winner.repo.forks_count+' · Last push '+winner.days+' days ago · License '+(winner.repo.license?.spdx_id||'not confirmed')+'. This score is not a runtime performance test.';const link=document.createElement('a');link.href=winner.repo.html_url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Inspect winning GitHub repository';const description=document.createElement('p');description.textContent=winner.repo.description||'No repository description';const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent='Show ranking audit ('+entries.length+' candidates)';details.appendChild(summary);for(const [i,item] of entries.entries()){const row=document.createElement('p');row.textContent=(i+1)+'. '+item.repo.full_name+' · metadata score '+item.score;details.appendChild(row);}output.append(heading,description,p,link,details);}catch(e){output.textContent='Search unavailable: '+String(e);}finally{button.disabled=false;}};}
function partnerDirectory(){const groups:[string,string,string,string][]=[['Google / YouTube / Search / Business','https://console.cloud.google.com/apis/credentials','Developer OAuth setup','Google Cloud project and OAuth consent'],['Facebook / Instagram / WhatsApp','https://developers.facebook.com/apps/','Meta developer app','Meta business and app review'],['TikTok','https://developers.tiktok.com/','Developer app','Approval and API scopes'],['LinkedIn','https://www.linkedin.com/developers/','Developer app','LinkedIn product permissions'],['Pinterest','https://developers.pinterest.com/','Developer app','Pinterest API access'],['GitHub','https://github.com/settings/developers','OAuth app','GitHub developer settings'],['X','https://developer.x.com/','Developer portal','API access and plan'],['Twitch','https://dev.twitch.tv/console','Developer app','Twitch application'],['Shopify','https://partners.shopify.com/','Commerce partner','Store integration'],['WooCommerce','https://woocommerce.com/document/woocommerce-rest-api/','Store API','Store owner API keys'],['Printful / Print on demand','https://developers.printful.com/','Fulfilment API','Merchant account'],['PayPal','https://developer.paypal.com/','Payment app','Merchant approval'],['Stripe','https://dashboard.stripe.com/','Payment integration','Supported merchant account'],['Cloudflare','https://dash.cloudflare.com/','Website / DNS','Domain authorization'],['Mailchimp','https://mailchimp.com/developer/','Email marketing','Mailchimp developer account'],['Brevo','https://developers.brevo.com/','Email and CRM','Business account'],['WhatsApp Business Platform','https://business.whatsapp.com/products/business-platform','Business messaging','Meta verification and WhatsApp platform'],['WhatsApp Channels','https://www.whatsapp.com/channel/','Channel management','No general-purpose channel publishing OAuth assumed'],['Supplier / manufacturer directory','https://www.google.com/search?q=manufacturer+supplier+directory','Supplier discovery','Verify suppliers before agreements'],['Wholesale / white label','https://www.google.com/search?q=wholesale+white+label+suppliers','Sourcing discovery','Supplier authorization required'],['Banking and mobile banking','https://www.google.com/search?q=official+bank+business+developer+api','Financial integration research','Bank-specific regulated approval']];show('Partner & OAuth Connection Directory','<p>Customers can open official developer or account registration pages to set up access. This directory is not an OAuth callback, account connection, banking login, or authorization system. Never enter bank credentials or passwords into Chatbliz.</p><label>Find platform or service<input id="partnerSearch" placeholder="YouTube, bank, wholesale, GitHub, WhatsApp…"></label><div id="partnerRows"></div>');const rows=$('partnerRows');const render=()=>{const term=(($('partnerSearch') as HTMLInputElement).value||'').toLowerCase();rows.replaceChildren();for(const [name,url,type,requirements] of groups.filter(x=>x.join(' ').toLowerCase().includes(term))){const row=document.createElement('p');row.style.cssText='padding:10px;border:1px solid #43516a;border-radius:10px';const title=document.createElement('strong');title.textContent=name;const desc=document.createElement('span');desc.textContent=' · '+type+' · '+requirements+' · ';const link=document.createElement('a');link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Open setup';row.append(title,desc,link);rows.appendChild(row);}};($('partnerSearch') as HTMLInputElement).oninput=render;render();}
function socialPanel() {
  const services:[string,string,string][]=[['YouTube Studio','https://studio.youtube.com/','Video & channel'],['Pinterest Business','https://business.pinterest.com/','Visual discovery'],['WhatsApp Business','https://business.whatsapp.com/','Customer messaging'],['WhatsApp Channels','https://www.whatsapp.com/','Channel distribution'],['Facebook Pages','https://www.facebook.com/pages/','Business pages'],['Instagram','https://www.instagram.com/','Reels & profile'],['TikTok','https://www.tiktok.com/','Short videos'],['LinkedIn Pages','https://www.linkedin.com/company/setup/new/','Professional audience'],['X','https://x.com/','Public updates'],['Twitch','https://dashboard.twitch.tv/','Live channel'],['Google Business Profile','https://business.google.com/','Local search'],['Google Search Console','https://search.google.com/search-console/','Indexing & SEO'],['Google Analytics','https://analytics.google.com/','Traffic analytics'],['Google Trends','https://trends.google.com/','Search topics'],['GitHub','https://github.com/','Code & website repository'],['Cloudflare','https://dash.cloudflare.com/','Website DNS & delivery']];
  show('Social Connection & Growth Hub','<p>Open official account sign-in and channel dashboards. Account login on these sites is NOT a Chatbliz OAuth connection; automated publishing requires approved API integrations. All integrations currently show Not connected.</p><div id="socialLinks"></div><h3>SEO & distribution readiness</h3><p>Track preparation steps for your website and channel growth. Checking these boxes does not verify the external platform.</p><div id="seoChecklist"></div><p class="notice">Do not share passwords or stream keys. Search ranking is not guaranteed by adding links or profiles.</p>');
  const list=$('socialLinks');for(const [name,url,kind] of services){const row=document.createElement('p');const label=document.createElement('span');label.textContent=name+' · '+kind+' · Not connected · ';const link=document.createElement('a');link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Open official site';row.append(label,link);list.appendChild(row);}
  const tasks=['Verify website in Search Console','Submit XML sitemap','Check indexing and mobile performance','Write page titles and descriptions','Add structured data where relevant','Connect analytics with consent','Optimize YouTube titles and thumbnails','Create Pinterest boards and descriptive Pins','Complete WhatsApp Business profile','Link verified business pages and channels','Review backlinks and search queries'];const checklist=$('seoChecklist');for(const task of tasks){const row=document.createElement('label');row.style.cssText='display:block;margin:10px 0';const input=document.createElement('input');input.type='checkbox';const key='chatbliz-seo-'+task;input.checked=localStorage.getItem(key)==='yes';input.onchange=()=>localStorage.setItem(key,input.checked?'yes':'no');row.append(input,document.createTextNode(' '+task));checklist.appendChild(row);}
}

const pv = $('preview') as HTMLVideoElement,
  pg = $('program') as HTMLVideoElement;
function update() {
  $('status').textContent = camera ? 'Camera connected' : 'Camera disconnected';
  $('detail').textContent =
    `Camera: ${cameraStreams.filter(s => s?.active).length}/3 · Phone mic: ${audioOn && !muted ? 'on' : 'muted/offline'} · Speaker: ${speakerMonitor?'monitoring':'off'} · Recording: ${recorder?.state === 'recording' ? 'active' : 'stopped'}`;
}
async function connect() {
  try {
    if (camera && camera !== programStream) camera.getVideoTracks().forEach(t => t.stop());
    camera = await navigator.mediaDevices.getUserMedia({
      video: {facingMode:{ideal:facing}},
      audio: false,
    });
    try { await ensurePhoneMic(); } catch(e) { audioOn=false; alert('Camera connected, but phone microphone permission failed: '+String(e)); }
    cameraStreams[0] = camera;
    previewSelection = 0;
    await playCameraVideo(pv,camera);
    await playCameraVideo($('source1') as HTMLVideoElement,camera);
    $('cam1').querySelector('b')!.textContent = 'CAM 1 · Connected';
    $('pe').classList.add('hidden');
    update();
  } catch (e) {
    alert('Camera or microphone permission failed: ' + String(e));
  }
}
$('connect').onclick = connect;
const flip = document.createElement('button');
flip.id = 'flip';
flip.textContent = '↻ FRONT / BACK';
$('connect').insertAdjacentElement('afterend',flip);
flip.onclick = switchPhoneCamera;
$('select1').onclick = () => setPreview(0);
$('select2').onclick = () => setPreview(1);
$('select3').onclick = () => setPreview(2);
$('take').onclick = () => {
  const chosen = cameraStreams[previewSelection];
  if (!chosen?.getVideoTracks().some(t => t.readyState === 'live')) {
    alert('Select a connected camera first');
    return;
  }
  programSelection = previewSelection;
  programStream = chosen;
  void playCameraVideo(pg,programStream);
  $('ge').classList.add('hidden');
};
$('swap').onclick = () => {
  if (!programStream || !camera) {
    alert('Connect and TAKE a camera first');
    return;
  }
  const previous = programSelection;
  programSelection = previewSelection;
  previewSelection = previous;
  programStream = cameraStreams[programSelection];
  pg.srcObject = programStream;
  pv.srcObject = cameraStreams[previewSelection];
};
function show(title: string, content: string) {
  $('panel').classList.remove('hidden');
  $('panel').innerHTML =
    `<button id="close" style="float:right">✕</button><h3>${title}</h3>${content}`;
  $('close').onclick = () => $('panel').classList.add('hidden');
}
function startRecord() {
  if (!programStream) {
    alert('Connect camera and press TAKE first');
    return;
  }
  if (!('MediaRecorder' in window)) {
    alert('Recording is not supported by this browser');
    return;
  }
  try {
    chunks = [];
    recordingStartedAt = performance.now();
    adTasks=adTasks.map(t=>({...t,status:'scheduled',airedAt:undefined}));persistAds();
    recordingCanvas = document.createElement('canvas');
    recordingCanvas.width = 1280;
    recordingCanvas.height = 720;
    const ctx = recordingCanvas.getContext('2d')!;
    const frame = () => {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 1280, 720);
      const source = pg;
      if (source.readyState >= 2 && source.videoWidth && source.videoHeight) {
        const ratio = Math.min(1280 / source.videoWidth, 720 / source.videoHeight);
        const w = source.videoWidth * ratio, h = source.videoHeight * ratio;
        ctx.drawImage(source, (1280-w)/2, (720-h)/2, w, h);
      }
      activeAd = scheduledAdAt((performance.now()-recordingStartedAt)/1000);
      if (activeAd){ctx.fillStyle='#0b1020ee';ctx.fillRect(0,560,1280,160);ctx.fillStyle='#d4af37';ctx.fillRect(0,560,14,160);ctx.fillStyle='#fff';ctx.font='bold 35px sans-serif';ctx.fillText(activeAd.name.slice(0,50),40,620);ctx.font='28px sans-serif';ctx.fillText(activeAd.message.slice(0,75),40,675);}
      else if (showTitle || showBanner) {
        ctx.fillStyle = '#0b1020ee'; ctx.fillRect(0, 600, 1280, 120);
        ctx.fillStyle = '#d4af37'; ctx.fillRect(0, 600, 12, 120);
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 35px sans-serif';
        if (showTitle) ctx.fillText(studioTitle.slice(0,55), 35, 650);
        if (showBanner) {ctx.fillStyle='#d4af37';ctx.font='26px sans-serif';ctx.fillText(studioBanner.slice(0,60),35,690);}
      }
      recordingLoop = requestAnimationFrame(frame);
    };
    frame();
    recordingOutput = recordingCanvas.captureStream(30);
    const mic = phoneMic?.getAudioTracks()[0];
    if (mic && mic.readyState === 'live' && !muted) recordingOutput.addTrack(mic);
    const preferred = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
    const type = preferred.find(t => MediaRecorder.isTypeSupported(t));
    recorder = new MediaRecorder(recordingOutput, type ? {mimeType:type} : undefined);
    lastMime = recorder.mimeType;
    recorder.ondataavailable = e => {
      if (e.data.size) chunks.push(e.data);
    };
    recorder.onstop = () => {
      cancelAnimationFrame(recordingLoop);
      recordingOutput?.getVideoTracks().forEach(t => t.stop());
      const blob = new Blob(chunks, { type: lastMime });
      lastRecording = blob;
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
      const url = URL.createObjectURL(blob);
      recordingUrl = url;
      show(
        'Recording saved',
        `<p>Your recording is ready. Save it before closing the browser.</p><video controls playsinline src="${url}" style="width:100%;max-height:200px"></video><p><a href="${url}" download="chatbliz-studio-recording.${lastMime.includes('mp4')?'mp4':'webm'}">⬇ Download recording</a></p><button id="shareClip">Share clip</button>`
      );
      $('shareClip').onclick = async () => { if (!lastRecording) return; const file = new File([lastRecording], 'chatbliz-recording.'+(lastMime.includes('mp4')?'mp4':'webm'), {type:lastMime}); try { if (navigator.canShare?.({files:[file]})) await navigator.share({files:[file],title:'Chatbliz Studio'}); else alert('Download the recording to share it from your device.'); } catch {} };
      update();
    };
    recorder.start(1000);
    $('stop').removeAttribute('disabled');
    $('record').setAttribute('disabled', '');
    update();
  } catch (e) {
    alert('Could not record: ' + String(e));
  }
}
$('record').onclick = startRecord;
$('stop').onclick = () => {
  if (recorder?.state === 'recording') recorder.stop();
  $('stop').setAttribute('disabled', '');
  $('record').removeAttribute('disabled');
};
$('buttons').addEventListener('click', async e => {
  const btn = (e.target as HTMLElement).closest('button');
  if (!btn) return;
  const name = btn.dataset.tool;
  if (name === 'Cameras') {
    await cameraPanel();
    return;
  }
  if (name === 'Audio') { show('Studio audio & intercom', '<p>Phone microphone: '+(audioOn?'connected':'not connected')+'</p><button id="connectMic">Connect phone mic</button><button id="muteMic">'+(muted?'Unmute':'Mute')+' microphone</button><hr><p>Phone speaker: monitor audio from the selected camera when that source provides audio. Use headphones to prevent feedback.</p><button id="speakerToggle">'+(speakerMonitor?'Turn speaker monitor off':'Turn speaker monitor on')+'</button><label>Speaker volume <input id="speakerVolume" type="range" min="0" max="100" value="'+Math.round(monitorVolume*100)+'"></label><hr><p>Talk to all cameras: remote camera intercom is not connected yet. It requires authenticated remote camera sessions and real-time audio routing.</p><button disabled>Talk to All · Not connected</button>'); $('connectMic').onclick = async()=>{try{await ensurePhoneMic();alert('Phone mic ready')}catch(e){alert(String(e))}}; $('muteMic').onclick = () => { muted = !muted; phoneMic?.getAudioTracks().forEach(t => t.enabled = !muted); update(); $('muteMic').textContent = muted?'Unmute microphone':'Mute microphone'; }; $('speakerToggle').onclick=()=>{speakerMonitor=!speakerMonitor;updateSpeakerMonitor();update();$('speakerToggle').textContent=speakerMonitor?'Turn speaker monitor off':'Turn speaker monitor on';}; $('speakerVolume').oninput=()=>{monitorVolume=Number(($('speakerVolume') as HTMLInputElement).value)/100;speakerAudio.volume=monitorVolume;}; return; }
  if (name === 'Ad Scheduler' || name === 'Sponsors'){adSchedulerPanel();return;}
  if (name === 'Lighting') {show('Camera lighting','<p>Adjust the visible local camera brightness. This is a video filter, not a physical light control.</p><label>Brightness <input id="lightLevel" type="range" min="50" max="180" value="100"></label><button id="lightReset">Reset brightness</button>');const apply=()=>{const level=Number(($('lightLevel') as HTMLInputElement).value)/100;['source1','source2','source3','preview','program'].forEach(id=>{($(id) as HTMLVideoElement).style.filter='brightness('+level+')';});};$('lightLevel').oninput=apply;$('lightReset').onclick=()=>{($('lightLevel') as HTMLInputElement).value='100';apply();};return;}
  if (name === 'Record') { startRecord(); return; }
  if (name === 'Audio') return;
  if (name === 'AI Autopilot') {show('AI Production Autopilot','<p>Generate a fashion film script and character/garment continuity plan, create a real AI photoshoot image, and export a 30-second animated image video. Longer productions need a server-side rendering pipeline.</p><textarea id="autoBrief" placeholder="Describe dress, fabric, characters, location, story, camera, lighting and music"></textarea><label>Total planned film duration (seconds)<input id="autoDuration" type="number" min="30" max="7200" value="120"></label><button id="autoScript">1 · Generate script and 30-second scene plan</button><button id="autoPhoto">2 · Generate fashion image</button><button id="autoClip" disabled>3 · Render 30-second animated clip</button><pre id="autoResult" style="white-space:pre-wrap;max-height:30vh;overflow:auto"></pre><div id="autoMedia"></div>');let photo:HTMLImageElement|null=null;const result=$('autoResult');const brief=()=>($('autoBrief') as HTMLTextAreaElement).value;const duration=()=>Number(($('autoDuration') as HTMLInputElement).value);$('autoScript').onclick=async()=>{result.textContent='Writing script…';try{const r=await api.post('/api/studio/autopilot',{brief:brief(),duration:duration()});result.textContent=r.data.script+'\n\nPlanned 30-second segments: '+r.data.segments;}catch(e){result.textContent=String(e);}};$('autoPhoto').onclick=async()=>{result.textContent='Generating fashion photograph…';try{const r=await api.post('/api/studio/photoshoot',{description:brief(),style:'Cinematic fashion editorial'});const p=r.data.image as {mimeType:string;data:string};photo=new Image();photo.src='data:'+p.mimeType+';base64,'+p.data;await photo.decode();const media=$('autoMedia');media.replaceChildren();photo.style.cssText='max-width:100%;max-height:340px;object-fit:contain';media.appendChild(photo);($('autoClip') as HTMLButtonElement).disabled=false;result.textContent='AI photograph ready. You can now render a 30-second animated photo-video.';}catch(e){result.textContent=String(e);}};$('autoClip').onclick=async()=>{if(!photo)return;const picture=photo;const btn=$('autoClip') as HTMLButtonElement;btn.disabled=true;result.textContent='Rendering 30 seconds in real time. Keep this tab open…';try{if(!('MediaRecorder'in window))throw new Error('MediaRecorder not supported');const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;const ctx=canvas.getContext('2d')!;const stream=canvas.captureStream(24);const mime=['video/webm;codecs=vp8','video/webm','video/mp4'].find(t=>MediaRecorder.isTypeSupported(t));const rec=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);const pieces:Blob[]=[];rec.ondataavailable=e=>{if(e.data.size)pieces.push(e.data);};const started=performance.now();let raf=0;const paint=()=>{const progress=Math.min(1,(performance.now()-started)/30000);ctx.fillStyle='#080808';ctx.fillRect(0,0,960,540);const scale=Math.max(960/picture.width,540/picture.height)*(1+progress*.13);const w=picture.width*scale,h=picture.height*scale;ctx.drawImage(picture,(960-w)/2-progress*14,(540-h)/2,w,h);ctx.fillStyle='#080808cc';ctx.fillRect(0,480,960,60);ctx.fillStyle='#d4af37';ctx.font='bold 23px sans-serif';ctx.fillText('CHATBLIZ · AI FASHION FILM',20,520);if(progress<1)raf=requestAnimationFrame(paint);};paint();const finished=new Promise<Blob>(resolve=>{rec.onstop=()=>resolve(new Blob(pieces,{type:rec.mimeType||'video/webm'}));});rec.start(1000);await new Promise<void>(resolve=>setTimeout(resolve,30000));rec.stop();cancelAnimationFrame(raf);const blob=await finished;stream.getTracks().forEach(t=>t.stop());const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='chatbliz-30-second-fashion-film.'+(blob.type.includes('mp4')?'mp4':'webm');link.textContent='Download 30-second video';$('autoMedia').appendChild(link);result.textContent='30-second animated photo-video rendered. This is camera-motion animation of an AI still image, not generative character motion.';}catch(e){result.textContent='Render failed: '+String(e);}finally{btn.disabled=false;}};return;}
  if (name === 'AI Photoshoot') {show('AI Fashion Photoshoot','<p>Describe a dress or outfit. AI generates an actual fashion image. Add an optional reference photograph to guide garment consistency.</p><textarea id="fashionBrief" placeholder="Describe the dress, colour, fabric, silhouette, model, pose, location and lighting"></textarea><label>Photoshoot style<select id="fashionStyle"><option>Editorial runway</option><option>Luxury e-commerce</option><option>Outdoor fashion campaign</option><option>Studio catalogue</option></select></label><label>Dress reference photo<input type="file" id="fashionRef" accept="image/*"></label><button id="shootFashion">Generate fashion photograph</button><div id="fashionResult"></div>');$('shootFashion').onclick=async()=>{const btn=$('shootFashion') as HTMLButtonElement;btn.disabled=true;$('fashionResult').textContent='Generating real AI photograph…';try{const file=($('fashionRef') as HTMLInputElement).files?.[0];const prepared=file?await image.resizeIfNeeded(file):undefined;const response=await api.post('/api/studio/photoshoot',{description:($('fashionBrief') as HTMLTextAreaElement).value,style:($('fashionStyle') as HTMLSelectElement).value,reference:prepared?{data:prepared.data,mimeType:prepared.mimeType}:undefined});const picture=response.data.image as {data:string;mimeType:string};const url='data:'+picture.mimeType+';base64,'+picture.data;const target=$('fashionResult');target.replaceChildren();const img=document.createElement('img');img.src=url;img.alt='AI generated fashion photoshoot';img.style.cssText='max-width:100%;border-radius:12px';target.appendChild(img);const save=document.createElement('a');save.href=url;save.download='chatbliz-fashion-photoshoot.png';save.textContent='Download generated image';target.appendChild(save);}catch(e){$('fashionResult').textContent='Generation failed: '+String(e);}finally{btn.disabled=false;}};return;}
  if (name === 'AI Video Generator') {show('AI Video Generator','<p>Create an AI production storyboard from text or an image, for 30 seconds to 2 hours. This version plans scenes; it does not yet render an AI video.</p><label>Source <select id="videoSource"><option value="text">Text or script</option><option value="image">Image reference</option></select></label><label>Reference image (optional)<input type="file" id="videoImage" accept="image/*"></label><label>Video length (seconds, 30–7200)<input id="videoDuration" type="number" min="30" max="7200" value="60"></label><textarea id="videoPrompt" placeholder="Describe your video, style, motion, voice and story"></textarea><button id="planVideo">Generate AI storyboard</button><pre id="videoPlan" style="white-space:pre-wrap;max-height:45vh;overflow:auto"></pre>');$('planVideo').onclick=async()=>{const button=$('planVideo') as HTMLButtonElement;button.disabled=true;$('videoPlan').textContent='Planning scenes…';try{const file=($('videoImage') as HTMLInputElement).files?.[0];const source=file?'image':'text';const prompt=($('videoPrompt') as HTMLTextAreaElement).value+(file?' Reference image uploaded: '+file.name+'. Image analysis not connected yet.':'');const response=await api.post('/api/studio/video-plan',{prompt,source,duration:Number(($('videoDuration') as HTMLInputElement).value)});$('videoPlan').textContent=response.data.storyboard+'\n\n'+response.data.notice;}catch(e){$('videoPlan').textContent='Planning failed: '+String(e);}finally{button.disabled=false;}};return;}
  if (name === 'AI Director') { show('AI Production Director','<p>Describe your podcast, recording or livestream. AI creates a title and banner for the recorded Program output.</p><select id="aiMode"><option>Podcast</option><option>Recording</option><option>Livestream</option></select><textarea id="aiBrief" placeholder="Professional business podcast, gold and black, host introduction"></textarea><button id="generateDesign">Generate scene & banner</button><div id="aiResult"></div>'); $('generateDesign').onclick=async()=>{const button=$('generateDesign') as HTMLButtonElement;button.disabled=true;$('aiResult').textContent='Generating…';try{const result=await api.post('/api/studio/design',{prompt:($('aiBrief') as HTMLTextAreaElement).value,mode:($('aiMode') as HTMLSelectElement).value});const data=result.data as {title:string;banner:string};studioTitle=data.title;studioBanner=data.banner;localStorage.setItem('studioTitle',studioTitle);localStorage.setItem('studioBanner',studioBanner);$('aiResult').textContent='Title: '+studioTitle+' | Banner: '+studioBanner;const apply=document.createElement('button');apply.textContent='Apply to Program recording';apply.onclick=()=>{showTitle=true;showBanner=true;alert('Graphics applied to the next and current local recording output.');};$('aiResult').appendChild(apply);}catch(e){ $('aiResult').textContent='AI generation failed: '+String(e);}finally{button.disabled=false;}};return; }
  if (name === 'Scenes' || name === 'Graphics' || name === 'Branding') {
    show('Scene & branding', '<p>Show a title strip in the recorded Program output.</p><label>Title <input id="titleInput" maxlength="55" value="" placeholder="Your show title" /></label><button id="applyTitle">Apply title</button><button id="toggleTitle">Toggle title overlay</button>');
    ($('titleInput') as HTMLInputElement).value = studioTitle;
    $('applyTitle').onclick = () => { studioTitle = ($('titleInput') as HTMLInputElement).value.trim() || 'CHATBLIZ STUDIO'; localStorage.setItem('studioTitle', studioTitle); showTitle = true; alert('Title will appear in recordings.'); };
    $('toggleTitle').onclick = () => { showTitle = !showTitle; alert(showTitle?'Title enabled':'Title disabled'); };
    return;
  }
  if (name === 'Edit') {
    show('Recording library', lastRecording && recordingUrl ? '<p>Latest recording, available until this page is closed.</p><video controls playsinline src="'+recordingUrl+'" style="width:100%"></video><p><a href="'+recordingUrl+'" download="chatbliz-recording.'+(lastMime.includes('mp4')?'mp4':'webm')+'">Download recording</a></p>' : '<p>No recording yet. Press TAKE then RECORD.</p>');
    return;
  }
  if (name === 'Podcast') {show('Podcast recording','<p>Connect your camera and microphone, select PREVIEW, press TAKE, then RECORD. Your podcast will be saved as a local video file.</p><button id="podcastConnect">Connect camera & microphone</button><button id="podcastRecord">Start podcast recording</button>');$('podcastConnect').onclick=connect;$('podcastRecord').onclick=startRecord;return;}
  if (name === 'Analytics') { show('Session status', '<p>Connected sources: '+cameraStreams.filter(s=>s?.active).length+'</p><p>Recording: '+(recorder?.state||'idle')+'</p><p>Live viewers: unavailable — no streaming service connected.</p>'); return; }
  if (name === 'Chat') {show('Studio production notes','<p>Local production notes for the director. Audience live chat requires a connected streaming service.</p><textarea id="productionNotes" placeholder="Talking points, questions, guest cues"></textarea><button id="saveNotes">Save notes</button><p id="notesStatus"></p>');($('productionNotes') as HTMLTextAreaElement).value=localStorage.getItem('studioNotes')||'';$('saveNotes').onclick=()=>{localStorage.setItem('studioNotes',($('productionNotes') as HTMLTextAreaElement).value);$('notesStatus').textContent='Notes saved on this device.';};return;}
  if (name === 'GitHub Module Arena') {moduleArena();return;}
  if (name === 'Partner & OAuth Setup') {partnerDirectory();return;}
  if (name === 'Go Live' || name === 'Social Growth Hub') { socialPanel(); return; }
  if (name === 'Publish') { show('Publish your recording', lastRecording && recordingUrl ? '<p>Download or share the recording with your phone apps. Direct automatic social publishing requires authorization.</p><a href="'+recordingUrl+'" download="chatbliz-recording.'+(lastMime.includes('mp4')?'mp4':'webm')+'">Download clip</a><p><button id="sharePublished">Share with device apps</button></p>' : '<p>Record a clip first. Direct social publishing is not yet connected.</p>'); if ($('sharePublished')) $('sharePublished').onclick = async()=>{if(!lastRecording)return;const file=new File([lastRecording],'chatbliz-recording.webm',{type:lastMime});try{if(navigator.canShare?.({files:[file]}))await navigator.share({files:[file]});else alert('Download and share from your device.')}catch{}}; return; }
  if (name === 'Settings') {
    show(
      'Settings',
      '<p>Use your browser camera and microphone permissions. A secure HTTPS connection is required for device access.</p><button id="socialAccounts">Social Accounts</button><button id="screenSource">Connect screen as CAM 3</button>'
    );
    $('socialAccounts').onclick = socialPanel;
    $('screenSource').onclick = async () => { try { if (!navigator.mediaDevices.getDisplayMedia) throw new Error('Screen sharing is not supported on this browser'); screenStream = await navigator.mediaDevices.getDisplayMedia({video:true,audio:false}); cameraStreams[2] = screenStream; ($('source3') as HTMLVideoElement).srcObject = screenStream; $('cam3').querySelector('b')!.textContent = 'CAM 3 · Screen'; screenStream.getVideoTracks()[0].onended = () => { cameraStreams[2]=null; $('cam3').querySelector('b')!.textContent='CAM 3 · Disconnected'; }; setPreview(2); $('panel').classList.add('hidden'); update(); } catch(e) {alert('Screen capture unavailable: '+String(e));} };
    return;
  }
  show(name || 'Studio','<p>This service needs an external integration before its controls can execute. The current local recording and AI production tools remain available.</p><button id="backStudio">Back to studio</button>');$('backStudio').onclick=()=>{$('panel').classList.add('hidden');};
});
update();
