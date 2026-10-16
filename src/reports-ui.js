import {parseReport, isFresh, whatsappReport} from "./reports.mjs";
const root = document.getElementById("system-reports");
const key = "chatbliz-owner-report-v1";
function node(tag, text) { const n = document.createElement(tag); if (text) n.textContent = text; return n; }
const title = node("h2", "My system report");
const notice = node("p", "Read research and team reports here. Import a report file or paste it below. Automatic delivery is not connected in this Chatbliz build.");
const file = node("input"); file.type="file"; file.accept=".md,.txt,text/plain,text/markdown"; file.setAttribute("aria-label","Import system report");
const input = node("textarea"); input.maxLength=40000; input.rows=5; input.placeholder="Paste your system report"; input.setAttribute("aria-label","System report text");
const save = node("button","Open report"); save.type="button"; save.className="suggestion";
const remove = node("button","Remove saved report"); remove.type="button"; remove.className="suggestion";
const status = node("p"); status.setAttribute("role","status");
const output = node("div");
root.append(title,notice,file,input,save,remove,status,output);
function show(report) {
  output.replaceChildren();
  const freshness = !report.timestamp ? "Report date unknown" : isFresh(report) ? "Dated today" : "Older report";
  const share=node("button","Share report to WhatsApp");share.type="button";share.className="suggestion";
  share.addEventListener("click",()=>{const link=document.createElement("a");link.href="https://wa.me/27817746377?text="+encodeURIComponent(whatsappReport(report));link.target="_blank";link.rel="noopener noreferrer";link.click();status.textContent="WhatsApp opens a draft. Choose a recipient and review before sending; Chatbliz has not sent it."});output.append(share);
  output.append(node("p",freshness+" · "+(report.timestamp ? new Date(report.timestamp).toLocaleString("en-ZA",{timeZone:"Africa/Johannesburg"})+" SAST" : "No valid date supplied")));
  output.append(node("p","Imported report · source statements and AI recommendations require review. Completed work is not independently verified."));
  if (report.sources.length) {
    const list=node("ul");
    for (const url of report.sources) {const li=node("li"),a=node("a",url);a.href=url;a.target="_blank";a.rel="noopener noreferrer";li.append(a);list.append(li);}
    output.append(node("h3","Evidence links"),list);
  }
  const detail=node("details"),summary=node("summary","Read complete report"),pre=node("pre",report.text);
  pre.style.whiteSpace="pre-wrap";pre.style.overflowWrap="anywhere";detail.append(summary,pre);detail.open=true;output.append(detail);
}
function open(text) {
  try {
    const report=parseReport(text);show(report);input.value="";
    try {localStorage.setItem(key,report.text);status.textContent="Report saved on this device. It has not been synced to an account.";}
    catch {status.textContent="Report opened. Device storage is unavailable; it was not saved.";}
  } catch(error) {status.textContent=error.message;}
}
save.addEventListener("click",()=>open(input.value));
file.addEventListener("change",async()=>{
  const selected=file.files[0];if(!selected)return;
  if(selected.size>160000){status.textContent="Choose a report under 160 KB.";file.value="";return;}
  try {open(await selected.text());}catch {status.textContent="The file could not be read.";}file.value="";
});
remove.addEventListener("click",()=>{try{localStorage.removeItem(key);output.replaceChildren();status.textContent="Saved report removed from this device.";}catch{status.textContent="Device storage could not be changed.";}});
try {const saved=localStorage.getItem(key);if(saved)show(parseReport(saved));}catch {status.textContent="Saved report unavailable. Import it again.";}
