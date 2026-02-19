const MY_NAME = "Your Name"; // replace with your name
const container = document.getElementById("chat");
const chatListEl = document.getElementById("chatList");
const mediaSidebarEl = document.getElementById("mediaSidebar");
const mediaGalleryEl = document.getElementById("mediaGallery");
const mediaViewerEl = document.getElementById("mediaViewer");

let currentChat = [];
let mediaCategories = {photos:[],videos:[],voice:[],stickers:[],custom_emoji:[]};

/* 1️⃣ Auto-detect chats (replace with actual files or index.json) */
const chatFiles = [
  "/chats/chat1.json",
  "/chats/chat2.json"
];

async function loadChats() {
  chatFiles.forEach(file=>{
    const name = file.split("/").pop().replace(".json","");
    const item = document.createElement("div");
    item.className="chat-item";
    item.innerText=name;
    item.onclick = ()=>openChat(file,name);
    chatListEl.appendChild(item);
  });

  // deep-link
  const params = new URLSearchParams(location.search);
  const chatParam = params.get("chat");
  if(chatParam){
    const matched = chatFiles.find(f=>f.includes(chatParam));
    if(matched) openChat(matched,chatParam);
  }
}

/* 2️⃣ Open chat */
async function openChat(file,name){
  document.getElementById("topbar").innerText=name;
  const data = await fetch(file).then(r=>r.json());
  container.innerHTML="";
  currentChat = data.messages.filter(m=>m.type==="message");
  categorizeMedia(currentChat);
  renderVirtual();
  renderMediaSidebar();
  const params = new URLSearchParams(location.search);
  const msgParam = params.get("id");
  if(msgParam) scrollToMessage(msgParam);
}

/* 3️⃣ Categorize media */
function categorizeMedia(messages){
  mediaCategories = {photos:[],videos:[],voice:[],stickers:[],custom_emoji:[]};
  messages.forEach(msg=>{
    if(msg.photo) mediaCategories.photos.push(msg.photo);
    if(msg.video) mediaCategories.videos.push(msg.video);
    if(msg.voice) mediaCategories.voice.push(msg.voice);
    if(msg.sticker) mediaCategories.stickers.push(msg.sticker);
    if(msg.custom_emoji) mediaCategories.custom_emoji.push(msg.custom_emoji);
  });
}

/* 4️⃣ Virtual render */
function renderVirtual(){
  currentChat.slice(-60).forEach(msg=>drawMessage(msg));
  container.scrollTop = container.scrollHeight;
}

/* 5️⃣ Draw message with reactions */
function drawMessage(msg){
  const div = document.createElement("div");
  div.className="msg "+(msg.from===MY_NAME?"me":"other");
  div.id="msg-"+msg.id;

  // text
  let text = Array.isArray(msg.text)?msg.text.map(t=>t.text||t).join(""):msg.text||"";
  const content=document.createElement("div");
  content.innerText=text;
  div.appendChild(content);

  // reactions
  if(msg.reactions){
    const wrap=document.createElement("div");
    wrap.className="reactions";
    let sorted=[...msg.reactions].sort((a,b)=>b.count-a.count);
    sorted.sort(r=>r.chosen?-1:1);
    sorted.slice(0,3).forEach(r=>{
      const rDiv = document.createElement("div");
      rDiv.className="reaction"+(r.chosen?" me":"");
      rDiv.innerHTML = `${r.emoji} <span>${r.count}</span>`;
      wrap.appendChild(rDiv);
    });
    if(sorted.length>3){
      const more=document.createElement("div");
      more.className="reaction";
      more.innerText="+"+(sorted.length-3);
      wrap.appendChild(more);
    }
    div.appendChild(wrap);
  }

  // click → copy deep link
  div.onclick=()=>navigator.clipboard.writeText(`${location.origin}?chat=${msg.chat||"unknown"}&id=${msg.id}`);

  container.appendChild(div);
}

/* 6️⃣ Scroll to message */
function scrollToMessage(id){
  const el = document.getElementById("msg-"+id);
  if(!el) return;
  el.scrollIntoView({behavior:"smooth",block:"center"});
  el.classList.add("highlight");
}

/* 7️⃣ Media sidebar & gallery */
function renderMediaSidebar(){
  mediaSidebarEl.innerHTML="";
  Object.keys(mediaCategories).forEach(cat=>{
    if(mediaCategories[cat].length){
      const div=document.createElement("div");
      div.className="media-category";
      div.innerText=`${cat.toUpperCase()} (${mediaCategories[cat].length})`;
      div.onclick = ()=>renderMediaGallery(cat);
      mediaSidebarEl.appendChild(div);
    }
  });
}

function renderMediaGallery(cat){
  mediaGalleryEl.innerHTML="";
  mediaCategories[cat].forEach(src=>{
    const el=document.createElement("img");
    el.src="/media/"+cat+"/"+src;
    el.className="mediaThumb";
    el.onclick = ()=>openFullscreen(src,cat);
    mediaGalleryEl.appendChild(el);
  });
  mediaGalleryEl.style.display="flex";
}

function openFullscreen(file,cat){
  mediaViewerEl.innerHTML=`<img src="/media/${cat}/${file}" class="fullscreenMedia">`;
  mediaViewerEl.style.display="flex";
  mediaViewerEl.onclick = ()=>mediaViewerEl.style.display="none";
}

/* INIT */
loadChats();
