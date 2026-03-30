'use strict';
/* ══════════════════════════════════════════════════
   JJK BATTLE — CLIENT
   Flujo: screen-main → screen-lobby → screen-select → screen-battle
   ══════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════════════════
// MODO HÍBRIDO: Socket.io (con servidor) o localStorage (sin servidor)
// ═══════════════════════════════════════════════════════════════

let socket;
let MODO_OFFLINE = false;
let eventHandlers = {};

// Helper para disparar eventos (funciona en ambos modos)
function triggerEvent(event, data) {
  if (eventHandlers[event]) {
    eventHandlers[event].forEach(h => {
      setTimeout(() => h(data), 0);
    });
  }
}

// Modo Socket.io - con servidor
if (typeof io !== 'undefined') {
  socket = io({
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    transports: ['websocket', 'polling']
  });
  console.log('Socket.io conectando...');
  
  socket.on('connect', () => {
    console.log('✅ Socket.io conectado al servidor');
    MODO_OFFLINE = false;
  });
  
  socket.on('connect_error', (error) => {
    console.error('❌ Error de conexión Socket.io:', error);
  });
  
  socket.on('disconnect', (reason) => {
    console.warn('⚠️ Socket.io desconectado:', reason);
  });
} else {
  // Modo offline - localStorage
  MODO_OFFLINE = true;
  console.log('🔌 Modo OFFLINE activado - usando almacenamiento local');
  
  // Crear socket simulado con métodos que funcionen
  socket = {
    on: function(event, handler) {
      if (!eventHandlers[event]) eventHandlers[event] = [];
      eventHandlers[event].push(handler);
    },
    emit: function(event, data) {
      // En modo offline, simulamos la respuesta del servidor
      handleOfflineEmit(event, data);
    },
    off: () => {},
    connected: false
  };
  
  // Verificar cambios cada 500ms (para sincronización entre pestañas)
  let lastCheck = {};
  setInterval(() => {
    const rooms = localStorage.getItem('jjk_latest_room');
    if (rooms) {
      const roomData = localStorage.getItem('jjk_sala_' + rooms);
      if (roomData && roomData !== lastCheck[rooms]) {
        lastCheck[rooms] = roomData;
        const sala = JSON.parse(roomData);
        // Aquí se dispararían eventos si detectamos cambios
      }
    }
  }, 500);
}

// Manejar emit en modo offline
function handleOfflineEmit(event, data) {
  if (!MODO_OFFLINE) return;
  
  // Simular respuestas del servidor para eventos
  switch(event) {
    case 'create_room':
      // El botón ya crea la sala, así que triggerEvent('room_created', ...)
      break;
    case 'join_room':
      // El botón ya se une, triggerEvent('room_joined', ...)
      break;
  }
}

// ── Estado global ────────────────────────────────────
const state = {
  playerIdx:    null,
  roomId:       null,
  chars:        [null, null],
  playerNames:  ['', ''],
  turnoActivo:  0,
  isMyTurn:     false,
  dominio:      null
};

// ── Catálogo de pistas ───────────────────────────────
const PISTAS = [
  { id:1, titulo:'Kaikai Kitan',     artista:'Eve',            contexto:'Opening 1 — Temporada 1',      icon:'🔥' },
  { id:2, titulo:'SPECIALZ',          artista:'King Gnu',       contexto:'Opening Arco de Shibuya',       icon:'⚡' },
  { id:3, titulo:'Ao no Sumika',      artista:'Tatsuya Kitani', contexto:'Opening Inventario Oculto',     icon:'💫' },
  { id:4, titulo:'Lost in Paradise',  artista:'ALI ft. AKLO',   contexto:'Ending 1 — Temporada 1',        icon:'🌙' },
  { id:5, titulo:'more more JUMP!',   artista:'hololive',       contexto:'Pista especial del Colegio',    icon:'🎵' },
];
let pistaActiva = null;

// ════════════════════════════════════════════════════
//  UTILIDADES
// ════════════════════════════════════════════════════
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.classList.add('hidden');
  });
  const el = document.getElementById(id);
  if (el) { el.classList.remove('hidden'); el.classList.add('active'); }
}

function currentScreen() {
  const a = document.querySelector('.screen.active');
  return a ? a.id : null;
}

function showToast(msg, ms = 2500) {
  const t = document.getElementById('toast');
  if (!t) return console.log('Toast:', msg);
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.add('hidden'), ms);
}

// ════════════════════════════════════════════════════
//  INICIALIZACIÓN DEL DOM
// ════════════════════════════════════════════════════
function initializeUI() {
  // MENÚ PRINCIPAL
  const btnJugar = document.getElementById('btn-jugar');
  if (btnJugar) {
    btnJugar.addEventListener('click', () => {
      showScreen('screen-lobby');
    });
  }

  // LOBBY
  const btnBackLobby = document.getElementById('btn-back-lobby');
  if (btnBackLobby) {
    btnBackLobby.addEventListener('click', () => {
      showScreen('screen-main');
      const roomCode = document.getElementById('room-code-display');
      if (roomCode) roomCode.classList.add('hidden');
      const lobbyErr = document.getElementById('lobby-error');
      if (lobbyErr) lobbyErr.classList.add('hidden');
    });
  }

  const btnCreate = document.getElementById('btn-create');
  if (btnCreate) {
    btnCreate.addEventListener('click', () => {
      const name = document.getElementById('input-name').value.trim();
      if (!name) return showToast('Ingresa tu nombre de combatiente.');
      
      if (MODO_OFFLINE) {
        // MODO OFFLINE: crear sala localmente
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let roomCode = '';
        for (let i = 0; i < 4; i++) {
          roomCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        // Guardar sala en localStorage
        const sala = {
          id: roomCode,
          players: [{ name, charIdx: null }, { name: 'Esperando...', charIdx: null }],
          phase: 'waiting'
        };
        localStorage.setItem('jjk_sala_' + roomCode, JSON.stringify(sala));
        localStorage.setItem('jjk_latest_room', roomCode);
        
        state.roomId = roomCode;
        state.playerIdx = 0;
        state.playerNames[0] = name;
        document.getElementById('room-code-text').textContent = roomCode;
        document.getElementById('room-code-display').classList.remove('hidden');
        showToast('Sala creada: ' + roomCode + ' — esperando rival...');
        
        // Monitorear si alguien se unió
        window.checkPlayerJoined = setInterval(() => {
          const salaData = JSON.parse(localStorage.getItem('jjk_sala_' + roomCode) || '{}');
          if (salaData.players?.[1]?.name && salaData.players[1].name !== 'Esperando...') {
            clearInterval(window.checkPlayerJoined);
            state.playerNames[1] = salaData.players[1].name;
            showToast(`¡${state.playerNames[1]} se unió! Preparando selección...`);
            setTimeout(() => {
              showScreen('screen-select');
              // Cargar personajes (simplificado)
              renderCharacterGridOffline();
            }, 500);
          }
        }, 300);
      } else {
        socket.emit('create_room', { playerName: name });
      }
    });
  }

  const btnJoin = document.getElementById('btn-join');
  if (btnJoin) {
    btnJoin.addEventListener('click', () => {
      const name = document.getElementById('input-name').value.trim();
      const room = document.getElementById('input-room').value.trim().toUpperCase();
      if (!name) return showToast('Ingresa tu nombre.');
      if (!room) return showToast('Ingresa el código de sala.');
      
      if (MODO_OFFLINE) {
        // MODO OFFLINE: unirse a sala local
        const salaData = JSON.parse(localStorage.getItem('jjk_sala_' + room) || null);
        if (!salaData) return showToast('Sala no encontrada: ' + room);
        
        // Actualizar sala con el segundo jugador
        salaData.players[1] = { name, charIdx: null };
        salaData.phase = 'character_select';
        localStorage.setItem('jjk_sala_' + room, JSON.stringify(salaData));
        localStorage.setItem('jjk_latest_room', room);
        
        state.roomId = room;
        state.playerIdx = 1;
        state.playerNames = [salaData.players[0].name, name];
        showToast('¡Unido a sala ' + room + '! Preparando selección...');
        
        setTimeout(() => {
          showScreen('screen-select');
          renderCharacterGridOffline();
        }, 500);
      } else {
        socket.emit('join_room', { roomId: room, playerName: name });
      }
    });
  }

  const inputName = document.getElementById('input-name');
  if (inputName) {
    inputName.addEventListener('keydown', e => { 
      if (e.key === 'Enter') document.getElementById('btn-create').click(); 
    });
  }

  const inputRoom = document.getElementById('input-room');
  if (inputRoom) {
    inputRoom.addEventListener('keydown', e => { 
      if (e.key === 'Enter') document.getElementById('btn-join').click(); 
    });
  }
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeUI);
} else {
  initializeUI();
}

// Inicializar event listeners de batalla
function initializeBattleUI() {
  const btn1 = document.getElementById('btn-habilidades');
  const btn2 = document.getElementById('btn-ataque');
  const btn3 = document.getElementById('btn-guardia');
  const btn4 = document.getElementById('btn-recargar');
  const btn5 = document.getElementById('btn-curar');
  const btn6 = document.getElementById('btn-back-hab');
  
  if (btn1) {
    btn1.addEventListener('click', () => {
      if (!state.isMyTurn) return;
      document.getElementById('action-menu').classList.add('hidden');
      showHabilidades();
    });
  }
  
  if (btn2) {
    btn2.addEventListener('click', () => {
      if (!state.isMyTurn) return;
      sendAction({ type: 'basic' });
    });
  }
  
  if (btn3) {
    btn3.addEventListener('click', () => {
      if (!state.isMyTurn) return;
      sendAction({ type: 'defend' });
    });
  }
  
  if (btn4) {
    btn4.addEventListener('click', () => {
      if (!state.isMyTurn) return;
      sendAction({ type: 'recargar' });
    });
  }
  
  if (btn5) {
    btn5.addEventListener('click', () => {
      if (!state.isMyTurn) return;
      sendAction({ type: 'curar' });
    });
  }
  
  if (btn6) {
    btn6.addEventListener('click', () => {
      document.getElementById('habilidades-menu').classList.add('hidden');
      document.getElementById('action-menu').classList.remove('hidden');
    });
  }
}

// Llamar a initializeBattleUI después de initializeUI
setTimeout(initializeBattleUI, 100);

socket.on('room_created', ({ roomId, playerIdx }) => {
  state.roomId = roomId;
  state.playerIdx = playerIdx;
  document.getElementById('room-code-text').textContent = roomId;
  document.getElementById('room-code-display').classList.remove('hidden');
  document.getElementById('lobby-error').classList.add('hidden');
});

socket.on('room_joined', ({ roomId, playerIdx }) => {
  state.roomId = roomId;
  state.playerIdx = playerIdx;
});

socket.on('player_joined', ({ players }) => {
  showToast(`¡${players[1].name} se unió! Preparando selección...`);
});

socket.on('error', ({ msg }) => {
  const el = document.getElementById('lobby-error');
  el.textContent = msg;
  el.classList.remove('hidden');
});

// ════════════════════════════════════════════════════
//  SELECCIÓN DE PERSONAJE
// ════════════════════════════════════════════════════
socket.on('phase_change', ({ fase, characters }) => {
  if (fase !== 'character_select') return;
  showScreen('screen-select');
  renderCharacterGrid(characters);
  document.getElementById('select-status').textContent = 'Elige tu personaje. El rival selecciona en su pantalla.';
});

// Catálogo local de personajes (para modo offline)
const CHARS_OFFLINE = [
  {id:0, nombre:'Gojo Satoru', tipo:'hechicero', emoji:'∞', color:'#00c8ff', gradiente:'linear-gradient(135deg,#003c6e,#00c8ff)', habilidades:[{nombre:'Azul'},{nombre:'Rojo'},{nombre:'VACÍO PÚRPURA'},{nombre:'Destello Negro'},{nombre:'EXPANSIÓN: VACÍO INFINITO', dominio:true}]},
  {id:1, nombre:'Sukuna', tipo:'hechicero', emoji:'呪', color:'#cc2200', gradiente:'linear-gradient(135deg,#2a0000,#cc2200)', habilidades:[{nombre:'Desmantelar'},{nombre:'Cleave'},{nombre:'FUGA'},{nombre:'Golpe Físico'},{nombre:'EXPANSIÓN: SANTUARIO MALÉVOLO', dominio:true}]},
  {id:2, nombre:'Itadori Yuji', tipo:'hechicero', emoji:'拳', color:'#ff7700', gradiente:'linear-gradient(135deg,#3a1500,#ff7700)', habilidades:[{nombre:'Puño Divergente'},{nombre:'Destello Negro'},{nombre:'Artes Marciales'},{nombre:'Corte de Alma'},{nombre:'Rencor'}]},
  {id:3, nombre:'Maki Zenin', tipo:'hechicero', emoji:'武', color:'#00cc66', gradiente:'linear-gradient(135deg,#003a1a,#00cc66)', habilidades:[{nombre:'Nube Itinerante'},{nombre:'Katana Almas'},{nombre:'Lanza'},{nombre:'Ataque Pesado'},{nombre:'Masacre'}]},
  {id:4, nombre:'Toji Fushiguro', tipo:'hechicero', emoji:'剣', color:'#aaaaaa', gradiente:'linear-gradient(135deg,#1a1a1a,#aaaaaa)', habilidades:[{nombre:'Navaja Invertida'},{nombre:'Cadena'},{nombre:'Espada Alma'},{nombre:'Pistola'},{nombre:'Bendición'}]},
  {id:5, nombre:'Yuta Okkotsu', tipo:'hechicero', emoji:'愛', color:'#ff88cc', gradiente:'linear-gradient(135deg,#2a0022,#ff88cc)', habilidades:[{nombre:'Copia: Discurso'},{nombre:'Corte con Katana'},{nombre:'Rika: Ataque Físico'},{nombre:'RAYO DE AMOR VERDADERO'},{nombre:'EXPANSIÓN: AMOR MUTUO', dominio:true}]},
  {id:7, nombre:'Mahito', tipo:'maldicion', emoji:'魂', color:'#9933ff', gradiente:'linear-gradient(135deg,#1a0033,#9933ff)', habilidades:[{nombre:'Mutación'},{nombre:'Polimorfismo'},{nombre:'Isomería'},{nombre:'Cuchilla Corporal'},{nombre:'EXPANSIÓN: AUTOENCARNACIÓN', dominio:true}]},
  {id:8, nombre:'Jogo', tipo:'maldicion', emoji:'火', color:'#ff4400', gradiente:'linear-gradient(135deg,#2a0800,#ff4400)', habilidades:[{nombre:'Insectos'},{nombre:'Vértice'},{nombre:'Meteorito'},{nombre:'Palmas Ardientes'},{nombre:'EXPANSIÓN: ATAÚD DE LA MONTAÑA', dominio:true}]},
  {id:12, nombre:'Choso', tipo:'maldicion', emoji:'血', color:'#cc0033', gradiente:'linear-gradient(135deg,#1a0000,#cc0033)', habilidades:[{nombre:'Sangre Perforante'},{nombre:'Supernova'},{nombre:'Escala Roja'},{nombre:'Golpe de Ala'},{nombre:'Manantial'}]},
  {id:15, nombre:'Hanami', tipo:'maldicion', emoji:'花', color:'#44cc44', gradiente:'linear-gradient(135deg,#001a00,#44cc44)', habilidades:[{nombre:'Raíces'},{nombre:'Semillas'},{nombre:'Rayo Solar'},{nombre:'Golpe de Madera'},{nombre:'EXPANSIÓN: MAR DE FLORES', dominio:true}]},
  {id:22, nombre:'Kenjaku', tipo:'hechicero', emoji:'脳', color:'#cc44ff', gradiente:'linear-gradient(135deg,#110022,#cc44ff)', habilidades:[{nombre:'Manipulación de Maldiciones'},{nombre:'Técnica Robada: Ultravioleta'},{nombre:'Barrera Anti-Hechicero'},{nombre:'UZUMAKI MODIFICADO'},{nombre:'EXPANSIÓN: GRAN JUEGO', dominio:true}]},
]

function renderCharacterGrid(chars) {
  const hechicerosGrid = document.getElementById('hechiceros-grid');
  const maldicionesGrid = document.getElementById('maldiciones-grid');
  
  if (!hechicerosGrid || !maldicionesGrid) {
    // Si no existen las grillas separadas, crear una única grilla
    const grid = document.getElementById('characters-grid');
    if (!grid) return;
    grid.innerHTML = '';
    chars.forEach(c => addCharCard(c, grid));
    return;
  }
  
  // Separar personajes por tipo
  const hechiceros = chars.filter(c => c.tipo === 'hechicero');
  const maldiciones = chars.filter(c => c.tipo === 'maldicion');
  
  hechicerosGrid.innerHTML = '';
  maldicionesGrid.innerHTML = '';
  
  hechiceros.forEach(c => addCharCard(c, hechicerosGrid));
  maldiciones.forEach(c => addCharCard(c, maldicionesGrid));
}

function addCharCard(c, grid) {
  const card = document.createElement('div');
  card.className = 'char-card';
  card.dataset.id = c.id;
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

function renderCharacterGridOffline() {
  renderCharacterGrid(CHARS_OFFLINE);
}

function onCharClick(c, card) {
  if (card.classList.contains('selected-other') || card.classList.contains('disabled')) return;
  document.querySelectorAll('.char-card.selected-you').forEach(el => {
    el.classList.remove('selected-you');
    el.querySelector('.card-selected-badge')?.remove();
  });
  card.classList.add('selected-you');
  const badge = document.createElement('div');
  badge.className = 'card-selected-badge';
  badge.textContent = 'TÚ';
  badge.style.color = '#e8b84b';
  card.appendChild(badge);
  
  if (MODO_OFFLINE) {
    // MODO OFFLINE: guardar selección en localStorage
    const salaData = JSON.parse(localStorage.getItem('jjk_sala_' + state.roomId) || '{}');
    salaData.players[state.playerIdx].charIdx = c.id;
    localStorage.setItem('jjk_sala_' + state.roomId, JSON.stringify(salaData));
    
    // Monitorear si el otro jugador seleccionó
    if (!window.checkBothSelected) {
      window.checkBothSelected = setInterval(() => {
        const updated = JSON.parse(localStorage.getItem('jjk_sala_' + state.roomId) || '{}');
        if (updated.players[0]?.charIdx !== null && updated.players[1]?.charIdx !== null) {
          clearInterval(window.checkBothSelected);
          window.checkBothSelected = null;
          startBattleOffline(updated);
        }
      }, 300);
    }
  } else {
    socket.emit('select_character', { charIdx: c.id });
  }
  
  document.getElementById('select-status').textContent = `Seleccionaste: ${c.nombre} — esperando al rival...`;
}

// Función para iniciar batalla en modo offline
function startBattleOffline(salaData) {
  const char0Data = CHARS_OFFLINE.find(c => c.id === salaData.players[0].charIdx);
  const char1Data = CHARS_OFFLINE.find(c => c.id === salaData.players[1].charIdx);
  
  if (!char0Data || !char1Data) return showToast('Error cargando personajes');
  
  // Simular datos de personajes para la batalla
  const chars = [
    { ...char0Data, hp: 500, maxHp: 500, energia: 300, maxEnergia: 300, playerIdx: 0, inmovilizado: 0, potenciado: 0, defendiendo: false, dominioActivo: false },
    { ...char1Data, hp: 500, maxHp: 500, energia: 300, maxEnergia: 300, playerIdx: 1, inmovilizado: 0, potenciado: 0, defendiendo: false, dominioActivo: false }
  ];
  
  state.chars = chars;
  state.playerNames = [salaData.players[0].name, salaData.players[1].name];
  state.turnoActivo = 0;
  state.isMyTurn = false;
  state.dominio = null;
  
  // Guardar batalla en localStorage para sincronización
  const battleData = {
    chars: chars,
    turnoActivo: 0,
    dominio: null,
    log: ['⚔️ ¡EL COMBATE COMIENZA!', `${chars[0].nombre} VS ${chars[1].nombre}`]
  };
  localStorage.setItem('jjk_batalla_' + state.roomId, JSON.stringify(battleData));
  
  showScreen('screen-battle');
  renderBattle();
  renderLog(battleData.log);
  setActionPanelState('waiting');
  updateDomainOverlay(null);
}

socket.on('character_selected', ({ playerIdx, charIdx }) => {
  if (playerIdx === state.playerIdx) return;
  const card = document.querySelector(`.char-card[data-id="${charIdx}"]`);
  if (!card) return;
  card.classList.add('selected-other');
  const badge = document.createElement('div');
  badge.className = 'card-selected-badge';
  badge.textContent = 'RIVAL';
  badge.style.color = '#cc2200';
  card.appendChild(badge);
});

function showPreview(c) {
  const preview = document.getElementById('select-preview');
  const habs = c.habilidades || [];
  preview.innerHTML = `
    <div class="preview-content">
      <div class="preview-char">
        <div class="preview-emoji" style="text-shadow:0 0 15px ${c.color}">${c.emoji}</div>
        <div class="preview-info">
          <h3>${c.nombre}</h3>
          <div class="preview-type">${c.tipo === 'maldicion' ? 'Maldición' : 'Hechicero'} &nbsp;·&nbsp; HP ${c.hp} &nbsp;·&nbsp; CE ${c.energia}</div>
        </div>
      </div>
      <div class="preview-habs">
        ${habs.map(h => `<div class="hab-tag${h.dominio ? ' dominio' : ''}">${h.nombre}</div>`).join('')}
      </div>
    </div>
  `;
}

// ════════════════════════════════════════════════════
//  BATALLA — ÚNICA handler de battle_update
// ════════════════════════════════════════════════════
socket.on('battle_start', ({ chars, playerNames, turnoActivo, log }) => {
  state.chars = chars;
  state.playerNames = playerNames;
  state.turnoActivo = turnoActivo;
  state.isMyTurn = false;
  showScreen('screen-battle');
  renderBattle();
  renderLog(log);
  setActionPanelState('waiting');
  updateDomainOverlay(null);
});

// ÚNICO handler de battle_update — gestiona todas las transiciones de pantalla
socket.on('battle_update', ({ chars, turnoActivo, dominio, log }) => {
  state.chars = chars;
  state.turnoActivo = turnoActivo;
  state.dominio = dominio;

  // Si estamos en choque de dominios o tribunal, volver a la batalla
  const screen = currentScreen();
  if (screen === 'screen-clash' || screen === 'screen-tribunal') {
    showScreen('screen-battle');
  }

  renderBattle();
  renderLog(log);
  updateDomainOverlay(dominio);
});

socket.on('your_turn', ({ playerIdx }) => {
  if (playerIdx !== state.playerIdx) return;
  state.isMyTurn = true;
  setActionPanelState('action');
});

socket.on('opponent_turn', ({ playerIdx }) => {
  state.isMyTurn = false;
  const name = state.chars[playerIdx]?.nombre || 'rival';
  setActionPanelState('waiting', `Turno de ${name}...`);
});

socket.on('action_invalid', ({ log }) => {
  renderLog(log);
  showToast('⚠️ Acción inválida — intenta de nuevo.');
  // Re-habilitar el turno
  state.isMyTurn = true;
  setActionPanelState('action');
});

socket.on('domain_activated', ({ efectoDominio, ownerIdx }) => {
  updateDomainOverlay({ efectoDominio, ownerIdx, turnosRestantes: 4 });
});

// ── Renderizado de batalla ────────────────────────────
function renderBattle() {
  for (let i = 0; i < 2; i++) {
    const c = state.chars[i];
    if (!c) continue;

    document.getElementById(`name-${i}`).textContent = c.nombre;
    document.getElementById(`player-name-${i}`).textContent = state.playerNames[i] || '';

    // Sprite
    document.getElementById(`emoji-${i}`).textContent = c.emoji;
    document.getElementById(`aura-${i}`).style.background =
      `radial-gradient(circle, ${c.color}55, transparent)`;
    document.getElementById(`sprite-${i}`).style.background =
      `radial-gradient(circle, ${c.color}22, transparent)`;

    // HP bar
    const hpPct = c.maxHp > 0 ? Math.max(0, (c.hp / c.maxHp) * 100) : 0;
    const hpBar = document.getElementById(`hp-${i}`);
    hpBar.style.width = hpPct + '%';
    hpBar.className = 'bar-fill hp-bar' + (hpPct <= 20 ? ' low' : hpPct <= 50 ? ' mid' : '');
    document.getElementById(`hp-num-${i}`).textContent = `${c.hp}/${c.maxHp}`;

    // CE bar
    const enPct = c.maxEnergia > 0 ? Math.max(0, (c.energia / c.maxEnergia) * 100) : 0;
    document.getElementById(`en-${i}`).style.width = enPct + '%';
    document.getElementById(`en-num-${i}`).textContent =
      c.maxEnergia > 0 ? `${c.energia}/${c.maxEnergia}` : '—';

    renderStatusIcons(i, c);
  }

  // Indicador de turno
  const ac = state.chars[state.turnoActivo];
  const ap = state.playerNames[state.turnoActivo];
  document.getElementById('turn-indicator').textContent = ac ? `${ap} — ${ac.nombre}` : '— TURNO —';

  // Info dominio
  const domInfo = document.getElementById('domain-info');
  if (state.dominio) {
    domInfo.style.display = 'block';
    domInfo.textContent = `🌀 ${state.dominio.nombre} (${state.dominio.turnosRestantes}T)`;
  } else {
    domInfo.style.display = 'none';
  }
}

function renderStatusIcons(idx, c) {
  const el = document.getElementById(`status-${idx}`);
  el.innerHTML = '';
  const add = (cls, text) => {
    const s = document.createElement('span');
    s.className = `status-icon ${cls}`;
    s.textContent = text;
    el.appendChild(s);
  };
  if (c.burnout > 0)       add('burnout',        `🔥 Burnout ${c.burnout}T`);
  if (c.inmovilizado > 0)  add('inmovilizado',   `⛓ Inmov. ${c.inmovilizado}T`);
  if (c.potenciado > 0)    add('potenciado-pos', `⬆ Potenciado ${c.potenciado}T`);
  if (c.potenciado < 0)    add('potenciado-neg', `⬇ Debilitado`);
  if (c.dominioActivo)     add('dominio-activo', `🌀 Dominio`);
  if (c.espadaVerdugoActiva) add('espada',       `⚔ Verdugo`);
}

function renderLog(log) {
  const el = document.getElementById('battle-log');
  el.innerHTML = (log || []).map(entry => {
    const msg = entry.msg || entry;
    const cls = classLog(msg);
    return `<div class="log-entry ${cls}">${escHtml(msg)}</div>`;
  }).join('');
  el.scrollTop = 0;
}

function classLog(msg) {
  if (msg.includes('💥') || msg.includes('JACKPOT') || msg.includes('usa:')) return 'special';
  if (msg.includes('recibe') || msg.includes('daño') || msg.includes('sufre')) return 'damage';
  if (msg.includes('DOMINIO') || msg.includes('dominio') || msg.includes('EXPANDE')) return 'domain';
  if (msg.includes('🏆') || msg.includes('ganado') || msg.includes('GANADOR')) return 'win';
  return 'system';
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function updateDomainOverlay(dominio) {
  const ov = document.getElementById('domain-overlay');
  if (!dominio || !dominio.efectoDominio) {
    ov.className = 'domain-overlay hidden';
    return;
  }
  ov.className = `domain-overlay ${dominio.efectoDominio} active`;
}

// ════════════════════════════════════════════════════
//  PANEL DE ACCIONES
// ════════════════════════════════════════════════════
function setActionPanelState(mode, waitMsg = 'Turno del rival...') {
  const waiting   = document.getElementById('waiting-msg');
  const actionMenu= document.getElementById('action-menu');
  const habMenu   = document.getElementById('habilidades-menu');

  waiting.classList.add('hidden');
  actionMenu.classList.add('hidden');
  habMenu.classList.add('hidden');

  if (mode === 'waiting') {
    waiting.innerHTML = `<div class="waiting-icon">⏳</div><div>${waitMsg}</div>`;
    waiting.classList.remove('hidden');
  } else if (mode === 'action') {
    renderActionMenu();
    actionMenu.classList.remove('hidden');
  }
}

function renderActionMenu() {
  const me = state.chars[state.playerIdx];
  if (!me) return;

  document.getElementById('btn-recargar').style.display = me.puedeEspeciales ? '' : 'none';
  document.getElementById('btn-curar').style.display    = me.puedeCurarse    ? '' : 'none';
}

function sendAction(data) {
  state.isMyTurn = false;
  setActionPanelState('waiting', 'Procesando...');
  socket.emit('player_action', data);
}

function showHabilidades() {
  const me = state.chars[state.playerIdx];
  if (!me) return;
  const list = document.getElementById('hab-list');
  list.innerHTML = '';

  me.habilidades.forEach((h, idx) => {
    const disabled = me.energia < h.coste || (me.burnout > 0 && idx > 0);
    const item = document.createElement('div');
    item.className = `hab-item ${h.dominio ? 'dominio' : ''} ${disabled ? 'disabled' : ''}`;
    item.innerHTML = `
      <div>
        <div class="hab-item-name">${escHtml(h.nombre)}</div>
        <div class="hab-item-desc">${escHtml(h.desc)}</div>
      </div>
      <div class="hab-item-right">
        <div class="hab-item-cost">⚡ ${h.coste}</div>
        ${h.danio > 0 ? `<div class="hab-item-dmg">⚔ ${h.danio}</div>` : ''}
      </div>
    `;
    if (!disabled) {
      item.addEventListener('click', () => {
        if (!state.isMyTurn) return;
        document.getElementById('habilidades-menu').classList.add('hidden');
        sendAction({ type: 'habilidad', habIdx: idx });
      });
    }
    list.appendChild(item);
  });

  document.getElementById('habilidades-menu').classList.remove('hidden');
}

// ════════════════════════════════════════════════════
//  CHOQUE DE DOMINIOS
// ════════════════════════════════════════════════════
let clashData = null;
let clashRonda = 1;
let myClashSequence = null;

socket.on('domain_clash_begin', ({ atacante, defensor, atPrio, defPrio, scores }) => {
  clashData = { atacante, defensor, scores: [...scores] };
  showScreen('screen-clash');
  document.getElementById('clash-vs').textContent = `${atacante}  VS  ${defensor}`;
  updateClashScores(scores);
  if (atPrio || defPrio) {
    showToast(`⚠️ ${atPrio ? atacante : defensor} tiene prioridad de dominio (+1 pto)`, 3000);
  }
});

socket.on('domain_clash_round', ({ ronda, sequence, scores }) => {
  clashRonda = ronda;
  myClashSequence = sequence;
  updateClashScores(scores);
  renderClashRound(ronda, sequence);
});

function updateClashScores(scores) {
  if (!clashData) return;
  document.getElementById('clash-scores').textContent =
    `[${clashData.atacante}]  ${scores[0]}  —  ${scores[1]}  [${clashData.defensor}]`;
}

function renderClashRound(ronda, seq) {
  const roundEl = document.getElementById('clash-round-display');
  const waitEl  = document.getElementById('clash-waiting');
  roundEl.classList.remove('hidden');
  waitEl.classList.add('hidden');
  document.getElementById('clash-round-num').textContent = `RONDA ${ronda} DE 3`;

  // Reset state
  document.getElementById('sequence-reveal').classList.add('hidden');
  document.getElementById('sequence-input-phase').classList.add('hidden');
  const showBtn = document.getElementById('btn-show-seq');
  showBtn.style.display = '';

  showBtn.onclick = () => {
    document.getElementById('seq-display').textContent = seq.join(' ');
    document.getElementById('sequence-reveal').classList.remove('hidden');
    showBtn.style.display = 'none';
  };

  document.getElementById('btn-hide-seq').onclick = () => {
    document.getElementById('sequence-reveal').classList.add('hidden');
    document.getElementById('sequence-input-phase').classList.remove('hidden');
    const inp = document.getElementById('seq-input');
    inp.value = '';
    inp.focus();
  };

  document.getElementById('btn-submit-seq').onclick = submitClash;
  document.getElementById('seq-input').onkeydown = e => { if (e.key === 'Enter') submitClash(); };
}

function submitClash() {
  const input = document.getElementById('seq-input').value.trim();
  const seq   = input.split('').map(Number);
  document.getElementById('clash-round-display').classList.add('hidden');
  document.getElementById('clash-waiting').classList.remove('hidden');
  socket.emit('domain_clash_response', { sequence: seq, ronda: clashRonda });
}

// ════════════════════════════════════════════════════
//  TRIBUNAL MALDITO
// ════════════════════════════════════════════════════
socket.on('tribunal_begin', ({ efectoDominio, acusadoIdx }) => {
  showScreen('screen-tribunal');
  updateDomainOverlay({ efectoDominio });
  document.getElementById('tribunal-accusation').classList.add('hidden');
  document.getElementById('tribunal-appeal').classList.add('hidden');
  const w = document.getElementById('tribunal-waiting');
  w.classList.remove('hidden');
  w.innerHTML = acusadoIdx === state.playerIdx
    ? '<div class="waiting-icon large">⚖️</div><div>Judgeman prepara los cargos contra ti...</div>'
    : '<div class="waiting-icon large">⚖️</div><div>El acusado se defiende ante Judgeman...</div>';
});

socket.on('tribunal_accusation', ({ crimen, gravedad, options, esApelacion }) => {
  document.getElementById('tribunal-waiting').classList.add('hidden');
  document.getElementById('tribunal-appeal').classList.add('hidden');
  const acc = document.getElementById('tribunal-accusation');
  acc.classList.remove('hidden');

  const badge = document.getElementById('gravedad-badge');
  badge.className = `gravedad-badge gravedad-${gravedad}`;
  badge.textContent = (gravedad===1?'⚪ LEVE':gravedad===2?'🟡 GRAVE':'🔴 FATAL')
    + (esApelacion ? ' — APELACIÓN' : '');

  document.getElementById('crime-text').textContent = `"${crimen}"`;

  const opts = document.getElementById('defense-options');
  opts.innerHTML = '';
  options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'defense-option';
    btn.textContent = `${idx + 1}. ${opt}`;
    btn.onclick = () => {
      acc.classList.add('hidden');
      document.getElementById('tribunal-waiting').classList.remove('hidden');
      document.getElementById('tribunal-waiting').innerHTML =
        '<div class="waiting-icon large">⚖️</div><div>Judgeman delibera...</div>';
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

document.getElementById('btn-apelar').addEventListener('click', () => {
  document.getElementById('tribunal-appeal').classList.add('hidden');
  document.getElementById('tribunal-waiting').classList.remove('hidden');
  socket.emit('tribunal_appeal', { apela: true });
});

document.getElementById('btn-no-apelar').addEventListener('click', () => {
  document.getElementById('tribunal-appeal').classList.add('hidden');
  document.getElementById('tribunal-waiting').classList.remove('hidden');
  socket.emit('tribunal_appeal', { apela: false });
});

// ════════════════════════════════════════════════════
//  GAME OVER
// ════════════════════════════════════════════════════
socket.on('game_over', ({ winnerIdx, winnerChar, winnerPlayer, log }) => {
  showScreen('screen-gameover');
  updateDomainOverlay(null);
  const esVictoria = winnerIdx === state.playerIdx;
  document.getElementById('winner-title').textContent = esVictoria ? '¡VICTORIA!' : 'DERROTA';
  document.getElementById('winner-title').style.color = esVictoria ? '#e8b84b' : '#cc2200';
  document.getElementById('winner-char').textContent   = winnerChar;
  document.getElementById('winner-player').textContent = winnerPlayer;
  document.getElementById('gameover-log').innerHTML =
    (log || []).slice(0, 15).map(e => `<div>${escHtml(e.msg || e)}</div>`).join('');
});

document.getElementById('btn-restart').addEventListener('click', () => location.reload());

// ════════════════════════════════════════════════════
//  MÚSICA (panel flotante en la batalla)
// ════════════════════════════════════════════════════
function buildMusicPanel() {
  const c = document.getElementById('music-tracks');
  c.innerHTML = '';
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
      ${pistaActiva?.id === p.id ? '<span class="music-track-playing">♪</span>' : ''}
    `;
    div.addEventListener('click', () => {
      pistaActiva = p;
      updateMusicBtn();
      buildMusicPanel();
      document.getElementById('music-panel').classList.add('hidden');
      showToast(`♪ ${p.titulo} — ${p.artista}`, 2000);
    });
    c.appendChild(div);
  });
}

function updateMusicBtn() {
  const btn   = document.getElementById('btn-music-float');
  const label = document.getElementById('music-float-label');
  if (pistaActiva) {
    btn.classList.add('playing');
    label.textContent = pistaActiva.titulo;
  } else {
    btn.classList.remove('playing');
    label.textContent = 'Música';
  }
}

document.getElementById('btn-music-float').addEventListener('click', () => {
  buildMusicPanel();
  document.getElementById('music-panel').classList.toggle('hidden');
});

document.getElementById('btn-music-close').addEventListener('click', () => {
  document.getElementById('music-panel').classList.add('hidden');
});

document.getElementById('btn-music-off').addEventListener('click', () => {
  pistaActiva = null;
  updateMusicBtn();
  buildMusicPanel();
  document.getElementById('music-panel').classList.add('hidden');
  showToast('🔇 Música desactivada');
});

document.addEventListener('click', e => {
  const panel = document.getElementById('music-panel');
  const btn   = document.getElementById('btn-music-float');
  if (!panel.classList.contains('hidden')
    && !panel.contains(e.target)
    && e.target !== btn && !btn.contains(e.target)) {
    panel.classList.add('hidden');
  }
});

// ════════════════════════════════════════════════════
//  DESCONEXIÓN
// ════════════════════════════════════════════════════
socket.on('player_disconnected', ({ msg }) => {
  showToast(`❌ ${msg}`, 5000);
  setTimeout(() => location.reload(), 4000);
});

socket.on('connect_error', () => {
  showToast('❌ No se puede conectar al servidor.', 5000);
});
