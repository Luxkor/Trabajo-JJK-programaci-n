'use strict';
/* ══════════════════════════════════════════════════
   JJK BATTLE — CLIENT  v5.2
   MODO ONLINE  (npm start): Socket.io
   MODO OFFLINE (index.html): localStorage + evento 'storage'
      · sessionStorage → identidad fija por ventana (playerIdx)
      · localStorage   → estado compartido entre ventanas
      · 'storage' event → notifica a la OTRA ventana (nunca a la que escribió)
   ══════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════
//  MODO
// ═══════════════════════════════════════════════════
let socket = null;
let MODO_OFFLINE = false;

// ── P2P SUPPORT HELPERS ──
function isLocalLogic() { return MODO_OFFLINE || (typeof connectionMode !== 'undefined' && connectionMode === 'p2p'); }
function syncState(key, valueObj) {
  const strValue = JSON.stringify(valueObj);
  localStorage.setItem(key, strValue);
  if (typeof connectionMode !== 'undefined' && connectionMode === 'p2p') {
    if (networkManager && networkManager.isConnected()) {
      networkManager.send('p2p_storage', { key, newValue: strValue });
    }
  }
}

let eventHandlers = {};
let pendingSocketListeners = [];
let serverBaseUrl = null;
let pendingLobbyAction = null;

function getSocketOptions() {
  return {
    reconnection: true, reconnectionDelay: 1000, reconnectionDelayMax: 5000,
    reconnectionAttempts: 5, transports: ['websocket', 'polling']
  };
}

function makeSocketStub() {
  return {
    on: (ev, fn) => { pendingSocketListeners.push({ ev, fn }); },
    emit: () => { }, off: () => { }, connected: false
  };
}

function attachPendingListeners(sock) {
  pendingSocketListeners.forEach(({ ev, fn }) => sock.on(ev, fn));
}

function normalizeServerUrl(url) {
  if (!url) return '';
  url = url.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = 'http://' + url;
  }
  return url.replace(/\/+$/, '');
}

function createSocket(url) {
  if (typeof io === 'undefined') return null;
  try {
    const sock = url ? io(url, getSocketOptions()) : io(getSocketOptions());
    attachPendingListeners(sock);
    return sock;
  } catch (e) {
    console.error('No se pudo crear socket:', e);
    return null;
  }
}

function connectToServer(url) {
  if (!url) return false;
  url = normalizeServerUrl(url);
  serverBaseUrl = url;
  localStorage.setItem('jjk_server_url', url);
  const sock = createSocket(url);
  if (!sock) return false;
  socket = sock;
  return true;
}

function waitForSocketConnect(sock, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    if (!sock) return reject(new Error('Socket no disponible'));
    if (sock.connected) return resolve();
    let done = false;
    const cleanup = () => {
      if (typeof sock.off === 'function') {
        sock.off('connect', onConnect);
        sock.off('connect_error', onError);
      }
      clearTimeout(timer);
    };
    const finish = (ok, err) => {
      if (done) return;
      done = true;
      cleanup();
      if (ok) resolve();
      else reject(err || new Error('No se pudo conectar'));
    };
    const onConnect = () => finish(true);
    const onError = (err) => finish(false, err || new Error('Error de conexión'));
    const timer = setTimeout(() => finish(false, new Error('Tiempo de conexión agotado')), timeoutMs);
    if (typeof sock.on === 'function') {
      sock.on('connect', onConnect);
      sock.on('connect_error', onError);
    }
    if (typeof sock.connect === 'function') {
      sock.connect();
    }
  });
}

function runPendingLobbyAction() {
  if (!pendingLobbyAction || !socket || !socket.connected) return;
  const action = pendingLobbyAction;
  pendingLobbyAction = null;
  action();
}

async function ensureLobbyConnection(serverInput) {
  if (MODO_OFFLINE) return true;
  if (socket && socket.connected) return true;
  try {
    if (serverInput) {
      if (!connectToServer(serverInput)) return false;
      await waitForSocketConnect(socket);
      return true;
    }
    if (!(window.location.protocol === 'http:' || window.location.protocol === 'https:')) {
      // index.html abierto directamente (file://): usar modo offline localStorage.
      MODO_OFFLINE = true;
      return true;
    }
    const autoSocket = createSocket();
    if (!autoSocket) return false;
    socket = autoSocket;
    MODO_OFFLINE = false;
    await waitForSocketConnect(socket);
    return true;
  } catch (e) {
    console.error('No se pudo conectar automáticamente al servidor:', e);
    return false;
  }
}

function initSocket() {
  socket = makeSocketStub();
  if (typeof io === 'undefined') {
    MODO_OFFLINE = true;
    return;
  }
  const savedUrl = localStorage.getItem('jjk_server_url');
  if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
    socket = createSocket();
  } else {
    // En file:// debe arrancar en offline por defecto.
    // Solo se conectará online si el usuario escribe una IP manualmente.
    MODO_OFFLINE = true;
    return;
  }
  if (socket) {
    MODO_OFFLINE = false;
  } else {
    MODO_OFFLINE = true;
  }
}

function attachDefaultConnectionHandlers() {
  socket.on('connect', () => {
    MODO_OFFLINE = false;
    showToast('Conectado al servidor de juego.', 3000);
  });
  socket.on('connect_error', (e) => {
    console.error('Socket error:', e);
    showToast('No se pudo conectar al servidor. Verifica la URL y el puerto.', 6000);
  });
  socket.on('reconnect_failed', () => {
    showToast('No se pudo reconectar al servidor. Comprueba la red.', 6000);
  });
  socket.on('disconnect', (reason) => {
    if (!MODO_OFFLINE) showToast('Desconectado del servidor. Comprueba la IP y el puerto.', 6000);
    console.warn('Desconectado:', reason);
  });
}

initSocket();
attachDefaultConnectionHandlers();

// ── Indicador de estado de conexión ──────────────────────
function updateConnectionStatus(status) {
  const dot = document.getElementById('conn-status-dot');
  const txt = document.getElementById('conn-status-text');
  if (!dot || !txt) return;
  dot.className = 'conn-dot conn-' + status;
  const labels = { connected: 'Conectado', disconnected: 'Sin conexión', connecting: 'Conectando...' };
  txt.textContent = labels[status] || status;
}

if (socket) {
  socket.on('connect', () => updateConnectionStatus('connected'));
  socket.on('disconnect', () => updateConnectionStatus('disconnected'));
  socket.on('connect_error', () => updateConnectionStatus('disconnected'));
}

// ── Autodetección de servidor cuando el cliente accede por http ──
async function autoDetectServer() {
  if (MODO_OFFLINE) return;
  const proto = window.location.protocol;
  if (proto !== 'http:' && proto !== 'https:') return;
  const host = window.location.host; // incluye puerto
  const serverInput = document.getElementById('input-server');
  if (serverInput && !serverInput.value) {
    // Si el jugador llega por http://IP:3000 el campo se queda vacío (el socket ya apunta al mismo origen)
    serverInput.placeholder = 'Deja vacío — ya estás conectado al servidor';
  }
  updateConnectionStatus(socket && socket.connected ? 'connected' : 'connecting');
}

// ── Estado global ─────────────────────────────────
const state = {
  playerIdx: null,
  roomId: null,
  chars: [null, null],
  playerNames: ['', ''],
  turnoActivo: 0,
  isMyTurn: false,
  dominio: null,
  actionPending: false,
  offlineLog: []
};

// ════════════════════════════════════════════════════
//  CRÍMENES (Tribunal Maldito)
// ════════════════════════════════════════════════════
const CRIMENES = [
  {
    crimen: 'uso no autorizado de técnica maldita en Shibuya',
    defensa: 'La técnica fue activada involuntariamente al contacto con una maldición de grado 2.', gravedad: 1
  },
  {
    crimen: 'exorcismo sin acreditación vigente del Consejo',
    defensa: 'La acreditación estaba en renovación y actué bajo orden verbal de un supervisor.', gravedad: 1
  },
  {
    crimen: 'destrucción de infraestructura del Colegio Técnico de Magia de Tokio',
    defensa: 'El daño fue consecuencia de un ataque no provocado; actué en defensa propia.', gravedad: 1
  },
  {
    crimen: 'colaboración con el Plan de Vuelta de Kenjaku en Shibuya',
    defensa: 'Fui manipulado mediante técnica de sustitución; mis acciones no eran mías.', gravedad: 2
  },
  {
    crimen: 'liberación deliberada del contenedor de Ryomen Sukuna',
    defensa: 'El contenedor fue dañado por una maldición de grado especial, no por acción propia.', gravedad: 2
  },
  {
    crimen: 'traición al Colegio entregando información al Clan Kamo disidente',
    defensa: 'La información fue transmitida bajo coerción mientras mis compañeros estaban retenidos.', gravedad: 2
  },
  {
    crimen: 'masacre del Hospital Eisei bajo control de Sukuna',
    defensa: 'El cuerpo fue tomado por Ryomen Sukuna; no existe intencionalidad de mi parte.', gravedad: 3
  },
  {
    crimen: 'conspiración con Kenjaku para someter a la humanidad mediante Tengen',
    defensa: 'No existe prueba física de mi participación activa; actué sin consentimiento.', gravedad: 3
  },
  {
    crimen: 'apertura del Juego de la Culpa con la muerte de mil hechiceros',
    defensa: 'La acusación carece de testigos vinculantes y toda evidencia fue recogida dentro del Juego.', gravedad: 3
  }
];

function buildOptsOffline(cIdx) {
  const correct = CRIMENES[cIdx].defensa;
  const others = CRIMENES.filter((_, i) => i !== cIdx).map(c => c.defensa)
    .sort(() => Math.random() - 0.5).slice(0, 2);
  const opts = [correct, ...others].sort(() => Math.random() - 0.5);
  return { opts, correctIdx: opts.indexOf(correct) };
}

// ════════════════════════════════════════════════════
//  FONDOS DE DOMINIO
// ════════════════════════════════════════════════════
const DOMAIN_BACKGROUNDS = {
  'vacio-infinito': 'radial-gradient(circle at 50% 50%, #000428 0%, #001a4a 40%, #000010 100%)',
  'santuario-malevolo': 'radial-gradient(circle at 50% 80%, #1a0000 0%, #050000 100%)',
  'idle-death-gamble': 'linear-gradient(135deg, #0a0015 0%, #150a00 100%)',
  'amor-mutuo': 'radial-gradient(ellipse at 50% 50%, #1a0020 0%, #0d0012 70%, #08000a 100%)',
  'autoencarnacion': 'radial-gradient(circle at 50% 50%, #0a0015 0%, #050010 100%)',
  'ataud-montana': 'radial-gradient(circle at 50% 100%, #280800 0%, #0a0300 60%, #050000 100%)',
  'jardin-sombras': 'linear-gradient(135deg, #000a05 0%, #001208 50%, #000a05 100%)',
  'mar-flores': 'radial-gradient(ellipse at 50% 50%, #001e00 0%, #000a00 70%)',
  'tribunal': 'linear-gradient(180deg, #060610 0%, #0a0a1a 50%, #060610 100%)',
  'gran-juego': 'radial-gradient(ellipse at 50% 50%, #1e003c 0%, #050010 70%)',
};

// ════════════════════════════════════════════════════
//  GESTIÓN DE FASES (offline)
// ════════════════════════════════════════════════════
function getPhase() {
  try { const r = localStorage.getItem('jjk_phase_' + state.roomId); return r ? JSON.parse(r) : null; }
  catch (e) { return null; }
}
function setPhase(data) {
  if (!state.roomId) return;
  syncState('jjk_phase_' + state.roomId, data);
}
function clearPhase() {
  if (!state.roomId) return;
  syncState('jjk_phase_' + state.roomId, null);
}

// ════════════════════════════════════════════════════
//  MAHORAGA
// ════════════════════════════════════════════════════
function createMahoraga(playerIdx) {
  return {
    id: 99, nombre: 'Mahoraga', tipo: 'maldicion', hp: 800, maxHp: 800,
    energia: 500, maxEnergia: 500, emoji: '将', color: '#ffaa00',
    gradiente: 'linear-gradient(135deg,#1a0800,#ffaa00)',
    puedeEspeciales: true, puedeCurarse: false,
    tieneHerramienta: false, herramientaConfiscada: false,
    playerIdx, burnout: 0, inmortal: 0, inmovilizado: 0, potenciado: 0,
    causaInmovilizacion: 'técnica enemiga', defendiendo: false,
    dominioActivo: false, espadaVerdugoActiva: false, golpesEspada: 0,
    habilidades: [
      { nombre: 'Golpe Físico', desc: 'Ataque bruto del General Divino', danio: 50, coste: 0, fisico: true },
      { nombre: 'Adaptación', desc: 'El cuerpo se adapta y regenera', danio: 0, coste: 50, fisico: false, efecto: 'regenerar' },
      { nombre: 'Tajo de Exterminio', desc: 'Instakill a Maldiciones (energía positiva)', danio: 150, coste: 100, fisico: true, efecto: 'exterminio' },
      { nombre: 'Ráfaga de Golpes', desc: 'Serie de impactos devastadores', danio: 70, coste: 20, fisico: true },
      { nombre: 'Embestida Pesada', desc: 'Daño puro, difícil de esquivar', danio: 90, coste: 30, fisico: true }
    ]
  };
}

// ════════════════════════════════════════════════════
//  NAOYA ZENIN (MALDICIÓN)
//  Se invoca cuando Naoya muere por golpe físico puro
//  (sin energía maldita en el atacante, sin herramienta)
// ════════════════════════════════════════════════════
function createNaoyaMaldicion(playerIdx) {
  return {
    id: 230, nombre: 'Naoya Zenin (Maldición)', tipo: 'maldicion',
    hp: 550, maxHp: 550, energia: 0, maxEnergia: 0,
    emoji: '怨', color: '#ff44aa',
    gradiente: 'linear-gradient(135deg,#1a0010,#ff44aa)',
    puedeEspeciales: false,  // sin CE → todos los ataques cuestan 0
    puedeCurarse: false, tieneHerramienta: false, herramientaConfiscada: false,
    playerIdx, burnout: 0, inmortal: 0, inmovilizado: 0, potenciado: 0,
    causaInmovilizacion: 'técnica enemiga', defendiendo: false,
    dominioActivo: false, espadaVerdugoActiva: false, golpesEspada: 0,
    // Último golpe recibido — para evitar una doble transformación
    _ultimoGolpeFisicoSinEnergia: false,
    habilidades: [
      { nombre: 'Vórtice Maldito', desc: 'Vórtice de aire corrompido con odio', danio: 95, coste: 0, fisico: true },
      { nombre: 'Torbellino de Odio', desc: 'Espiral de rencor puro, imparable', danio: 115, coste: 0, fisico: true },
      { nombre: 'Barrera Sónica Maldita', desc: 'Inmoviliza al rival 2 turnos', danio: 75, coste: 0, fisico: true, efecto: 'inmovilizar2' },
      { nombre: 'Orgullo del Clan Zenin', desc: '+100 HP y potenciado 2T', danio: 0, coste: 0, fisico: false, efecto: 'orgullo' },
      // Dominio propio de la forma Maldición
      {
        nombre: 'EXPANSIÓN: ESPIRAL DE RENCOR', desc: 'El odio eterno de Naoya envuelve el campo — potencia +2T y 30 dmg pasivo/turno',
        danio: 60, coste: 0, fisico: false, dominio: true, efecto: 'potenciar', efectoDominio: 'santuario-malevolo'
      },
    ]
  };
}
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => { s.classList.remove('active'); s.classList.add('hidden'); });
  const el = document.getElementById(id);
  if (el) { el.classList.remove('hidden'); el.classList.add('active'); }
}
function currentScreen() { const a = document.querySelector('.screen.active'); return a ? a.id : null; }
function showToast(msg, ms = 2500) {
  const t = document.getElementById('toast'); if (!t) return;
  t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.add('hidden'), ms);
}
function escHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function arraysEqual(a, b) { return a && b && a.length === b.length && a.every((v, i) => v === b[i]); }
function genSeq(len) { return Array.from({ length: len }, () => Math.floor(Math.random() * 4) + 1); }

// ════════════════════════════════════════════════════
//  MÚSICA
// ════════════════════════════════════════════════════
const PISTAS = [
  { id: 1, titulo: 'Kaikai Kitan', artista: 'Eve', contexto: 'Opening 1 — T1', icon: '🔥', archivo: 'audio/kaikai-kitan.mp3', ytUrl: 'https://www.youtube.com/watch?v=E8NtYTWPIkM' },
  { id: 2, titulo: 'SPECIALZ', artista: 'King Gnu', contexto: 'Opening Arco Shibuya', icon: '⚡', archivo: 'audio/specialz.mp3', ytUrl: 'https://www.youtube.com/watch?v=R5RG3WzK3lQ' },
  { id: 3, titulo: 'Ao no Sumika', artista: 'T. Kitani', contexto: 'Opening Inventario Oculto', icon: '💫', archivo: 'audio/ao-no-sumika.mp3', ytUrl: 'https://www.youtube.com/watch?v=HtcmPFdLKX0' },
  { id: 4, titulo: 'Lost in Paradise', artista: 'ALI ft. AKLO', contexto: 'Ending 1 — T1', icon: '🌙', archivo: 'audio/lost-in-paradise.mp3', ytUrl: 'https://www.youtube.com/watch?v=9IkehDAMOTQ' },
];
let pistaActiva = null;
const audioPlayer = new Audio(); audioPlayer.loop = true; audioPlayer.volume = 0.7;
function reproducirPista(p) {
  if (!p) return detenerMusica();
  audioPlayer.pause(); audioPlayer.src = p.archivo;
  audioPlayer.play().catch(() => {
    showToast(`⚠️ MP3 no encontrado: ${p.archivo.split('/').pop()}`, 4000);
    setTimeout(() => window.open(p.ytUrl, '_blank'), 1500);
  });
}
function detenerMusica() { audioPlayer.pause(); audioPlayer.src = ''; }

// ════════════════════════════════════════════════════
//  SINCRONIZACIÓN OFFLINE
// ════════════════════════════════════════════════════
function saveBattleToStorage(gameOver = false) {
  if (!state.roomId) return;
  syncState('jjk_battle_' + state.roomId, {
    chars: state.chars, turnoActivo: state.turnoActivo, dominio: state.dominio,
    log: state.offlineLog, playerNames: state.playerNames, gameOver, ts: Date.now()
  });
}

window.addEventListener('storage', function (e) {
  if (!MODO_OFFLINE || !state.roomId) return;
  handleStorageSync(e.key, e.newValue);
});

// Listener para el NetworkManager que actúe igual que el storage event
if (typeof networkManager !== 'undefined') {
  networkManager.on('p2p_storage', (data) => {
    if (connectionMode === 'p2p' && state.roomId) {
      localStorage.setItem(data.key, data.newValue);
      handleStorageSync(data.key, data.newValue);
    }
  });
}

function handleStorageSync(key, newValue) {
  // Sala (join / char select)
  if (key === 'jjk_sala_' + state.roomId && newValue) {
    const sala = JSON.parse(newValue);
    const scr = currentScreen();
    if (scr === 'screen-lobby') {
      if (sala.players[1]?.name && sala.players[1].name !== 'Esperando...') {
        state.playerNames = [sala.players[0].name, sala.players[1].name];
        showToast(`¡${sala.players[1].name} se unió!`);
        showScreen('screen-select'); renderCharacterGridOffline();
      }
      return;
    }
    if (scr === 'screen-select') {
      const ri = 1 - state.playerIdx;
      const rc = sala.players[ri]?.charIdx;
      if (rc != null) _markRivalCard(rc);
      if (sala.players[0]?.charIdx != null && sala.players[1]?.charIdx != null)
        if (state.playerIdx === 0) startBattleOffline(sala);
    }
  }

  // Estado de combate
  if (key === 'jjk_battle_' + state.roomId && newValue) {
    const data = JSON.parse(newValue);
    const scr = currentScreen();
    // Volver a batalla desde cualquier pantalla especial (clash, tribunal, select, lobby)
    if (scr === 'screen-select' || scr === 'screen-lobby' || scr === 'screen-clash' || scr === 'screen-tribunal') showScreen('screen-battle');
    state.chars = data.chars; state.turnoActivo = data.turnoActivo;
    state.dominio = data.dominio; state.offlineLog = data.log;
    if (data.playerNames) state.playerNames = data.playerNames;
    if (data.gameOver) {
      renderBattle(); renderLog(state.offlineLog);
      updateDomainOverlay(null); _showGameOverOffline(); return;
    }
    renderBattle(); renderLog(state.offlineLog); updateDomainOverlay(state.dominio);
    _actualizarPanelOffline();
  }

  // Fase especial
  if (key === 'jjk_phase_' + state.roomId) {
    if (!newValue) return;
    const phase = JSON.parse(newValue);
    handlePhaseEvent(phase);
  }
}

function handlePhaseEvent(phase) {
  switch (phase.type) {
    case 'awaiting_domain_response':
      if (phase.activatorIdx !== state.playerIdx) showDomainResponsePanel(phase);
      else setActionPanelState('waiting', `🌀 El rival considera responder al dominio...`);
      break;
    case 'domain_response':
      if (phase.activatorIdx === state.playerIdx) resolveDomainResponse(phase);
      break;
    case 'clash_active':
      showOfflineClashScreen(phase); break;
    case 'clash_submission':
      if (state.playerIdx === 0) _resolverRondaClash(phase); break;
    case 'tribunal_active':
      if (phase.accusedIdx === state.playerIdx) showOfflineTribunal(phase);
      else showTribunalWaiting('El acusado delibera su defensa...'); break;
    case 'tribunal_appeal_offer':
      if (phase.accusedIdx === state.playerIdx) showOfflineTribunalAppeal(phase);
      else showTribunalWaiting('El acusado decide si apelar...'); break;
    case 'tribunal_response':
      if (phase.activatorIdx === state.playerIdx) resolveOfflineTribunal(phase);
      break;
  }
}

// ════════════════════════════════════════════════════
//  INICIALIZACIÓN DOM
// ════════════════════════════════════════════════════
function initializeUI() {
  const serverInput = document.getElementById('input-server');
  const savedUrl = localStorage.getItem('jjk_server_url');
  if (serverInput && savedUrl) { serverInput.value = savedUrl; }

  // Autodetección de servidor
  autoDetectServer();

  // ── Modal de selección de modo de conexión ──
  let connectionMode = 'socket'; // 'socket' o 'p2p'

  document.getElementById('btn-socket-mode')?.addEventListener('click', () => {
    connectionMode = 'socket';
    document.getElementById('connection-mode-modal').classList.add('hidden');
    showScreen('screen-lobby');
  });

  document.getElementById('btn-p2p-mode')?.addEventListener('click', () => {
    connectionMode = 'p2p';
    document.getElementById('connection-mode-modal').classList.add('hidden');
    showScreen('screen-lobby');
  });

  document.getElementById('btn-jugar')?.addEventListener('click', () => {
    // Mostrar modal de selección de modo de conexión
    document.getElementById('connection-mode-modal').classList.remove('hidden');
  });

  document.getElementById('btn-back-lobby')?.addEventListener('click', () => {
    showScreen('screen-main');
    document.getElementById('room-code-display')?.classList.add('hidden');
    document.getElementById('lobby-error')?.classList.add('hidden');
    connectionMode = 'socket'; // Reset a default
  });

  document.getElementById('btn-create')?.addEventListener('click', async () => {
    const name = document.getElementById('input-name').value.trim();
    const serverInput = document.getElementById('input-server')?.value.trim();
    if (!name) return showToast('Ingresa tu nombre de combatiente.');
    if (!MODO_OFFLINE && (!socket || !socket.connected)) {
      const connected = await ensureLobbyConnection(serverInput);
      if (!connected) {
        return showToast('No se pudo conectar al servidor. Si abres esta URL desde el servidor, deja la IP vacía.', 6000);
      }
    }
    if (MODO_OFFLINE) {
      const code = Math.random().toString(36).substr(2, 5).toUpperCase();
      const sala = { id: code, players: [{ name, charIdx: null }, { name: 'Esperando...', charIdx: null }] };
      localStorage.setItem('jjk_sala_' + code, JSON.stringify(sala));
      sessionStorage.setItem('jjk_offline_player_idx', '0');
      sessionStorage.setItem('jjk_offline_room_id', code);
      state.playerIdx = 0; state.roomId = code; state.playerNames[0] = name;
      document.getElementById('room-code-text').textContent = code;
      document.getElementById('room-code-display').classList.remove('hidden');
      showToast('Sala creada: ' + code + ' — esperando al rival...');
    } else {
      if (!socket || !socket.connected) {
        pendingLobbyAction = () => socket.emit('create_room', { playerName: name, mode: typeof connectionMode !== 'undefined' ? connectionMode : 'socket' });
        return showToast('Conectando al servidor...');
      }
      socket.emit('create_room', { playerName: name, mode: typeof connectionMode !== 'undefined' ? connectionMode : 'socket' });
    }
  });

  document.getElementById('btn-join')?.addEventListener('click', async () => {
    const name = document.getElementById('input-name').value.trim();
    const room = document.getElementById('input-room').value.trim().toUpperCase();
    const serverInput = document.getElementById('input-server')?.value.trim();
    if (!name) return showToast('Ingresa tu nombre.');
    if (!room) return showToast('Ingresa el código de sala.');
    if (!MODO_OFFLINE && (!socket || !socket.connected)) {
      const connected = await ensureLobbyConnection(serverInput);
      if (!connected) {
        return showToast('No se pudo conectar al servidor. Si abres esta URL desde el servidor, deja la IP vacía.', 6000);
      }
    }
    if (MODO_OFFLINE) {
      const raw = localStorage.getItem('jjk_sala_' + room);
      if (!raw) return showToast('Sala no encontrada: ' + room);
      const sala = JSON.parse(raw);
      if (!sala.players[1] || sala.players[1].name !== 'Esperando...') return showToast('Sala llena o no disponible.');
      sala.players[1] = { name, charIdx: null };
      localStorage.setItem('jjk_sala_' + room, JSON.stringify(sala));
      sessionStorage.setItem('jjk_offline_player_idx', '1');
      sessionStorage.setItem('jjk_offline_room_id', room);
      state.playerIdx = 1; state.roomId = room;
      state.playerNames = [sala.players[0].name, name];
      showToast('¡Unido a sala ' + room + '!');
      showScreen('screen-select'); renderCharacterGridOffline();
    } else {
      if (!socket || !socket.connected) {
        pendingLobbyAction = () => socket.emit('join_room', { roomId: room, playerName: name });
        return showToast('Conectando al servidor...');
      }
      socket.emit('join_room', { roomId: room, playerName: name });
    }
  });

  document.getElementById('input-name')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('btn-create')?.click();
  });

  const guard = () => !state.isMyTurn || state.actionPending;
  document.getElementById('btn-habilidades')?.addEventListener('click', () => {
    if (guard()) return;
    document.getElementById('action-menu').classList.add('hidden'); showHabilidades();
  });
  document.getElementById('btn-ataque')?.addEventListener('click', () => { if (guard()) return; sendAction({ type: 'basic' }); });
  document.getElementById('btn-guardia')?.addEventListener('click', () => { if (guard()) return; sendAction({ type: 'defend' }); });
  document.getElementById('btn-recargar')?.addEventListener('click', () => { if (guard()) return; sendAction({ type: 'recargar' }); });
  document.getElementById('btn-curar')?.addEventListener('click', () => { if (guard()) return; sendAction({ type: 'curar' }); });
  document.getElementById('btn-back-hab')?.addEventListener('click', () => setActionPanelState('action'));
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeUI);
else initializeUI();

// ════════════════════════════════════════════════════
//  SOCKET — LOBBY (online)
// ════════════════════════════════════════════════════
socket.on('room_created', ({ roomId, playerIdx }) => {
  state.roomId = roomId; state.playerIdx = playerIdx;
  document.getElementById('room-code-text').textContent = roomId;
  document.getElementById('room-code-display').classList.remove('hidden');
  document.getElementById('lobby-error').classList.add('hidden');
  // Habilitar botón de copiar
  const copyBtn = document.getElementById('btn-copy-code');
  if (copyBtn) {
    copyBtn.classList.remove('hidden');
    copyBtn.onclick = () => {
      navigator.clipboard?.writeText(roomId).then(() => showToast('✅ Código copiado: ' + roomId))
        .catch(() => showToast('Código: ' + roomId + ' — cópialo manualmente'));
    };
  }
  showToast('Sala creada. Comparte el código con el rival.', 4000);
});
socket.on('room_joined', ({ roomId, playerIdx }) => { state.roomId = roomId; state.playerIdx = playerIdx; });
socket.on('player_joined', ({ players }) => {
  state.playerNames = players.map(p => p.name);
  showToast(`¡${players[1].name} se unió! Elige tu personaje.`, 4000);
});

socket.on('p2p_ready', async ({ remoteSocketId }) => {
  if (typeof connectionMode !== 'undefined' && connectionMode === 'p2p') {
    showToast('Estableciendo conexión Peer-to-Peer directa...', 3000);
    try {
      await networkManager.connectViaP2P(remoteSocketId, socket, state.playerIdx === 0);

      if (state.playerIdx === 0) {
        // Host initializes the offline/p2p logic loop
        const sala = {
          id: state.roomId,
          players: [
            { name: state.playerNames[0] || 'Jugador 1', charIdx: null },
            { name: state.playerNames[1] || 'Jugador 2', charIdx: null }
          ]
        };
        // wait slightly to ensure connection channel is fully bound on data events before broadcasting
        setTimeout(() => {
          syncState('jjk_sala_' + state.roomId, sala);
          showScreen('screen-select');
          renderCharacterGridOffline();
        }, 500);
      }
    } catch (e) {
      showToast('Error en la conexión P2P: ' + e.message);
    }
  }
});

socket.on('error', ({ msg }) => {
  const el = document.getElementById('lobby-error'); el.textContent = msg; el.classList.remove('hidden');
});

// ════════════════════════════════════════════════════
//  CATÁLOGO DE PERSONAJES (offline)
// ════════════════════════════════════════════════════
const CHARS_OFFLINE = [
  {
    id: 0, nombre: 'Gojo Satoru', tipo: 'hechicero', hp: 600, energia: 450, emoji: '∞', color: '#00c8ff', gradiente: 'linear-gradient(135deg,#003c6e,#00c8ff)', puedeEspeciales: true,
    habilidades: [{ nombre: 'Azul', desc: 'Atracción gravitacional', danio: 40, coste: 5 }, { nombre: 'Rojo', desc: 'Repulsión amplificada', danio: 60, coste: 5 }, { nombre: 'VACÍO PÚRPURA', desc: 'Borra todo lo que toca', danio: 80, coste: 5 }, { nombre: 'Destello Negro', desc: 'BF garantizado', danio: 100, coste: 5, fisico: true }, { nombre: 'EXPANSIÓN: VACÍO INFINITO', desc: 'Inmoviliza rival 2T', danio: 60, coste: 15, dominio: true, efecto: 'inmovilizar2', efectoDominio: 'vacio-infinito' }]
  },
  {
    id: 1, nombre: 'Sukuna', tipo: 'hechicero', hp: 700, energia: 950, emoji: '呪', color: '#cc2200', gradiente: 'linear-gradient(135deg,#2a0000,#cc2200)', puedeEspeciales: true,
    habilidades: [{ nombre: 'Desmantelar', desc: 'Cortes malditos', danio: 60, coste: 20 }, { nombre: 'Cleave', desc: 'Cortes adaptados', danio: 75, coste: 35 }, { nombre: 'FUGA', desc: 'Flecha mortal', danio: 100, coste: 50 }, { nombre: 'Golpe Físico', desc: 'Velocidad sobrehumana', danio: 80, coste: 35, fisico: true }, { nombre: 'EXPANSIÓN: SANTUARIO MALÉVOLO', desc: '50 dmg pasivo/turno', danio: 80, coste: 120, dominio: true, efectoDominio: 'santuario-malevolo' }]
  },
  {
    id: 2, nombre: 'Itadori Yuji', tipo: 'hechicero', hp: 550, energia: 250, emoji: '拳', color: '#ff7700', gradiente: 'linear-gradient(135deg,#3a1500,#ff7700)', puedeEspeciales: true,
    habilidades: [{ nombre: 'Puño Divergente', desc: 'Retraso maldito', danio: 60, coste: 20, fisico: true }, { nombre: 'Destello Negro', desc: 'BF garantizado', danio: 80, coste: 35, fisico: true }, { nombre: 'Artes Marciales', desc: 'Combo físico', danio: 100, coste: 50, fisico: true }, { nombre: 'Corte de Alma', desc: 'Daña el alma', danio: 120, coste: 65, fisico: true }, { nombre: 'Rencor', desc: 'Frenesí imparable', danio: 140, coste: 100, fisico: true }]
  },
  {
    id: 3, nombre: 'Maki Zenin', tipo: 'hechicero', hp: 650, energia: 0, emoji: '武', color: '#00cc66', gradiente: 'linear-gradient(135deg,#003a1a,#00cc66)', puedeEspeciales: false, tieneHerramienta: true,
    habilidades: [{ nombre: 'Nube Itinerante', desc: 'Bastón maldito', danio: 40, coste: 0, fisico: true }, { nombre: 'Katana Almas', desc: 'Corte de alma', danio: 60, coste: 0, fisico: true }, { nombre: 'Lanza', desc: 'Estocada', danio: 80, coste: 0, fisico: true }, { nombre: 'Ataque Pesado', desc: 'Golpe bruto', danio: 100, coste: 0, fisico: true }, { nombre: 'Masacre', desc: 'Frenesí veloz', danio: 120, coste: 0, fisico: true }]
  },
  {
    id: 4, nombre: 'Toji Fushiguro', tipo: 'hechicero', hp: 650, energia: 0, emoji: '剣', color: '#aaaaaa', gradiente: 'linear-gradient(135deg,#1a1a1a,#aaaaaa)', puedeEspeciales: false, tieneHerramienta: true,
    habilidades: [{ nombre: 'Navaja Invertida', desc: 'Anula técnicas', danio: 40, coste: 0, fisico: true }, { nombre: 'Cadena', desc: 'Largo alcance', danio: 60, coste: 0, fisico: true }, { nombre: 'Espada Alma', desc: 'Corte mortal', danio: 80, coste: 0, fisico: true }, { nombre: 'Pistola', desc: 'A distancia', danio: 100, coste: 0, fisico: true }, { nombre: 'Bendición', desc: 'Punto ciego', danio: 120, coste: 0, fisico: true }]
  },
  {
    id: 5, nombre: 'Yuta Okkotsu', tipo: 'hechicero', hp: 500, energia: 1000, emoji: '愛', color: '#ff88cc', gradiente: 'linear-gradient(135deg,#2a0022,#ff88cc)', puedeEspeciales: true,
    habilidades: [{ nombre: 'Copia: Discurso', desc: 'Habla maldita', danio: 40, coste: 20 }, { nombre: 'Corte con Katana', desc: 'Tajo básico', danio: 60, coste: 35, fisico: true }, { nombre: 'Rika: Ataque Físico', desc: 'Puñetazo de Rika', danio: 80, coste: 50, fisico: true }, { nombre: 'RAYO DE AMOR VERDADERO', desc: 'Haz de Rika', danio: 100, coste: 65 }, { nombre: 'EXPANSIÓN: AMOR MUTUO', desc: 'Potencia 2T', danio: 60, coste: 120, dominio: true, efecto: 'potenciar', efectoDominio: 'amor-mutuo' }]
  },
  {
    id: 6, nombre: 'Kinji Hakari', tipo: 'hechicero', hp: 500, energia: 300, emoji: '♠', color: '#ffcc00', gradiente: 'linear-gradient(135deg,#1a1000,#ffcc00)', puedeEspeciales: true,
    habilidades: [{ nombre: 'Puñetazo Áspero', desc: 'Papel de lija', danio: 40, coste: 20, fisico: true }, { nombre: 'Puerta Tren', desc: 'Aplastamiento', danio: 60, coste: 35 }, { nombre: 'Combo', desc: 'Golpes rítmicos', danio: 80, coste: 50, fisico: true }, { nombre: 'Cabezazo', desc: 'Cráneo', danio: 100, coste: 65, fisico: true }, { nombre: 'EXPANSIÓN: IDLE DEATH GAMBLE', desc: '33%: inmortalidad+CE∞', danio: 0, coste: 120, dominio: true, efecto: 'gamble', efectoDominio: 'idle-death-gamble' }]
  },
  {
    id: 7, nombre: 'Mahito', tipo: 'maldicion', hp: 450, energia: 350, emoji: '魂', color: '#9933ff', gradiente: 'linear-gradient(135deg,#1a0033,#9933ff)', puedeEspeciales: true,
    habilidades: [{ nombre: 'Mutación', desc: 'Altera el alma', danio: 40, coste: 20 }, { nombre: 'Polimorfismo', desc: 'Transfigurados', danio: 60, coste: 35 }, { nombre: 'Isomería', desc: 'Clones', danio: 80, coste: 50 }, { nombre: 'Cuchilla Corporal', desc: 'Brazo cuchilla', danio: 100, coste: 65, fisico: true }, { nombre: 'EXPANSIÓN: AUTOENCARNACIÓN', desc: 'Potencia 2T', danio: 80, coste: 120, dominio: true, efecto: 'potenciar', efectoDominio: 'autoencarnacion' }]
  },
  {
    id: 8, nombre: 'Jogo', tipo: 'maldicion', hp: 380, energia: 450, emoji: '火', color: '#ff4400', gradiente: 'linear-gradient(135deg,#2a0800,#ff4400)', puedeEspeciales: true,
    habilidades: [{ nombre: 'Insectos', desc: 'Explosivos', danio: 40, coste: 20 }, { nombre: 'Vértice', desc: 'Magma', danio: 60, coste: 35 }, { nombre: 'Meteorito', desc: 'Roca en llamas', danio: 80, coste: 50 }, { nombre: 'Palmas Ardientes', desc: 'Fuego directo', danio: 100, coste: 65, fisico: true }, { nombre: 'EXPANSIÓN: ATAÚD DE LA MONTAÑA', desc: 'Potencia 2T', danio: 80, coste: 120, dominio: true, efecto: 'potenciar', efectoDominio: 'ataud-montana' }]
  },
  {
    id: 9, nombre: 'Megumi Fushiguro', tipo: 'hechicero', hp: 420, energia: 350, emoji: '影', color: '#4488ff', gradiente: 'linear-gradient(135deg,#001033,#4488ff)', puedeEspeciales: true,
    habilidades: [{ nombre: 'Perros Divinos', desc: 'Shikigami', danio: 40, coste: 20, fisico: true }, { nombre: 'Nue', desc: 'Descarga', danio: 60, coste: 35 }, { nombre: 'Elefante Máximo', desc: 'Aplastamiento', danio: 80, coste: 50, fisico: true }, { nombre: 'EXPANSIÓN: JARDÍN DE SOMBRAS', desc: 'Dominio sombras', danio: 80, coste: 65, dominio: true, efectoDominio: 'jardin-sombras' }, { nombre: 'MAHORAGA', desc: 'Invoca al General Divino — Megumi abandona', danio: 0, coste: 100 }]
  },
  {
    id: 10, nombre: 'Suguru Geto', tipo: 'hechicero', hp: 500, energia: 500, emoji: '霊', color: '#33aa44', gradiente: 'linear-gradient(135deg,#001a00,#33aa44)', puedeEspeciales: true,
    habilidades: [{ nombre: 'Maldiciones Menores', desc: 'Horda', danio: 40, coste: 20 }, { nombre: 'Calamar', desc: 'Asfixia', danio: 60, coste: 35 }, { nombre: 'Dragón', desc: 'Carga', danio: 80, coste: 50 }, { nombre: 'Artes Marciales', desc: 'Físico', danio: 100, coste: 65, fisico: true }, { nombre: 'UZUMAKI', desc: 'Técnica Máxima', danio: 140, coste: 120 }]
  },
  {
    id: 11, nombre: 'Nanami Kento', tipo: 'hechicero', hp: 480, energia: 250, emoji: '比', color: '#ccaa44', gradiente: 'linear-gradient(135deg,#1a1400,#ccaa44)', puedeEspeciales: true, tieneHerramienta: true,
    habilidades: [{ nombre: 'Ratio 7:3', desc: 'Punto débil', danio: 40, coste: 20, fisico: true }, { nombre: 'Derrumbe', desc: 'Entorno', danio: 60, coste: 35 }, { nombre: 'Golpe Contundente', desc: 'Bruto', danio: 80, coste: 50, fisico: true }, { nombre: 'Tajo', desc: 'Corte', danio: 100, coste: 65, fisico: true }, { nombre: 'Horas Extras', desc: 'Liberación', danio: 140, coste: 120, fisico: true }]
  },
  {
    id: 12, nombre: 'Choso', tipo: 'maldicion', hp: 460, energia: 320, emoji: '血', color: '#cc0033', gradiente: 'linear-gradient(135deg,#1a0000,#cc0033)', puedeEspeciales: true,
    habilidades: [{ nombre: 'Sangre Perforante', desc: 'Rayo sangre', danio: 40, coste: 20 }, { nombre: 'Supernova', desc: 'Metralla', danio: 60, coste: 35 }, { nombre: 'Escala Roja', desc: 'Potencia', danio: 80, coste: 50 }, { nombre: 'Golpe de Ala', desc: 'Cuchilla', danio: 100, coste: 65, fisico: true }, { nombre: 'Manantial', desc: 'Inundación', danio: 140, coste: 120 }]
  },
  {
    id: 13, nombre: 'Aoi Todo', tipo: 'hechicero', hp: 520, energia: 220, emoji: '掌', color: '#ff6600', gradiente: 'linear-gradient(135deg,#1a0a00,#ff6600)', puedeEspeciales: true,
    habilidades: [{ nombre: 'Boogie Woogie', desc: 'Intercambio posicional', danio: 40, coste: 20 }, { nombre: 'Puñetazo', desc: 'Golpe seco', danio: 60, coste: 35, fisico: true }, { nombre: 'Patada', desc: 'Patada voladora', danio: 80, coste: 50, fisico: true }, { nombre: 'Aplauso Sorpresa', desc: 'Desorienta', danio: 100, coste: 65 }, { nombre: 'Destello Negro', desc: 'BF garantizado', danio: 140, coste: 120, fisico: true }]
  },
  {
    id: 14, nombre: 'Nobara Kugisaki', tipo: 'hechicero', hp: 400, energia: 250, emoji: '钉', color: '#ff4488', gradiente: 'linear-gradient(135deg,#1a000a,#ff4488)', puedeEspeciales: true,
    habilidades: [{ nombre: 'Resonancia', desc: 'Vínculo alma', danio: 40, coste: 20 }, { nombre: 'Horquilla', desc: 'Explosión clavo', danio: 60, coste: 35 }, { nombre: 'Martillazo', desc: 'Cargado', danio: 80, coste: 50, fisico: true }, { nombre: 'Lluvia de Clavos', desc: 'Área', danio: 100, coste: 65 }, { nombre: 'Clavo Físico', desc: 'Estocada', danio: 140, coste: 120, fisico: true }]
  },
  {
    id: 15, nombre: 'Hanami', tipo: 'maldicion', hp: 550, energia: 300, emoji: '花', color: '#44cc44', gradiente: 'linear-gradient(135deg,#001a00,#44cc44)', puedeEspeciales: true,
    habilidades: [{ nombre: 'Raíces', desc: 'Empalamiento', danio: 40, coste: 20 }, { nombre: 'Semillas', desc: 'Drenaje', danio: 60, coste: 35 }, { nombre: 'Rayo Solar', desc: 'Haz luz', danio: 80, coste: 50 }, { nombre: 'Golpe de Madera', desc: 'Impacto', danio: 100, coste: 65, fisico: true }, { nombre: 'EXPANSIÓN: MAR DE FLORES', desc: 'Drena vida en área', danio: 80, coste: 120, dominio: true, efectoDominio: 'mar-flores' }]
  },
  {
    id: 16, nombre: 'Hajime Kashimo', tipo: 'hechicero', hp: 490, energia: 400, emoji: '雷', color: '#ffdd00', gradiente: 'linear-gradient(135deg,#1a1500,#ffdd00)', puedeEspeciales: true,
    habilidades: [{ nombre: 'Descarga', desc: 'Rayo', danio: 40, coste: 20 }, { nombre: 'Báculo Físico', desc: 'Conductor', danio: 60, coste: 35, fisico: true }, { nombre: 'Electrólisis', desc: 'Vapor', danio: 80, coste: 50 }, { nombre: 'Patada Magnética', desc: 'Magnético', danio: 100, coste: 65, fisico: true }, { nombre: 'ÁMBAR MÍTICO', desc: 'Forma final', danio: 160, coste: 120, fisico: true }]
  },
  {
    id: 17, nombre: 'Mei Mei', tipo: 'hechicero', hp: 450, energia: 250, emoji: '鸦', color: '#aa88ff', gradiente: 'linear-gradient(135deg,#0a0022,#aa88ff)', puedeEspeciales: true, tieneHerramienta: true,
    habilidades: [{ nombre: 'Corte Hacha', desc: 'Tajo', danio: 40, coste: 20, fisico: true }, { nombre: 'Bird Strike', desc: 'Cuervo suicida', danio: 60, coste: 35 }, { nombre: 'Patada', desc: 'Golpe', danio: 80, coste: 50, fisico: true }, { nombre: 'Golpe de Mango', desc: 'Contundente', danio: 100, coste: 65, fisico: true }, { nombre: 'Ataque Rápido', desc: 'Veloz', danio: 140, coste: 120, fisico: true }]
  },
  {
    id: 18, nombre: 'Inumaki Toge', tipo: 'hechicero', hp: 360, energia: 300, emoji: '言', color: '#88ccff', gradiente: 'linear-gradient(135deg,#001522,#88ccff)', puedeEspeciales: true,
    habilidades: [{ nombre: '¡Explota!', desc: 'Comando explosión', danio: 40, coste: 20 }, { nombre: '¡Aplastate!', desc: 'Presión', danio: 60, coste: 35 }, { nombre: 'Grito Sónico', desc: 'Onda choque', danio: 80, coste: 50 }, { nombre: 'Golpe Leve', desc: 'Físico básico', danio: 100, coste: 65, fisico: true }, { nombre: 'Sentencia Final', desc: 'Daño extremo + autolesión 20%', danio: 140, coste: 120, efecto: 'autolesion' }]
  },
  {
    id: 19, nombre: 'Panda', tipo: 'hechicero', hp: 550, energia: 200, emoji: '熊', color: '#cccccc', gradiente: 'linear-gradient(135deg,#111111,#888888)', puedeEspeciales: true,
    habilidades: [{ nombre: 'Núcleo Gorila', desc: 'Fuerza', danio: 40, coste: 20, fisico: true }, { nombre: 'Cañón Tambor', desc: 'Daño interno', danio: 60, coste: 35 }, { nombre: 'Núcleo Rhino', desc: 'Embestida', danio: 80, coste: 50, fisico: true }, { nombre: 'Zarpazo', desc: 'Físico', danio: 100, coste: 65, fisico: true }, { nombre: 'Trío de Golpes', desc: 'Combo final', danio: 140, coste: 120, fisico: true }]
  },
  {
    id: 20, nombre: 'Hiromi Higuruma', tipo: 'hechicero', hp: 470, energia: 380, emoji: '⚖', color: '#8888cc', gradiente: 'linear-gradient(135deg,#0a0a22,#8888cc)', puedeEspeciales: true,
    habilidades: [{ nombre: 'Golpe de Mazo', desc: 'Físico Judgeman', danio: 55, coste: 20, fisico: true }, { nombre: 'Confiscación', desc: 'Debilita rival 2T', danio: 40, coste: 35, efecto: 'debilitar' }, { nombre: 'Testigo de Cargo', desc: 'Evidencia maldita', danio: 75, coste: 50 }, { nombre: 'VEREDICTO: CULPABLE', desc: 'Daño + inmov 1T', danio: 100, coste: 80, efecto: 'inmovilizar1' }, { nombre: 'EXPANSIÓN: TRIBUNAL MALDITO', desc: 'Juicio de Judgeman', danio: 0, coste: 120, dominio: true, efecto: 'tribunal', efectoDominio: 'tribunal' }]
  },
  {
    id: 21, nombre: 'Angel (Hana Kurusu)', tipo: 'hechicero', hp: 440, energia: 420, emoji: '✝', color: '#ffeecc', gradiente: 'linear-gradient(135deg,#1a1533,#ffeecc)', puedeEspeciales: true,
    habilidades: [{ nombre: 'Tajo Celestial', desc: 'Ignora defensa', danio: 60, coste: 25, fisico: true }, { nombre: 'Purificación', desc: 'Elimina efectos +80HP', danio: 0, coste: 40, efecto: 'purificar' }, { nombre: 'Lluvia de Plumas', desc: 'Ráfaga angélica', danio: 75, coste: 55 }, { nombre: 'JACOB: ANIQUILACIÓN', desc: 'Daño doble a maldiciones', danio: 110, coste: 85, fisico: true, efecto: 'jacob' }, { nombre: 'ESCALERA DE JACOB', desc: 'Atraviesa toda defensa', danio: 180, coste: 130, fisico: true }]
  },
  {
    id: 22, nombre: 'Kenjaku', tipo: 'hechicero', hp: 580, energia: 550, emoji: '脳', color: '#cc44ff', gradiente: 'linear-gradient(135deg,#110022,#cc44ff)', puedeEspeciales: true,
    habilidades: [{ nombre: 'Manipulación de Maldiciones', desc: 'Horda robada', danio: 65, coste: 25 }, { nombre: 'Técnica Robada: Ultravioleta', desc: 'Rayo copiado', danio: 90, coste: 45 }, { nombre: 'Barrera Anti-Hechicero', desc: 'Suprime CE rival 2T', danio: 30, coste: 60, efecto: 'suprimir' }, { nombre: 'UZUMAKI MODIFICADO', desc: 'Combinación', danio: 130, coste: 90 }, { nombre: 'EXPANSIÓN: GRAN JUEGO', desc: 'Inmov 2T + drena CE', danio: 60, coste: 130, dominio: true, efecto: 'gran-juego', efectoDominio: 'gran-juego' }]
  },
  {
    id: 23, nombre: 'Naoya Zenin', tipo: 'hechicero', hp: 460, energia: 300, emoji: '風', color: '#aaffee', gradiente: 'linear-gradient(135deg,#001a15,#aaffee)', puedeEspeciales: true,
    habilidades: [{ nombre: 'Vórtice', desc: 'Espiral aire', danio: 65, coste: 20, fisico: true }, { nombre: 'Ventilación: Ráfaga', desc: 'Múltiples impactos', danio: 80, coste: 35, fisico: true }, { nombre: 'Barrera de Sonido', desc: 'Inmov rival 1T', danio: 55, coste: 50, fisico: true, efecto: 'inmovilizar1' }, { nombre: 'Ventilación: Espiral Letal', desc: 'Desgarra', danio: 120, coste: 75, fisico: true }, { nombre: 'Torrente: Última Velocidad', desc: 'Potencia +1T', danio: 140, coste: 100, fisico: true, efecto: 'potenciar' }]
  },
  {
    id: 24, nombre: 'Yuki Tsukumo', tipo: 'hechicero', hp: 530, energia: 380, emoji: '重', color: '#aa66ff', gradiente: 'linear-gradient(135deg,#0a0022,#aa66ff)', puedeEspeciales: true,
    habilidades: [{ nombre: 'Puñetazo de Masa Virtual', desc: 'Peso aplastante', danio: 70, coste: 20, fisico: true }, { nombre: 'Garuda: Embestida', desc: 'Masa virtual', danio: 90, coste: 40 }, { nombre: 'Masa Virtual: Escudo', desc: 'Defensa + contragolpe 40', danio: 40, coste: 55, efecto: 'escudo-masa' }, { nombre: 'Garuda: Impacto Gravitacional', desc: 'Deforma espacio', danio: 115, coste: 80, fisico: true }, { nombre: 'MASA VIRTUAL: COLAPSO ESTELAR', desc: 'Singularidad', danio: 170, coste: 125, fisico: true }]
  },
];

socket.on('phase_change', ({ fase, characters }) => {
  if (fase !== 'character_select') return;
  showScreen('screen-select'); renderCharacterGrid(characters);
  document.getElementById('select-status').textContent = 'Elige tu personaje.';
});

function renderCharacterGrid(chars) {
  const hG = document.getElementById('hechiceros-grid'), mG = document.getElementById('maldiciones-grid');
  if (!hG || !mG) { const g = document.getElementById('characters-grid'); if (g) { g.innerHTML = ''; chars.forEach(c => addCharCard(c, g)); } return; }
  hG.innerHTML = ''; mG.innerHTML = '';
  chars.filter(c => c.tipo === 'hechicero').forEach(c => addCharCard(c, hG));
  chars.filter(c => c.tipo === 'maldicion').forEach(c => addCharCard(c, mG));
}
function renderCharacterGridOffline() { renderCharacterGrid(CHARS_OFFLINE); }

function addCharCard(c, grid) {
  const card = document.createElement('div'); card.className = 'char-card'; card.dataset.id = c.id;
  card.innerHTML = `<div class="card-bg" style="background:${c.gradiente}"></div><div class="card-overlay"></div><div class="card-tipo ${c.tipo}">${c.tipo === 'maldicion' ? 'Maldición' : 'Hechicero'}</div><div class="card-emoji">${c.emoji}</div><div class="card-name">${c.nombre}</div>`;
  card.addEventListener('click', () => onCharClick(c, card));
  card.addEventListener('mouseenter', () => showPreview(c));
  grid.appendChild(card);
}

function _markRivalCard(charId) {
  const card = document.querySelector(`.char-card[data-id="${charId}"]`);
  if (!card || card.querySelector('.card-selected-badge[data-rival]')) return;
  card.classList.add('selected-other');
  const b = document.createElement('div'); b.className = 'card-selected-badge'; b.dataset.rival = 'true';
  b.textContent = 'RIVAL'; b.style.color = '#cc2200'; card.appendChild(b);
}

function onCharClick(c, card) {
  if (card.classList.contains('selected-other') || card.classList.contains('disabled')) return;
  document.querySelectorAll('.char-card.selected-you').forEach(el => { el.classList.remove('selected-you'); el.querySelector('.card-selected-badge:not([data-rival])')?.remove(); });
  card.classList.add('selected-you');
  const b = document.createElement('div'); b.className = 'card-selected-badge'; b.textContent = 'TÚ'; b.style.color = '#e8b84b'; card.appendChild(b);
  if (isLocalLogic()) {
    const sala = JSON.parse(localStorage.getItem('jjk_sala_' + state.roomId) || '{}');
    if (sala.players) {
      sala.players[state.playerIdx].charIdx = c.id;
      syncState('jjk_sala_' + state.roomId, sala);
      const rivalReady = sala.players[1 - state.playerIdx]?.charIdx != null;
      document.getElementById('select-status').textContent = rivalReady ? '¡Ambos listos! Iniciando...' : `Seleccionaste: ${c.nombre} — esperando al rival...`;
      if (state.playerIdx === 0 && rivalReady) startBattleOffline(sala);
    }
  } else {
    socket.emit('select_character', { charIdx: c.id });
    document.getElementById('select-status').textContent = `Seleccionaste: ${c.nombre} — esperando al rival...`;
  }
}
socket.on('character_selected', ({ playerIdx, charIdx }) => { if (playerIdx === state.playerIdx) return; _markRivalCard(charIdx); });

function showPreview(c) {
  const habs = c.habilidades || [];
  document.getElementById('select-preview').innerHTML = `<div class="preview-content"><div class="preview-char"><div class="preview-emoji" style="text-shadow:0 0 15px ${c.color}">${c.emoji}</div><div class="preview-info"><h3>${c.nombre}</h3><div class="preview-type">${c.tipo === 'maldicion' ? 'Maldición' : 'Hechicero'} · HP ${c.hp} · CE ${c.energia}</div></div></div><div class="preview-habs">${habs.map(h => `<div class="hab-tag${h.dominio ? ' dominio' : ''}">${h.nombre}</div>`).join('')}</div></div>`;
}

// ════════════════════════════════════════════════════
//  INICIO DE COMBATE (offline)
// ════════════════════════════════════════════════════
function startBattleOffline(salaData) {
  const c0 = CHARS_OFFLINE.find(c => c.id === salaData.players[0].charIdx);
  const c1 = CHARS_OFFLINE.find(c => c.id === salaData.players[1].charIdx);
  if (!c0 || !c1) return showToast('Error cargando personajes');

  const curanderos = ['Gojo Satoru', 'Sukuna', 'Yuta Okkotsu', 'Maki Zenin', 'Toji Fushiguro'];
  const mk = (def, idx) => ({
    ...def, hp: def.hp, maxHp: def.hp, energia: def.energia, maxEnergia: def.energia,
    playerIdx: idx, burnout: 0, inmortal: 0, inmovilizado: 0, potenciado: 0,
    causaInmovilizacion: 'técnica enemiga', defendiendo: false, dominioActivo: false,
    espadaVerdugoActiva: false, golpesEspada: 0, herramientaConfiscada: false,
    puedeEspeciales: def.puedeEspeciales !== false && (def.energia > 0 || def.nombre === 'Gojo Satoru'),
    puedeCurarse: curanderos.includes(def.nombre),
  });

  state.chars = [mk(c0, 0), mk(c1, 1)];
  state.playerNames = [salaData.players[0].name, salaData.players[1].name];
  state.turnoActivo = 0;
  // state.playerIdx ya está fijo — NO se sobreescribe aquí
  state.dominio = null;
  state.offlineLog = [{ msg: '⚔️ ¡EL COMBATE COMIENZA!' }, { msg: `${state.chars[0].nombre} VS ${state.chars[1].nombre}` }];

  saveBattleToStorage();
  showScreen('screen-battle'); renderBattle(); renderLog(state.offlineLog);
  updateDomainOverlay(null); _actualizarPanelOffline();
}

// ════════════════════════════════════════════════════
//  GESTIÓN DE PANEL
// ════════════════════════════════════════════════════
function _actualizarPanelOffline() {
  state.isMyTurn = (state.turnoActivo === state.playerIdx);
  state.actionPending = false;
  if (state.isMyTurn) {
    const me = state.chars[state.playerIdx];
    if (me) {
      document.getElementById('btn-recargar').style.display = me.puedeEspeciales ? '' : 'none';
      const cur = ['Gojo Satoru', 'Sukuna', 'Yuta Okkotsu', 'Maki Zenin', 'Toji Fushiguro'];
      document.getElementById('btn-curar').style.display = cur.includes(me.nombre) ? '' : 'none';
    }
    setActionPanelState('action');
  } else {
    setActionPanelState('waiting', `Turno de ${state.chars[state.turnoActivo]?.nombre || 'rival'}...`);
  }
}

function _showGameOverOffline() {
  const c0 = state.chars[0], c1 = state.chars[1];
  const wIdx = (c0 && c0.hp > 0) ? 0 : 1;
  showScreen('screen-gameover'); updateDomainOverlay(null);
  const esVic = wIdx === state.playerIdx;
  document.getElementById('winner-title').textContent = esVic ? '¡VICTORIA!' : 'DERROTA';
  document.getElementById('winner-title').style.color = esVic ? '#e8b84b' : '#cc2200';
  document.getElementById('winner-char').textContent = state.chars[wIdx]?.nombre || '';
  document.getElementById('winner-player').textContent = state.playerNames[wIdx] || '';
  document.getElementById('gameover-log').innerHTML = state.offlineLog.slice(0, 15).map(e => `<div>${escHtml(e.msg || '')}</div>`).join('');
}

// ════════════════════════════════════════════════════
//  MOTOR DE COMBATE (offline)
// ════════════════════════════════════════════════════
function offlineLog(msg) { state.offlineLog = [{ msg }, ...state.offlineLog].slice(0, 40); }

function offlineDmg(atacante, hab) {
  let d = hab ? (hab.danio || 30) : 30;
  if (atacante.potenciado > 0) d = Math.floor(d * 1.5);
  else if (atacante.potenciado < 0) d = Math.floor(d * 0.6);
  if (atacante.dominioActivo) d = Math.floor(d * 1.3);
  const isFisico = hab ? !!hab.fisico : true;
  let bf = false;
  if (isFisico && atacante.puedeEspeciales)
    bf = (hab?.nombre?.includes('Destello Negro')) || Math.random() < 0.05;
  if (bf) { d = Math.floor(d * 2.5); offlineLog('💥 ¡DESTELLO NEGRO!'); }
  return d;
}

function offlineApply(defensor, dmg, atacante) {
  // Dentro de un dominio el golpe es garantizado (salvo Maki/Toji)
  const esMakiToji = defensor.nombre === 'Maki Zenin' || defensor.nombre === 'Toji Fushiguro';
  if (!state.dominio && !esMakiToji && Math.random() < 0.15) { offlineLog(`💨 ¡${defensor.nombre} esquivó el ataque!`); return; }
  if (state.dominio && !esMakiToji) offlineLog(`🎯 Golpe garantizado por el Dominio.`);
  const d = defensor.defendiendo ? Math.floor(dmg / 2) : dmg;
  if (defensor.defendiendo) offlineLog(`🛡️ ${defensor.nombre} reduce el daño a la mitad.`);
  defensor.hp = Math.max(0, defensor.hp - d);
  offlineLog(`${defensor.nombre} recibe ${d} de daño. (HP: ${defensor.hp}/${defensor.maxHp})`);
  // Guardar si el último golpe fue físico puro (sin CE ni herramienta)
  // Necesario para la transformación de Naoya
  if (atacante) {
    const sinEnergia = !atacante.tieneHerramienta && atacante.energia === 0 ||
      !atacante.tieneHerramienta && (atacante._lastHabCoste === 0);
    defensor._ultimoGolpeFisicoSinEnergia = sinEnergia;
  }
}

function processOfflineAction(type, habIdx) {
  const atIdx = state.turnoActivo, defIdx = 1 - atIdx;
  const at = state.chars[atIdx], def = state.chars[defIdx];

  at.defendiendo = false;
  if (at.burnout > 0) at.burnout--;
  if (at.potenciado > 0) at.potenciado--;
  else if (at.potenciado < 0) at.potenciado++;

  if (at.inmovilizado > 0) {
    at.inmovilizado--;
    offlineLog(`⛓ ${at.nombre} está inmovilizado — turno saltado.`);
    tickOfflineDominio(); finishOfflineTurn(); return;
  }

  if (type === 'basic') {
    offlineLog(`${at.nombre} lanza un Ataque Físico.`);
    at._lastHabCoste = 0;  // coste 0 → golpe físico puro
    offlineApply(def, offlineDmg(at, null), at);
  } else if (type === 'defend') {
    at.defendiendo = true; offlineLog(`🛡️ ${at.nombre} se pone en guardia.`);
  } else if (type === 'recargar') {
    at.energia = Math.min(at.maxEnergia, at.energia + 80);
    offlineLog(`⚡ ${at.nombre} recarga 80 CE. (CE: ${at.energia}/${at.maxEnergia})`);
  } else if (type === 'curar') {
    const esFisico = at.nombre === 'Maki Zenin' || at.nombre === 'Toji Fushiguro';
    const cost = at.nombre === 'Gojo Satoru' ? 5 : esFisico ? 0 : 50;
    const amount = esFisico ? 150 : 250;
    if (!esFisico && at.energia < cost) { offlineLog(`⚠️ CE insuficiente para curarse.`); _actualizarPanelOffline(); return; }
    at.energia -= cost; at.hp = Math.min(at.maxHp, at.hp + amount);
    offlineLog(`💚 ${at.nombre} se cura +${amount} HP. (HP: ${at.hp}/${at.maxHp})`);

  } else if (type === 'habilidad' && habIdx !== undefined) {
    const hab = at.habilidades[habIdx];
    if (!hab) { _actualizarPanelOffline(); return; }
    if (at.burnout > 0 && habIdx > 0) { offlineLog(`🔥 BURNOUT — solo habilidad 0.`); _actualizarPanelOffline(); return; }
    if (at.energia < (hab.coste || 0)) { offlineLog(`⚠️ CE insuficiente (necesita ${hab.coste}, tiene ${at.energia}).`); _actualizarPanelOffline(); return; }

    // MAHORAGA: invocación especial
    if (hab.nombre === 'MAHORAGA') {
      at.energia -= (hab.coste || 0);
      offlineLog(`🐉 ¡${at.nombre} invoca a Mahoraga! Megumi abandona el combate.`);
      offlineLog(`⚠️ El General Divino emerge — 800 HP, instakill a maldiciones.`);
      state.chars[atIdx] = createMahoraga(atIdx);
      tickOfflineDominio(); finishOfflineTurn(); return;
    }

    at.energia -= (hab.coste || 0);
    at._lastHabCoste = (hab.coste || 0);  // para detectar golpe físico puro en transformación Naoya
    offlineLog(`✨ ${at.nombre} usa: ${hab.nombre}`);

    // Efectos que finalizan turno inmediatamente
    if (hab.efecto === 'regenerar') {
      at.hp = Math.min(at.maxHp, at.hp + 80);
      offlineLog(`💚 ${at.nombre} se adapta: +80 HP. (HP: ${at.hp}/${at.maxHp})`);
      tickOfflineDominio(); finishOfflineTurn(); return;
    }
    if (hab.efecto === 'exterminio') {
      if (def.tipo === 'maldicion') {
        offlineLog(`✨ ¡Tajo de Exterminio! ${def.nombre} es purificado al instante.`);
        def.hp = 0;
      } else {
        offlineLog(`⚔️ Tajo de Exterminio — sin bonus extra contra hechiceros.`);
        offlineApply(def, offlineDmg(at, hab), at);
      }
      tickOfflineDominio(); finishOfflineTurn(); return;
    }
    if (hab.efecto === 'purificar') {
      at.burnout = 0; at.inmovilizado = 0; at.hp = Math.min(at.maxHp, at.hp + 80);
      offlineLog(`✝️ Purificación: efectos negativos eliminados +80 HP.`);
      tickOfflineDominio(); finishOfflineTurn(); return;
    }
    if (hab.efecto === 'jacob') {
      if (def.tipo === 'maldicion') {
        const d2 = (hab.danio || 0) * 2; def.hp = Math.max(0, def.hp - d2);
        offlineLog(`✝️ JACOB: ANIQUILACIÓN — daño doble! ${def.nombre} recibe ${d2} dmg.`);
      } else {
        offlineLog(`✝️ JACOB — sin bonus extra contra hechiceros. Daño normal.`);
        offlineApply(def, offlineDmg(at, hab), at);
      }
      tickOfflineDominio(); finishOfflineTurn(); return;
    }
    if (hab.efecto === 'escudo-masa') {
      at.defendiendo = true; def.hp = Math.max(0, def.hp - 40);
      offlineLog(`⚫ Masa Virtual: Escudo + contraataque 40 dmg.`);
    }

    // Efectos de estado
    if (hab.efecto === 'potenciar') { at.potenciado = 2; offlineLog(`🔥 ${at.nombre} se potencia 2 turnos.`); }
    if (hab.efecto === 'debilitar') { def.potenciado = Math.max(def.potenciado - 1, -2); offlineLog(`📜 ${def.nombre} debilitado.`); }
    if (hab.efecto === 'suprimir') { def.potenciado = Math.max(def.potenciado - 2, -2); def.energia = 0; offlineLog(`🔮 ${def.nombre} suprimido y sin CE.`); }
    if (hab.efecto === 'inmovilizar1') { def.inmovilizado = 1; def.causaInmovilizacion = hab.nombre; offlineLog(`⛓ ${def.nombre} inmovilizado 1T.`); }
    if (hab.efecto === 'inmovilizar2') { def.inmovilizado = 2; def.causaInmovilizacion = hab.nombre; offlineLog(`⛓ ${def.nombre} inmovilizado 2T.`); }
    if (hab.efecto === 'autolesion') { const sl = Math.floor((hab.danio || 0) * 0.2); at.hp = Math.max(0, at.hp - sl); offlineLog(`🩸 ${at.nombre} sufre ${sl} de retroceso.`); }
    if (hab.efecto === 'gran-juego') { def.inmovilizado = 2; def.energia = 0; offlineLog(`🌀 Gran Juego: ${def.nombre} inmovilizado 2T y sin CE.`); }
    // Naoya Maldición — Orgullo del Clan Zenin
    if (hab.efecto === 'orgullo') {
      at.potenciado = 2; at.hp = Math.min(at.maxHp, at.hp + 100);
      offlineLog(`💀 ¡Orgullo del Clan Zenin! ${at.nombre} +100 HP y potenciado 2T.`);
    }

    // DOMINIO: abrir flujo de respuesta
    if (hab.dominio) {
      if (state.dominio?.ownerIdx === atIdx) { offlineLog(`⚠️ Ya tienes un dominio activo.`); tickOfflineDominio(); finishOfflineTurn(); return; }
      // Calcular si el defensor puede responder con dominio
      const defDomains = def.habilidades.map((h, i) => ({ ...h, idx: i }))
        .filter(h => h.dominio && def.energia >= (h.coste || 0) && !def.burnout && def.hp > 0);
      if (!defDomains.length) {
        offlineLog(`🌀 ${def.nombre} no puede responder al dominio.`);
        _aplicarActivacionDominio(atIdx, hab, at, def);
        _despuesDominioActivado(atIdx, hab);
        return;
      }
      // Hay respuesta posible → fase de espera
      _iniciarRespuestaDominio(atIdx, hab, defDomains);
      return;
    }

    // Daño normal
    if ((hab.danio || 0) > 0) offlineApply(def, offlineDmg(at, hab), at);
  }

  tickOfflineDominio();
  finishOfflineTurn();
}

// ════════════════════════════════════════════════════
//  FLUJO DE RESPUESTA AL DOMINIO
// ════════════════════════════════════════════════════
function _iniciarRespuestaDominio(atIdx, hab, defDomains) {
  const at = state.chars[atIdx];
  setPhase({
    type: 'awaiting_domain_response',
    activatorIdx: atIdx,
    activatorName: at.nombre,
    domainName: hab.nombre,
    efectoDominio: hab.efectoDominio || '',
    activatorHabIdx: at.habilidades.findIndex(h => h.nombre === hab.nombre),
    defenderDomains: defDomains.map(h => ({ nombre: h.nombre, coste: h.coste, idx: h.idx, efectoDominio: h.efectoDominio || '', efecto: h.efecto || '' })),
  });
  setActionPanelState('waiting', `🌀 El rival considera responder al dominio...`);
}

// Llega al DEFENSOR por storage event
function showDomainResponsePanel(phase) {
  if (currentScreen() !== 'screen-battle') return;
  const actionPanel = document.getElementById('action-panel');
  document.getElementById('waiting-msg').classList.add('hidden');
  document.getElementById('action-menu').classList.add('hidden');
  document.getElementById('habilidades-menu').classList.add('hidden');

  let panel = document.getElementById('domain-response-panel');
  if (!panel) {
    panel = document.createElement('div'); panel.id = 'domain-response-panel';
    panel.style.cssText = 'width:100%;display:flex;flex-direction:column;gap:0.4rem;padding:0.25rem 0;';
    actionPanel.appendChild(panel);
  }
  panel.classList.remove('hidden');
  panel.innerHTML = `
    <div style="text-align:center;color:#cc44ff;font-weight:700;font-size:0.9rem;margin-bottom:0.25rem;">
      🌀 ¡<strong>${escHtml(phase.activatorName)}</strong> expande: <em>${escHtml(phase.domainName)}</em>
    </div>
    <div style="font-size:0.75rem;color:var(--text-dim);text-align:center;margin-bottom:0.3rem;">
      ¿Respondes con tu propio Dominio Maldito?
    </div>
    <div id="domain-resp-opts"></div>`;

  const opts = document.getElementById('domain-resp-opts');
  phase.defenderDomains.forEach(dh => {
    const btn = document.createElement('div'); btn.className = 'hab-item dominio'; btn.style.cursor = 'pointer';
    btn.innerHTML = `<div><div class="hab-item-name">🌀 ${escHtml(dh.nombre)}</div><div class="hab-item-desc">Responder con este dominio</div></div><div class="hab-item-right"><div class="hab-item-cost">⚡ ${dh.coste}</div></div>`;
    btn.addEventListener('click', () => _submitDomainResponse(phase, dh.idx));
    opts.appendChild(btn);
  });

  const passBtn = document.createElement('div'); passBtn.className = 'hab-item'; passBtn.style.cursor = 'pointer';
  passBtn.innerHTML = `<div><div class="hab-item-name">🏳 No responder</div><div class="hab-item-desc">El dominio rival se expande sin oposición</div></div>`;
  passBtn.addEventListener('click', () => _submitDomainResponse(phase, null));
  opts.appendChild(passBtn);
}

function _hideDomainResponsePanel() {
  const p = document.getElementById('domain-response-panel');
  if (p) p.classList.add('hidden');
}

function _submitDomainResponse(phase, defHabIdx) {
  _hideDomainResponsePanel();
  const defIdx = 1 - phase.activatorIdx;
  const def = state.chars[defIdx];
  if (defHabIdx !== null) {
    const defHab = def.habilidades[defHabIdx];
    def.energia -= (defHab.coste || 0);
    offlineLog(`✨ ${def.nombre} responde con: ${defHab.nombre}`);
  } else {
    offlineLog(`🏳 ${def.nombre} no responde al dominio.`);
    setActionPanelState('waiting', 'Procesando resultado...');
  }
  setPhase({
    type: 'domain_response',
    activatorIdx: phase.activatorIdx,
    activatorHabIdx: phase.activatorHabIdx,
    defHabIdx
  });
}

// Llega al ACTIVADOR por storage event
function resolveDomainResponse(phase) {
  const atIdx = phase.activatorIdx, defIdx = 1 - atIdx;
  const at = state.chars[atIdx], def = state.chars[defIdx];
  const atHab = at.habilidades[phase.activatorHabIdx];
  clearPhase();
  if (phase.defHabIdx === null) {
    offlineLog(`🌀 ¡${at.nombre} establece su dominio sin oposición!`);
    _aplicarActivacionDominio(atIdx, atHab, at, def);
    _despuesDominioActivado(atIdx, atHab);
  } else {
    const defHab = def.habilidades[phase.defHabIdx];
    offlineLog(`💥 ¡¡CHOQUE DE DOMINIOS!! ${at.nombre} VS ${def.nombre}`);
    _iniciarClashOffline(atIdx, atHab, defIdx, defHab);
  }
}

// ════════════════════════════════════════════════════
//  MINIJUEGO DE CHOQUE (offline)
// ════════════════════════════════════════════════════
function _iniciarClashOffline(atIdx, atHab, defIdx, defHab) {
  const atPrio = (state.chars[atIdx].nombre === 'Sukuna' || state.chars[atIdx].nombre === 'Kenjaku') ? 1 : 0;
  const defPrio = (state.chars[defIdx].nombre === 'Sukuna' || state.chars[defIdx].nombre === 'Kenjaku') ? 1 : 0;
  setPhase({
    type: 'clash_active',
    atIdx, atHab, defIdx, defHab,
    round: 1, maxRounds: 3,
    sequences: { [atIdx]: [genSeq(4), genSeq(5), genSeq(6)], [defIdx]: [genSeq(4), genSeq(5), genSeq(6)] },
    scores: { [atIdx]: atPrio, [defIdx]: defPrio },
    submissions: { [atIdx]: null, [defIdx]: null }
  });
}

function showOfflineClashScreen(phase) {
  const mySeq = phase.sequences[String(state.playerIdx)]?.[phase.round - 1]
    || phase.sequences[state.playerIdx]?.[phase.round - 1];
  if (!mySeq) return;
  const atC = state.chars[phase.atIdx], defC = state.chars[phase.defIdx];
  const myScore = phase.scores[String(state.playerIdx)] ?? phase.scores[state.playerIdx] ?? 0;
  const rivScore = phase.scores[String(1 - state.playerIdx)] ?? phase.scores[1 - state.playerIdx] ?? 0;

  document.getElementById('clash-vs').textContent = `${atC.nombre}  VS  ${defC.nombre}`;
  document.getElementById('clash-scores').textContent = `[${state.playerNames[state.playerIdx]}] ${myScore}  —  ${rivScore} [${state.playerNames[1 - state.playerIdx]}]`;

  showScreen('screen-clash');
  document.getElementById('sequence-reveal').classList.add('hidden');
  document.getElementById('sequence-input-phase').classList.add('hidden');
  document.getElementById('clash-waiting').classList.add('hidden');
  const roundEl = document.getElementById('clash-round-display');
  roundEl.classList.remove('hidden');
  document.getElementById('clash-round-num').textContent = `RONDA ${phase.round} DE ${phase.maxRounds}`;

  const showBtn = document.getElementById('btn-show-seq'); showBtn.style.display = '';
  showBtn.onclick = () => {
    document.getElementById('seq-display').textContent = mySeq.join(' ');
    document.getElementById('sequence-reveal').classList.remove('hidden');
    showBtn.style.display = 'none';
  };
  document.getElementById('btn-hide-seq').onclick = () => {
    document.getElementById('sequence-reveal').classList.add('hidden');
    document.getElementById('sequence-input-phase').classList.remove('hidden');
    const inp = document.getElementById('seq-input'); inp.value = ''; inp.focus();
  };
  document.getElementById('btn-submit-seq').onclick = _submitClashOffline;
  document.getElementById('seq-input').onkeydown = e => { if (e.key === 'Enter') _submitClashOffline(); };
}

function _submitClashOffline() {
  const answer = document.getElementById('seq-input').value.trim().split('').map(Number);
  document.getElementById('clash-round-display').classList.add('hidden');
  document.getElementById('clash-waiting').classList.remove('hidden');

  const phase = getPhase();
  if (!phase || phase.type !== 'clash_active') return;

  // Actualizar submissions con este jugador
  const updSubs = { ...phase.submissions, [state.playerIdx]: answer };
  const updPhase = { ...phase, submissions: updSubs };
  setPhase(updPhase);

  // Si ambos han enviado Y somos J0, resolver la ronda
  const both = updSubs[phase.atIdx] !== null && updSubs[phase.defIdx] !== null;
  if (both && state.playerIdx === 0) _resolverRondaClash(updPhase);
}

function _resolverRondaClash(phase) {
  const { round, maxRounds, atIdx, defIdx, sequences, submissions, scores } = phase;
  // Normalizar claves (JSON convierte int keys a strings)
  const getVal = (obj, k) => obj[k] ?? obj[String(k)];

  const atSeq = getVal(sequences, atIdx)[round - 1];
  const defSeq = getVal(sequences, defIdx)[round - 1];
  const atOk = arraysEqual(atSeq, getVal(submissions, atIdx));
  const defOk = arraysEqual(defSeq, getVal(submissions, defIdx));

  const newScores = {
    [atIdx]: (getVal(scores, atIdx) || 0) + (atOk ? 1 : 0),
    [defIdx]: (getVal(scores, defIdx) || 0) + (defOk ? 1 : 0)
  };
  offlineLog(`Ronda ${round}: ${atOk ? '✓' : '✗'} ${state.chars[atIdx].nombre}  vs  ${defOk ? '✓' : '✗'} ${state.chars[defIdx].nombre}`);

  if (round < maxRounds) {
    setPhase({ ...phase, round: round + 1, scores: newScores, submissions: { [atIdx]: null, [defIdx]: null } });
  } else {
    const atScore = getVal(newScores, atIdx), defScore = getVal(newScores, defIdx);
    const winnerIdx = atScore > defScore ? atIdx : defIdx;
    const loserIdx = 1 - winnerIdx;
    const winnerHab = winnerIdx === atIdx ? phase.atHab : phase.defHab;

    offlineLog(`🏆 ${state.chars[winnerIdx].nombre} gana el choque (${atScore}-${defScore})`);
    offlineLog(`🔥 ${state.chars[loserIdx].nombre} entra en Burnout 2T.`);
    state.chars[loserIdx].burnout = 2;
    if (state.chars[loserIdx].dominioActivo) { state.chars[loserIdx].dominioActivo = false; state.dominio = null; }

    clearPhase();
    _aplicarActivacionDominio(winnerIdx, winnerHab, state.chars[winnerIdx], state.chars[loserIdx]);
    renderBattle(); renderLog(state.offlineLog); updateDomainOverlay(state.dominio);
    // Salir del clash ANTES de guardar → J0 sale aquí, J1 sale por el storage event
    showScreen('screen-battle');
    saveBattleToStorage();
    _despuesDominioActivado(winnerIdx, winnerHab);
  }
}

// ════════════════════════════════════════════════════
//  ACTIVACIÓN REAL DEL DOMINIO
// ════════════════════════════════════════════════════
function _aplicarActivacionDominio(ownerIdx, hab, owner, oponente) {
  // Efectos de expansión
  if (hab.efecto === 'potenciar') { owner.potenciado = 2; offlineLog(`🔥 ${owner.nombre} potenciado 2T.`); }
  if (hab.efecto === 'inmovilizar2') { oponente.inmovilizado = 2; offlineLog(`⛓ ${oponente.nombre} inmovilizado 2T.`); }
  if (hab.efecto === 'gran-juego') { oponente.inmovilizado = 2; oponente.energia = 0; offlineLog(`🌀 Gran Juego: ${oponente.nombre} inmov 2T y sin CE.`); }
  if (hab.efecto === 'gamble') {
    if (Math.random() < 0.33) { offlineLog(`🎰 ¡JACKPOT! CE infinita e inmortalidad 4T.`); owner.inmortal = 4; owner.energia = 9999; }
    else offlineLog(`💀 Mala suerte en IDLE DEATH GAMBLE.`);
  }
  _activarDominioOffline(ownerIdx, hab);
  if ((hab.danio || 0) > 0) offlineApply(oponente, offlineDmg(owner, hab));
}

function _activarDominioOffline(ownerIdx, hab) {
  state.dominio = { ownerIdx, nombre: hab.nombre, efectoDominio: hab.efectoDominio || '', turnosRestantes: 8 };
  state.chars[ownerIdx].dominioActivo = true;
  updateDomainOverlay(state.dominio);
  offlineLog(`🌀 ¡${state.chars[ownerIdx].nombre} EXPANDE: ${hab.nombre}!`);
}

function _despuesDominioActivado(ownerIdx, hab) {
  // TRIBUNAL MALDITO — activar juicio
  if (hab.efecto === 'tribunal' || hab.nombre?.includes('TRIBUNAL MALDITO')) {
    renderBattle(); renderLog(state.offlineLog); updateDomainOverlay(state.dominio); saveBattleToStorage();
    _iniciarTribunalOffline(ownerIdx); return;
  }
  tickOfflineDominio();
  finishOfflineTurn();
}

// ════════════════════════════════════════════════════
//  TRIBUNAL MALDITO (offline)
// ════════════════════════════════════════════════════
function _iniciarTribunalOffline(higIdx) {
  const accusedIdx = 1 - higIdx;
  const cIdx = Math.floor(Math.random() * CRIMENES.length);
  const crime = CRIMENES[cIdx];
  const opts = buildOptsOffline(cIdx);
  setPhase({
    type: 'tribunal_active',
    activatorIdx: higIdx, accusedIdx,
    crimeIdx: cIdx, crimen: crime.crimen, gravedad: crime.gravedad,
    options: opts.opts, correctIdx: opts.correctIdx, esPrimera: true
  });
}

function showOfflineTribunal(phase) {
  showScreen('screen-tribunal');
  updateDomainOverlay({ efectoDominio: 'tribunal' });
  document.getElementById('tribunal-waiting').classList.add('hidden');
  document.getElementById('tribunal-appeal').classList.add('hidden');
  const acc = document.getElementById('tribunal-accusation'); acc.classList.remove('hidden');

  const badge = document.getElementById('gravedad-badge');
  badge.className = `gravedad-badge gravedad-${phase.gravedad}`;
  badge.textContent = (phase.gravedad === 1 ? '⚪ LEVE' : phase.gravedad === 2 ? '🟡 GRAVE' : '🔴 FATAL')
    + (phase.esPrimera ? '' : ' — APELACIÓN');
  document.getElementById('crime-text').textContent = `"${phase.crimen}"`;

  const opts = document.getElementById('defense-options'); opts.innerHTML = '';
  phase.options.forEach((opt, idx) => {
    const btn = document.createElement('button'); btn.className = 'defense-option';
    btn.textContent = `${idx + 1}. ${opt}`;
    btn.onclick = () => {
      acc.classList.add('hidden');
      document.getElementById('tribunal-waiting').innerHTML = '<div class="waiting-icon large">⚖️</div><div>Judgeman delibera...</div>';
      document.getElementById('tribunal-waiting').classList.remove('hidden');
      setPhase({
        type: 'tribunal_response', activatorIdx: phase.activatorIdx, accusedIdx: phase.accusedIdx,
        crimeIdx: phase.crimeIdx, gravedad: phase.gravedad, correctIdx: phase.correctIdx,
        esPrimera: phase.esPrimera, choice: idx
      });
    };
    opts.appendChild(btn);
  });
}

function showTribunalWaiting(msg) {
  showScreen('screen-tribunal');
  document.getElementById('tribunal-accusation').classList.add('hidden');
  document.getElementById('tribunal-appeal').classList.add('hidden');
  const w = document.getElementById('tribunal-waiting'); w.classList.remove('hidden');
  w.innerHTML = `<div class="waiting-icon large">⚖️</div><div>${escHtml(msg)}</div>`;
}

function showOfflineTribunalAppeal(phase) {
  showScreen('screen-tribunal');
  document.getElementById('tribunal-accusation').classList.add('hidden');
  document.getElementById('tribunal-waiting').classList.add('hidden');
  document.getElementById('tribunal-appeal').classList.remove('hidden');

  document.getElementById('btn-apelar').onclick = () => {
    const nIdx = Math.floor(Math.random() * CRIMENES.length);
    const nCrime = CRIMENES[nIdx]; const nOpts = buildOptsOffline(nIdx);
    setPhase({
      type: 'tribunal_active', activatorIdx: phase.activatorIdx, accusedIdx: phase.accusedIdx,
      crimeIdx: nIdx, crimen: nCrime.crimen, gravedad: nCrime.gravedad,
      options: nOpts.opts, correctIdx: nOpts.correctIdx, esPrimera: false
    });
  };
  document.getElementById('btn-no-apelar').onclick = () => {
    setPhase({
      type: 'tribunal_response', activatorIdx: phase.activatorIdx, accusedIdx: phase.accusedIdx,
      crimeIdx: phase.crimeIdx, gravedad: phase.gravedad, correctIdx: phase.correctIdx,
      esPrimera: false, choice: -1
    });
  };
}

function resolveOfflineTribunal(phase) {
  const accused = state.chars[phase.accusedIdx];
  const hig = state.chars[phase.activatorIdx];
  const correct = phase.choice === phase.correctIdx;
  clearPhase();
  showScreen('screen-battle');

  if (correct) {
    offlineLog(`✅ VEREDICTO: ¡INOCENTE! El cargo queda retirado.`);
  } else if (phase.esPrimera && phase.gravedad >= 2) {
    setPhase({ ...phase, type: 'tribunal_appeal_offer' }); return;
  } else {
    if (phase.gravedad <= 2) {
      offlineLog(`🔨 CONFISCACIÓN ejecutada.`);
      if (accused.tieneHerramienta && !accused.herramientaConfiscada) {
        accused.herramientaConfiscada = true; accused.potenciado = Math.max(accused.potenciado - 2, -2);
        offlineLog(`📦 Herramienta de ${accused.nombre} destruida.`);
      } else if (accused.puedeEspeciales) {
        accused.burnout = 2; offlineLog(`🚫 Técnica de ${accused.nombre} sellada 2T.`);
      } else {
        accused.energia = 0; offlineLog(`⚡ Energía de ${accused.nombre} confiscada.`);
      }
    } else {
      offlineLog(`💀 PENA DE MUERTE: ¡${hig.nombre} obtiene la Espada del Verdugo!`);
      hig.espadaVerdugoActiva = true; hig.golpesEspada = 0;
      _intentarEspadaOffline(phase.activatorIdx, phase.accusedIdx);
    }
  }

  renderBattle(); renderLog(state.offlineLog); saveBattleToStorage();
  tickOfflineDominio(); finishOfflineTurn();
}

function _intentarEspadaOffline(higIdx, acIdx) {
  const hig = state.chars[higIdx], ac = state.chars[acIdx];
  if (!hig || !hig.espadaVerdugoActiva) return;
  if (Math.random() < 0.30) {
    hig.golpesEspada = (hig.golpesEspada || 0) + 1;
    if (hig.golpesEspada === 1) {
      const d = Math.floor(ac.hp * 0.6); ac.hp = Math.max(0, ac.hp - d);
      offlineLog(`🩸 ¡PRIMER GOLPE DEL VERDUGO! ${ac.nombre} pierde ${d} HP.`);
    } else {
      ac.hp = 0; hig.espadaVerdugoActiva = false; hig.golpesEspada = 0;
      offlineLog(`☠️ ¡SEGUNDO GOLPE! La sentencia se cumple.`);
    }
  } else { offlineLog(`💨 La Espada del Verdugo falla esta vez...`); }
}

// ════════════════════════════════════════════════════
//  TICK DE DOMINIO Y FIN DE TURNO
// ════════════════════════════════════════════════════
function tickOfflineDominio() {
  if (!state.dominio) return;
  const dom = state.dominio, owner = state.chars[dom.ownerIdx], defIdx = 1 - dom.ownerIdx;
  if (owner.nombre === 'Sukuna') {
    state.chars[defIdx].hp = Math.max(0, state.chars[defIdx].hp - 50);
    offlineLog(`⚔️ Santuario Malévolo: 50 dmg pasivo.`);
  }
  if (owner.nombre === 'Kenjaku') {
    const d = Math.min(state.chars[defIdx].energia, 60);
    state.chars[defIdx].energia -= d; offlineLog(`🌀 Gran Juego drena ${d} CE.`);
  }
  if (owner.nombre === 'Hanami') {
    state.chars[defIdx].hp = Math.max(0, state.chars[defIdx].hp - 30);
    offlineLog(`🌸 Mar de Flores drena 30 HP.`);
  }
  if (owner.nombre === 'Naoya Zenin (Maldición)') {
    state.chars[defIdx].hp = Math.max(0, state.chars[defIdx].hp - 30);
    offlineLog(`💀 Espiral de Rencor: 30 dmg pasivo del odio eterno de Naoya.`);
  }
  dom.turnosRestantes--;
  if (dom.turnosRestantes <= 0) {
    offlineLog(`El dominio de ${owner.nombre} se ha disipado.`);
    owner.dominioActivo = false; owner.burnout = 2;
    state.dominio = null; updateDomainOverlay(null);
  }
}

function finishOfflineTurn() {
  // ── Transformación de Naoya ─────────────────────────────────
  // Debe comprobarse ANTES del chequeo de game over.
  // Si Naoya muere por golpe físico puro (coste 0, sin herramienta)
  // renace como Maldición Especial; state.chars[i] se reemplaza aquí.
  for (let i = 0; i < 2; i++) {
    const c = state.chars[i];
    if (c && c.nombre === 'Naoya Zenin' && c.hp <= 0 && c._ultimoGolpeFisicoSinEnergia) {
      offlineLog(`☠️ Naoya Zenin ha caído... pero su rencor no descansa.`);
      offlineLog(`💀 ¡NAOYA ZENIN RENACE COMO MALDICIÓN ESPECIAL!`);
      state.chars[i] = createNaoyaMaldicion(i);
    }
  }

  // Leer DESPUÉS de la posible transformación para no usar referencias antiguas
  const c0 = state.chars[0], c1 = state.chars[1];

  if (c0.hp <= 0 || c1.hp <= 0) {
    const wIdx = c0.hp > 0 ? 0 : 1;
    offlineLog(`🏆 ¡${state.chars[wIdx].nombre} [${state.playerNames[wIdx]}] ha ganado!`);
    renderBattle(); renderLog(state.offlineLog); saveBattleToStorage(true);
    setTimeout(() => _showGameOverOffline(), 800); return;
  }
  state.turnoActivo = 1 - state.turnoActivo;
  offlineLog(`--- Turno de ${state.chars[state.turnoActivo].nombre} (${state.playerNames[state.turnoActivo]}) ---`);

  // Espada del Verdugo al inicio de cada turno
  const hig = state.chars.find(c => c.espadaVerdugoActiva);
  if (hig) { const vIdx = 1 - hig.playerIdx; _intentarEspadaOffline(hig.playerIdx, vIdx); }

  renderBattle(); renderLog(state.offlineLog); updateDomainOverlay(state.dominio);
  saveBattleToStorage();
  _actualizarPanelOffline();
}

// ════════════════════════════════════════════════════
//  BATALLA — SOCKET (online)
// ════════════════════════════════════════════════════
socket.on('battle_start', ({ chars, playerNames, turnoActivo, log }) => {
  state.chars = chars; state.playerNames = playerNames; state.turnoActivo = turnoActivo;
  state.isMyTurn = false; state.actionPending = false;
  showScreen('screen-battle'); renderBattle(); renderLog(log);
  setActionPanelState('waiting', 'Esperando inicio...'); updateDomainOverlay(null);
});

socket.on('battle_update', ({ chars, turnoActivo, dominio, log }) => {
  state.chars = chars; state.turnoActivo = turnoActivo; state.dominio = dominio;
  state.isMyTurn = false; state.actionPending = false;
  const scr = currentScreen();
  if (scr === 'screen-clash' || scr === 'screen-tribunal') showScreen('screen-battle');
  renderBattle(); renderLog(log); updateDomainOverlay(dominio);
  setActionPanelState('waiting', 'Procesando...');
});

socket.on('your_turn', ({ playerIdx }) => {
  if (playerIdx !== state.playerIdx) return;
  state.isMyTurn = true; state.actionPending = false;
  if (currentScreen() === 'screen-battle') setActionPanelState('action');
});
socket.on('opponent_turn', ({ playerIdx }) => {
  state.isMyTurn = false; state.actionPending = false;
  const name = state.chars[playerIdx]?.nombre || 'rival';
  if (currentScreen() === 'screen-battle') setActionPanelState('waiting', `Turno de ${name}...`);
});
socket.on('action_invalid', ({ log }) => {
  renderLog(log); showToast('⚠️ Acción inválida — intenta de nuevo.');
  state.isMyTurn = true; state.actionPending = false;
  if (currentScreen() === 'screen-battle') setActionPanelState('action');
});

// Ventana de respuesta al dominio (online)
socket.on('domain_response_window', ({ activatorIdx, activatorName, domainName, defDomains }) => {
  if (activatorIdx !== state.playerIdx && defDomains?.length) {
    _showOnlineDomainResponsePanel(activatorName, domainName, defDomains);
  } else if (activatorIdx === state.playerIdx) {
    setActionPanelState('waiting', `🌀 Dominio expandido — esperando respuesta del rival...`);
  }
});

function _showOnlineDomainResponsePanel(activatorName, domainName, defDomains) {
  const actionPanel = document.getElementById('action-panel');
  document.getElementById('waiting-msg').classList.add('hidden');
  document.getElementById('action-menu').classList.add('hidden');
  document.getElementById('habilidades-menu').classList.add('hidden');

  let panel = document.getElementById('domain-response-panel');
  if (!panel) { panel = document.createElement('div'); panel.id = 'domain-response-panel'; panel.style.cssText = 'width:100%;display:flex;flex-direction:column;gap:0.4rem;'; actionPanel.appendChild(panel); }
  panel.classList.remove('hidden');

  panel.innerHTML = `<div style="text-align:center;color:#cc44ff;font-weight:700;font-size:0.9rem;">🌀 ¡<strong>${escHtml(activatorName)}</strong> expande <em>${escHtml(domainName)}</em>!</div><div style="font-size:0.75rem;color:var(--text-dim);text-align:center;margin-bottom:0.3rem;">¿Respondes con tu dominio?</div><div id="domain-resp-opts-online"></div>`;

  const opts = document.getElementById('domain-resp-opts-online');
  defDomains.forEach(dh => {
    const btn = document.createElement('div'); btn.className = 'hab-item dominio'; btn.style.cursor = 'pointer';
    btn.innerHTML = `<div><div class="hab-item-name">🌀 ${escHtml(dh.nombre)}</div></div><div class="hab-item-right"><div class="hab-item-cost">⚡ ${dh.coste}</div></div>`;
    btn.addEventListener('click', () => { panel.classList.add('hidden'); socket.emit('domain_response', { activate: true, habIdx: dh.idx }); setActionPanelState('waiting', 'Procesando...'); });
    opts.appendChild(btn);
  });
  const passBtn = document.createElement('div'); passBtn.className = 'hab-item'; passBtn.style.cursor = 'pointer';
  passBtn.innerHTML = `<div><div class="hab-item-name">🏳 No responder</div></div>`;
  passBtn.addEventListener('click', () => { panel.classList.add('hidden'); socket.emit('domain_response', { activate: false }); setActionPanelState('waiting', 'Procesando...'); });
  opts.appendChild(passBtn);
}

// ════════════════════════════════════════════════════
//  RENDERIZADO
// ════════════════════════════════════════════════════
function renderBattle() {
  for (let i = 0; i < 2; i++) {
    const c = state.chars[i]; if (!c) continue;
    document.getElementById(`name-${i}`).textContent = c.nombre;
    document.getElementById(`player-name-${i}`).textContent = state.playerNames[i] || '';
    document.getElementById(`emoji-${i}`).textContent = c.emoji;
    document.getElementById(`aura-${i}`).style.background = `radial-gradient(circle, ${c.color}55, transparent)`;
    document.getElementById(`sprite-${i}`).style.background = `radial-gradient(circle, ${c.color}22, transparent)`;
    const hpPct = c.maxHp > 0 ? Math.max(0, (c.hp / c.maxHp) * 100) : 0;
    const hpBar = document.getElementById(`hp-${i}`); hpBar.style.width = hpPct + '%';
    hpBar.className = 'bar-fill hp-bar' + (hpPct <= 20 ? ' low' : hpPct <= 50 ? ' mid' : '');
    document.getElementById(`hp-num-${i}`).textContent = `${c.hp}/${c.maxHp}`;
    const enPct = c.maxEnergia > 0 ? Math.max(0, (c.energia / c.maxEnergia) * 100) : 0;
    document.getElementById(`en-${i}`).style.width = enPct + '%';
    document.getElementById(`en-num-${i}`).textContent = c.maxEnergia > 0 ? `${c.energia}/${c.maxEnergia}` : '—';
    renderStatusIcons(i, c);
  }
  const ac = state.chars[state.turnoActivo], ap = state.playerNames[state.turnoActivo];
  document.getElementById('turn-indicator').textContent = ac ? `${ap} — ${ac.nombre}` : '— TURNO —';
  const domInfo = document.getElementById('domain-info');
  if (state.dominio) {
    // turnosRestantes=8 = 4 rondas (decrementa 2 veces por ronda: 1 por cada acción)
    const td = Math.ceil(state.dominio.turnosRestantes / 2);
    domInfo.style.display = 'block';
    domInfo.textContent = `🌀 ${state.dominio.nombre} (${td}T)`;
  } else { domInfo.style.display = 'none'; }
}

function renderStatusIcons(idx, c) {
  const el = document.getElementById(`status-${idx}`); el.innerHTML = '';
  const add = (cls, text) => { const s = document.createElement('span'); s.className = `status-icon ${cls}`; s.textContent = text; el.appendChild(s); };
  if (c.burnout > 0) add('burnout', `🔥 Burnout ${c.burnout}T`);
  if (c.inmovilizado > 0) add('inmovilizado', `⛓ Inmov. ${c.inmovilizado}T`);
  if (c.potenciado > 0) add('potenciado-pos', `⬆ Potenciado ${c.potenciado}T`);
  if (c.potenciado < 0) add('potenciado-neg', `⬇ Debilitado`);
  if (c.dominioActivo) add('dominio-activo', `🌀 Dominio`);
  if (c.espadaVerdugoActiva) add('espada', `⚔ Verdugo`);
  if (c.inmortal > 0) add('potenciado-pos', `⭐ Inmortal ${c.inmortal}T`);
}

function renderLog(log) {
  const el = document.getElementById('battle-log');
  el.innerHTML = (log || []).map(entry => {
    const msg = entry.msg || entry;
    return `<div class="log-entry ${classLog(msg)}">${escHtml(msg)}</div>`;
  }).join('');
  el.scrollTop = 0;
}
function classLog(msg) {
  if (msg.includes('💥') || msg.includes('JACKPOT') || msg.includes('usa:')) return 'special';
  if (msg.includes('recibe') || msg.includes('daño') || msg.includes('sufre')) return 'damage';
  if (msg.includes('DOMINIO') || msg.includes('dominio') || msg.includes('EXPANDE') || msg.includes('choque') || msg.includes('Choque')) return 'domain';
  if (msg.includes('🏆') || msg.includes('ganado') || msg.includes('GANADOR')) return 'win';
  return 'system';
}

// ════════════════════════════════════════════════════
//  VISUAL: fondo dinámico del dominio
//  Se aplica directamente sobre #screen-battle para que
//  sea visible bajo todos los elementos del combate.
// ════════════════════════════════════════════════════
function updateDomainOverlay(dominio) {
  const ov = document.getElementById('domain-overlay');
  const bs = document.getElementById('screen-battle');

  if (!dominio?.efectoDominio) {
    if (ov) ov.className = 'domain-overlay hidden';
    if (bs) { bs.style.transition = 'background 1.5s ease'; bs.style.background = ''; }
    return;
  }

  // Overlay animado (pseudo-elementos CSS)
  if (ov) ov.className = `domain-overlay ${dominio.efectoDominio} active`;

  // Fondo directo al screen — siempre visible incluso con z-index
  const bg = DOMAIN_BACKGROUNDS[dominio.efectoDominio];
  if (bs && bg) { bs.style.transition = 'background 1.5s ease'; bs.style.background = bg; }
}

// ════════════════════════════════════════════════════
//  PANEL DE ACCIONES
// ════════════════════════════════════════════════════
function setActionPanelState(mode, waitMsg = 'Turno del rival...') {
  document.getElementById('waiting-msg').classList.add('hidden');
  document.getElementById('action-menu').classList.add('hidden');
  document.getElementById('habilidades-menu').classList.add('hidden');
  document.getElementById('domain-response-panel')?.classList.add('hidden');
  if (mode === 'waiting') {
    document.getElementById('waiting-msg').innerHTML = `<div class="waiting-icon">⏳</div><div>${waitMsg}</div>`;
    document.getElementById('waiting-msg').classList.remove('hidden');
  } else if (mode === 'action') {
    renderActionMenu(); document.getElementById('action-menu').classList.remove('hidden');
  }
}

function renderActionMenu() {
  const me = state.chars[state.playerIdx]; if (!me) return;
  const cur = ['Gojo Satoru', 'Sukuna', 'Yuta Okkotsu', 'Maki Zenin', 'Toji Fushiguro'];
  document.getElementById('btn-recargar').style.display = me.puedeEspeciales ? '' : 'none';
  document.getElementById('btn-curar').style.display = cur.includes(me.nombre) ? '' : 'none';
}

function sendAction(data) {
  if (isLocalLogic()) { processOfflineAction(data.type, data.habIdx); return; }
  if (!state.isMyTurn || state.actionPending) return;
  state.isMyTurn = false; state.actionPending = true;
  setActionPanelState('waiting', 'Procesando...');
  socket.emit('player_action', data);
}

function showHabilidades() {
  const me = state.chars[state.playerIdx]; if (!me) return;
  const list = document.getElementById('hab-list'); list.innerHTML = '';
  me.habilidades.forEach((h, idx) => {
    const disabled = me.energia < (h.coste || 0) || (me.burnout > 0 && idx > 0);
    const item = document.createElement('div');
    item.className = `hab-item ${h.dominio ? 'dominio' : ''} ${disabled ? 'disabled' : ''}`;
    item.innerHTML = `<div><div class="hab-item-name">${escHtml(h.nombre)}</div><div class="hab-item-desc">${escHtml(h.desc || '')}</div></div><div class="hab-item-right"><div class="hab-item-cost">⚡ ${h.coste || 0}</div>${(h.danio || 0) > 0 ? `<div class="hab-item-dmg">⚔ ${h.danio}</div>` : ''}</div>`;
    if (!disabled) item.addEventListener('click', () => {
      if (!state.isMyTurn || state.actionPending) return;
      document.getElementById('habilidades-menu').classList.add('hidden');
      sendAction({ type: 'habilidad', habIdx: idx });
    });
    list.appendChild(item);
  });
  document.getElementById('habilidades-menu').classList.remove('hidden');
}

// ════════════════════════════════════════════════════
//  CHOQUE DE DOMINIOS (online)
// ════════════════════════════════════════════════════
let clashData = null, clashRonda = 1;
socket.on('domain_clash_begin', ({ atacante, defensor, atPrio, defPrio, scores }) => {
  clashData = { atacante, defensor, scores: [...scores] };
  showScreen('screen-clash');
  document.getElementById('clash-vs').textContent = `${atacante}  VS  ${defensor}`;
  updateClashScores(scores);
  if (atPrio || defPrio) showToast(`⚠️ ${atPrio ? atacante : defensor} tiene prioridad (+1 pto)`, 3000);
});
socket.on('domain_clash_round', ({ ronda, sequence, scores }) => {
  clashRonda = ronda; updateClashScores(scores); renderClashRound(ronda, sequence);
});

function updateClashScores(scores) {
  if (!clashData) return;
  document.getElementById('clash-scores').textContent = `[${clashData.atacante}]  ${scores[0]}  —  ${scores[1]}  [${clashData.defensor}]`;
}
function renderClashRound(ronda, seq) {
  const roundEl = document.getElementById('clash-round-display');
  roundEl.classList.remove('hidden');
  document.getElementById('clash-waiting').classList.add('hidden');
  document.getElementById('clash-round-num').textContent = `RONDA ${ronda} DE 3`;
  document.getElementById('sequence-reveal').classList.add('hidden');
  document.getElementById('sequence-input-phase').classList.add('hidden');
  const sb = document.getElementById('btn-show-seq'); sb.style.display = '';
  sb.onclick = () => { document.getElementById('seq-display').textContent = seq.join(' '); document.getElementById('sequence-reveal').classList.remove('hidden'); sb.style.display = 'none'; };
  document.getElementById('btn-hide-seq').onclick = () => { document.getElementById('sequence-reveal').classList.add('hidden'); document.getElementById('sequence-input-phase').classList.remove('hidden'); const inp = document.getElementById('seq-input'); inp.value = ''; inp.focus(); };
  document.getElementById('btn-submit-seq').onclick = submitClash;
  document.getElementById('seq-input').onkeydown = e => { if (e.key === 'Enter') submitClash(); };
}
function submitClash() {
  const seq = document.getElementById('seq-input').value.trim().split('').map(Number);
  document.getElementById('clash-round-display').classList.add('hidden');
  document.getElementById('clash-waiting').classList.remove('hidden');
  socket.emit('domain_clash_response', { sequence: seq, ronda: clashRonda });
}

// ════════════════════════════════════════════════════
//  TRIBUNAL MALDITO (online)
// ════════════════════════════════════════════════════
socket.on('tribunal_begin', ({ efectoDominio, acusadoIdx }) => {
  showScreen('screen-tribunal'); updateDomainOverlay({ efectoDominio });
  document.getElementById('tribunal-accusation').classList.add('hidden');
  document.getElementById('tribunal-appeal').classList.add('hidden');
  const w = document.getElementById('tribunal-waiting'); w.classList.remove('hidden');
  w.innerHTML = acusadoIdx === state.playerIdx
    ? '<div class="waiting-icon large">⚖️</div><div>Judgeman prepara los cargos contra ti...</div>'
    : '<div class="waiting-icon large">⚖️</div><div>El acusado se defiende ante Judgeman...</div>';
});

socket.on('tribunal_accusation', ({ crimen, gravedad, options, esApelacion }) => {
  document.getElementById('tribunal-waiting').classList.add('hidden');
  document.getElementById('tribunal-appeal').classList.add('hidden');
  const acc = document.getElementById('tribunal-accusation'); acc.classList.remove('hidden');
  const badge = document.getElementById('gravedad-badge');
  badge.className = `gravedad-badge gravedad-${gravedad}`;
  badge.textContent = (gravedad === 1 ? '⚪ LEVE' : gravedad === 2 ? '🟡 GRAVE' : '🔴 FATAL') + (esApelacion ? ' — APELACIÓN' : '');
  document.getElementById('crime-text').textContent = `"${crimen}"`;
  const opts = document.getElementById('defense-options'); opts.innerHTML = '';
  options.forEach((opt, idx) => {
    const btn = document.createElement('button'); btn.className = 'defense-option';
    btn.textContent = `${idx + 1}. ${opt}`;
    btn.onclick = () => {
      acc.classList.add('hidden');
      document.getElementById('tribunal-waiting').innerHTML = '<div class="waiting-icon large">⚖️</div><div>Judgeman delibera...</div>';
      document.getElementById('tribunal-waiting').classList.remove('hidden');
      socket.emit('tribunal_response', { choice: idx, esPrimera: !esApelacion });
    };
    opts.appendChild(btn);
  });
});

socket.on('tribunal_appeal_offer', () => {
  document.getElementById('tribunal-accusation').classList.add('hidden');
  document.getElementById('tribunal-waiting').classList.add('hidden');
  document.getElementById('tribunal-appeal').classList.remove('hidden');
});
document.getElementById('btn-apelar')?.addEventListener('click', () => {
  document.getElementById('tribunal-appeal').classList.add('hidden');
  document.getElementById('tribunal-waiting').classList.remove('hidden');
  socket.emit('tribunal_appeal', { apela: true });
});
document.getElementById('btn-no-apelar')?.addEventListener('click', () => {
  document.getElementById('tribunal-appeal').classList.add('hidden');
  document.getElementById('tribunal-waiting').classList.remove('hidden');
  socket.emit('tribunal_appeal', { apela: false });
});

// ════════════════════════════════════════════════════
//  GAME OVER
// ════════════════════════════════════════════════════
socket.on('game_over', ({ winnerIdx, winnerChar, winnerPlayer, log }) => {
  showScreen('screen-gameover'); updateDomainOverlay(null);
  const esVic = winnerIdx === state.playerIdx;
  document.getElementById('winner-title').textContent = esVic ? '¡VICTORIA!' : 'DERROTA';
  document.getElementById('winner-title').style.color = esVic ? '#e8b84b' : '#cc2200';
  document.getElementById('winner-char').textContent = winnerChar;
  document.getElementById('winner-player').textContent = winnerPlayer;
  document.getElementById('gameover-log').innerHTML = (log || []).slice(0, 15).map(e => `<div>${escHtml(e.msg || e)}</div>`).join('');
});

document.getElementById('btn-restart')?.addEventListener('click', () => {
  if (isLocalLogic() && state.roomId) {
    syncState('jjk_battle_' + state.roomId, null);
    syncState('jjk_sala_' + state.roomId, null);
    sessionStorage.removeItem('jjk_offline_player_idx');
    sessionStorage.removeItem('jjk_offline_room_id');
    window.location.reload();
    return;
  }
  if (socket && state.roomId) {
    socket.emit('leave_room', { roomId: state.roomId });
    window.location.reload();
  }
});

// ════════════════════════════════════════════════════
//  MÚSICA — panel flotante
// ════════════════════════════════════════════════════
function buildMusicPanel() {
  const c = document.getElementById('music-tracks'); c.innerHTML = '';
  PISTAS.forEach(p => {
    const div = document.createElement('div');
    div.className = 'music-track' + (pistaActiva?.id === p.id ? ' active' : '');
    div.innerHTML = `<div class="music-track-icon">${p.icon}</div><div class="music-track-info"><div class="music-track-title">${p.titulo}</div><div class="music-track-artist">${p.artista}</div><div class="music-track-context">${p.contexto}</div></div>${pistaActiva?.id === p.id ? '<span class="music-track-playing">♪</span>' : ''}`;
    div.addEventListener('click', () => {
      pistaActiva = p; updateMusicBtn(); buildMusicPanel();
      document.getElementById('music-panel').classList.add('hidden');
      reproducirPista(p); showToast(`♪ ${p.titulo} — ${p.artista}`, 2000);
    });
    c.appendChild(div);
  });
}
function updateMusicBtn() {
  const btn = document.getElementById('btn-music-float'), label = document.getElementById('music-float-label');
  if (pistaActiva) { btn.classList.add('playing'); label.textContent = pistaActiva.titulo; }
  else { btn.classList.remove('playing'); label.textContent = 'Música'; }
}
document.getElementById('btn-music-float')?.addEventListener('click', () => { buildMusicPanel(); document.getElementById('music-panel').classList.toggle('hidden'); });
document.getElementById('btn-music-close')?.addEventListener('click', () => document.getElementById('music-panel').classList.add('hidden'));
document.getElementById('btn-music-off')?.addEventListener('click', () => {
  pistaActiva = null; detenerMusica(); updateMusicBtn(); buildMusicPanel();
  document.getElementById('music-panel').classList.add('hidden'); showToast('🔇 Música desactivada');
});
document.addEventListener('click', e => {
  const panel = document.getElementById('music-panel'), btn = document.getElementById('btn-music-float');
  if (!panel.classList.contains('hidden') && !panel.contains(e.target) && e.target !== btn && !btn?.contains(e.target))
    panel.classList.add('hidden');
});

// ════════════════════════════════════════════════════
//  DESCONEXIÓN
// ════════════════════════════════════════════════════
socket.on('player_disconnected', ({ msg }) => { showToast(`❌ ${msg}`, 5000); setTimeout(() => location.reload(), 4000); });
socket.on('connect_error', () => showToast('❌ No se puede conectar al servidor.', 5000));

socket.on('connect', runPendingLobbyAction);