(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const tracks = [
    {id:'SIM-A01',name:'Northern Air Corridor',category:'air',kind:'Air vehicle',location:'Gulu',status:'En route',point:[2.72,32.30],trail:[[2.40,32.19],[2.54,32.25],[2.72,32.30]]},
    {id:'SIM-A02',name:'Eastern Survey',category:'air',kind:'Air vehicle',location:'Jinja',status:'Survey',point:[0.45,33.20],trail:[[0.10,32.95],[0.28,33.07],[0.45,33.20]]},
    {id:'SIM-A03',name:'Western Transit',category:'air',kind:'Air vehicle',location:'Fort Portal',status:'En route',point:[0.67,30.30],trail:[[0.44,30.09],[0.55,30.20],[0.67,30.30]]},
    {id:'SIM-W01',name:'Lake Victoria Patrol',category:'maritime',kind:'Water vehicle',location:'Entebbe',status:'Patrol',point:[-0.28,32.47],trail:[[-0.42,32.30],[-0.36,32.40],[-0.28,32.47]]},
    {id:'SIM-W02',name:'Island Support',category:'maritime',kind:'Water vehicle',location:'Kalangala',status:'Transit',point:[-0.36,32.25],trail:[[-0.56,32.12],[-0.46,32.19],[-0.36,32.25]]},
    {id:'SIM-G01',name:'Central Response',category:'ground',kind:'Ground team',location:'Kampala',status:'Available',point:[0.3476,32.5825],trail:[[0.29,32.53],[0.32,32.55],[0.3476,32.5825]]},
    {id:'SIM-G02',name:'Eastern Logistics',category:'ground',kind:'Ground team',location:'Mbale',status:'In transit',point:[1.08,34.18],trail:[[0.98,33.95],[1.04,34.07],[1.08,34.18]]},
    {id:'SIM-G03',name:'Western Response',category:'ground',kind:'Ground team',location:'Mbarara',status:'Available',point:[-0.61,30.66],trail:[[-0.78,30.48],[-0.69,30.58],[-0.61,30.66]]},
    {id:'SIM-A04',name:'Northern Transit',category:'air',kind:'Air vehicle',location:'Lira',status:'En route',point:[2.25,32.9],trail:[[2.02,32.70],[2.13,32.79],[2.25,32.9]]},
    {id:'SIM-W03',name:'Eastern Lake Support',category:'maritime',kind:'Water vehicle',location:'Lake Victoria',status:'Transit',point:[-0.62,33.13],trail:[[-0.75,32.89],[-0.69,33.01],[-0.62,33.13]]},
    {id:'SIM-G04',name:'Central Logistics',category:'ground',kind:'Ground team',location:'Masaka',status:'In transit',point:[-0.33,31.74],trail:[[-0.49,31.55],[-0.42,31.65],[-0.33,31.74]]},
    {id:'SIM-R01',name:'Lake Rescue Team',category:'rescue',kind:'Rescue team',location:'Entebbe',status:'Standby',point:[-0.05,32.56],trail:[[-0.18,32.44],[-0.10,32.50],[-0.05,32.56]]},
    {id:'SIM-R02',name:'Northern Rescue Team',category:'rescue',kind:'Rescue team',location:'Lira',status:'Available',point:[2.1,32.78],trail:[[1.91,32.60],[2.0,32.69],[2.1,32.78]]},
    {id:'SIM-S01',name:'Unidentified Contact A',category:'signal',kind:'Unverified signal',location:'Lake Victoria',status:'Unverified',point:[-0.44,32.9],trail:[[-0.56,32.82],[-0.51,32.86],[-0.44,32.9]]},
    {id:'SIM-S02',name:'Unidentified Contact B',category:'signal',kind:'Unverified signal',location:'Eastern sector',status:'Unverified',point:[0.91,33.84],trail:[[0.78,33.72],[0.85,33.78],[0.91,33.84]]},
    {id:'SIM-S03',name:'Unidentified Contact C',category:'signal',kind:'Unverified signal',location:'Lake Victoria',status:'Unverified',point:[-0.82,32.48],trail:[[-0.9,32.39],[-0.86,32.44],[-0.82,32.48]]}
  ];
  const styles = {air:{color:'#63d7c3',symbol:'✈'},maritime:{color:'#79bfff',symbol:'◆'},ground:{color:'#eac478',symbol:'✦'},rescue:{color:'#a4e874',symbol:'✚'},signal:{color:'#ea73cf',symbol:'●'}};
  const state = {mode:'live',filter:'all',query:'',selected:null,map:null,scale:1};
  function clock(){ $('utc-clock').textContent = new Date().toISOString().slice(11,19)+' UTC'; }
  clock(); setInterval(clock,1000);
  function setText(id,value){ $(id).textContent=value; }
  function visible(){return state.mode==='simulated' ? tracks.filter(t=>(state.filter==='all'||t.category===state.filter)&&(`${t.name} ${t.id} ${t.location} ${t.kind}`.toLowerCase().includes(state.query))) : [];}
  const NS='http://www.w3.org/2000/svg';
  const mapWidth=1200,mapHeight=900;
  const project=([lon,lat])=>[(lon-28.3)*140,(4.7-lat)*140];
  const node=(name,attrs={},parent)=>{
    const el=document.createElementNS(NS,name);
    Object.entries(attrs).forEach(([key,value])=>el.setAttribute(key,String(value)));
    if(parent)parent.append(el);
    return el;
  };
  function renderMap(){
    const svg=state.map;if(!svg)return;
    svg.replaceChildren();
    if(state.mode!=='simulated')return;
    const layer=node('g',{class:'scenario-layer'},svg);
    const zone=[[-0.19,32.08],[-0.09,32.63],[-0.57,32.71],[-0.72,32.28]].map(([lat,lon])=>project([lon,lat]).join(',')).join(' ');
    node('polygon',{points:zone,class:'sample-zone'},layer);
    const zoneLabel=node('text',{x:project([32.34,-.38])[0],y:project([32.34,-.38])[1],class:'sample-zone-label'},layer);zoneLabel.textContent='SAMPLE RESPONSE ZONE';
    visible().forEach(t=>{
      const style=styles[t.category];
      const coords=t.trail.map(([lat,lon])=>project([lon,lat]).join(',')).join(' ');
      node('polyline',{points:coords,fill:'none',stroke:style.color,'stroke-width':2.5,'stroke-dasharray':t.category==='signal'?'2 7':'6 8','stroke-opacity':.83},layer);
      if(t.category==='air'){
        const [a,b]=t.trail.slice(-2).map(([lat,lon])=>project([lon,lat]));
        const angle=Math.atan2(b[1]-a[1],b[0]-a[0]);
        const tip=[b[0]-Math.cos(angle)*17,b[1]-Math.sin(angle)*17];
        const left=[tip[0]-Math.cos(angle-.55)*9,tip[1]-Math.sin(angle-.55)*9];
        const right=[tip[0]-Math.cos(angle+.55)*9,tip[1]-Math.sin(angle+.55)*9];
        node('polyline',{points:[left,tip,right].map(p=>p.join(',')).join(' '),fill:'none',stroke:style.color,'stroke-width':2},layer);
      }
      const [x,y]=project([t.point[1],t.point[0]]);
      const marker=node('g',{class:`svg-marker ${t.category}${state.selected===t.id?' active':''}`,transform:`translate(${x} ${y})`,tabindex:0,role:'button','aria-label':`Select simulated ${t.name}`},layer);
      node('circle',{cx:0,cy:0,r:17,class:'marker-halo'},marker);
      node('circle',{cx:0,cy:0,r:11,class:'marker-core'},marker);
      const symbol=node('text',{x:0,y:4,'text-anchor':'middle'},marker);symbol.textContent=style.symbol;
      const title=node('title',{},marker);title.textContent=`Simulated ${t.name}`;
      marker.addEventListener('click',e=>{e.stopPropagation();select(t.id);});
      marker.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(t.id);}});
    });
  }
  function zoomBy(factor){if(!state.map)return;state.scale=Math.max(1,Math.min(2.6,state.scale*factor));setZoom();}
  function setZoom(){
    if(!state.map)return;
    const w=mapWidth/state.scale,h=mapHeight/state.scale;
    state.map.setAttribute('viewBox',`${(mapWidth-w)/2} ${(mapHeight-h)/2} ${w} ${h}`);
  }
  async function initMap(){
    const svg=node('svg',{viewBox:'0 0 1200 900',preserveAspectRatio:'xMidYMid slice',class:'map-svg','aria-hidden':'true'},$('map'));
    state.map=svg;svg.addEventListener('click',()=>select(null));
    svg.addEventListener('pointermove',event=>{
      const rect=svg.getBoundingClientRect();
      const x=(event.clientX-rect.left)/rect.width*1200,y=(event.clientY-rect.top)/rect.height*900;
      const lon=28.3+x/140,lat=4.7-y/140;
      if(Number.isFinite(lon)&&Number.isFinite(lat))setText('map-coordinates',`${Math.abs(lat).toFixed(4)}° ${lat>=0?'N':'S'} · ${Math.abs(lon).toFixed(4)}° E`);
    });
    renderMap();
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
      if(fly)zoomBy(1.15);
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
    setText('feed-status',next==='simulated'?'Sample scenario · 16 fictional tracks':'No live sources connected');
    setText('integrity-status',next==='simulated'?'Scenario data · never live':'No sources connected');
    if(next==='simulated'){state.scale=1;setZoom();}
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
  $('zoom-in').addEventListener('click',()=>zoomBy(1.25));
  $('zoom-out').addEventListener('click',()=>zoomBy(1/1.25));
  $('recenter').addEventListener('click',()=>{state.scale=1;setZoom();});
  $('toggle-sidebar').addEventListener('click',()=>{if(matchMedia('(max-width:760px)').matches){$('sidebar').scrollIntoView({behavior:'smooth'});return;}$('sidebar').classList.toggle('open');$('toggle-sidebar').setAttribute('aria-expanded',String($('sidebar').classList.contains('open')));});
  $('close-sidebar').addEventListener('click',()=>{$('sidebar').classList.remove('open');$('toggle-sidebar').setAttribute('aria-expanded','false');});
  mode('live');
  fetch('/v1/operations/tracks',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('unavailable');return r.json();}).then(data=>{
    if(data.connected_sources?.length===0){setText('feed-status','No live sources connected');return;}
    // The current UI has no trusted operational ingestion contract. Do not display unvalidated feeds.
    setText('feed-status','Live feed integration pending');
  }).catch(()=>setText('feed-status','Live feed unavailable'));
  initMap();
})();
