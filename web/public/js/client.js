'use strict';
/* ══════════════════════════════════════════════════
   JJK BATTLE — CLIENT  v5.1
   Flujo: screen-main → screen-lobby → screen-select → screen-battle

   MODO ONLINE  (con npm start):  usa Socket.io
   MODO OFFLINE (index.html solo): usa localStorage + evento 'storage'
      – sessionStorage guarda el índice de jugador por ventana
      – localStorage comparte el estado de la sala y del combate
      – El evento 'storage' dispara actualizaciones en la OTRA ventana
        (el navegador NO dispara 'storage' en la ventana que escribió)
   ══════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════════════════
//  DETECCIÓN DE MODO
// ═══════════════════════════════════════════════════════════════
let socket;
let MODO_OFFLINE = false;
let eventHandlers = {};

function triggerEvent(event, data) {
  if (eventHandlers[event]) {
    eventHandlers[event].forEach(h => setTimeout(() => h(data), 0));
  }
}

if (typeof io !== 'undefined') {
  socket = io({
    reconnection: true, reconnectionDelay: 1000,
    reconnectionDelayMax: 5000, reconnectionAttempts: 5,
    transports: ['websocket', 'polling']
  });
  socket.on('connect',       () => { console.log('✅ Socket.io conectado'); MODO_OFFLINE = false; });
  socket.on('connect_error', (e) => console.error('❌ Socket.io error:', e));
  socket.on('disconnect',    (r) => console.warn('⚠️ Socket.io desconectado:', r));
} else {
  MODO_OFFLINE = true;
  console.log('🔌 Modo OFFLINE — sincronización por localStorage');
  socket = {
    on:  (event, handler) => { if (!eventHandlers[event]) eventHandlers[event] = []; eventHandlers[event].push(handler); },
    emit: () => {},
    off:  () => {},
    connected: false
  };
}

function handleOfflineEmit() {}   // stub; acciones offline se procesan directamente

// ── Estado global ────────────────────────────────────────────
const state = {
  playerIdx:     null,   // índice FIJO de esta ventana (0 ó 1), nunca cambia
  roomId:        null,
  chars:         [null, null],
  playerNames:   ['', ''],
  turnoActivo:   0,
  isMyTurn:      false,
  dominio:       null,
  actionPending: false,
  offlineLog:    []
};

// ════════════════════════════════════════════════════
//  SINCRONIZACIÓN OFFLINE — localStorage + storage event
// ════════════════════════════════════════════════════

/** Guarda el estado completo del combate en localStorage.
 *  La OTRA ventana lo recibirá mediante el evento 'storage'. */
function saveBattleToStorage(gameOver = false) {
  if (!state.roomId) return;
  localStorage.setItem('jjk_battle_' + state.roomId, JSON.stringify({
    chars:       state.chars,
    turnoActivo: state.turnoActivo,
    dominio:     state.dominio,
    log:         state.offlineLog,
    playerNames: state.playerNames,
    timestamp:   Date.now(),
    gameOver
  }));
}

/** Manejador centralizado del evento 'storage'.
 *  Solo se ejecuta en la ventana que NO escribió el cambio. */
window.addEventListener('storage', function (e) {
  if (!MODO_OFFLINE || !state.roomId) return;

  // ── Sala actualizada (jugador se unió o eligió personaje) ──
  if (e.key === 'jjk_sala_' + state.roomId && e.newValue) {
    const sala = JSON.parse(e.newValue);
    const scr  = currentScreen();

    // Jugador 1 se unió → ventana 0 va a selección de personaje
    if (scr === 'screen-lobby') {
      if (sala.players[1]?.name && sala.players[1].name !== 'Esperando...') {
        state.playerNames = [sala.players[0].name, sala.players[1].name];
        showToast(`¡${sala.players[1].name} se unió!`);
        showScreen('screen-select');
        renderCharacterGridOffline();
      }
      return;
    }

    // Rival seleccionó personaje → mostrar en la cuadrícula
    if (scr === 'screen-select') {
      const rivalIdx    = 1 - state.playerIdx;
      const rivalCharId = sala.players[rivalIdx]?.charIdx;
      if (rivalCharId != null) {
        _markRivalCard(rivalCharId);
        document.getElementById('select-status').textContent = '¡El rival ha elegido! Esperando...';
      }
      // Si los dos han elegido Y esta ventana es J0, iniciar combate
      if (sala.players[0]?.charIdx != null && sala.players[1]?.charIdx != null) {
        if (state.playerIdx === 0) startBattleOffline(sala);
        // J1 esperará el evento jjk_battle_ que J0 escribirá
      }
    }
  }

  // ── Estado de combate actualizado por la otra ventana ──
  if (e.key === 'jjk_battle_' + state.roomId && e.newValue) {
    const data = JSON.parse(e.newValue);

    // Si el combate acaba de iniciarse y esta ventana aún está en selección
    if (currentScreen() === 'screen-select' || currentScreen() === 'screen-lobby') {
      showScreen('screen-battle');
    }

    state.chars       = data.chars;
    state.turnoActivo = data.turnoActivo;
    state.dominio     = data.dominio;
    state.offlineLog  = data.log;
    if (data.playerNames) state.playerNames = data.playerNames;

    if (data.gameOver) {
      renderBattle();
      renderLog(state.offlineLog);
      updateDomainOverlay(null);
      _showGameOverOffline();
      return;
    }

    renderBattle();
    renderLog(state.offlineLog);
    updateDomainOverlay(state.dominio);
    // Determinar si ahora es el turno de esta ventana
    _actualizarPanelOffline();
  }
});

/** Marca la carta del rival en la pantalla de selección. */
function _markRivalCard(charId) {
  const card = document.querySelector(`.char-card[data-id="${charId}"]`);
  if (!card || card.querySelector('.card-selected-badge[data-rival]')) return;
  card.classList.add('selected-other');
  const badge = document.createElement('div');
  badge.className   = 'card-selected-badge';
  badge.dataset.rival = 'true';
  badge.textContent = 'RIVAL';
  badge.style.color = '#cc2200';
  card.appendChild(badge);
}

/** Actualiza el panel de acción según si es el turno de esta ventana. */
function _actualizarPanelOffline() {
  state.isMyTurn    = (state.turnoActivo === state.playerIdx);
  state.actionPending = false;
  if (state.isMyTurn) {
    const me = state.chars[state.playerIdx];
    if (me) {
      document.getElementById('btn-recargar').style.display = me.puedeEspeciales ? '' : 'none';
      const cur = ['Gojo Satoru','Sukuna','Yuta Okkotsu','Maki Zenin','Toji Fushiguro'];
      document.getElementById('btn-curar').style.display = cur.includes(me.nombre) ? '' : 'none';
    }
    setActionPanelState('action');
  } else {
    const rivalName = state.chars[state.turnoActivo]?.nombre || 'rival';
    setActionPanelState('waiting', `Turno de ${rivalName}...`);
  }
}

/** Muestra la pantalla de game over en modo offline. */
function _showGameOverOffline() {
  const c0 = state.chars[0], c1 = state.chars[1];
  const wIdx = (c0 && c0.hp > 0) ? 0 : 1;
  showScreen('screen-gameover');
  updateDomainOverlay(null);
  const esVictoria = wIdx === state.playerIdx;
  document.getElementById('winner-title').textContent = esVictoria ? '¡VICTORIA!' : 'DERROTA';
  document.getElementById('winner-title').style.color = esVictoria ? '#e8b84b' : '#cc2200';
  document.getElementById('winner-char').textContent   = state.chars[wIdx]?.nombre || '';
  document.getElementById('winner-player').textContent = state.playerNames[wIdx] || '';
  document.getElementById('gameover-log').innerHTML =
    state.offlineLog.slice(0, 15).map(e => `<div>${escHtml(e.msg || '')}</div>`).join('');
}

// ════════════════════════════════════════════════════
//  MÚSICA — HTML5 Audio
// ════════════════════════════════════════════════════
const PISTAS = [
  { id:1, titulo:'Kaikai Kitan',     artista:'Eve',           contexto:'Opening 1 — Temporada 1',   icon:'🔥', archivo:'audio/kaikai-kitan.mp3',     ytUrl:'https://www.youtube.com/watch?v=E8NtYTWPIkM' },
  { id:2, titulo:'SPECIALZ',         artista:'King Gnu',       contexto:'Opening Arco de Shibuya',   icon:'⚡', archivo:'audio/specialz.mp3',           ytUrl:'https://www.youtube.com/watch?v=R5RG3WzK3lQ' },
  { id:3, titulo:'Ao no Sumika',     artista:'Tatsuya Kitani', contexto:'Opening Inventario Oculto', icon:'💫', archivo:'audio/ao-no-sumika.mp3',       ytUrl:'https://www.youtube.com/watch?v=HtcmPFdLKX0' },
  { id:4, titulo:'Lost in Paradise', artista:'ALI ft. AKLO',   contexto:'Ending 1 — Temporada 1',    icon:'🌙', archivo:'audio/lost-in-paradise.mp3',   ytUrl:'https://www.youtube.com/watch?v=9IkehDAMOTQ' },
];
let pistaActiva = null;
const audioPlayer = new Audio();
audioPlayer.loop = true; audioPlayer.volume = 0.7;

function reproducirPista(p) {
  if (!p) return detenerMusica();
  audioPlayer.pause(); audioPlayer.src = p.archivo;
  audioPlayer.play().catch(() => {
    showToast(`⚠️ MP3 no encontrado. Pon "${p.archivo.split('/').pop()}" en public/audio/`, 4000);
    setTimeout(() => window.open(p.ytUrl, '_blank'), 1500);
  });
}
function detenerMusica() { audioPlayer.pause(); audioPlayer.src = ''; }

// ════════════════════════════════════════════════════
//  UTILIDADES
// ════════════════════════════════════════════════════
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => { s.classList.remove('active'); s.classList.add('hidden'); });
  const el = document.getElementById(id);
  if (el) { el.classList.remove('hidden'); el.classList.add('active'); }
}
function currentScreen() { const a = document.querySelector('.screen.active'); return a ? a.id : null; }
function showToast(msg, ms = 2500) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.add('hidden'), ms);
}

// ════════════════════════════════════════════════════
//  INICIALIZACIÓN DEL DOM
// ════════════════════════════════════════════════════
function initializeUI() {

  // ── Menú principal ──
  document.getElementById('btn-jugar')?.addEventListener('click', () => showScreen('screen-lobby'));

  // ── Lobby — volver ──
  document.getElementById('btn-back-lobby')?.addEventListener('click', () => {
    showScreen('screen-main');
    document.getElementById('room-code-display')?.classList.add('hidden');
    document.getElementById('lobby-error')?.classList.add('hidden');
  });

  // ── Crear sala ──
  document.getElementById('btn-create')?.addEventListener('click', () => {
    const name = document.getElementById('input-name').value.trim();
    if (!name) return showToast('Ingresa tu nombre de combatiente.');

    if (MODO_OFFLINE) {
      // Generar código de sala
      const code = Math.random().toString(36).substr(2, 5).toUpperCase();
      const sala  = { id: code, players: [{ name, charIdx: null }, { name: 'Esperando...', charIdx: null }] };
      localStorage.setItem('jjk_sala_' + code, JSON.stringify(sala));

      // sessionStorage es exclusivo por ventana: guardamos identidad aquí
      sessionStorage.setItem('jjk_offline_player_idx', '0');
      sessionStorage.setItem('jjk_offline_room_id', code);
      state.playerIdx   = 0;
      state.roomId      = code;
      state.playerNames[0] = name;

      document.getElementById('room-code-text').textContent = code;
      document.getElementById('room-code-display').classList.remove('hidden');
      showToast('Sala creada: ' + code + ' — esperando al rival...');
      // La otra ventana actualizará la sala; el evento 'storage' nos avisará
    } else {
      socket.emit('create_room', { playerName: name });
    }
  });

  // ── Unirse a sala ──
  document.getElementById('btn-join')?.addEventListener('click', () => {
    const name = document.getElementById('input-name').value.trim();
    const room = document.getElementById('input-room').value.trim().toUpperCase();
    if (!name) return showToast('Ingresa tu nombre.');
    if (!room) return showToast('Ingresa el código de sala.');

    if (MODO_OFFLINE) {
      const raw = localStorage.getItem('jjk_sala_' + room);
      if (!raw) return showToast('Sala no encontrada: ' + room);
      const sala = JSON.parse(raw);
      if (!sala.players[1] || sala.players[1].name !== 'Esperando...') return showToast('Sala llena o no disponible.');

      sala.players[1] = { name, charIdx: null };
      localStorage.setItem('jjk_sala_' + room, JSON.stringify(sala));
      // El evento 'storage' notificará a la ventana 0 que el J1 se unió

      sessionStorage.setItem('jjk_offline_player_idx', '1');
      sessionStorage.setItem('jjk_offline_room_id', room);
      state.playerIdx   = 1;
      state.roomId      = room;
      state.playerNames = [sala.players[0].name, name];

      showToast('¡Unido a sala ' + room + '!');
      showScreen('screen-select');
      renderCharacterGridOffline();
    } else {
      socket.emit('join_room', { roomId: room, playerName: name });
    }
  });

  document.getElementById('input-name')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('btn-create')?.click();
  });

  // ── Botones de batalla ──
  const guard = () => !state.isMyTurn || state.actionPending;

  document.getElementById('btn-habilidades')?.addEventListener('click', () => {
    if (guard()) return;
    document.getElementById('action-menu').classList.add('hidden');
    showHabilidades();
  });
  document.getElementById('btn-ataque')?.addEventListener('click',   () => { if (guard()) return; sendAction({ type: 'basic' }); });
  document.getElementById('btn-guardia')?.addEventListener('click',  () => { if (guard()) return; sendAction({ type: 'defend' }); });
  document.getElementById('btn-recargar')?.addEventListener('click', () => { if (guard()) return; sendAction({ type: 'recargar' }); });
  document.getElementById('btn-curar')?.addEventListener('click',    () => { if (guard()) return; sendAction({ type: 'curar' }); });
  document.getElementById('btn-back-hab')?.addEventListener('click', () => setActionPanelState('action'));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeUI);
} else {
  initializeUI();
}

// ════════════════════════════════════════════════════
//  SOCKET — LOBBY (modo online)
// ════════════════════════════════════════════════════
socket.on('room_created', ({ roomId, playerIdx }) => {
  state.roomId = roomId; state.playerIdx = playerIdx;
  document.getElementById('room-code-text').textContent = roomId;
  document.getElementById('room-code-display').classList.remove('hidden');
  document.getElementById('lobby-error').classList.add('hidden');
});
socket.on('room_joined',  ({ roomId, playerIdx }) => { state.roomId = roomId; state.playerIdx = playerIdx; });
socket.on('player_joined', ({ players }) => showToast(`¡${players[1].name} se unió!`));
socket.on('error', ({ msg }) => {
  const el = document.getElementById('lobby-error');
  el.textContent = msg; el.classList.remove('hidden');
});

// ════════════════════════════════════════════════════
//  SELECCIÓN DE PERSONAJE — catálogo offline
// ════════════════════════════════════════════════════
const CHARS_OFFLINE = [
  {id:0,  nombre:'Gojo Satoru',        tipo:'hechicero', hp:600,  energia:450,  emoji:'∞', color:'#00c8ff', gradiente:'linear-gradient(135deg,#003c6e,#00c8ff)',    puedeEspeciales:true,
    habilidades:[{nombre:'Azul',desc:'Atracción gravitacional',danio:40,coste:5},{nombre:'Rojo',desc:'Repulsión amplificada',danio:60,coste:5},{nombre:'VACÍO PÚRPURA',desc:'Borra todo lo que toca',danio:80,coste:5},{nombre:'Destello Negro',desc:'Impacto físico garantizado',danio:100,coste:5,fisico:true},{nombre:'EXPANSIÓN: VACÍO INFINITO',desc:'Inmoviliza al rival 2 turnos',danio:60,coste:15,dominio:true,efecto:'inmovilizar2',efectoDominio:'vacio-infinito'}]},
  {id:1,  nombre:'Sukuna',             tipo:'hechicero', hp:700,  energia:950,  emoji:'呪', color:'#cc2200', gradiente:'linear-gradient(135deg,#2a0000,#cc2200)',    puedeEspeciales:true,
    habilidades:[{nombre:'Desmantelar',desc:'Cortes malditos',danio:60,coste:20},{nombre:'Cleave',desc:'Cortes adaptados',danio:75,coste:35},{nombre:'FUGA',desc:'Flecha de fuego mortal',danio:100,coste:50},{nombre:'Golpe Físico',desc:'Velocidad sobrehumana',danio:80,coste:35,fisico:true},{nombre:'EXPANSIÓN: SANTUARIO MALÉVOLO',desc:'50 dmg pasivo/turno',danio:80,coste:120,dominio:true,efectoDominio:'santuario-malevolo'}]},
  {id:2,  nombre:'Itadori Yuji',       tipo:'hechicero', hp:550,  energia:250,  emoji:'拳', color:'#ff7700', gradiente:'linear-gradient(135deg,#3a1500,#ff7700)',    puedeEspeciales:true,
    habilidades:[{nombre:'Puño Divergente',desc:'Golpe con retraso',danio:60,coste:20,fisico:true},{nombre:'Destello Negro',desc:'Crítico garantizado',danio:80,coste:35,fisico:true},{nombre:'Artes Marciales',desc:'Combo físico',danio:100,coste:50,fisico:true},{nombre:'Corte de Alma',desc:'Daña el alma',danio:120,coste:65,fisico:true},{nombre:'Rencor',desc:'Frenesí imparable',danio:140,coste:100,fisico:true}]},
  {id:3,  nombre:'Maki Zenin',         tipo:'hechicero', hp:650,  energia:0,    emoji:'武', color:'#00cc66', gradiente:'linear-gradient(135deg,#003a1a,#00cc66)',    puedeEspeciales:false,
    habilidades:[{nombre:'Nube Itinerante',desc:'Bastón maldito',danio:40,coste:0,fisico:true},{nombre:'Katana Almas',desc:'Corte de alma',danio:60,coste:0,fisico:true},{nombre:'Lanza',desc:'Estocada',danio:80,coste:0,fisico:true},{nombre:'Ataque Pesado',desc:'Golpe bruto',danio:100,coste:0,fisico:true},{nombre:'Masacre',desc:'Frenesí veloz',danio:120,coste:0,fisico:true}]},
  {id:4,  nombre:'Toji Fushiguro',     tipo:'hechicero', hp:650,  energia:0,    emoji:'剣', color:'#aaaaaa', gradiente:'linear-gradient(135deg,#1a1a1a,#aaaaaa)',    puedeEspeciales:false,
    habilidades:[{nombre:'Navaja Invertida',desc:'Anula técnicas',danio:40,coste:0,fisico:true},{nombre:'Cadena',desc:'Largo alcance',danio:60,coste:0,fisico:true},{nombre:'Espada Alma',desc:'Corte mortal',danio:80,coste:0,fisico:true},{nombre:'Pistola',desc:'A distancia',danio:100,coste:0,fisico:true},{nombre:'Bendición',desc:'Punto ciego',danio:120,coste:0,fisico:true}]},
  {id:5,  nombre:'Yuta Okkotsu',       tipo:'hechicero', hp:500,  energia:1000, emoji:'愛', color:'#ff88cc', gradiente:'linear-gradient(135deg,#2a0022,#ff88cc)',    puedeEspeciales:true,
    habilidades:[{nombre:'Copia: Discurso',desc:'Habla maldita',danio:40,coste:20},{nombre:'Corte con Katana',desc:'Tajo básico',danio:60,coste:35,fisico:true},{nombre:'Rika: Ataque Físico',desc:'Puñetazo de Rika',danio:80,coste:50,fisico:true},{nombre:'RAYO DE AMOR VERDADERO',desc:'Haz de Rika',danio:100,coste:65},{nombre:'EXPANSIÓN: AMOR MUTUO',desc:'Potencia 2T',danio:60,coste:120,dominio:true,efecto:'potenciar',efectoDominio:'amor-mutuo'}]},
  {id:6,  nombre:'Kinji Hakari',       tipo:'hechicero', hp:500,  energia:300,  emoji:'♠', color:'#ffcc00', gradiente:'linear-gradient(135deg,#1a1000,#ffcc00)',    puedeEspeciales:true,
    habilidades:[{nombre:'Puñetazo Áspero',desc:'Papel de lija',danio:40,coste:20,fisico:true},{nombre:'Puerta Tren',desc:'Aplastamiento',danio:60,coste:35},{nombre:'Combo',desc:'Golpes rítmicos',danio:80,coste:50,fisico:true},{nombre:'Cabezazo',desc:'Cráneo',danio:100,coste:65,fisico:true},{nombre:'EXPANSIÓN: IDLE DEATH GAMBLE',desc:'33%: inmortalidad+CE∞',danio:0,coste:120,dominio:true,efecto:'gamble',efectoDominio:'idle-death-gamble'}]},
  {id:7,  nombre:'Mahito',             tipo:'maldicion', hp:450,  energia:350,  emoji:'魂', color:'#9933ff', gradiente:'linear-gradient(135deg,#1a0033,#9933ff)',    puedeEspeciales:true,
    habilidades:[{nombre:'Mutación',desc:'Altera el alma',danio:40,coste:20},{nombre:'Polimorfismo',desc:'Transfigurados',danio:60,coste:35},{nombre:'Isomería',desc:'Clones',danio:80,coste:50},{nombre:'Cuchilla Corporal',desc:'Brazo cuchilla',danio:100,coste:65,fisico:true},{nombre:'EXPANSIÓN: AUTOENCARNACIÓN',desc:'Potencia 2T',danio:80,coste:120,dominio:true,efecto:'potenciar',efectoDominio:'autoencarnacion'}]},
  {id:8,  nombre:'Jogo',               tipo:'maldicion', hp:380,  energia:450,  emoji:'火', color:'#ff4400', gradiente:'linear-gradient(135deg,#2a0800,#ff4400)',    puedeEspeciales:true,
    habilidades:[{nombre:'Insectos',desc:'Explosivos',danio:40,coste:20},{nombre:'Vértice',desc:'Magma',danio:60,coste:35},{nombre:'Meteorito',desc:'Roca en llamas',danio:80,coste:50},{nombre:'Palmas Ardientes',desc:'Fuego directo',danio:100,coste:65,fisico:true},{nombre:'EXPANSIÓN: ATAÚD DE LA MONTAÑA',desc:'Potencia 2T',danio:80,coste:120,dominio:true,efecto:'potenciar',efectoDominio:'ataud-montana'}]},
  {id:9,  nombre:'Megumi Fushiguro',   tipo:'hechicero', hp:420,  energia:350,  emoji:'影', color:'#4488ff', gradiente:'linear-gradient(135deg,#001033,#4488ff)',    puedeEspeciales:true,
    habilidades:[{nombre:'Perros Divinos',desc:'Shikigami',danio:40,coste:20,fisico:true},{nombre:'Nue',desc:'Descarga',danio:60,coste:35},{nombre:'Elefante Máximo',desc:'Aplastamiento',danio:80,coste:50,fisico:true},{nombre:'EXPANSIÓN: JARDÍN DE SOMBRAS',desc:'Dominio sombras',danio:80,coste:65,dominio:true,efectoDominio:'jardin-sombras'},{nombre:'MAHORAGA',desc:'General Divino',danio:0,coste:100}]},
  {id:10, nombre:'Suguru Geto',        tipo:'hechicero', hp:500,  energia:500,  emoji:'霊', color:'#33aa44', gradiente:'linear-gradient(135deg,#001a00,#33aa44)',    puedeEspeciales:true,
    habilidades:[{nombre:'Maldiciones Menores',desc:'Horda',danio:40,coste:20},{nombre:'Calamar',desc:'Asfixia',danio:60,coste:35},{nombre:'Dragón',desc:'Carga',danio:80,coste:50},{nombre:'Artes Marciales',desc:'Físico',danio:100,coste:65,fisico:true},{nombre:'UZUMAKI',desc:'Técnica Máxima',danio:140,coste:120}]},
  {id:11, nombre:'Nanami Kento',       tipo:'hechicero', hp:480,  energia:250,  emoji:'比', color:'#ccaa44', gradiente:'linear-gradient(135deg,#1a1400,#ccaa44)',    puedeEspeciales:true,
    habilidades:[{nombre:'Ratio 7:3',desc:'Punto débil',danio:40,coste:20,fisico:true},{nombre:'Derrumbe',desc:'Entorno',danio:60,coste:35},{nombre:'Golpe Contundente',desc:'Bruto',danio:80,coste:50,fisico:true},{nombre:'Tajo',desc:'Corte',danio:100,coste:65,fisico:true},{nombre:'Horas Extras',desc:'Liberación',danio:140,coste:120,fisico:true}]},
  {id:12, nombre:'Choso',              tipo:'maldicion', hp:460,  energia:320,  emoji:'血', color:'#cc0033', gradiente:'linear-gradient(135deg,#1a0000,#cc0033)',    puedeEspeciales:true,
    habilidades:[{nombre:'Sangre Perforante',desc:'Rayo sangre',danio:40,coste:20},{nombre:'Supernova',desc:'Metralla',danio:60,coste:35},{nombre:'Escala Roja',desc:'Potencia',danio:80,coste:50},{nombre:'Golpe de Ala',desc:'Cuchilla',danio:100,coste:65,fisico:true},{nombre:'Manantial',desc:'Inundación',danio:140,coste:120}]},
  {id:13, nombre:'Aoi Todo',           tipo:'hechicero', hp:520,  energia:220,  emoji:'掌', color:'#ff6600', gradiente:'linear-gradient(135deg,#1a0a00,#ff6600)',    puedeEspeciales:true,
    habilidades:[{nombre:'Boogie Woogie',desc:'Intercambio',danio:40,coste:20},{nombre:'Puñetazo',desc:'Golpe',danio:60,coste:35,fisico:true},{nombre:'Patada',desc:'Voladora',danio:80,coste:50,fisico:true},{nombre:'Aplauso Sorpresa',desc:'Desorienta',danio:100,coste:65},{nombre:'Destello Negro',desc:'Crítico garantizado',danio:140,coste:120,fisico:true}]},
  {id:14, nombre:'Nobara Kugisaki',    tipo:'hechicero', hp:400,  energia:250,  emoji:'钉', color:'#ff4488', gradiente:'linear-gradient(135deg,#1a000a,#ff4488)',    puedeEspeciales:true,
    habilidades:[{nombre:'Resonancia',desc:'Vínculo alma',danio:40,coste:20},{nombre:'Horquilla',desc:'Explosión',danio:60,coste:35},{nombre:'Martillazo',desc:'Cargado',danio:80,coste:50,fisico:true},{nombre:'Lluvia de Clavos',desc:'Área',danio:100,coste:65},{nombre:'Clavo Físico',desc:'Estocada',danio:140,coste:120,fisico:true}]},
  {id:15, nombre:'Hanami',             tipo:'maldicion', hp:550,  energia:300,  emoji:'花', color:'#44cc44', gradiente:'linear-gradient(135deg,#001a00,#44cc44)',    puedeEspeciales:true,
    habilidades:[{nombre:'Raíces',desc:'Empalamiento',danio:40,coste:20},{nombre:'Semillas',desc:'Drenaje',danio:60,coste:35},{nombre:'Rayo Solar',desc:'Haz luz',danio:80,coste:50},{nombre:'Golpe de Madera',desc:'Impacto',danio:100,coste:65,fisico:true},{nombre:'EXPANSIÓN: MAR DE FLORES',desc:'Drena vida',danio:80,coste:120,dominio:true,efectoDominio:'mar-flores'}]},
  {id:16, nombre:'Hajime Kashimo',     tipo:'hechicero', hp:490,  energia:400,  emoji:'雷', color:'#ffdd00', gradiente:'linear-gradient(135deg,#1a1500,#ffdd00)',    puedeEspeciales:true,
    habilidades:[{nombre:'Descarga',desc:'Rayo',danio:40,coste:20},{nombre:'Báculo Físico',desc:'Conductor',danio:60,coste:35,fisico:true},{nombre:'Electrólisis',desc:'Vapor',danio:80,coste:50},{nombre:'Patada Magnética',desc:'Magnético',danio:100,coste:65,fisico:true},{nombre:'ÁMBAR MÍTICO',desc:'Forma final',danio:160,coste:120,fisico:true}]},
  {id:17, nombre:'Mei Mei',            tipo:'hechicero', hp:450,  energia:250,  emoji:'鸦', color:'#aa88ff', gradiente:'linear-gradient(135deg,#0a0022,#aa88ff)',    puedeEspeciales:true,
    habilidades:[{nombre:'Corte Hacha',desc:'Tajo',danio:40,coste:20,fisico:true},{nombre:'Bird Strike',desc:'Cuervo suicida',danio:60,coste:35},{nombre:'Patada',desc:'Golpe',danio:80,coste:50,fisico:true},{nombre:'Golpe de Mango',desc:'Contundente',danio:100,coste:65,fisico:true},{nombre:'Ataque Rápido',desc:'Veloz',danio:140,coste:120,fisico:true}]},
  {id:18, nombre:'Inumaki Toge',       tipo:'hechicero', hp:360,  energia:300,  emoji:'言', color:'#88ccff', gradiente:'linear-gradient(135deg,#001522,#88ccff)',    puedeEspeciales:true,
    habilidades:[{nombre:'¡Explota!',desc:'Comando explosión',danio:40,coste:20},{nombre:'¡Aplastate!',desc:'Presión',danio:60,coste:35},{nombre:'Grito Sónico',desc:'Onda choque',danio:80,coste:50},{nombre:'Golpe Leve',desc:'Físico',danio:100,coste:65,fisico:true},{nombre:'Sentencia Final',desc:'Daño+autolesión',danio:140,coste:120,efecto:'autolesion'}]},
  {id:19, nombre:'Panda',              tipo:'hechicero', hp:550,  energia:200,  emoji:'熊', color:'#cccccc', gradiente:'linear-gradient(135deg,#111111,#888888)',    puedeEspeciales:true,
    habilidades:[{nombre:'Núcleo Gorila',desc:'Fuerza',danio:40,coste:20,fisico:true},{nombre:'Cañón Tambor',desc:'Interno',danio:60,coste:35},{nombre:'Núcleo Rhino',desc:'Embestida',danio:80,coste:50,fisico:true},{nombre:'Zarpazo',desc:'Físico',danio:100,coste:65,fisico:true},{nombre:'Trío de Golpes',desc:'Combo final',danio:140,coste:120,fisico:true}]},
  {id:20, nombre:'Hiromi Higuruma',    tipo:'hechicero', hp:470,  energia:380,  emoji:'⚖', color:'#8888cc', gradiente:'linear-gradient(135deg,#0a0a22,#8888cc)',    puedeEspeciales:true,
    habilidades:[{nombre:'Golpe de Mazo',desc:'Físico Judgeman',danio:55,coste:20,fisico:true},{nombre:'Confiscación',desc:'Debilita 2T',danio:40,coste:35,efecto:'debilitar'},{nombre:'Testigo de Cargo',desc:'Evidencia',danio:75,coste:50},{nombre:'VEREDICTO: CULPABLE',desc:'Daño+inmov 1T',danio:100,coste:80,efecto:'inmovilizar1'},{nombre:'EXPANSIÓN: TRIBUNAL MALDITO',desc:'Juicio Judgeman',danio:0,coste:120,dominio:true,efectoDominio:'tribunal'}]},
  {id:21, nombre:'Angel (Hana Kurusu)',tipo:'hechicero', hp:440,  energia:420,  emoji:'✝', color:'#ffeecc', gradiente:'linear-gradient(135deg,#1a1533,#ffeecc)',    puedeEspeciales:true,
    habilidades:[{nombre:'Tajo Celestial',desc:'Ignora defensa',danio:60,coste:25,fisico:true},{nombre:'Purificación',desc:'Elimina efectos+80HP',danio:0,coste:40,efecto:'purificar'},{nombre:'Lluvia de Plumas',desc:'Ráfaga angélica',danio:75,coste:55},{nombre:'JACOB: ANIQUILACIÓN',desc:'Doble daño maldiciones',danio:110,coste:85,fisico:true,efecto:'jacob'},{nombre:'ESCALERA DE JACOB',desc:'Atraviesa defensa',danio:180,coste:130,fisico:true}]},
  {id:22, nombre:'Kenjaku',            tipo:'hechicero', hp:580,  energia:550,  emoji:'脳', color:'#cc44ff', gradiente:'linear-gradient(135deg,#110022,#cc44ff)',    puedeEspeciales:true,
    habilidades:[{nombre:'Manipulación de Maldiciones',desc:'Horda robada',danio:65,coste:25},{nombre:'Técnica Robada: Ultravioleta',desc:'Rayo copiado',danio:90,coste:45},{nombre:'Barrera Anti-Hechicero',desc:'Suprime CE rival 2T',danio:30,coste:60,efecto:'suprimir'},{nombre:'UZUMAKI MODIFICADO',desc:'Combinación',danio:130,coste:90},{nombre:'EXPANSIÓN: GRAN JUEGO',desc:'Inmov 2T+drena CE',danio:60,coste:130,dominio:true,efecto:'gran-juego',efectoDominio:'gran-juego'}]},
  {id:23, nombre:'Naoya Zenin',        tipo:'hechicero', hp:460,  energia:300,  emoji:'風', color:'#aaffee', gradiente:'linear-gradient(135deg,#001a15,#aaffee)',    puedeEspeciales:true,
    habilidades:[{nombre:'Vórtice',desc:'Espiral aire',danio:65,coste:20,fisico:true},{nombre:'Ventilación: Ráfaga',desc:'Múltiples impactos',danio:80,coste:35,fisico:true},{nombre:'Barrera de Sonido',desc:'Inmov 1T',danio:55,coste:50,fisico:true,efecto:'inmovilizar1'},{nombre:'Ventilación: Espiral Letal',desc:'Desgarra',danio:120,coste:75,fisico:true},{nombre:'Torrente: Última Velocidad',desc:'Potencia+1T',danio:140,coste:100,fisico:true,efecto:'potenciar'}]},
  {id:24, nombre:'Yuki Tsukumo',       tipo:'hechicero', hp:530,  energia:380,  emoji:'重', color:'#aa66ff', gradiente:'linear-gradient(135deg,#0a0022,#aa66ff)',    puedeEspeciales:true,
    habilidades:[{nombre:'Puñetazo de Masa Virtual',desc:'Peso aplastante',danio:70,coste:20,fisico:true},{nombre:'Garuda: Embestida',desc:'Masa virtual',danio:90,coste:40},{nombre:'Masa Virtual: Escudo',desc:'Defensa+contragolpe',danio:40,coste:55,efecto:'escudo-masa'},{nombre:'Garuda: Impacto Gravitacional',desc:'Deforma espacio',danio:115,coste:80,fisico:true},{nombre:'MASA VIRTUAL: COLAPSO ESTELAR',desc:'Singularidad',danio:170,coste:125,fisico:true}]},
];

// ── Socket — selección online ──
socket.on('phase_change', ({ fase, characters }) => {
  if (fase !== 'character_select') return;
  showScreen('screen-select');
  renderCharacterGrid(characters);
  document.getElementById('select-status').textContent = 'Elige tu personaje.';
});

function renderCharacterGrid(chars) {
  const hGrid = document.getElementById('hechiceros-grid');
  const mGrid = document.getElementById('maldiciones-grid');
  if (!hGrid || !mGrid) {
    const g = document.getElementById('characters-grid');
    if (g) { g.innerHTML = ''; chars.forEach(c => addCharCard(c, g)); }
    return;
  }
  hGrid.innerHTML = ''; mGrid.innerHTML = '';
  chars.filter(c => c.tipo === 'hechicero').forEach(c => addCharCard(c, hGrid));
  chars.filter(c => c.tipo === 'maldicion').forEach(c => addCharCard(c, mGrid));
}

function renderCharacterGridOffline() { renderCharacterGrid(CHARS_OFFLINE); }

function addCharCard(c, grid) {
  const card = document.createElement('div');
  card.className = 'char-card'; card.dataset.id = c.id;
  card.innerHTML = `
    <div class="card-bg" style="background:${c.gradiente}"></div>
    <div class="card-overlay"></div>
    <div class="card-tipo ${c.tipo}">${c.tipo === 'maldicion' ? 'Maldición' : 'Hechicero'}</div>
    <div class="card-emoji">${c.emoji}</div>
    <div class="card-name">${c.nombre}</div>
  `;
  card.addEventListener('click', () => onCharClick(c, card));
  card.addEventListener('mouseenter', () => showPreview(c));
  grid.appendChild(card);
}

function onCharClick(c, card) {
  if (card.classList.contains('selected-other') || card.classList.contains('disabled')) return;
  document.querySelectorAll('.char-card.selected-you').forEach(el => {
    el.classList.remove('selected-you'); el.querySelector('.card-selected-badge:not([data-rival])')?.remove();
  });
  card.classList.add('selected-you');
  const badge = document.createElement('div');
  badge.className = 'card-selected-badge'; badge.textContent = 'TÚ'; badge.style.color = '#e8b84b';
  card.appendChild(badge);

  if (MODO_OFFLINE) {
    // Guardar selección en la sala compartida
    const salaData = JSON.parse(localStorage.getItem('jjk_sala_' + state.roomId) || '{}');
    salaData.players[state.playerIdx].charIdx = c.id;
    localStorage.setItem('jjk_sala_' + state.roomId, JSON.stringify(salaData));
    // El evento 'storage' notificará a la otra ventana

    // Comprobar si los dos ya han elegido (esta ventana no recibe su propio evento storage)
    const rivalIdx   = 1 - state.playerIdx;
    const rivalReady = salaData.players[rivalIdx]?.charIdx != null;
    document.getElementById('select-status').textContent =
      rivalReady ? '¡Ambos listos! Iniciando combate...' : `Seleccionaste: ${c.nombre} — esperando al rival...`;

    // Solo el J0 inicia el combate cuando ambos están listos
    if (state.playerIdx === 0 && rivalReady) {
      startBattleOffline(salaData);
    }
  } else {
    socket.emit('select_character', { charIdx: c.id });
    document.getElementById('select-status').textContent = `Seleccionaste: ${c.nombre} — esperando al rival...`;
  }
}

// ── Socket — selección online: notificar rival ──
socket.on('character_selected', ({ playerIdx, charIdx }) => {
  if (playerIdx === state.playerIdx) return;
  _markRivalCard(charIdx);
});

function showPreview(c) {
  const habs = c.habilidades || [];
  document.getElementById('select-preview').innerHTML = `
    <div class="preview-content">
      <div class="preview-char">
        <div class="preview-emoji" style="text-shadow:0 0 15px ${c.color}">${c.emoji}</div>
        <div class="preview-info">
          <h3>${c.nombre}</h3>
          <div class="preview-type">${c.tipo === 'maldicion' ? 'Maldición' : 'Hechicero'} · HP ${c.hp} · CE ${c.energia}</div>
        </div>
      </div>
      <div class="preview-habs">
        ${habs.map(h => `<div class="hab-tag${h.dominio ? ' dominio' : ''}">${h.nombre}</div>`).join('')}
      </div>
    </div>`;
}

// ════════════════════════════════════════════════════
//  INICIO DE COMBATE — modo offline
// ════════════════════════════════════════════════════
function startBattleOffline(salaData) {
  const char0Data = CHARS_OFFLINE.find(c => c.id === salaData.players[0].charIdx);
  const char1Data = CHARS_OFFLINE.find(c => c.id === salaData.players[1].charIdx);
  if (!char0Data || !char1Data) return showToast('Error cargando personajes');

  const curanderos = ['Gojo Satoru','Sukuna','Yuta Okkotsu','Maki Zenin','Toji Fushiguro'];
  const mkChar = (def, idx) => ({
    ...def, hp: def.hp, maxHp: def.hp, energia: def.energia, maxEnergia: def.energia,
    playerIdx: idx, burnout: 0, inmortal: 0, inmovilizado: 0, potenciado: 0,
    causaInmovilizacion: 'técnica enemiga', defendiendo: false, dominioActivo: false,
    puedeEspeciales: def.puedeEspeciales !== false && (def.energia > 0 || def.nombre === 'Gojo Satoru'),
    puedeCurarse: curanderos.includes(def.nombre),
  });

  state.chars       = [mkChar(char0Data, 0), mkChar(char1Data, 1)];
  state.playerNames = [salaData.players[0].name, salaData.players[1].name];
  state.turnoActivo = 0;
  // state.playerIdx ya está fijo desde create/join — NO se sobreescribe
  state.dominio     = null;
  state.offlineLog  = [
    { msg: '⚔️ ¡EL COMBATE COMIENZA!' },
    { msg: `${state.chars[0].nombre} VS ${state.chars[1].nombre}` }
  ];

  // Guardar estado inicial en localStorage → la ventana del J1 recibirá el evento storage
  saveBattleToStorage();

  showScreen('screen-battle');
  renderBattle();
  renderLog(state.offlineLog);
  updateDomainOverlay(null);
  _actualizarPanelOffline();   // J0: botones activos; J1: esperará el evento storage
}

// ════════════════════════════════════════════════════
//  MOTOR DE COMBATE — modo offline
// ════════════════════════════════════════════════════
function offlineLog(msg) {
  state.offlineLog = [{ msg }, ...state.offlineLog].slice(0, 40);
}

function offlineDmg(atacante, hab) {
  let d = hab ? (hab.danio || 30) : 30;
  if (atacante.potenciado > 0) d = Math.floor(d * 1.5);
  else if (atacante.potenciado < 0) d = Math.floor(d * 0.6);
  if (atacante.dominioActivo) d = Math.floor(d * 1.3);
  const isFisico = hab ? !!hab.fisico : true;
  let bf = false;
  if (isFisico && atacante.puedeEspeciales) {
    bf = (hab?.nombre?.includes('Destello Negro')) || Math.random() < 0.05;
  }
  if (bf) { d = Math.floor(d * 2.5); offlineLog('💥 ¡DESTELLO NEGRO!'); }
  return d;
}

function offlineApply(defensor, dmg) {
  if (Math.random() < 0.15) { offlineLog(`💨 ¡${defensor.nombre} esquivó el ataque!`); return; }
  const d = defensor.defendiendo ? Math.floor(dmg / 2) : dmg;
  if (defensor.defendiendo) offlineLog(`🛡️ ${defensor.nombre} reduce el daño a la mitad.`);
  defensor.hp = Math.max(0, defensor.hp - d);
  offlineLog(`${defensor.nombre} recibe ${d} de daño. (HP: ${defensor.hp}/${defensor.maxHp})`);
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
    offlineApply(def, offlineDmg(at, null));

  } else if (type === 'defend') {
    at.defendiendo = true;
    offlineLog(`🛡️ ${at.nombre} se pone en guardia.`);

  } else if (type === 'recargar') {
    at.energia = Math.min(at.maxEnergia, at.energia + 80);
    offlineLog(`⚡ ${at.nombre} recarga 80 CE. (CE: ${at.energia}/${at.maxEnergia})`);

  } else if (type === 'curar') {
    const esFisico = at.nombre === 'Maki Zenin' || at.nombre === 'Toji Fushiguro';
    const cost = at.nombre === 'Gojo Satoru' ? 5 : esFisico ? 0 : 50;
    if (!esFisico && at.energia < cost) {
      offlineLog(`⚠️ CE insuficiente para curarse.`);
      _actualizarPanelOffline(); return;
    }
    at.energia -= cost;
    const amount = esFisico ? 150 : 250;
    at.hp = Math.min(at.maxHp, at.hp + amount);
    offlineLog(`💚 ${at.nombre} se cura +${amount} HP. (HP: ${at.hp}/${at.maxHp})`);

  } else if (type === 'habilidad' && habIdx !== undefined) {
    const hab = at.habilidades[habIdx];
    if (!hab) { _actualizarPanelOffline(); return; }
    if (at.burnout > 0 && habIdx > 0) { offlineLog(`🔥 BURNOUT — solo habilidad 0.`); _actualizarPanelOffline(); return; }
    if (at.energia < (hab.coste || 0)) {
      offlineLog(`⚠️ CE insuficiente (necesita ${hab.coste}, tiene ${at.energia}).`);
      _actualizarPanelOffline(); return;
    }
    at.energia -= (hab.coste || 0);
    offlineLog(`✨ ${at.nombre} usa: ${hab.nombre}`);

    // ── Efectos especiales ──
    if (hab.efecto === 'potenciar')     { at.potenciado = 2; offlineLog(`🔥 ${at.nombre} se potencia 2 turnos.`); }
    if (hab.efecto === 'debilitar')     { def.potenciado = Math.max(def.potenciado - 1, -2); offlineLog(`📜 ${def.nombre} debilitado.`); }
    if (hab.efecto === 'suprimir')      { def.potenciado = Math.max(def.potenciado - 2, -2); def.energia = 0; offlineLog(`🔮 ${def.nombre} suprimido.`); }
    if (hab.efecto === 'inmovilizar1')  { def.inmovilizado = 1; offlineLog(`⛓ ${def.nombre} inmovilizado 1T.`); }
    if (hab.efecto === 'inmovilizar2')  { def.inmovilizado = 2; offlineLog(`⛓ ${def.nombre} inmovilizado 2T.`); }
    if (hab.efecto === 'gran-juego')    { def.inmovilizado = 2; def.energia = 0; offlineLog(`🌀 ${def.nombre} inmovilizado 2T y sin CE.`); }
    if (hab.efecto === 'purificar')     { at.burnout = 0; at.inmovilizado = 0; at.hp = Math.min(at.maxHp, at.hp + 80); offlineLog(`✝️ Purificación: efectos eliminados +80 HP.`); }
    if (hab.efecto === 'escudo-masa')   { at.defendiendo = true; def.hp = Math.max(0, def.hp - 40); offlineLog(`⚫ Masa Virtual: Escudo + contraataque 40 dmg.`); }
    if (hab.efecto === 'autolesion')    { const sl = Math.floor((hab.danio||0) * 0.2); at.hp = Math.max(0, at.hp - sl); offlineLog(`🩸 ${at.nombre} sufre ${sl} de retroceso.`); }
    if (hab.efecto === 'jacob' && def.tipo === 'maldicion') {
      offlineLog(`✝️ JACOB: ANIQUILACIÓN — daño doble a maldición!`);
      const d2 = (hab.danio || 0) * 2; def.hp = Math.max(0, def.hp - d2);
      offlineLog(`${def.nombre} recibe ${d2} de daño angélico. (HP: ${def.hp}/${def.maxHp})`);
      tickOfflineDominio(); finishOfflineTurn(); return;
    }

    // ── Dominio ──
    if (hab.dominio) {
      if (state.dominio?.ownerIdx === atIdx) { offlineLog(`⚠️ Ya tienes un dominio activo.`); tickOfflineDominio(); finishOfflineTurn(); return; }
      if (state.dominio && state.dominio.ownerIdx !== atIdx) {
        // Choque simplificado en offline (sin minijuego de memoria)
        offlineLog(`⚡ ¡CHOQUE DE DOMINIOS! ${at.nombre} vs ${def.nombre}`);
        const atPrio = (at.nombre === 'Sukuna' || at.nombre === 'Kenjaku') ? 1 : 0;
        const defPrio= (def.nombre === 'Sukuna' || def.nombre === 'Kenjaku') ? 1 : 0;
        const atScore = atPrio + (Math.random() < 0.5 ? 1 : 0);
        const defScore= defPrio+ (Math.random() < 0.5 ? 1 : 0);
        if (atScore >= defScore) {
          offlineLog(`🏆 ¡${at.nombre} sobrepone su dominio!`);
          def.dominioActivo = false; def.burnout = 2;
          _activarDominioOffline(atIdx, hab);
        } else {
          offlineLog(`🛡️ ${def.nombre} mantiene su dominio intacto.`);
          at.burnout = 2;
        }
        tickOfflineDominio(); finishOfflineTurn(); return;
      }
      // Sin dominio rival → activar
      offlineLog(`🌀 ¡${at.nombre} EXPANDE SU DOMINIO — ${hab.nombre}!`);
      if (hab.efecto === 'gamble') {
        if (Math.random() < 0.33) { offlineLog(`🎰 ¡JACKPOT! CE infinita e inmortalidad 4T.`); at.inmortal = 4; at.energia = 9999; }
        else offlineLog(`💀 Mala suerte en el IDLE DEATH GAMBLE.`);
      }
      _activarDominioOffline(atIdx, hab);
      if ((hab.danio || 0) > 0) offlineApply(def, offlineDmg(at, hab));
      tickOfflineDominio(); finishOfflineTurn(); return;
    }

    if ((hab.danio || 0) > 0) offlineApply(def, offlineDmg(at, hab));
  }

  tickOfflineDominio();
  finishOfflineTurn();
}

function _activarDominioOffline(ownerIdx, hab) {
  state.dominio = { ownerIdx, nombre: hab.nombre, efectoDominio: hab.efectoDominio || '', turnosRestantes: 8 };
  state.chars[ownerIdx].dominioActivo = true;
  updateDomainOverlay(state.dominio);
}

function tickOfflineDominio() {
  if (!state.dominio) return;
  const dom = state.dominio, owner = state.chars[dom.ownerIdx], defIdx = 1 - dom.ownerIdx;
  if (owner.nombre === 'Sukuna') {
    state.chars[defIdx].hp = Math.max(0, state.chars[defIdx].hp - 50);
    offlineLog(`⚔️ Santuario Malévolo: 50 dmg pasivo.`);
  }
  if (owner.nombre === 'Kenjaku') {
    const d = Math.min(state.chars[defIdx].energia, 60);
    state.chars[defIdx].energia -= d;
    offlineLog(`🌀 Gran Juego drena ${d} CE.`);
  }
  dom.turnosRestantes--;
  if (dom.turnosRestantes <= 0) {
    offlineLog(`El dominio de ${owner.nombre} se ha disipado.`);
    owner.dominioActivo = false; owner.burnout = 2;
    state.dominio = null; updateDomainOverlay(null);
  }
}

function finishOfflineTurn() {
  const c0 = state.chars[0], c1 = state.chars[1];
  if (c0.hp <= 0 || c1.hp <= 0) {
    const wIdx = c0.hp > 0 ? 0 : 1;
    offlineLog(`🏆 ¡${state.chars[wIdx].nombre} [${state.playerNames[wIdx]}] ha ganado!`);
    renderBattle(); renderLog(state.offlineLog);
    // Guardar estado final con flag gameOver → la otra ventana mostrará el resultado
    saveBattleToStorage(true);
    setTimeout(() => _showGameOverOffline(), 800);
    return;
  }

  state.turnoActivo = 1 - state.turnoActivo;
  offlineLog(`--- Turno de ${state.chars[state.turnoActivo].nombre} (${state.playerNames[state.turnoActivo]}) ---`);

  renderBattle(); renderLog(state.offlineLog);
  updateDomainOverlay(state.dominio);

  // Guardar en localStorage ANTES de actualizar el panel de esta ventana.
  // La OTRA ventana recibirá el evento 'storage' y actualizará su UI.
  saveBattleToStorage();

  // Actualizar el panel de esta ventana según a quién corresponde el nuevo turno
  _actualizarPanelOffline();
}

// ════════════════════════════════════════════════════
//  BATALLA — handlers Socket (modo online)
// ════════════════════════════════════════════════════
socket.on('battle_start', ({ chars, playerNames, turnoActivo, log }) => {
  state.chars = chars; state.playerNames = playerNames; state.turnoActivo = turnoActivo;
  state.isMyTurn = false; state.actionPending = false;
  showScreen('screen-battle'); renderBattle(); renderLog(log);
  setActionPanelState('waiting', 'Esperando inicio...'); updateDomainOverlay(null);
});

// FIX: battle_update siempre resetea isMyTurn; your_turn lo vuelve a activar solo para el correcto
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

// ── Renderizado de batalla ──────────────────────────
function renderBattle() {
  for (let i = 0; i < 2; i++) {
    const c = state.chars[i]; if (!c) continue;
    document.getElementById(`name-${i}`).textContent        = c.nombre;
    document.getElementById(`player-name-${i}`).textContent = state.playerNames[i] || '';
    document.getElementById(`emoji-${i}`).textContent = c.emoji;
    document.getElementById(`aura-${i}`).style.background   = `radial-gradient(circle, ${c.color}55, transparent)`;
    document.getElementById(`sprite-${i}`).style.background = `radial-gradient(circle, ${c.color}22, transparent)`;
    const hpPct = c.maxHp > 0 ? Math.max(0, (c.hp / c.maxHp) * 100) : 0;
    const hpBar = document.getElementById(`hp-${i}`);
    hpBar.style.width = hpPct + '%';
    hpBar.className = 'bar-fill hp-bar' + (hpPct <= 20 ? ' low' : hpPct <= 50 ? ' mid' : '');
    document.getElementById(`hp-num-${i}`).textContent  = `${c.hp}/${c.maxHp}`;
    const enPct = c.maxEnergia > 0 ? Math.max(0, (c.energia / c.maxEnergia) * 100) : 0;
    document.getElementById(`en-${i}`).style.width      = enPct + '%';
    document.getElementById(`en-num-${i}`).textContent  = c.maxEnergia > 0 ? `${c.energia}/${c.maxEnergia}` : '—';
    renderStatusIcons(i, c);
  }
  const ac = state.chars[state.turnoActivo], ap = state.playerNames[state.turnoActivo];
  document.getElementById('turn-indicator').textContent = ac ? `${ap} — ${ac.nombre}` : '— TURNO —';

  const domInfo = document.getElementById('domain-info');
  if (state.dominio) {
    // BUG FIX: turnosRestantes cuenta acciones individuales (2 por ronda).
    // Mostramos rondas completas restantes = Math.ceil(turnosRestantes / 2)
    const turnosDisplay = Math.ceil(state.dominio.turnosRestantes / 2);
    domInfo.style.display = 'block';
    domInfo.textContent   = `🌀 ${state.dominio.nombre} (${turnosDisplay}T)`;
  } else {
    domInfo.style.display = 'none';
  }
}

function renderStatusIcons(idx, c) {
  const el = document.getElementById(`status-${idx}`); el.innerHTML = '';
  const add = (cls, text) => {
    const s = document.createElement('span'); s.className = `status-icon ${cls}`; s.textContent = text; el.appendChild(s);
  };
  if (c.burnout > 0)            add('burnout',        `🔥 Burnout ${c.burnout}T`);
  if (c.inmovilizado > 0)       add('inmovilizado',   `⛓ Inmov. ${c.inmovilizado}T`);
  if (c.potenciado > 0)         add('potenciado-pos', `⬆ Potenciado ${c.potenciado}T`);
  if (c.potenciado < 0)         add('potenciado-neg', `⬇ Debilitado`);
  if (c.dominioActivo)          add('dominio-activo', `🌀 Dominio`);
  if (c.espadaVerdugoActiva)    add('espada',         `⚔ Verdugo`);
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
  if (msg.includes('recibe') || msg.includes('daño')  || msg.includes('sufre')) return 'damage';
  if (msg.includes('DOMINIO')|| msg.includes('dominio')|| msg.includes('EXPANDE')) return 'domain';
  if (msg.includes('🏆')     || msg.includes('ganado') || msg.includes('GANADOR')) return 'win';
  return 'system';
}
function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function updateDomainOverlay(dominio) {
  const ov = document.getElementById('domain-overlay');
  if (!dominio?.efectoDominio) { ov.className = 'domain-overlay hidden'; return; }
  ov.className = `domain-overlay ${dominio.efectoDominio} active`;
}

// ════════════════════════════════════════════════════
//  PANEL DE ACCIONES
// ════════════════════════════════════════════════════
function setActionPanelState(mode, waitMsg = 'Turno del rival...') {
  document.getElementById('waiting-msg').classList.add('hidden');
  document.getElementById('action-menu').classList.add('hidden');
  document.getElementById('habilidades-menu').classList.add('hidden');
  if (mode === 'waiting') {
    document.getElementById('waiting-msg').innerHTML = `<div class="waiting-icon">⏳</div><div>${waitMsg}</div>`;
    document.getElementById('waiting-msg').classList.remove('hidden');
  } else if (mode === 'action') {
    renderActionMenu();
    document.getElementById('action-menu').classList.remove('hidden');
  }
}

function renderActionMenu() {
  // Siempre usar state.playerIdx — es el índice FIJO de esta ventana
  const me = state.chars[state.playerIdx]; if (!me) return;
  const cur = ['Gojo Satoru','Sukuna','Yuta Okkotsu','Maki Zenin','Toji Fushiguro'];
  document.getElementById('btn-recargar').style.display = me.puedeEspeciales ? '' : 'none';
  document.getElementById('btn-curar').style.display    = cur.includes(me.nombre) ? '' : 'none';
}

function sendAction(data) {
  if (MODO_OFFLINE) { processOfflineAction(data.type, data.habIdx); return; }
  if (!state.isMyTurn || state.actionPending) return;
  state.isMyTurn = false; state.actionPending = true;
  setActionPanelState('waiting', 'Procesando...');
  socket.emit('player_action', data);
}

function showHabilidades() {
  // Siempre usar state.playerIdx — es el índice FIJO de esta ventana
  const me = state.chars[state.playerIdx]; if (!me) return;
  const list = document.getElementById('hab-list'); list.innerHTML = '';
  me.habilidades.forEach((h, idx) => {
    const disabled = me.energia < (h.coste || 0) || (me.burnout > 0 && idx > 0);
    const item = document.createElement('div');
    item.className = `hab-item ${h.dominio ? 'dominio' : ''} ${disabled ? 'disabled' : ''}`;
    item.innerHTML = `
      <div>
        <div class="hab-item-name">${escHtml(h.nombre)}</div>
        <div class="hab-item-desc">${escHtml(h.desc || '')}</div>
      </div>
      <div class="hab-item-right">
        <div class="hab-item-cost">⚡ ${h.coste || 0}</div>
        ${(h.danio||0) > 0 ? `<div class="hab-item-dmg">⚔ ${h.danio}</div>` : ''}
      </div>`;
    if (!disabled) {
      item.addEventListener('click', () => {
        if (!state.isMyTurn || state.actionPending) return;
        document.getElementById('habilidades-menu').classList.add('hidden');
        sendAction({ type: 'habilidad', habIdx: idx });
      });
    }
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
  document.getElementById('clash-scores').textContent =
    `[${clashData.atacante}]  ${scores[0]}  —  ${scores[1]}  [${clashData.defensor}]`;
}
function renderClashRound(ronda, seq) {
  const roundEl = document.getElementById('clash-round-display');
  roundEl.classList.remove('hidden');
  document.getElementById('clash-waiting').classList.add('hidden');
  document.getElementById('clash-round-num').textContent = `RONDA ${ronda} DE 3`;
  document.getElementById('sequence-reveal').classList.add('hidden');
  document.getElementById('sequence-input-phase').classList.add('hidden');
  const showBtn = document.getElementById('btn-show-seq'); showBtn.style.display = '';
  showBtn.onclick = () => {
    document.getElementById('seq-display').textContent = seq.join(' ');
    document.getElementById('sequence-reveal').classList.remove('hidden');
    showBtn.style.display = 'none';
  };
  document.getElementById('btn-hide-seq').onclick = () => {
    document.getElementById('sequence-reveal').classList.add('hidden');
    document.getElementById('sequence-input-phase').classList.remove('hidden');
    const inp = document.getElementById('seq-input'); inp.value = ''; inp.focus();
  };
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
  badge.className   = `gravedad-badge gravedad-${gravedad}`;
  badge.textContent = (gravedad===1?'⚪ LEVE':gravedad===2?'🟡 GRAVE':'🔴 FATAL') + (esApelacion ? ' — APELACIÓN' : '');
  document.getElementById('crime-text').textContent = `"${crimen}"`;
  const opts = document.getElementById('defense-options'); opts.innerHTML = '';
  options.forEach((opt, idx) => {
    const btn = document.createElement('button'); btn.className = 'defense-option';
    btn.textContent = `${idx + 1}. ${opt}`;
    btn.onclick = () => {
      acc.classList.add('hidden');
      document.getElementById('tribunal-waiting').classList.remove('hidden');
      document.getElementById('tribunal-waiting').innerHTML = '<div class="waiting-icon large">⚖️</div><div>Judgeman delibera...</div>';
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
//  GAME OVER (online)
// ════════════════════════════════════════════════════
socket.on('game_over', ({ winnerIdx, winnerChar, winnerPlayer, log }) => {
  showScreen('screen-gameover'); updateDomainOverlay(null);
  const esVictoria = winnerIdx === state.playerIdx;
  document.getElementById('winner-title').textContent = esVictoria ? '¡VICTORIA!' : 'DERROTA';
  document.getElementById('winner-title').style.color = esVictoria ? '#e8b84b' : '#cc2200';
  document.getElementById('winner-char').textContent   = winnerChar;
  document.getElementById('winner-player').textContent = winnerPlayer;
  document.getElementById('gameover-log').innerHTML =
    (log || []).slice(0, 15).map(e => `<div>${escHtml(e.msg || e)}</div>`).join('');
});
document.getElementById('btn-restart')?.addEventListener('click', () => {
  if (MODO_OFFLINE && state.roomId) {
    localStorage.removeItem('jjk_battle_' + state.roomId);
    localStorage.removeItem('jjk_sala_'   + state.roomId);
    sessionStorage.removeItem('jjk_offline_player_idx');
    sessionStorage.removeItem('jjk_offline_room_id');
  }
  location.reload();
});

// ════════════════════════════════════════════════════
//  MÚSICA — panel flotante
// ════════════════════════════════════════════════════
function buildMusicPanel() {
  const c = document.getElementById('music-tracks'); c.innerHTML = '';
  PISTAS.forEach(p => {
    const div = document.createElement('div');
    div.className = 'music-track' + (pistaActiva?.id === p.id ? ' active' : '');
    div.innerHTML = `
      <div class="music-track-icon">${p.icon}</div>
      <div class="music-track-info">
        <div class="music-track-title">${p.titulo}</div>
        <div class="music-track-artist">${p.artista}</div>
        <div class="music-track-context">${p.contexto}</div>
      </div>
      ${pistaActiva?.id === p.id ? '<span class="music-track-playing">♪</span>' : ''}`;
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
  else             { btn.classList.remove('playing'); label.textContent = 'Música'; }
}
document.getElementById('btn-music-float')?.addEventListener('click', () => { buildMusicPanel(); document.getElementById('music-panel').classList.toggle('hidden'); });
document.getElementById('btn-music-close')?.addEventListener('click', () => document.getElementById('music-panel').classList.add('hidden'));
document.getElementById('btn-music-off')?.addEventListener('click', () => {
  pistaActiva = null; detenerMusica(); updateMusicBtn(); buildMusicPanel();
  document.getElementById('music-panel').classList.add('hidden');
  showToast('🔇 Música desactivada');
});
document.addEventListener('click', e => {
  const panel = document.getElementById('music-panel'), btn = document.getElementById('btn-music-float');
  if (!panel.classList.contains('hidden') && !panel.contains(e.target) && e.target !== btn && !btn?.contains(e.target))
    panel.classList.add('hidden');
});

// ════════════════════════════════════════════════════
//  DESCONEXIÓN (online)
// ════════════════════════════════════════════════════
socket.on('player_disconnected', ({ msg }) => { showToast(`❌ ${msg}`, 5000); setTimeout(() => location.reload(), 4000); });
socket.on('connect_error', () => showToast('❌ No se puede conectar al servidor.', 5000));