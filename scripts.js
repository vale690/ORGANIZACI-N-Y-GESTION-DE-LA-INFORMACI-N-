// Organización y Gestión de la Información - scripts.js

const LS_KEY = 'ogi_documents_v1';
let docs = [];

// DOM
const form = document.getElementById('docForm');
const nombre = document.getElementById('nombre');
const categoria = document.getElementById('categoria');
const etiquetas = document.getElementById('etiquetas');
const fecha = document.getElementById('fecha');
const descripcion = document.getElementById('descripcion');
const listaContenedor = document.getElementById('listaContenedor');
const docId = document.getElementById('docId');
const limpiarBtn = document.getElementById('limpiar');
const exportarBtn = document.getElementById('exportar');
const importFile = document.getElementById('importFile');
const chartCtx = document.getElementById('categoriaChart');
let categoriaChart = null;

// Inicializar
loadFromStorage();
renderList();
renderChart();

// Eventos
form.addEventListener('submit', e => {
  e.preventDefault();
  if (docId.value) {
    updateDocument(docId.value);
  } else {
    addDocument();
  }
  form.reset(); docId.value = '';
  renderList(); renderChart();
});

limpiarBtn.addEventListener('click', ()=>{form.reset(); docId.value='';});

exportarBtn.addEventListener('click', ()=>{
  const data = JSON.stringify(docs, null, 2);
  const blob = new Blob([data], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'documentos_ogi.json';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
});

importFile.addEventListener('change', async (e)=>{
  const file = e.target.files[0];
  if (!file) return;
  try{
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) throw new Error('Formato inválido');
    // merge: add those that don't have same id
    parsed.forEach(item=>{
      if (!item.id) item.id = generateId();
      const exists = docs.find(d=>d.id===item.id);
      if (!exists) docs.push(item);
    });
    saveToStorage(); renderList(); renderChart();
    alert('Importación completada.');
  }catch(err){alert('Error importando archivo: '+err.message)}
  e.target.value='';
});

// CRUD
function addDocument(){
  const item = {
    id: generateId(),
    nombre: nombre.value.trim(),
    categoria: categoria.value,
    etiquetas: etiquetas.value.split(',').map(t=>t.trim()).filter(Boolean),
    fecha: fecha.value || null,
    descripcion: descripcion.value.trim(),
    creado: new Date().toISOString()
  };
  docs.unshift(item);
  saveToStorage();
}

function updateDocument(id){
  const i = docs.findIndex(d=>d.id===id);
  if (i===-1) return;
  docs[i].nombre = nombre.value.trim();
  docs[i].categoria = categoria.value;
  docs[i].etiquetas = etiquetas.value.split(',').map(t=>t.trim()).filter(Boolean);
  docs[i].fecha = fecha.value || null;
  docs[i].descripcion = descripcion.value.trim();
  saveToStorage();
}

function deleteDocument(id){
  if (!confirm('¿Eliminar este documento?')) return;
  docs = docs.filter(d=>d.id!==id);
  saveToStorage(); renderList(); renderChart();
}

function editDocument(id){
  const d = docs.find(x=>x.id===id);
  if (!d) return;
  docId.value = d.id;
  nombre.value = d.nombre;
  categoria.value = d.categoria;
  etiquetas.value = (d.etiquetas||[]).join(', ');
  fecha.value = d.fecha || '';
  descripcion.value = d.descripcion || '';
  window.scrollTo({top:0,behavior:'smooth'});
}

// Render
function renderList(){
  listaContenedor.innerHTML = '';
  if (docs.length===0){
    listaContenedor.innerHTML = '<p class="small">No hay documentos. Agrega uno usando el formulario.</p>';
    return;
  }
  docs.forEach(d=>{
    const div = document.createElement('div');
    div.className = 'doc-item';
    div.innerHTML = `
      <div class="doc-main">
        <h3>${escapeHtml(d.nombre)}</h3>
        <div class="doc-meta"><strong>Categoría:</strong> ${escapeHtml(d.categoria)} • <strong>Fecha:</strong> ${d.fecha||'--'}</div>
        <p class="small">${escapeHtml(d.descripcion||'')}</p>
        <div class="doc-meta">Etiquetas: ${(d.etiquetas||[]).map(t=>'<span>'+escapeHtml(t)+'</span>').join(', ')}</div>
      </div>
      <div class="doc-actions">
        <button class="btn" onclick="editDocument('${d.id}')">Editar</button>
        <button class="btn" onclick="deleteDocument('${d.id}')">Eliminar</button>
      </div>
    `;
    listaContenedor.appendChild(div);
  });
}

function renderChart(){
  const counts = {};
  docs.forEach(d=>{ counts[d.categoria] = (counts[d.categoria]||0)+1 });
  const labels = Object.keys(counts);
  const data = Object.values(counts);
  if (!categoriaChart){
    categoriaChart = new Chart(chartCtx,{
      type:'bar',
      data:{labels, datasets:[{label:'Documentos', data}]},
      options:{
        responsive:true,
        maintainAspectRatio:false,
        scales:{y:{beginAtZero:true}}
      }
    });
  } else {
    categoriaChart.data.labels = labels;
    categoriaChart.data.datasets[0].data = data;
    categoriaChart.update();
  }
}

// Storage
function saveToStorage(){ localStorage.setItem(LS_KEY, JSON.stringify(docs)); }
function loadFromStorage(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    docs = raw ? JSON.parse(raw) : [];
  }catch(e){docs = []}
}

// Helpers
function generateId(){ return 'd_'+Math.random().toString(36).slice(2,10); }
function escapeHtml(s){ if(!s) return ''; return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

// Hacer funciones accesibles desde HTML
window.editDocument = editDocument;
window.deleteDocument = deleteDocument;
