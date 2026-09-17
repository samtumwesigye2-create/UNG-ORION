(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const center = [0.8, 32.6];
  const zoom = 7;
  const tracks = [
    {id:'SIM-A01',name:'Northern Air Corridor',category:'air',kind:'Air vehicle',location:'Gulu',status:'En route',point:[2.72,32.30],trail:[[2.40,32.19],[2.54,32.25],[2.72,32.30]]},
    {id:'SIM-A02',name:'Eastern Survey',category:'air',kind:'Air vehicle',location:'Jinja',status:'Survey',point:[0.45,33.20],trail:[[0.10,32.95],[0.28,33.07],[0.45,33.20]]},
    {id:'SIM-A03',name:'Western Transit',category:'air',kind:'Air vehicle',location:'Fort Portal',status:'En route',point:[0.67,30.30],trail:[[0.44,30.09],[0.55,30.20],[0.67,30.30]]},
    {id:'SIM-W01',name:'Lake Victoria Patrol',category:'maritime',kind:'Water vehicle',location:'Entebbe',status:'Patrol',point:[-0.28,32.47],trail:[[-0.42,32.30],[-0.36,32.40],[-0.28,32.47]]},
    {id:'SIM-W02',name:'Island Support',category:'maritime',kind:'Water vehicle',location:'Kalangala',status:'Transit',point:[-0.36,32.25],trail:[[-0.56,32.12],[-0.46,32.19],[-0.36,32.25]]},
    {id:'SIM-G01',name:'Central Response',category:'ground',kind:'Ground team',location:'Kampala',status:'Available',point:[0.3476,32.5825],trail:[[0.29,32.53],[0.32,32.55],[0.3476,32.5825]]},
    {id:'SIM-G02',name:'Eastern Logistics',category:'ground',kind:'Ground team',location:'Mbale',status:'In transit',point:[1.08,34.18],trail:[[0.98,33.95],[1.04,34.07],[1.08,34.18]]},
    {id:'SIM-G03',name:'Western Response',category:'ground',kind:'Ground team',location:'Mbarara',status:'Available',point:[-0.61,30.66],trail:[[-0.78,30.48],[-0.69,30.58],[-0.61,30.66]]}
  ];
  const styles = {air:{color:'#63d7c3',symbol:'✈'},maritime:{color:'#79bfff',symbol:'◆'},ground:{color:'#eac478',symbol:'✦'}};
  const state = {mode:'live',filter:'all',query:'',selected:null,map:null,markers:new Map(),trailLayer:null,zoneLayer:null};
  function clock(){ $('utc-clock').textContent = new Date().toISOString().slice(11,19)+' UTC'; }
  clock(); setInterval(clock,1000);
  function setText(id,value){ $(id).textContent=value; }
  function visible(){return state.mode==='simulated' ? tracks.filter(t=>(state.filter==='all'||t.category===state.filter)&&(`${t.name} ${t.id} ${t.location} ${t.kind}`.toLowerCase().includes(state.query))) : [];}
  function initMap(){
    if(typeof L==='undefined') { setText('feed-status','Map library unavailable · retry when online'); return; }
    state.map=L.map('map',{zoomControl:false,attributionControl:true,preferCanvas:true}).setView(center,zoom);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(state.map);
    state.map.on('mousemove',e=>setText('map-coordinates',`${Math.abs(e.latlng.lat).toFixed(4)}° ${e.latlng.lat>=0?'N':'S'} · ${Math.abs(e.latlng.lng).toFixed(4)}° ${e.latlng.lng>=0?'E':'W'}`));
    state.map.on('click',()=>select(null));
    renderMap();
  }
  function renderMap(){
    if(!state.map)return;
    state.markers.forEach(marker=>marker.remove());state.markers.clear();
    if(state.trailLayer)state.trailLayer.remove();if(state.zoneLayer)state.zoneLayer.remove();
    if(state.mode!=='simulated')return;
    state.zoneLayer=L.layerGroup().addTo(state.map);
    const zone=L.polygon([[-0.19,32.08],[-0.09,32.63],[-0.57,32.71],[-0.72,32.28]],{color:'#cfad69',weight:1.4,dashArray:'7 6',fillColor:'#d7ae62',fillOpacity:.055}).addTo(state.zoneLayer);
    zone.bindTooltip('<span class="zone-label">SAMPLE RESPONSE ZONE</span>',{permanent:true,direction:'center',className:'zone-tooltip'});
    state.trailLayer=L.layerGroup().addTo(state.map);
    visible().forEach(t=>{
      const style=styles[t.category];
      L.polyline(t.trail,{color:style.color,weight:2,dashArray:'5 7',opacity:.78}).addTo(state.trailLayer);
      const icon=L.divIcon({html:`<span class="track-marker ${t.category}${state.selected===t.id?' active':''}" aria-hidden="true">${style.symbol}</span>`,className:'',iconSize:[27,27],iconAnchor:[13,13]});
      const marker=L.marker(t.point,{icon,title:`Simulated ${t.name}`}).addTo(state.map).on('click',e=>{L.DomEvent.stopPropagation(e);select(t.id);});
      marker.bindTooltip(`SIMULATED · ${t.name}`,{direction:'top',offset:[0,-13]});
      state.markers.set(t.id,marker);
    });
  }
  function renderList(){
    const list=$('track-list');list.replaceChildren();const results=visible();
    setText('count-all',state.mode==='simulated'?tracks.length:0);setText('visible-count',results.length);
    if(!results.length){const empty=document.createElement('div');empty.className='list-empty';empty.textContent=state.mode==='live'?'No live tracks. No telemetry sources are connected.':'No simulated tracks match these filters.';list.append(empty);return;}
    results.forEach(t=>{
      const card=document.createElement('button');card.type='button';card.className=`track-card${state.selected===t.id?' selected':''}`;card.setAttribute('aria-label',`Select simulated ${t.name}`);
      const icon=document.createElement('span');icon.className=`track-icon ${t.category}`;icon.textContent=styles[t.category].symbol;
      const text=document.createElement('span');text.className='track-text';
      const line=document.createElement('span');line.className='track-line';
      const name=document.createElement('span');name.className='track-name';name.textContent=t.name;
      const tag=document.createElement('span');tag.className='track-tag';tag.textContent='SIM';line.append(name,tag);
      const meta=document.createElement('span');meta.className='track-meta';meta.textContent=`${t.kind} · ${t.location}`;
      const id=document.createElement('span');id.className='track-id';id.textContent=`${t.id}   /   ${t.status}`;
      text.append(line,meta,id);card.append(icon,text);card.addEventListener('click',()=>select(t.id,true));list.append(card);
    });
  }
  function select(id,fly=false){
    state.selected=id;
    const t=tracks.find(t=>t.id===id);
    $('detail-card').classList.toggle('hidden',!t||state.mode!=='simulated');
    if(t&&state.mode==='simulated'){
      setText('detail-name',t.name);setText('detail-type',t.kind);setText('detail-id',t.id);setText('detail-location',t.location);setText('detail-status',t.status);
      $('detail-symbol').className=`detail-symbol ${t.category}`;setText('detail-symbol',styles[t.category].symbol);
      if(fly&&state.map)state.map.flyTo(t.point,Math.max(state.map.getZoom(),9),{duration:.7});
    }
    renderList();renderMap();
    if(fly)$('sidebar').classList.remove('open');
  }
  function mode(next){
    if(!['live','simulated'].includes(next))return;
    state.mode=next;state.selected=null;
    $('live-mode').classList.toggle('active',next==='live');$('demo-mode').classList.toggle('active',next==='simulated');
    $('live-mode').setAttribute('aria-pressed',String(next==='live'));$('demo-mode').setAttribute('aria-pressed',String(next==='simulated'));
    $('demo-banner').classList.toggle('hidden',next==='live');$('map-empty').classList.toggle('hidden',next!=='live');$('detail-card').classList.add('hidden');
    $('map-status').classList.toggle('simulated',next==='simulated');
    setText('map-status-text',next==='simulated'?'SIMULATED · TRAINING SCENARIO':'LIVE · NO CONNECTED SOURCES');
    setText('feed-status',next==='simulated'?'Sample scenario · 8 fictional tracks':'No live sources connected');
    setText('integrity-status',next==='simulated'?'Scenario data · never live':'No sources connected');
    if(next==='simulated'&&state.map)state.map.setView(center,zoom);
    renderList();renderMap();
  }
  $('live-mode').addEventListener('click',()=>mode('live'));
  $('demo-mode').addEventListener('click',()=>mode('simulated'));
  $('open-demo').addEventListener('click',()=>mode('simulated'));
  $('close-detail').addEventListener('click',()=>select(null));
  $('track-search').addEventListener('input',e=>{state.query=e.target.value.trim().toLowerCase();select(null);});
  document.querySelectorAll('.filter').forEach(button=>button.addEventListener('click',()=>{
    state.filter=button.dataset.filter;
    document.querySelectorAll('.filter').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});
    select(null);
  }));
  $('zoom-in').addEventListener('click',()=>state.map?.zoomIn());
  $('zoom-out').addEventListener('click',()=>state.map?.zoomOut());
  $('recenter').addEventListener('click',()=>state.map?.setView(center,zoom));
  $('toggle-sidebar').addEventListener('click',()=>{$('sidebar').classList.toggle('open');$('toggle-sidebar').setAttribute('aria-expanded',String($('sidebar').classList.contains('open')));});
  $('close-sidebar').addEventListener('click',()=>{$('sidebar').classList.remove('open');$('toggle-sidebar').setAttribute('aria-expanded','false');});
  mode('live');
  fetch('/v1/operations/tracks',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('unavailable');return r.json();}).then(data=>{
    if(data.connected_sources?.length===0){setText('feed-status','No live sources connected');return;}
    // The current UI has no trusted operational ingestion contract. Do not display unvalidated feeds.
    setText('feed-status','Live feed integration pending');
  }).catch(()=>setText('feed-status','Live feed unavailable'));
  initMap();
})();
