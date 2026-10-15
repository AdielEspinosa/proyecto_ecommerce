const API = {
  usuarios: { list: '/api/usuarios-list', base: '/api/usuarios' },
  productos: { list: '/api/productos-list', base: '/api/productos' },
  pedidos: { list: '/api/pedidos', base: '/api/pedidos' }
};
const state = { usuarios: [], productos: [], pedidos: [], currentPage: 'overview', modal: null };
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const fmtMoney = value => new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(value)||0);
const fmtDate = value => { if(!value) return '—'; const d = new Date(String(value).replace(' ','T')); return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric'}); };
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
function setHealth(key, ok, detail=''){
  const ids={usuarios:['usersHealth','serviceUsers','userServiceStatus'],productos:['productsHealth','serviceProducts','productServiceStatus'],pedidos:['ordersHealth','serviceOrders']};
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
    renderService(key);
    if(key!=='pedidos' && state.pedidos.length) renderOrders();
    updateOverview();
    return data;
  }catch(error){
    setHealth(key,false);
    const map={usuarios:['usersTable',6],productos:['productsTable',6],pedidos:['ordersTable',8]};
    const [table,cols]=map[key];
    if(!state[key].length)setTableMessage(table,`${error.message} Revisa el servicio ${key}.`,true,cols);
    updateOverview();
    if(!quiet)toast(`No se pudo consultar ${key}`,error.message,'error');
    return null;
  }finally{
    const id={usuarios:'userLastQuery',productos:'productLastQuery',pedidos:'orderLastQuery'}[key];
    if(id) $(`#${id}`).textContent=timeNow();
  }
}
function updateOverview(){
  const users=state.usuarios, products=state.productos, orders=state.pedidos;
  $('#usersMetric').textContent=users.length; $('#productsMetric').textContent=products.length; $('#ordersMetric').textContent=orders.length;
  $('#usersNavCount').textContent=users.length; $('#productsNavCount').textContent=products.length; $('#ordersNavCount').textContent=orders.length;
  $('#userTotal').textContent=users.length; $('#productTotal').textContent=products.length; $('#orderTotal').textContent=orders.length;
  $('#productAvailable').textContent=products.filter(p=>truthy(p.disponible)).length;
  $('#orderPending').textContent=orders.filter(o=>String(o.estado||'pendiente').toLowerCase()==='pendiente').length;
  const healthKeys=['usuarios','productos','pedidos'];
  const online=healthKeys.filter(k=>{const el=$({usuarios:'#usersHealth',productos:'#productsHealth',pedidos:'#ordersHealth'}[k]);return el && el.classList.contains('good');}).length;
  $('#servicesMetric').textContent=online;
  $('#servicesHealth').textContent=online===3?'En línea':`${online} de 3`; $('#servicesHealth').className=`metric-status ${online===3?'good':online===0?'bad':''}`;
  $('#productsFoot').textContent=`${products.filter(p=>truthy(p.disponible)).length} disponibles`;
  $('#usersFoot').textContent=`${users.filter(u=>String(u.rol||'').toLowerCase()==='cliente').length} clientes`;
  $('#ordersFoot').textContent=`${orders.filter(o=>String(o.estado||'').toLowerCase()==='entregado').length} entregados`;
  $('#platformStatus').textContent=online===3?'Todos los servicios en línea':`${online}/3 servicios disponibles`;
  $('.pulse-dot').classList.toggle('off',online!==3);
  $('#heroHealth').textContent=online===3?'3 servicios disponibles':`${online} de 3 servicios disponibles`;
  $('#lastUpdated').textContent=`Actualizado a las ${timeNow()}`;
  renderRecentOrders();
}
function truthy(v){return v===true||v===1||v==='1'||String(v).toLowerCase()==='true';}
const ACTION_ICONS = {
  view: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
  edit: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg>',
  patch: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2"/><circle cx="15" cy="17" r="2"/></svg>',
  delete: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"/></svg>'
};
function actionButton(action,kind,id,title,label,danger=false){
  const iconKey =
  action === 'toggle' || action === 'address' ? 'patch' :
  action === 'state' ? 'edit' :
  action;
  return `<button type="button" class="action-btn${danger?' danger':''}" title="${esc(title)}" aria-label="${esc(label)}" data-action="${action}" data-kind="${kind}" data-id="${esc(id)}">${ACTION_ICONS[iconKey]||''}</button>`;
}
function renderService(key){
  if(key==='usuarios')renderUsers();
  if(key==='productos')renderProducts();
  if(key==='pedidos')renderOrders();
}
function renderUsers(){
  const q=($('#usersSearch')?.value||'').trim().toLowerCase();
  const list=state.usuarios.filter(u=>[u.id,u.nombre,u.apellidos,u.correo,u.telefono,u.direccion,u.rol].some(v=>String(v??'').toLowerCase().includes(q)));
  if(!list.length){setTableMessage('usersTable',state.usuarios.length?'No hay usuarios que coincidan con la búsqueda.':'No hay usuarios registrados.',false,6);}
  else $('#usersTable').innerHTML=list.map(u=>`<tr>
    <td><div class="user-cell"><span class="user-avatar">${esc(initials(`${u.nombre||''} ${u.apellidos||''}`))}</span><span><b class="primary-cell">${esc(`${u.nombre||''} ${u.apellidos||''}`.trim()||'Usuario')}</b><small class="sub-cell">ID #${esc(u.id)}</small></span></div></td>
    <td>${esc(u.correo||'—')}</td><td>${esc(u.telefono||'—')}</td><td><span class="role-pill ${String(u.rol).toLowerCase()==='administrador'?'admin':''}">${esc(u.rol||'Sin rol')}</span></td><td>${esc(u.direccion||'—')}</td>
    <td><div class="action-group">${actionButton('view','usuarios',u.id,'Consultar detalle',`Consultar usuario ${u.id}`)}${actionButton('edit','usuarios',u.id,'Editar (PUT)',`Editar usuario ${u.id}`)}${actionButton('patch','usuarios',u.id,'Modificar parcialmente (PATCH)',`Modificar parcialmente usuario ${u.id}`)}${actionButton('delete','usuarios',u.id,'Eliminar',`Eliminar usuario ${u.id}`,true)}</div></td></tr>`).join('');
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
function statusClass(status){return String(status||'pendiente').toLowerCase().replace(/[^a-z]/g,'');}
function clientName(id){
  const u=state.usuarios.find(item=>String(item.id)===String(id));
  return u ? `${u.nombre||''} ${u.apellidos||''}`.trim() || `Cliente #${id}` : `Cliente #${id}`;
}
function productName(id){
  const p=state.productos.find(item=>String(item.id)===String(id));
  return p ? (p.nombre||`Producto #${id}`) : `Producto #${id}`;
}
function renderOrders(){
  const q=($('#ordersSearch')?.value||'').trim().toLowerCase();
  const list=state.pedidos.filter(o=>[o.id,o.cliente_id,clientName(o.cliente_id),o.producto_id,productName(o.producto_id),o.cantidad,o.direccion,o.total,o.estado,o.fecha].some(v=>String(v??'').toLowerCase().includes(q)));
  if(!list.length)setTableMessage('ordersTable',state.pedidos.length?'No hay pedidos que coincidan con la búsqueda.':'No hay pedidos registrados.',false,8);
  else $('#ordersTable').innerHTML=list.map(o=>`<tr>
    <td><b class="primary-cell">#${esc(o.id)}</b></td>
    <td><span class="primary-cell">${esc(clientName(o.cliente_id))}</span><small class="sub-cell">ID #${esc(o.cliente_id)}</small></td>
    <td><span class="primary-cell">${esc(productName(o.producto_id))}</span><small class="sub-cell">ID #${esc(o.producto_id)}</small></td>
    <td>${esc(o.cantidad??'—')}</td>
    <td><b class="primary-cell">${fmtMoney(o.total)}</b></td>
    <td><span class="status-pill ${statusClass(o.estado)}">${esc(titleCase(o.estado||'pendiente'))}</span></td>
    <td>${esc(fmtDate(o.fecha))}</td>
    <td><div class="action-group">${actionButton('view','pedidos',o.id,'Consultar detalle',`Consultar pedido ${o.id}`)}${actionButton('state','pedidos',o.id,'Editar estado (PUT)',`Editar estado del pedido ${o.id}`)}${actionButton('address','pedidos',o.id,'Modificar dirección (PATCH)',`Modificar dirección del pedido ${o.id}`)}${actionButton('delete','pedidos',o.id,'Eliminar',`Eliminar pedido ${o.id}`,true)}</div></td>
  </tr>`).join('');
  $('#ordersTableCount').textContent=`${list.length} de ${state.pedidos.length} registros`;
}
function renderRecentOrders(){
  const recent=[...state.pedidos].slice(-4).reverse();
  $('#recentOrders').innerHTML=recent.length?recent.map(o=>`<div class="recent-item"><span><b>Pedido #${esc(o.id)}</b><small>${esc(fmtDate(o.fecha))}</small></span><span>${esc(clientName(o.cliente_id))}<small class="sub-cell">${esc(productName(o.producto_id))}</small></span><span><b>${fmtMoney(o.total)}</b></span><span><span class="status-pill ${statusClass(o.estado)}">${esc(titleCase(o.estado||'pendiente'))}</span></span></div>`).join(''):'<div class="empty-state">No hay pedidos para mostrar.</div>';
}
function go(page){
  if(!['overview','usuarios','productos','pedidos'].includes(page))page='overview';
  state.currentPage=page;
  $$('.page-view').forEach(el=>el.classList.toggle('active',el.id===`page-${page}`));
  $$('.nav-link').forEach(el=>el.classList.toggle('active',el.dataset.page===page));
  $('#crumbCurrent').textContent=({overview:'Resumen',usuarios:'Usuarios',productos:'Productos',pedidos:'Pedidos'})[page];
  if(page!=='overview')loadService(page,true);
  window.location.hash=page==='overview'?'overview':page;
}
const fields = {
  usuarios: [
    {name:'nombre',label:'Nombre',required:true,placeholder:'Ej. Laura'},
    {name:'apellidos',label:'Apellidos',required:true,placeholder:'Ej. Gómez Rodríguez'},
    {name:'correo',label:'Correo electrónico',type:'email',required:true,placeholder:'nombre@correo.com'},
    {name:'telefono',label:'Teléfono',placeholder:'300 000 0000'},
    {name:'direccion',label:'Dirección',full:true,placeholder:'Calle, carrera, número…'},
    {name:'rol',label:'Rol',type:'select',required:true,options:[['cliente','Cliente'],['administrador','Administrador']]}
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
  ]
};
function fieldMarkup(field,value,mode){
  const val=value??field.default??'';
  const required=field.required?'required':'';
  const full=field.full?'full':'';
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
  return `<div class="field ${full}"><label for="field-${field.name}">${esc(field.label)}</label><input id="field-${field.name}" name="${field.name}" type="${esc(field.type||'text')}" value="${esc(val)}" ${required} ${field.min!==undefined?`min="${field.min}"`:''} ${field.step?`step="${field.step}"`:''} placeholder="${esc(field.placeholder||'')}"></div>`;
}
function openModal({kind,title,description,mode='create',record={},action=null}){
  state.modal={kind,mode,record,action};
  $('#modalEyebrow').textContent=({usuarios:'GESTIÓN DE USUARIOS',productos:'CATÁLOGO DE PRODUCTOS',pedidos:'GESTIÓN DE PEDIDOS'})[kind]||'DETALLE';
  $('#modalTitle').textContent=title;$('#modalDescription').textContent=description||'Completa los campos solicitados.';$('#formError').textContent='';
  const form=$('#recordForm');form.dataset.kind=kind;form.dataset.mode=mode;
  const config=mode==='state'?[{name:'estado',label:'Nuevo estado',type:'select',required:true,options:[['pendiente','Pendiente'],['preparando','Preparando'],['entregado','Entregado'],['cancelado','Cancelado']]}]:
    mode==='address'?[{name:'direccion',label:'Nueva dirección de entrega',required:true,full:true,placeholder:'Dirección completa'}]:
    mode==='patch'?(kind==='usuarios'?[
      {name:'nombre',label:'Nombre',placeholder:'Dejar vacío para no modificar'},
      {name:'apellidos',label:'Apellidos',placeholder:'Dejar vacío para no modificar'},
      {name:'correo',label:'Correo electrónico',type:'email',placeholder:'Dejar vacío para no modificar'},
      {name:'telefono',label:'Teléfono',placeholder:'Dejar vacío para no modificar'},
      {name:'direccion',label:'Dirección',full:true,placeholder:'Dejar vacío para no modificar'},
      {name:'rol',label:'Rol',type:'select',options:[['','Sin cambios'],['cliente','Cliente'],['administrador','Administrador']]}
    ]:kind==='productos'?[{name:'disponible',label:'Disponibilidad',type:'checkbox',default:truthy(record.disponible),full:true}]:[]):
    mode==='create'||mode==='edit'?fields[kind]:[];
  $('#modalFields').innerHTML=config.map(f=>fieldMarkup(f,record[f.name],mode)).join('');
  const readOnly=mode==='view';
  if(readOnly){
    $('#modalFields').innerHTML=Object.entries(record).map(([k,v])=>`<div class="field"><label>${esc(titleCase(k))}</label><div class="field-hint" style="font-size:12px;color:#3b3d46;word-break:break-word">${esc(v??'—')}</div></div>`).join('');
  }
  $$('#modalFields input, #modalFields select, #modalFields textarea').forEach(el=>el.disabled=readOnly);
  $('#saveRecord').hidden=readOnly;$('#cancelModal').textContent=readOnly?'Cerrar':'Cancelar';
  $('#saveRecord').textContent=({create:'Crear registro',edit:'Guardar cambios',patch:'Aplicar cambios',state:'Actualizar estado',address:'Actualizar dirección'})[mode]||'Guardar';
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
    else result[el.name]=el.value.trim();
  });
  return result;
}
async function submitModal(event){
  event.preventDefault();if(!state.modal)return;
  const {kind,mode,record}=state.modal;const id=record.id;const save=$('#saveRecord');const errorEl=$('#formError');
  const payload=payloadFromForm();
  if(mode==='patch'&&kind==='usuarios'&&!Object.keys(payload).length){errorEl.textContent='Ingresa al menos un campo para modificar.';return;}
  save.disabled=true;save.textContent='Procesando…';errorEl.textContent='';
  try{
    let result;
    if(mode==='create') result=await request(API[kind].base,{method:'POST',body:JSON.stringify(payload)});
    else if(mode==='edit') result=await request(`${API[kind].base}/${id}`,{method:'PUT',body:JSON.stringify(payload)});
    else if(mode==='patch'&&kind==='usuarios')result=await request(`${API.usuarios.base}/${id}`,{method:'PATCH',body:JSON.stringify(payload)});
    else if(mode==='patch'&&kind==='productos')result=await request(`${API.productos.base}/${id}/disponibilidad`,{method:'PATCH',body:JSON.stringify(payload)});
    else if(mode==='state')result=await request(`${API.pedidos.base}/${id}/estado`,{method:'PUT',body:JSON.stringify(payload)});
    else if(mode==='address')result=await request(`${API.pedidos.base}/${id}`,{method:'PATCH',body:JSON.stringify(payload)});
    closeModal();toast('Operación completada',result?.mensaje||'Los cambios se guardaron correctamente.');await loadService(kind,true);if(kind==='pedidos')await loadService('usuarios',true);
  }catch(err){errorEl.textContent=err.message;toast('No se pudo guardar',err.message,'error');}
  finally{save.disabled=false;if(state.modal)save.textContent='Guardar cambios';}
}
async function fetchRecord(kind,id){
  const path=kind==='usuarios'?`${API.usuarios.base}/${id}`:kind==='productos'?`${API.productos.base}/${id}`:`${API.pedidos.base}/${id}`;
  return request(path);
}
async function handleAction(action,kind,id){
  const record=state[kind].find(x=>String(x.id)===String(id));
  if(action==='view'){
    try{const data=await fetchRecord(kind,id);if(kind==='pedidos'){data.cliente=clientName(data.cliente_id);data.producto=productName(data.producto_id);}openModal({kind,title:`Detalle ${kind==='pedidos'?'del pedido':kind==='usuarios'?'del usuario':'del producto'} #${id}`,description:'Información obtenida directamente desde el endpoint de consulta por ID.',mode:'view',record:data});}
    catch(err){toast('No se pudo consultar el detalle',err.message,'error');}
    return;
  }
  if(action==='edit'){openModal({kind,title:`Editar ${kind==='usuarios'?'usuario':kind==='productos'?'producto':'pedido'} #${id}`,description:'La operación se enviará mediante PUT al endpoint existente.',mode:'edit',record:record||{}});return;}
  if(action==='patch'){
    openModal({kind,title:`Modificar usuario #${id}`,description:'PATCH enviará únicamente los campos que completes.',mode:'patch',record:record||{}});return;
  }
  if(action==='toggle'){
    openModal({kind,title:`Cambiar disponibilidad · #${id}`,description:'Actualiza solo el campo disponibilidad mediante PATCH.',mode:'patch',record:record||{}});return;
  }
  if(action==='state'){openModal({kind,title:`Actualizar estado · Pedido #${id}`,description:'Selecciona el nuevo estado del pedido.',mode:'state',record:record||{}});return;}
  if(action==='address'){openModal({kind,title:`Cambiar dirección · Pedido #${id}`,description:'Actualiza la dirección de entrega mediante PATCH.',mode:'address',record:record||{}});return;}
  if(action==='delete'){
    const noun=kind==='usuarios'?'usuario':kind==='productos'?'producto':'pedido';
    if(!window.confirm(`¿Seguro que deseas eliminar el ${noun} #${id}? Esta acción no se puede deshacer.`))return;
    try{const result=await request(`${API[kind].base}/${id}`,{method:'DELETE'});toast('Registro eliminado',result?.mensaje||`Se eliminó el ${noun} #${id}.`);await loadService(kind,true);}
    catch(err){toast('No se pudo eliminar',err.message,'error');}
  }
}
function setupEvents(){
  $$('.nav-link').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();go(a.dataset.page);}));
  $$('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));
  $('#refreshAll').addEventListener('click',async()=>{await Promise.all(['usuarios','productos','pedidos'].map(k=>loadService(k,true)));toast('Datos actualizados','Se consultaron los servicios disponibles.');});
  $('#checkServices').addEventListener('click',()=>Promise.all(['usuarios','productos','pedidos'].map(k=>loadService(k,true))).then(()=>toast('Comprobación terminada','Consulta el estado de cada servicio en el panel.')));
  $('#refreshUsers').addEventListener('click',()=>loadService('usuarios'));$('#refreshProducts').addEventListener('click',()=>loadService('productos'));$('#refreshOrders').addEventListener('click',()=>loadService('pedidos'));
  $('#createUser').addEventListener('click',()=>openModal({kind:'usuarios',title:'Registrar usuario',description:'Completa la información del nuevo cliente.',mode:'create'}));
  $('#createProduct').addEventListener('click',()=>openModal({kind:'productos',title:'Agregar producto',description:'Añade un producto al catálogo de Pizza Express.',mode:'create'}));
  $('#createOrder').addEventListener('click',async()=>{await Promise.all([loadService('usuarios',true),loadService('productos',true)]);openModal({kind:'pedidos',title:'Crear pedido',description:'Elige un cliente y un producto disponible. La API calculará el total y tomará la dirección del cliente.',mode:'create'});});
  $('#closeModal').addEventListener('click',closeModal);$('#cancelModal').addEventListener('click',closeModal);
  $('#modalBackdrop').addEventListener('click',e=>{if(e.target===$('#modalBackdrop'))closeModal();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#modalBackdrop').hidden)closeModal();});
  $('#recordForm').addEventListener('submit',submitModal);
  $('#usersTable').addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b)handleAction(b.dataset.action,b.dataset.kind,b.dataset.id);});
  $('#productsTable').addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b)handleAction(b.dataset.action,b.dataset.kind,b.dataset.id);});
  $('#ordersTable').addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b)handleAction(b.dataset.action,b.dataset.kind,b.dataset.id);});
  $('#usersSearch').addEventListener('input',renderUsers);$('#productsSearch').addEventListener('input',renderProducts);$('#ordersSearch').addEventListener('input',renderOrders);
}
function init(){
  $('#year').textContent=new Date().getFullYear();
  $('#todayLabel').textContent=new Date().toLocaleDateString('es-CO',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
  setupEvents();
  const hash=window.location.hash.replace('#','');if(['usuarios','productos','pedidos'].includes(hash))go(hash);
  Promise.all(['usuarios','productos','pedidos'].map(k=>loadService(k,true)));
}
window.addEventListener('DOMContentLoaded',init);
