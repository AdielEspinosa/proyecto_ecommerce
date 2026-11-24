// Todas las rutas /api/... pasan por Nginx hacia el API Gateway
const API = {
  usuarios: { list: '/api/usuarios-list', base: '/api/usuarios' },
  productos: { list: '/api/productos-list', base: '/api/productos' },
  pedidos: { list: '/api/pedidos', base: '/api/pedidos' },
  pagos: { list: '/api/pagos', base: '/api/pagos' },
  autenticacion: { login: '/api/autenticacion/login', registro: '/api/autenticacion/registro', health: '/api/autenticacion/circuito/usuarios' }
};

// Vistas por rol: páginas visibles, página inicial y servicios que consulta cada rol.
// Nota: sin tokens, estas restricciones solo existen en el frontend.
const ROLES = {
  administrador: { label: 'Administrador', pages: ['overview','usuarios','productos','pedidos','pagos'], home: 'overview', services: ['usuarios','productos','pedidos','pagos'] },
  operador: { label: 'Operador', pages: ['pedidos'], home: 'pedidos', services: ['usuarios','productos','pedidos'] },
  cliente: { label: 'Cliente', pages: ['catalogo','pedidos','pagos'], home: 'catalogo', services: ['productos','pedidos','pagos'] }
};
const SESSION_KEY = 'pizzaexpress.sesion';
const ACTIVE_PAYMENT = ['pendiente','aprobado'];
// Qué vistas se vuelven a pintar cuando llega la información de un servicio
const DEPENDENTS = { usuarios: ['usuarios','pedidos'], productos: ['productos','catalogo','pedidos','pagos'], pedidos: ['pedidos','pagos'], pagos: ['pagos','pedidos'] };

const state = { usuarios: [], productos: [], pedidos: [], pagos: [], health: {}, sesion: null, currentPage: 'overview', modal: null };
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const fmtMoney = value => new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(value)||0);
// Flask envía las fechas como "Mon, 23 Nov 2026 03:50:35 GMT"; también se acepta "2026-11-23 03:50:35"
const fmtDate = value => { if(!value) return '—'; let d = new Date(value); if(Number.isNaN(d.getTime())) d = new Date(String(value).replace(' ','T')); return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric'}); };
const timeNow = () => new Date().toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'});
const titleCase = value => String(value ?? '').replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase());
function initials(name='PE'){ return String(name).trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase() || 'PE'; }
function toast(title, message='', type='success'){ const node=document.createElement('div'); node.className=`toast ${type}`; node.innerHTML=`<b>${esc(title)}</b>${esc(message)}`; $('#toastRegion').append(node); setTimeout(()=>node.remove(),5000); }
async function request(url, options={}) {
  const config={...options, headers:{...(options.body?{'Content-Type':'application/json'}:{}),...(options.headers||{})}};
  let response;
  try { response=await fetch(url,config); } catch(e) { throw new Error(`No se pudo conectar con ${url}. Verifica que el servicio esté activo y que Nginx lo tenga configurado.`); }
  const text=await response.text();
  let body=null;
  if(text){ try { body=JSON.parse(text); } catch { body={raw:text}; } }
  if(!response.ok){
    let message=body?.mensaje || body?.message || body?.error;
    if(!message && body?.raw){ const plain=body.raw.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim(); message=plain.slice(0,220); }
    throw new Error(message || `La API respondió HTTP ${response.status}.`);
  }
  return body;
}

// =========================
// SESIÓN (sessionStorage)
// =========================
function readSession(){ try { const raw=sessionStorage.getItem(SESSION_KEY); return raw?JSON.parse(raw):null; } catch { return null; } }
function saveSession(usuario){ state.sesion=usuario; try { sessionStorage.setItem(SESSION_KEY,JSON.stringify(usuario)); } catch {} }
function clearSession(){ state.sesion=null; try { sessionStorage.removeItem(SESSION_KEY); } catch {} }
function roleKey(){ const rol=String(state.sesion?.rol||'').toLowerCase(); return ROLES[rol]?rol:'cliente'; }
function role(){ return ROLES[roleKey()]; }
const isAdmin = () => roleKey()==='administrador';
const isOperator = () => roleKey()==='operador';
const isClient = () => roleKey()==='cliente';

// El cliente solo ve sus pedidos y los pagos de esos pedidos
function visible(key){
  if(!isClient()) return state[key];
  if(key==='pedidos') return state.pedidos.filter(o=>String(o.cliente_id)===String(state.sesion?.usuario_id));
  if(key==='pagos'){ const ids=new Set(visible('pedidos').map(o=>String(o.id))); return state.pagos.filter(p=>ids.has(String(p.pedido_id))); }
  return state[key];
}

function setHealth(key, ok, detail=''){
  state.health[key]=ok;
  const ids={usuarios:['usersHealth','serviceUsers','userServiceStatus'],productos:['productsHealth','serviceProducts','productServiceStatus'],pedidos:['ordersHealth','serviceOrders'],pagos:['servicePayments'],autenticacion:['serviceAuth']};
  (ids[key]||[]).forEach(id=>{const el=$(`#${id}`);if(!el)return; if(el.classList.contains('service-state')){el.classList.toggle('good',ok);el.classList.toggle('bad',!ok);el.innerHTML=`<i></i>${ok?'En línea':'Sin conexión'}`;}else{el.textContent=detail || (ok?'En línea':'Sin conexión');el.classList.toggle('good',ok);el.classList.toggle('bad',!ok);}});
}
function setTableMessage(id, message, isError=false, cols=6){ const el=$(`#${id}`); if(el)el.innerHTML=`<tr><td colspan="${cols}" class="table-message ${isError?'error':''}">${esc(message)}</td></tr>`; }
async function loadService(key, quiet=false){
  const cfg=API[key];
  try{
    const data=await request(cfg.list);
    if(!Array.isArray(data)) throw new Error('La API no devolvió una lista de registros.');
    state[key]=data;
    setHealth(key,true);
    DEPENDENTS[key].forEach(k=>{ if(k===key||k==='catalogo'||state[k].length) renderService(k); });
    updateOverview();
    return data;
  }catch(error){
    setHealth(key,false);
    const map={usuarios:['usersTable',6],productos:['productsTable',6],pedidos:['ordersTable',8],pagos:['paymentsTable',7]};
    const [table,cols]=map[key];
    if(!state[key].length){
      setTableMessage(table,`${error.message} Revisa el servicio ${key}.`,true,cols);
      if(key==='productos') $('#catalogGrid').innerHTML=`<div class="empty-state error">${esc(error.message)} Revisa el servicio de productos.</div>`;
    }
    updateOverview();
    if(!quiet)toast(`No se pudo consultar ${key}`,error.message,'error');
    return null;
  }finally{
    const id={usuarios:'userLastQuery',productos:'productLastQuery',pedidos:'orderLastQuery',pagos:'paymentLastQuery'}[key];
    if(id) $(`#${id}`).textContent=timeNow();
  }
}
// Autenticación no tiene un listado: se usa el estado de su circuito como comprobación
async function checkAuthService(){
  try{ await request(API.autenticacion.health); setHealth('autenticacion',true); }
  catch{ setHealth('autenticacion',false); }
  updateOverview();
}
function refreshRoleServices(quiet=true){
  const tasks=role().services.map(k=>loadService(k,quiet));
  if(isAdmin()) tasks.push(checkAuthService());
  return Promise.all(tasks);
}
function updateOverview(){
  const users=state.usuarios, products=state.productos, orders=visible('pedidos'), payments=visible('pagos');
  $('#usersMetric').textContent=users.length; $('#productsMetric').textContent=products.length; $('#ordersMetric').textContent=state.pedidos.length;
  $('#usersNavCount').textContent=users.length; $('#productsNavCount').textContent=products.length; $('#ordersNavCount').textContent=orders.length; $('#paymentsNavCount').textContent=payments.length;
  $('#userTotal').textContent=users.length; $('#productTotal').textContent=products.length; $('#orderTotal').textContent=orders.length;
  $('#productAvailable').textContent=products.filter(p=>truthy(p.disponible)).length;
  $('#orderPending').textContent=orders.filter(o=>String(o.estado||'pendiente').toLowerCase()==='pendiente').length;
  $('#paymentTotal').textContent=payments.length;
  $('#paymentPending').textContent=payments.filter(p=>String(p.estado||'pendiente').toLowerCase()==='pendiente').length;
  const keys=isAdmin()?['usuarios','autenticacion','productos','pedidos','pagos']:role().services;
  const online=keys.filter(k=>state.health[k]).length, total=keys.length, all=online===total;
  $('#servicesMetric').textContent=online; $('#servicesTotal').textContent=total;
  $('#servicesHealth').textContent=all?'En línea':`${online} de ${total}`; $('#servicesHealth').className=`metric-status ${all?'good':online===0?'bad':''}`;
  $('#productsFoot').textContent=`${products.filter(p=>truthy(p.disponible)).length} disponibles`;
  $('#usersFoot').textContent=`${users.filter(u=>String(u.rol||'').toLowerCase()==='cliente').length} clientes`;
  $('#ordersFoot').textContent=`${state.pedidos.filter(o=>String(o.estado||'').toLowerCase()==='entregado').length} entregados`;
  $('#platformStatus').textContent=all?'Todos los servicios en línea':`${online}/${total} servicios disponibles`;
  $('.pulse-dot').classList.toggle('off',!all);
  $('#heroHealth').textContent=all?`${total} servicios disponibles`:`${online} de ${total} servicios disponibles`;
  $('#lastUpdated').textContent=`Actualizado a las ${timeNow()}`;
  renderRecentOrders();
}
function truthy(v){return v===true||v===1||v==='1'||String(v).toLowerCase()==='true';}
const ACTION_ICONS = {
  view: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
  edit: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg>',
  patch: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2"/><circle cx="15" cy="17" r="2"/></svg>',
  delete: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"/></svg>',
  approve: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5L20 7"/></svg>',
  reject: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>'
};
// variant: true (peligro) o el nombre de una clase extra, p. ej. 'success'
function actionButton(action,kind,id,title,label,variant=''){
  const iconKey =
  action === 'toggle' || action === 'address' ? 'patch' :
  action === 'state' ? 'edit' :
  action;
  const extra = variant===true ? ' danger' : variant ? ` ${variant}` : '';
  return `<button type="button" class="action-btn${extra}" title="${esc(title)}" aria-label="${esc(label)}" data-action="${action}" data-kind="${kind}" data-id="${esc(id)}">${ACTION_ICONS[iconKey]||''}</button>`;
}
function renderService(key){
  if(key==='usuarios')renderUsers();
  if(key==='productos')renderProducts();
  if(key==='pedidos')renderOrders();
  if(key==='pagos')renderPayments();
  if(key==='catalogo')renderCatalog();
}
function renderUsers(){
  const q=($('#usersSearch')?.value||'').trim().toLowerCase();
  const list=state.usuarios.filter(u=>[u.id,u.nombre,u.apellidos,u.correo,u.telefono,u.direccion,u.rol].some(v=>String(v??'').toLowerCase().includes(q)));
  if(!list.length){setTableMessage('usersTable',state.usuarios.length?'No hay usuarios que coincidan con la búsqueda.':'No hay usuarios registrados.',false,6);}
  else $('#usersTable').innerHTML=list.map(u=>{const rol=String(u.rol||'').toLowerCase();return `<tr>
    <td><div class="user-cell"><span class="user-avatar">${esc(initials(`${u.nombre||''} ${u.apellidos||''}`))}</span><span><b class="primary-cell">${esc(`${u.nombre||''} ${u.apellidos||''}`.trim()||'Usuario')}</b><small class="sub-cell">ID #${esc(u.id)}</small></span></div></td>
    <td>${esc(u.correo||'—')}</td><td>${esc(u.telefono||'—')}</td><td><span class="role-pill ${rol==='administrador'?'admin':rol==='operador'?'operador':''}">${esc(u.rol||'Sin rol')}</span></td><td>${esc(u.direccion||'—')}</td>
    <td><div class="action-group">${actionButton('view','usuarios',u.id,'Consultar detalle',`Consultar usuario ${u.id}`)}${actionButton('edit','usuarios',u.id,'Editar (PUT)',`Editar usuario ${u.id}`)}${actionButton('patch','usuarios',u.id,'Modificar parcialmente (PATCH)',`Modificar parcialmente usuario ${u.id}`)}${actionButton('delete','usuarios',u.id,'Eliminar',`Eliminar usuario ${u.id}`,true)}</div></td></tr>`;}).join('');
  $('#usersTableCount').textContent=`${list.length} de ${state.usuarios.length} registros`;
}
function renderProducts(){
  const q=($('#productsSearch')?.value||'').trim().toLowerCase();
  const list=state.productos.filter(p=>[p.id,p.nombre,p.tamanio,p.descripcion,p.precio,p.disponible].some(v=>String(v??'').toLowerCase().includes(q)));
  if(!list.length)setTableMessage('productsTable',state.productos.length?'No hay productos que coincidan con la búsqueda.':'No hay productos registrados.',false,6);
  else $('#productsTable').innerHTML=list.map(p=>{const available=truthy(p.disponible);return `<tr>
    <td><div class="product-cell"><span class="product-thumb">🍕</span><span><b class="primary-cell">${esc(p.nombre||'Producto')}</b><small class="sub-cell">ID #${esc(p.id)}</small></span></div></td><td>${esc(p.tamanio||'—')}</td><td><b class="primary-cell">${fmtMoney(p.precio)}</b></td><td><span class="availability-pill ${available?'available':'unavailable'}">${available?'● Disponible':'● Agotado'}</span></td><td title="${esc(p.descripcion||'')}">${esc((p.descripcion||'—').length>48?(p.descripcion||'').slice(0,45)+'…':p.descripcion||'—')}</td>
    <td><div class="action-group">${actionButton('view','productos',p.id,'Consultar detalle',`Consultar producto ${p.id}`)}${actionButton('edit','productos',p.id,'Editar (PUT)',`Editar producto ${p.id}`)}${actionButton('toggle','productos',p.id,`Cambiar disponibilidad (PATCH) · ${available?'disponible':'agotado'}`,`Cambiar disponibilidad producto ${p.id}`)}${actionButton('delete','productos',p.id,'Eliminar',`Eliminar producto ${p.id}`,true)}</div></td></tr>`;}).join('');
  $('#productsTableCount').textContent=`${list.length} de ${state.productos.length} registros`;
}
// Imagen decorativa para cada pizza del catálogo
function productImage(name){
  const n=String(name||'').toLowerCase();
  if(n.includes('pepperoni')) return 'imagenes/pizzaexpress.png';
  if(n.includes('carne')) return 'imagenes/pizzamixta.jpg';
  const pool=['imagenes/pizzanap.jpg','imagenes/pizzamex.jpg'];
  let h=0; for(const c of n) h=(h+c.charCodeAt(0))%pool.length;
  return pool[h];
}
function renderCatalog(){
  const grid=$('#catalogGrid');
  if(!state.productos.length){grid.innerHTML='<div class="empty-state">No hay productos en el catálogo.</div>';return;}
  const list=[...state.productos].sort((a,b)=>Number(truthy(b.disponible))-Number(truthy(a.disponible)));
  grid.innerHTML=list.map(p=>{const available=truthy(p.disponible);return `<article class="catalog-card${available?'':' unavailable'}">
    <div class="catalog-media"><img src="${productImage(p.nombre)}" alt="${esc(p.nombre)}" loading="lazy"><span class="availability-pill ${available?'available':'unavailable'}">${available?'● Disponible':'● Agotado'}</span></div>
    <div class="catalog-body"><div class="catalog-head"><h3>${esc(p.nombre||'Pizza')}</h3><span class="catalog-size">${esc(p.tamanio||'—')}</span></div><p>${esc(p.descripcion||'Sin descripción.')}</p>
    <div class="catalog-foot"><b>${fmtMoney(p.precio)}</b><button type="button" class="button button-primary" data-order-product="${esc(p.id)}" ${available?'':'disabled'}>${available?'Pedir':'Agotado'}</button></div></div>
  </article>`;}).join('');
}
function statusClass(status){return String(status||'pendiente').toLowerCase().replace(/[^a-z]/g,'');}
function clientName(id){
  const s=state.sesion;
  if(s&&String(id)===String(s.usuario_id)){const own=`${s.nombre||''} ${s.apellidos||''}`.trim();if(own)return own;}
  const u=state.usuarios.find(item=>String(item.id)===String(id));
  return u ? `${u.nombre||''} ${u.apellidos||''}`.trim() || `Cliente #${id}` : `Cliente #${id}`;
}
function productName(id){
  const p=state.productos.find(item=>String(item.id)===String(id));
  return p ? `${p.nombre||`Producto #${id}`}${p.tamanio?` (${p.tamanio})`:''}` : `Producto #${id}`;
}
function orderById(id){ return state.pedidos.find(o=>String(o.id)===String(id)); }
// Pago pendiente o aprobado de un pedido (un pedido solo puede tener uno activo)
function orderPayment(pedidoId){ return state.pagos.find(p=>String(p.pedido_id)===String(pedidoId)&&ACTIVE_PAYMENT.includes(String(p.estado).toLowerCase())); }
function orderActions(o){
  const view=actionButton('view','pedidos',o.id,'Consultar detalle',`Consultar pedido ${o.id}`);
  if(isAdmin()) return view+actionButton('state','pedidos',o.id,'Editar estado (PUT)',`Editar estado del pedido ${o.id}`)+actionButton('address','pedidos',o.id,'Modificar dirección (PATCH)',`Modificar dirección del pedido ${o.id}`)+actionButton('delete','pedidos',o.id,'Eliminar',`Eliminar pedido ${o.id}`,true);
  if(isClient()){
    const pago=orderPayment(o.id);
    if(pago) return view+`<span class="status-pill ${statusClass(pago.estado)}">Pago ${esc(pago.estado)}</span>`;
    if(String(o.estado).toLowerCase()==='cancelado') return view;
    return view+`<button type="button" class="button button-primary pay-button" data-action="pay" data-kind="pedidos" data-id="${esc(o.id)}">Pagar</button>`;
  }
  return view;
}
function renderOrders(){
  const q=($('#ordersSearch')?.value||'').trim().toLowerCase();
  const all=visible('pedidos');
  const list=all.filter(o=>[o.id,o.cliente_id,clientName(o.cliente_id),o.producto_id,productName(o.producto_id),o.cantidad,o.direccion,o.total,o.estado,o.fecha].some(v=>String(v??'').toLowerCase().includes(q)));
  if(!list.length)setTableMessage('ordersTable',all.length?'No hay pedidos que coincidan con la búsqueda.':isClient()?'Aún no tienes pedidos. Pide tu primera pizza desde el catálogo.':'No hay pedidos registrados.',false,8);
  else $('#ordersTable').innerHTML=list.map(o=>`<tr>
    <td><b class="primary-cell">#${esc(o.id)}</b></td>
    <td><span class="primary-cell">${esc(clientName(o.cliente_id))}</span><small class="sub-cell">ID #${esc(o.cliente_id)}</small></td>
    <td><span class="primary-cell">${esc(productName(o.producto_id))}</span><small class="sub-cell">ID #${esc(o.producto_id)}</small></td>
    <td>${esc(o.cantidad??'—')}</td>
    <td><b class="primary-cell">${fmtMoney(o.total)}</b></td>
    <td><span class="status-pill ${statusClass(o.estado)}">${esc(titleCase(o.estado||'pendiente'))}</span></td>
    <td>${esc(fmtDate(o.fecha))}</td>
    <td><div class="action-group">${orderActions(o)}</div></td>
  </tr>`).join('');
  $('#ordersTableCount').textContent=`${list.length} de ${all.length} registros`;
}
function paymentActions(p){
  const view=actionButton('view','pagos',p.id,'Consultar detalle',`Consultar pago ${p.id}`);
  if(!isAdmin()) return view;
  const pending=String(p.estado||'').toLowerCase()==='pendiente';
  return view+(pending?actionButton('approve','pagos',p.id,'Aprobar pago (el pedido pasa a preparación)',`Aprobar pago ${p.id}`,'success')+actionButton('reject','pagos',p.id,'Rechazar pago',`Rechazar pago ${p.id}`,true):'')+actionButton('delete','pagos',p.id,'Eliminar',`Eliminar pago ${p.id}`,true);
}
function renderPayments(){
  const q=($('#paymentsSearch')?.value||'').trim().toLowerCase();
  const all=visible('pagos');
  const list=all.filter(p=>{const o=orderById(p.pedido_id);return [p.id,p.pedido_id,p.metodo_pago,p.estado,p.fecha,o?productName(o.producto_id):'',o?clientName(o.cliente_id):''].some(v=>String(v??'').toLowerCase().includes(q));});
  if(!list.length)setTableMessage('paymentsTable',all.length?'No hay pagos que coincidan con la búsqueda.':isClient()?'Aún no has registrado pagos. Paga un pedido desde «Mis pedidos».':'No hay pagos registrados.',false,7);
  else $('#paymentsTable').innerHTML=list.map(p=>{const o=orderById(p.pedido_id);return `<tr>
    <td><b class="primary-cell">#${esc(p.id)}</b></td>
    <td><span class="primary-cell">Pedido #${esc(p.pedido_id)}</span><small class="sub-cell">${esc(o?`${productName(o.producto_id)}${isClient()?'':` · ${clientName(o.cliente_id)}`}`:'Pedido no disponible')}</small></td>
    <td>${esc(titleCase(p.metodo_pago||'—'))}</td>
    <td><b class="primary-cell">${o?fmtMoney(o.total):'—'}</b></td>
    <td><span class="status-pill ${statusClass(p.estado)}">${esc(titleCase(p.estado||'pendiente'))}</span></td>
    <td>${esc(fmtDate(p.fecha))}</td>
    <td><div class="action-group">${paymentActions(p)}</div></td>
  </tr>`;}).join('');
  $('#paymentsTableCount').textContent=`${list.length} de ${all.length} registros`;
}
function renderRecentOrders(){
  const recent=[...state.pedidos].slice(-4).reverse();
  $('#recentOrders').innerHTML=recent.length?recent.map(o=>`<div class="recent-item"><span><b>Pedido #${esc(o.id)}</b><small>${esc(fmtDate(o.fecha))}</small></span><span>${esc(clientName(o.cliente_id))}<small class="sub-cell">${esc(productName(o.producto_id))}</small></span><span><b>${fmtMoney(o.total)}</b></span><span><span class="status-pill ${statusClass(o.estado)}">${esc(titleCase(o.estado||'pendiente'))}</span></span></div>`).join(''):'<div class="empty-state">No hay pedidos para mostrar.</div>';
}
function pageLabel(page){
  if(isClient()&&page==='pedidos') return 'Mis pedidos';
  if(isClient()&&page==='pagos') return 'Mis pagos';
  return ({overview:'Resumen',catalogo:'Catálogo',usuarios:'Usuarios',productos:'Productos',pedidos:'Pedidos',pagos:'Pagos'})[page]||page;
}
function go(page, load=true){
  if(!role().pages.includes(page))page=role().home;
  state.currentPage=page;
  $$('.page-view').forEach(el=>el.classList.toggle('active',el.id===`page-${page}`));
  $$('.nav-link').forEach(el=>el.classList.toggle('active',el.dataset.page===page));
  $('#crumbCurrent').textContent=pageLabel(page);
  if(load){
    const loads={usuarios:['usuarios'],productos:['productos'],catalogo:['productos'],pedidos:isClient()?['pedidos','pagos']:['pedidos'],pagos:['pedidos','pagos']}[page]||[];
    loads.forEach(k=>loadService(k,true));
  }
  window.location.hash=page;
}
// Ajusta navegación, textos y botones según el rol de la sesión
function applyRole(){
  const r=role(), s=state.sesion||{};
  $$('.nav-link').forEach(a=>{a.hidden=!r.pages.includes(a.dataset.page);});
  $('#ordersNavLabel').textContent=pageLabel('pedidos'); $('#paymentsNavLabel').textContent=pageLabel('pagos');
  const fullName=`${s.nombre||''} ${s.apellidos||''}`.trim()||s.nombre_usuario||'Usuario';
  $('#userName').textContent=fullName; $('#userRole').textContent=r.label; $('#userAvatar').textContent=initials(fullName);
  $('#sidebarRole').textContent=r.label.toUpperCase();
  $('#brandSubtitle').textContent=isClient()?'Pedidos en línea':'Centro de operaciones';
  $('#footerNote').innerHTML=isClient()?'Pedidos en línea <i>·</i> Gracias por elegirnos':isOperator()?'Panel de operación <i>·</i> Registro de pedidos':'Panel de administración <i>·</i> Datos conectados a los servicios';
  const orderTexts=isClient()
    ?['MIS COMPRAS','Mis pedidos','Consulta tus pedidos y paga los que aún no tienen pago.','Tus pedidos','Pulsa «Pagar» para enviar el pago al canal de pagos.']
    :isOperator()
    ?['OPERACIÓN','Pedidos','Registra pedidos para los clientes y consulta el historial.','Historial de pedidos','Vista de solo lectura para el operador.']
    :['VENTAS Y OPERACIÓN','Pedidos','Consulta el historial y gestiona los estados de cada pedido.','Historial de pedidos','Actualiza el estado, la dirección o elimina un pedido.'];
  ['ordersEyebrow','ordersTitle','ordersSubtitle','ordersTableTitle','ordersTableSubtitle'].forEach((id,i)=>{$(`#${id}`).textContent=orderTexts[i];});
  const paymentTexts=isClient()
    ?['MIS COMPRAS','Mis pagos','Tus pagos quedan pendientes hasta que Pizza Express los confirme.','Tus pagos','Cuando se aprueba un pago, tu pedido pasa a preparación.']
    :['FACTURACIÓN','Pagos','Aprueba o rechaza los pagos registrados. Al aprobar, el pedido pasa a preparación.','Historial de pagos','Consulta, confirma o elimina pagos.'];
  ['paymentsEyebrow','paymentsTitle','paymentsSubtitle','paymentsTableTitle','paymentsTableSubtitle'].forEach((id,i)=>{$(`#${id}`).textContent=paymentTexts[i];});
  $('#createPayment').hidden=!isAdmin();
}
function resetViews(){
  setTableMessage('usersTable','Consultando usuarios…',false,6);
  setTableMessage('productsTable','Consultando productos…',false,6);
  setTableMessage('ordersTable','Consultando pedidos…',false,8);
  setTableMessage('paymentsTable','Consultando pagos…',false,7);
  $('#catalogGrid').innerHTML='<div class="empty-state">Cargando catálogo…</div>';
  $('#recentOrders').innerHTML='<div class="empty-state">Cargando pedidos recientes…</div>';
  ['usersSearch','productsSearch','ordersSearch','paymentsSearch'].forEach(id=>{$(`#${id}`).value='';});
}
const ROL_OPTIONS=[['cliente','Cliente'],['operador','Operador'],['administrador','Administrador']];
const fields = {
  usuarios: [
    {name:'nombre',label:'Nombre',required:true,placeholder:'Ej. Laura'},
    {name:'apellidos',label:'Apellidos',required:true,placeholder:'Ej. Gómez Rodríguez'},
    {name:'correo',label:'Correo electrónico',type:'email',required:true,placeholder:'nombre@correo.com'},
    {name:'telefono',label:'Teléfono',placeholder:'300 000 0000'},
    {name:'direccion',label:'Dirección',required:true,full:true,placeholder:'Calle, carrera, número…'},
    {name:'rol',label:'Rol',type:'select',required:true,options:ROL_OPTIONS}
  ],
  // Solo al crear: la cuenta se registra en el servicio de autenticación
  cuenta: [
    {name:'nombre_usuario',label:'Nombre de usuario',required:true,placeholder:'Ej. laura.gomez'},
    {name:'password',label:'Contraseña',type:'password',required:true,placeholder:'Contraseña de acceso'}
  ],
  productos: [
    {name:'nombre',label:'Nombre del producto',required:true,placeholder:'Ej. Pizza Pepperoni',full:true},
    {name:'tamanio',label:'Tamaño',type:'select',required:true,options:[['Personal','Personal'],['Mediana','Mediana'],['Familiar','Familiar'],['Pequeña','Pequeña'],['Grande','Grande']]},
    {name:'precio',label:'Precio (COP)',type:'number',min:'0',step:'1',required:true,placeholder:'25000'},
    {name:'descripcion',label:'Descripción',type:'textarea',full:true,placeholder:'Ingredientes y detalles del producto…'},
    {name:'disponible',label:'Producto disponible para venta',type:'checkbox',default:true,full:true}
  ],
  pedidos: [
    {name:'cliente_id',label:'ID del cliente',type:'selectUsers',required:true,full:true},
    {name:'producto_id',label:'Producto',type:'selectProducts',required:true},
    {name:'cantidad',label:'Cantidad',type:'number',min:'1',step:'1',required:true,default:'1'}
  ],
  // El cliente siempre pide a su nombre
  pedidosCliente: [
    {name:'producto_id',label:'Pizza',type:'selectProducts',required:true,full:true},
    {name:'cantidad',label:'Cantidad',type:'number',min:'1',step:'1',required:true,default:'1',full:true}
  ],
  pagos: [
    {type:'note',text:'<b>Canal de pagos simulado.</b> No se cobra dinero real: la transacción se registra como <b>pendiente</b> hasta que el administrador la apruebe.'},
    {name:'pedido_id',label:'Pedido',type:'selectPedidos',required:true,full:true},
    {name:'metodo_pago',label:'Método de pago',type:'select',required:true,full:true,options:[['efectivo','Efectivo'],['tarjeta','Tarjeta'],['transferencia','Transferencia']]}
  ]
};
function fieldMarkup(field,value,mode){
  const val=value??field.default??'';
  const required=field.required?'required':'';
  const full=field.full?'full':'';
  if(field.type==='note')return `<div class="field full"><div class="pay-note"><span class="pay-note-icon">◈</span><span>${field.text}</span></div></div>`;
  if(field.type==='checkbox')return `<div class="field ${full}"><div class="check-field"><input id="field-${field.name}" name="${field.name}" type="checkbox" ${truthy(val)?'checked':''}><label for="field-${field.name}">${esc(field.label)}</label></div></div>`;
  if(field.type==='textarea')return `<div class="field ${full}"><label for="field-${field.name}">${esc(field.label)}</label><textarea id="field-${field.name}" name="${field.name}" ${required} placeholder="${esc(field.placeholder||'')}">${esc(val)}</textarea></div>`;
  if(field.type==='select')return `<div class="field ${full}"><label for="field-${field.name}">${esc(field.label)}</label><select id="field-${field.name}" name="${field.name}" ${required}>${field.options.map(([v,l])=>`<option value="${esc(v)}" ${String(val)===v?'selected':''}>${esc(l)}</option>`).join('')}</select></div>`;
  if(field.type==='selectUsers'){
    const options=state.usuarios.map(u=>[` ${u.id}`,`${u.id} — ${u.nombre||''} ${u.apellidos||''} (${u.correo||'sin correo'})`]);
    return `<div class="field ${full}"><label for="field-${field.name}">${esc(field.label)}</label><select id="field-${field.name}" name="${field.name}" ${required}><option value="">Selecciona un cliente…</option>${options.map(([v,l])=>`<option value="${esc(String(v).trim())}" ${String(val)===String(v).trim()?'selected':''}>${esc(l)}</option>`).join('')}</select>${options.length?'':'<small class="field-hint">No se pudieron cargar usuarios. Verifica el servicio antes de crear pedidos.</small>'}</div>`;
  }
  if(field.type==='selectProducts'){
    const options=state.productos.filter(p=>truthy(p.disponible)).map(p=>[String(p.id),`${p.id} — ${p.nombre} (${p.tamanio}) · ${fmtMoney(p.precio)}`]);
    return `<div class="field ${full}"><label for="field-${field.name}">${esc(field.label)}</label><select id="field-${field.name}" name="${field.name}" ${required}><option value="">Selecciona un producto…</option>${options.map(([v,l])=>`<option value="${esc(v)}" ${String(val)===v?'selected':''}>${esc(l)}</option>`).join('')}</select>${options.length?'':'<small class="field-hint">No hay productos disponibles para pedidos.</small>'}</div>`;
  }
  if(field.type==='selectPedidos'){
    // Solo pedidos que no estén cancelados y que no tengan un pago pendiente o aprobado
    const payable=visible('pedidos').filter(o=>String(o.estado).toLowerCase()!=='cancelado'&&!orderPayment(o.id));
    const options=payable.map(o=>[String(o.id),`Pedido #${o.id} — ${productName(o.producto_id)} ×${o.cantidad} · ${fmtMoney(o.total)}${isClient()?'':` · ${clientName(o.cliente_id)}`}`]);
    return `<div class="field ${full}"><label for="field-${field.name}">${esc(field.label)}</label><select id="field-${field.name}" name="${field.name}" ${required}><option value="">Selecciona un pedido…</option>${options.map(([v,l])=>`<option value="${esc(v)}" ${String(val)===v?'selected':''}>${esc(l)}</option>`).join('')}</select>${options.length?'':'<small class="field-hint">No hay pedidos pendientes de pago.</small>'}</div>`;
  }
  return `<div class="field ${full}"><label for="field-${field.name}">${esc(field.label)}</label><input id="field-${field.name}" name="${field.name}" type="${esc(field.type||'text')}" value="${esc(val)}" ${required} ${field.min!==undefined?`min="${field.min}"`:''} ${field.step?`step="${field.step}"`:''} placeholder="${esc(field.placeholder||'')}"></div>`;
}
function openModal({kind,title,description,mode='create',record={},action=null}){
  state.modal={kind,mode,record,action};
  $('#modalEyebrow').textContent=({usuarios:'GESTIÓN DE USUARIOS',productos:'CATÁLOGO DE PRODUCTOS',pedidos:'GESTIÓN DE PEDIDOS',pagos:'PAGOS'})[kind]||'DETALLE';
  $('#modalTitle').textContent=title;$('#modalDescription').textContent=description||'Completa los campos solicitados.';$('#formError').textContent='';
  const form=$('#recordForm');form.dataset.kind=kind;form.dataset.mode=mode;
  const createFields=kind==='usuarios'?[...fields.usuarios,...fields.cuenta]:kind==='pedidos'&&isClient()?fields.pedidosCliente:fields[kind];
  const config=mode==='state'?[{name:'estado',label:'Nuevo estado',type:'select',required:true,options:[['pendiente','Pendiente'],['preparando','Preparando'],['entregado','Entregado'],['cancelado','Cancelado']]}]:
    mode==='address'?[{name:'direccion',label:'Nueva dirección de entrega',required:true,full:true,placeholder:'Dirección completa'}]:
    mode==='patch'?(kind==='usuarios'?[
      {name:'nombre',label:'Nombre',placeholder:'Dejar vacío para no modificar'},
      {name:'apellidos',label:'Apellidos',placeholder:'Dejar vacío para no modificar'},
      {name:'correo',label:'Correo electrónico',type:'email',placeholder:'Dejar vacío para no modificar'},
      {name:'telefono',label:'Teléfono',placeholder:'Dejar vacío para no modificar'},
      {name:'direccion',label:'Dirección',full:true,placeholder:'Dejar vacío para no modificar'},
      {name:'rol',label:'Rol',type:'select',options:[['','Sin cambios'],...ROL_OPTIONS]}
    ]:kind==='productos'?[{name:'disponible',label:'Disponibilidad',type:'checkbox',default:truthy(record.disponible),full:true}]:[]):
    mode==='create'?createFields:
    mode==='edit'?fields[kind]:[];
  $('#modalFields').innerHTML=config.map(f=>fieldMarkup(f,record[f.name],mode)).join('');
  const readOnly=mode==='view';
  if(readOnly){
    $('#modalFields').innerHTML=Object.entries(record).map(([k,v])=>`<div class="field"><label>${esc(titleCase(k))}</label><div class="field-hint" style="font-size:12px;color:#3b3d46;word-break:break-word">${esc(v??'—')}</div></div>`).join('');
  }
  $$('#modalFields input, #modalFields select, #modalFields textarea').forEach(el=>el.disabled=readOnly);
  $('#saveRecord').hidden=readOnly;$('#cancelModal').textContent=readOnly?'Cerrar':'Cancelar';
  $('#saveRecord').textContent=({create:kind==='pagos'?'Enviar pago':kind==='pedidos'&&isClient()?'Hacer pedido':'Crear registro',edit:'Guardar cambios',patch:'Aplicar cambios',state:'Actualizar estado',address:'Actualizar dirección'})[mode]||'Guardar';
  $('#modalBackdrop').hidden=false;
  if(!readOnly){const first=$('#modalFields input:not([type=checkbox]), #modalFields select, #modalFields textarea');first?.focus();}
}
function closeModal(){ $('#modalBackdrop').hidden=true;state.modal=null; }
function payloadFromForm(){
  const kind=state.modal.kind,mode=state.modal.mode;
  if(mode==='patch'&&kind==='usuarios'){
    const allowed=['nombre','apellidos','correo','telefono','direccion','rol'];const result={};
    allowed.forEach(k=>{const el=$(`#field-${k}`);if(el&&el.value.trim()!=='')result[k]=el.value.trim();});
    return result;
  }
  const result={};
  $$('#modalFields [name]').forEach(el=>{
    if(el.type==='checkbox')result[el.name]=el.checked;
    else if(el.type==='number')result[el.name]=Number(el.value);
    else if(el.type==='password')result[el.name]=el.value;
    else result[el.name]=el.value.trim();
  });
  return result;
}
async function submitModal(event){
  event.preventDefault();if(!state.modal)return;
  const {kind,mode,record}=state.modal;const id=record.id;const save=$('#saveRecord');const errorEl=$('#formError');const label=save.textContent;
  const payload=payloadFromForm();
  if(mode==='patch'&&kind==='usuarios'&&!Object.keys(payload).length){errorEl.textContent='Ingresa al menos un campo para modificar.';return;}
  if(kind==='pedidos'&&mode==='create'&&isClient())payload.cliente_id=state.sesion.usuario_id;
  if(kind==='pagos'&&mode==='create')payload.pedido_id=Number(payload.pedido_id);
  save.disabled=true;save.textContent=kind==='pagos'&&mode==='create'?'Procesando pago…':'Procesando…';errorEl.textContent='';
  try{
    let result;
    // Las cuentas nuevas se crean en autenticación, que a su vez crea el perfil en usuarios
    if(mode==='create'&&kind==='usuarios') result=await request(API.autenticacion.registro,{method:'POST',body:JSON.stringify(payload)});
    else if(mode==='create') result=await request(API[kind].base,{method:'POST',body:JSON.stringify(payload)});
    else if(mode==='edit') result=await request(`${API[kind].base}/${id}`,{method:'PUT',body:JSON.stringify(payload)});
    else if(mode==='patch'&&kind==='usuarios')result=await request(`${API.usuarios.base}/${id}`,{method:'PATCH',body:JSON.stringify(payload)});
    else if(mode==='patch'&&kind==='productos')result=await request(`${API.productos.base}/${id}/disponibilidad`,{method:'PATCH',body:JSON.stringify(payload)});
    else if(mode==='state')result=await request(`${API.pedidos.base}/${id}/estado`,{method:'PUT',body:JSON.stringify(payload)});
    else if(mode==='address')result=await request(`${API.pedidos.base}/${id}`,{method:'PATCH',body:JSON.stringify(payload)});
    closeModal();
    toast(kind==='pagos'&&mode==='create'?'Pago enviado':'Operación completada',result?.mensaje||'Los cambios se guardaron correctamente.');
    await loadService(kind,true);
    if(kind==='pedidos'&&!isClient())await loadService('usuarios',true);
    if(kind==='pedidos'&&mode==='create'&&state.currentPage!=='pedidos')go('pedidos');
  }catch(err){errorEl.textContent=err.message;toast('No se pudo guardar',err.message,'error');}
  finally{save.disabled=false;if(state.modal)save.textContent=label;}
}
async function fetchRecord(kind,id){
  return request(`${API[kind].base}/${id}`);
}
async function openOrderModal(record={}){
  const loads=[loadService('productos',true)];
  if(!isClient())loads.push(loadService('usuarios',true));
  await Promise.all(loads);
  openModal({kind:'pedidos',title:'Crear pedido',description:isClient()?'Elige la pizza y la cantidad. El pedido se enviará a tu dirección registrada.':'Elige un cliente y un producto disponible. La API calculará el total y tomará la dirección del cliente.',mode:'create',record});
}
async function handleAction(action,kind,id){
  const record=state[kind].find(x=>String(x.id)===String(id));
  const noun={usuarios:'usuario',productos:'producto',pedidos:'pedido',pagos:'pago'}[kind];
  if(action==='view'){
    try{
      const data=await fetchRecord(kind,id);
      if(kind==='pedidos'){data.cliente=clientName(data.cliente_id);data.producto=productName(data.producto_id);}
      if(kind==='pagos'){const o=orderById(data.pedido_id);if(o){data.producto=productName(o.producto_id);data.total=fmtMoney(o.total);data.estado_pedido=o.estado;}}
      openModal({kind,title:`Detalle del ${noun} #${id}`,description:'Información obtenida directamente desde el endpoint de consulta por ID.',mode:'view',record:data});
    }
    catch(err){toast('No se pudo consultar el detalle',err.message,'error');}
    return;
  }
  if(action==='pay'){
    openModal({kind:'pagos',title:`Pagar pedido #${id}`,description:'Elige el método de pago. El servicio de pagos validará el pedido y enviará la transacción al canal simulado.',mode:'create',record:{pedido_id:id}});
    return;
  }
  if(action==='approve'||action==='reject'){
    const estado=action==='approve'?'aprobado':'rechazado';
    const question=action==='approve'
      ?`¿Aprobar el pago #${id}? El servicio de pagos avisará a pedidos para pasar el pedido #${record?.pedido_id??''} a preparación.`
      :`¿Rechazar el pago #${id}? El cliente podrá registrar un nuevo pago para ese pedido.`;
    if(!window.confirm(question))return;
    try{
      const result=await request(`${API.pagos.base}/${id}`,{method:'PUT',body:JSON.stringify({estado})});
      toast(action==='approve'?'Pago aprobado':'Pago rechazado',result?.mensaje||'');
      await Promise.all([loadService('pagos',true),loadService('pedidos',true)]);
    }catch(err){toast('No se pudo actualizar el pago',err.message,'error');}
    return;
  }
  if(action==='edit'){openModal({kind,title:`Editar ${noun} #${id}`,description:'La operación se enviará mediante PUT al endpoint existente.',mode:'edit',record:record||{}});return;}
  if(action==='patch'){
    openModal({kind,title:`Modificar usuario #${id}`,description:'PATCH enviará únicamente los campos que completes.',mode:'patch',record:record||{}});return;
  }
  if(action==='toggle'){
    openModal({kind,title:`Cambiar disponibilidad · #${id}`,description:'Actualiza solo el campo disponibilidad mediante PATCH.',mode:'patch',record:record||{}});return;
  }
  if(action==='state'){openModal({kind,title:`Actualizar estado · Pedido #${id}`,description:'Selecciona el nuevo estado del pedido.',mode:'state',record:record||{}});return;}
  if(action==='address'){openModal({kind,title:`Cambiar dirección · Pedido #${id}`,description:'Actualiza la dirección de entrega mediante PATCH.',mode:'address',record:record||{}});return;}
  if(action==='delete'){
    if(!window.confirm(`¿Seguro que deseas eliminar el ${noun} #${id}? Esta acción no se puede deshacer.`))return;
    try{const result=await request(`${API[kind].base}/${id}`,{method:'DELETE'});toast('Registro eliminado',result?.mensaje||`Se eliminó el ${noun} #${id}.`);await loadService(kind,true);}
    catch(err){toast('No se pudo eliminar',err.message,'error');}
  }
}

// =========================
// ACCESO: LOGIN, REGISTRO Y SALIDA
// =========================
function switchAuthTab(tab){
  const login=tab==='login';
  $$('[data-auth-tab]').forEach(b=>{const on=b.dataset.authTab===tab;b.classList.toggle('active',on);b.setAttribute('aria-selected',String(on));});
  $('#loginForm').hidden=!login; $('#registerForm').hidden=login;
  $('#authTitle').textContent=login?'Inicia sesión':'Crea tu cuenta';
  $('#authSubtitle').textContent=login?'Ingresa con tu nombre de usuario y contraseña.':'Regístrate para pedir y pagar tus pizzas en línea.';
  $('#loginError').textContent=''; $('#registerError').textContent='';
}
function iniciarSesion(respuesta){
  saveSession(respuesta.usuario);
  $('#loginForm').reset(); $('#registerForm').reset();
  startApp();
  if(respuesta.usuario.perfil_completo===false) toast('Sesión con perfil limitado',respuesta.mensaje,'error');
  else toast(`Hola, ${respuesta.usuario.nombre||respuesta.usuario.nombre_usuario}`,`Ingresaste como ${role().label.toLowerCase()}.`);
}
async function submitLogin(event){
  event.preventDefault();
  const btn=$('#loginSubmit'), errorEl=$('#loginError');
  const payload={nombre_usuario:$('#loginUser').value.trim(),password:$('#loginPass').value};
  errorEl.textContent=''; btn.disabled=true; btn.textContent='Ingresando…';
  try{
    const respuesta=await request(API.autenticacion.login,{method:'POST',body:JSON.stringify(payload)});
    iniciarSesion(respuesta);
  }catch(err){errorEl.textContent=err.message;}
  finally{btn.disabled=false;btn.textContent='Ingresar';}
}
async function submitRegister(event){
  event.preventDefault();
  const form=$('#registerForm'), btn=$('#registerSubmit'), errorEl=$('#registerError');
  const payload={};
  $$('[name]',form).forEach(el=>{payload[el.name]=el.type==='password'?el.value:el.value.trim();});
  errorEl.textContent=''; btn.disabled=true; btn.textContent='Creando cuenta…';
  let registrado=false;
  try{
    // 1. Autenticación crea el perfil en usuarios y guarda las credenciales
    await request(API.autenticacion.registro,{method:'POST',body:JSON.stringify(payload)});
    registrado=true;
    // 2. Inicio de sesión automático con la cuenta recién creada
    const respuesta=await request(API.autenticacion.login,{method:'POST',body:JSON.stringify({nombre_usuario:payload.nombre_usuario,password:payload.password})});
    iniciarSesion(respuesta);
  }catch(err){
    if(registrado){
      switchAuthTab('login');
      $('#loginUser').value=payload.nombre_usuario;
      $('#loginError').textContent=`Tu cuenta se creó, pero no se pudo iniciar sesión: ${err.message}`;
    }else errorEl.textContent=err.message;
  }finally{btn.disabled=false;btn.textContent='Crear cuenta';}
}
function showAuth(){
  closeModal();
  $('#appShell').hidden=true; $('#authScreen').hidden=false;
  switchAuthTab('login');
}
function startApp(){
  state.usuarios=[]; state.productos=[]; state.pedidos=[]; state.pagos=[]; state.health={};
  $('#authScreen').hidden=true; $('#appShell').hidden=false;
  resetViews();
  applyRole();
  updateOverview();
  const hash=window.location.hash.replace('#','');
  go(role().pages.includes(hash)?hash:role().home,false);
  refreshRoleServices(true);
}
function logout(){
  const nombre=state.sesion?.nombre||state.sesion?.nombre_usuario||'';
  clearSession();
  state.usuarios=[]; state.productos=[]; state.pedidos=[]; state.pagos=[]; state.health={};
  history.replaceState(null,'',window.location.pathname+window.location.search);
  showAuth();
  toast('Sesión cerrada',nombre?`Hasta pronto, ${nombre}.`:'Hasta pronto.');
}

function setupEvents(){
  $$('.nav-link').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();go(a.dataset.page);}));
  $$('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));
  $$('[data-auth-tab]').forEach(b=>b.addEventListener('click',()=>{switchAuthTab(b.dataset.authTab);(b.dataset.authTab==='login'?$('#loginUser'):$('#regNombre')).focus();}));
  $('#loginForm').addEventListener('submit',submitLogin);
  $('#registerForm').addEventListener('submit',submitRegister);
  $('#logoutButton').addEventListener('click',logout);
  $('#refreshAll').addEventListener('click',async()=>{await refreshRoleServices(true);toast('Datos actualizados','Se consultaron los servicios disponibles.');});
  $('#checkServices').addEventListener('click',()=>refreshRoleServices(true).then(()=>toast('Comprobación terminada','Consulta el estado de cada servicio en el panel.')));
  $('#refreshUsers').addEventListener('click',()=>loadService('usuarios'));$('#refreshProducts').addEventListener('click',()=>loadService('productos'));$('#refreshOrders').addEventListener('click',()=>loadService('pedidos'));
  $('#refreshCatalog').addEventListener('click',()=>loadService('productos'));
  $('#refreshPayments').addEventListener('click',()=>Promise.all([loadService('pedidos',true),loadService('pagos')]));
  $('#createUser').addEventListener('click',()=>openModal({kind:'usuarios',title:'Registrar usuario',description:'Crea la cuenta completa: el servicio de autenticación crea el perfil en usuarios y guarda las credenciales.',mode:'create',record:{rol:'cliente'}}));
  $('#createProduct').addEventListener('click',()=>openModal({kind:'productos',title:'Agregar producto',description:'Añade un producto al catálogo de Pizza Express.',mode:'create'}));
  $('#createOrder').addEventListener('click',()=>openOrderModal());
  $('#createPayment').addEventListener('click',async()=>{await Promise.all([loadService('pedidos',true),loadService('pagos',true),loadService('productos',true),loadService('usuarios',true)]);openModal({kind:'pagos',title:'Registrar pago',description:'Selecciona un pedido sin pago y el método. El canal simulado deja el pago pendiente.',mode:'create'});});
  $('#catalogGrid').addEventListener('click',e=>{const b=e.target.closest('[data-order-product]');if(b&&!b.disabled)openOrderModal({producto_id:b.dataset.orderProduct});});
  $('#closeModal').addEventListener('click',closeModal);$('#cancelModal').addEventListener('click',closeModal);
  $('#modalBackdrop').addEventListener('click',e=>{if(e.target===$('#modalBackdrop'))closeModal();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#modalBackdrop').hidden)closeModal();});
  $('#recordForm').addEventListener('submit',submitModal);
  ['usersTable','productsTable','ordersTable','paymentsTable'].forEach(id=>$(`#${id}`).addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b)handleAction(b.dataset.action,b.dataset.kind,b.dataset.id);}));
  $('#usersSearch').addEventListener('input',renderUsers);$('#productsSearch').addEventListener('input',renderProducts);$('#ordersSearch').addEventListener('input',renderOrders);$('#paymentsSearch').addEventListener('input',renderPayments);
}
function init(){
  $('#year').textContent=new Date().getFullYear();
  $('#todayLabel').textContent=new Date().toLocaleDateString('es-CO',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
  setupEvents();
  const sesion=readSession();
  if(sesion&&sesion.usuario_id){state.sesion=sesion;startApp();}
  else showAuth();
}
window.addEventListener('DOMContentLoaded',init);
