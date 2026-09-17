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
  const state = {mode:'live',filter:'all',query:'',selected:null,map:null,geometry:null,scale:1};
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
  function pathFor(coordinates){
    const rings=(typeof coordinates[0][0][0]==='number')?coordinates:coordinates.flat();
    return rings.map(ring=>ring.map((point,i)=>`${i?'L':'M'}${project(point).map(n=>n.toFixed(1)).join(' ')}`).join(' ')+' Z').join(' ');
  }
  function drawBase(svg){
    const defs=node('defs',{},svg);
    const gradient=node('linearGradient',{id:'map-shade',x1:'0',x2:'1',y1:'0',y2:'1'},defs);
    node('stop',{offset:'0%', 'stop-color':'#1c2c33'},gradient);
    node('stop',{offset:'100%', 'stop-color':'#17252c'},gradient);
    node('rect',{x:0,y:0,width:mapWidth,height:mapHeight,fill:'url(#map-shade)'},svg);
    const grid=node('g',{class:'geo-grid'},svg);
    for(let lon=29;lon<=36;lon++){
      const x=project([lon,0])[0];node('line',{x1:x,y1:0,x2:x,y2:900},grid);
      const label=node('text',{x:x+7,y:25},grid);label.textContent=`${lon}° E`;
    }
    for(let lat=-1;lat<=4;lat++){
      const y=project([30,lat])[1];node('line',{x1:0,y1:y,x2:1200,y2:y},grid);
      const label=node('text',{x:14,y:y-7},grid);label.textContent=`${Math.abs(lat)}° ${lat<0?'S':'N'}`;
    }
    if(state.geometry){
      const land=node('g',{class:'land-shapes'},svg);
      state.geometry.countries.forEach(country=>{
        const shape=node('path',{d:pathFor(country.geometry.coordinates),class:country.name==='Uganda'?'uganda-shape':'neighbor-shape'},land);
        const title=node('title',{},shape);title.textContent=country.name;
      });
      node('path',{d:pathFor(state.geometry.lake.coordinates),class:'lake-shape'},svg);
    }
    const lakes=node('text',{x:project([32.75,-0.9])[0],y:project([32.75,-0.9])[1],class:'lake-label','text-anchor':'middle'},svg);lakes.textContent='LAKE VICTORIA';
    const country=node('text',{x:project([32.75,1.45])[0],y:project([32.75,1.45])[1],class:'country-label','text-anchor':'middle'},svg);country.textContent='UGANDA';
    const cities=[['KAMPALA',32.58,.35],['ENTEBBE',32.46,.04],['JINJA',33.2,.44],['GULU',32.3,2.77],['MBARARA',30.66,-.61],['MBALE',34.18,1.08],['FORT PORTAL',30.3,.67]];
    const labels=node('g',{class:'city-labels'},svg);
    cities.forEach(([name,lon,lat])=>{
      const [x,y]=project([lon,lat]);node('circle',{cx:x,cy:y,r:3},labels);
      const text=node('text',{x:x+9,y:y-7},labels);text.textContent=name;
    });
  }
  function renderMap(){
    const svg=state.map;if(!svg)return;
    svg.replaceChildren();drawBase(svg);
    if(state.mode!=='simulated')return;
    const layer=node('g',{class:'scenario-layer'},svg);
    const zone=[[-0.19,32.08],[-0.09,32.63],[-0.57,32.71],[-0.72,32.28]].map(([lat,lon])=>project([lon,lat]).join(',')).join(' ');
    node('polygon',{points:zone,class:'sample-zone'},layer);
    const zoneLabel=node('text',{x:project([32.34,-.38])[0],y:project([32.34,-.38])[1],class:'sample-zone-label'},layer);zoneLabel.textContent='SAMPLE RESPONSE ZONE';
    visible().forEach(t=>{
      const style=styles[t.category];
      const coords=t.trail.map(([lat,lon])=>project([lon,lat]).join(',')).join(' ');
      node('polyline',{points:coords,fill:'none',stroke:style.color,'stroke-width':2.5,'stroke-dasharray':'6 8','stroke-opacity':.8},layer);
      const [x,y]=project([t.point[1],t.point[0]]);
      const marker=node('g',{class:`svg-marker ${t.category}${state.selected===t.id?' active':''}`,transform:`translate(${x} ${y})`,tabindex:0,role:'button','aria-label':`Select simulated ${t.name}`},layer);
      node('circle',{cx:0,cy:0,r:21,class:'marker-halo'},marker);
      node('circle',{cx:0,cy:0,r:13,class:'marker-core'},marker);
      const symbol=node('text',{x:0,y:5,'text-anchor':'middle'},marker);symbol.textContent=style.symbol;
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
    try{
      const response=await fetch('/assets/uganda-map.json');if(!response.ok)throw Error('Map data unavailable');
      state.geometry=await response.json();
    }catch(e){setText('map-coordinates','Map geometry unavailable · retry');}
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
    setText('feed-status',next==='simulated'?'Sample scenario · 8 fictional tracks':'No live sources connected');
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
