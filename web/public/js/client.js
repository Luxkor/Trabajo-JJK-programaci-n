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

// ════════════════════════════════════════════════════
//  MÚSICA — HTML5 Audio con ficheros locales
//  Coloca los MP3 en: public/audio/
//    kaikai-kitan.mp3, specialz.mp3, ao-no-sumika.mp3, lost-in-paradise.mp3
//  Si el fichero no existe, se abre el vídeo en YouTube como fallback.
// ════════════════════════════════════════════════════
const PISTAS = [
  { id:1, titulo:'Kaikai Kitan',     artista:'Eve',           contexto:'Opening 1 — Temporada 1',   icon:'🔥',
    archivo:'audio/kaikai-kitan.mp3',    ytUrl:'https://www.youtube.com/watch?v=E8NtYTWPIkM' },
  { id:2, titulo:'SPECIALZ',         artista:'King Gnu',       contexto:'Opening Arco de Shibuya',   icon:'⚡',
    archivo:'audio/specialz.mp3',        ytUrl:'https://www.youtube.com/watch?v=R5RG3WzK3lQ' },
  { id:3, titulo:'Ao no Sumika',     artista:'Tatsuya Kitani', contexto:'Opening Inventario Oculto', icon:'💫',
    archivo:'audio/ao-no-sumika.mp3',    ytUrl:'https://www.youtube.com/watch?v=HtcmPFdLKX0' },
  { id:4, titulo:'Lost in Paradise', artista:'ALI ft. AKLO',   contexto:'Ending 1 — Temporada 1',    icon:'🌙',
    archivo:'audio/lost-in-paradise.mp3',ytUrl:'https://www.youtube.com/watch?v=9IkehDAMOTQ' },
];
let pistaActiva = null;

// Elemento <audio> que hace la reproducción real
const audioPlayer = new Audio();
audioPlayer.loop   = true;
audioPlayer.volume = 0.7;

function reproducirPista(pista) {
  if (!pista) return detenerMusica();
  audioPlayer.pause();
  audioPlayer.src = pista.archivo;

  const promise = audioPlayer.play();
  if (promise !== undefined) {
    promise.catch(() => {
      // MP3 no encontrado en public/audio/ → abrir YouTube en nueva pestaña
      showToast(`⚠️ MP3 no encontrado. Pon "${pista.archivo.split('/').pop()}" en public/audio/`, 4000);
      setTimeout(() => window.open(pista.ytUrl, '_blank'), 1500);
    });
  }
}

function detenerMusica() {
  audioPlayer.pause();
  audioPlayer.src = '';
}

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

  // ── Botones de batalla — adjuntados aquí, al mismo tiempo que todo lo demás ──
  // Razón: el setTimeout(100) anterior era frágil; si la pantalla de batalla
  // se mostraba antes, los listeners podían no estar adjuntados todavía.
  const bHab  = document.getElementById('btn-habilidades');
  const bAtq  = document.getElementById('btn-ataque');
  const bGrd  = document.getElementById('btn-guardia');
  const bRec  = document.getElementById('btn-recargar');
  const bCur  = document.getElementById('btn-curar');
  const bBack = document.getElementById('btn-back-hab');

  if (bHab)  bHab.addEventListener('click',  () => { if (!state.isMyTurn) return; document.getElementById('action-menu').classList.add('hidden'); showHabilidades(); });
  if (bAtq)  bAtq.addEventListener('click',  () => { if (!state.isMyTurn) return; sendAction({ type: 'basic' }); });
  if (bGrd)  bGrd.addEventListener('click',  () => { if (!state.isMyTurn) return; sendAction({ type: 'defend' }); });
  if (bRec)  bRec.addEventListener('click',  () => { if (!state.isMyTurn) return; sendAction({ type: 'recargar' }); });
  if (bCur)  bCur.addEventListener('click',  () => { if (!state.isMyTurn) return; sendAction({ type: 'curar' }); });
  if (bBack) bBack.addEventListener('click', () => { setActionPanelState('action'); }); // ← usa setActionPanelState en vez de manipular clases a mano
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeUI);
} else {
  initializeUI();
}

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

// Catálogo completo de personajes — debe coincidir con CHARACTERS en server.js
const CHARS_OFFLINE = [
  // ── HECHICEROS ──────────────────────────────────────────────────────────
  {id:0,  nombre:'Gojo Satoru',        tipo:'hechicero', hp:600,  energia:450,  emoji:'∞', color:'#00c8ff', gradiente:'linear-gradient(135deg,#003c6e,#00c8ff)',
    habilidades:[{nombre:'Azul',desc:'Atracción gravitacional',danio:40,coste:5},{nombre:'Rojo',desc:'Repulsión amplificada',danio:60,coste:5},{nombre:'VACÍO PÚRPURA',desc:'Borra todo lo que toca',danio:80,coste:5},{nombre:'Destello Negro',desc:'Impacto físico garantizado',danio:100,coste:5},{nombre:'EXPANSIÓN: VACÍO INFINITO',desc:'Inmoviliza al rival 2 turnos',danio:60,coste:15,dominio:true}]},
  {id:1,  nombre:'Sukuna',             tipo:'hechicero', hp:700,  energia:950,  emoji:'呪', color:'#cc2200', gradiente:'linear-gradient(135deg,#2a0000,#cc2200)',
    habilidades:[{nombre:'Desmantelar',desc:'Cortes malditos',danio:60,coste:20},{nombre:'Cleave',desc:'Cortes adaptados a la resistencia',danio:75,coste:35},{nombre:'FUGA',desc:'Flecha de fuego mortal',danio:100,coste:50},{nombre:'Golpe Físico',desc:'Velocidad sobrehumana',danio:80,coste:35},{nombre:'EXPANSIÓN: SANTUARIO MALÉVOLO',desc:'Cortes pasivos cada turno',danio:80,coste:120,dominio:true}]},
  {id:2,  nombre:'Itadori Yuji',       tipo:'hechicero', hp:550,  energia:250,  emoji:'拳', color:'#ff7700', gradiente:'linear-gradient(135deg,#3a1500,#ff7700)',
    habilidades:[{nombre:'Puño Divergente',desc:'Golpe con retraso maldito',danio:60,coste:20},{nombre:'Destello Negro',desc:'Crítico garantizado',danio:80,coste:35},{nombre:'Artes Marciales',desc:'Combo físico devastador',danio:100,coste:50},{nombre:'Corte de Alma',desc:'Daña directamente el alma',danio:120,coste:65},{nombre:'Rencor',desc:'Frenesí de golpes imparable',danio:140,coste:100}]},
  {id:3,  nombre:'Maki Zenin',         tipo:'hechicero', hp:650,  energia:0,    emoji:'武', color:'#00cc66', gradiente:'linear-gradient(135deg,#003a1a,#00cc66)',
    habilidades:[{nombre:'Nube Itinerante',desc:'Bastón maldito',danio:40,coste:0},{nombre:'Katana Almas',desc:'Corte de alma',danio:60,coste:0},{nombre:'Lanza',desc:'Estocada precisa',danio:80,coste:0},{nombre:'Ataque Pesado',desc:'Golpe bruto',danio:100,coste:0},{nombre:'Masacre',desc:'Frenesí veloz',danio:120,coste:0}]},
  {id:4,  nombre:'Toji Fushiguro',     tipo:'hechicero', hp:650,  energia:0,    emoji:'剣', color:'#aaaaaa', gradiente:'linear-gradient(135deg,#1a1a1a,#aaaaaa)',
    habilidades:[{nombre:'Navaja Invertida',desc:'Anula técnicas malditas',danio:40,coste:0},{nombre:'Cadena',desc:'Ataque de largo alcance',danio:60,coste:0},{nombre:'Espada Alma',desc:'Corte mortal',danio:80,coste:0},{nombre:'Pistola',desc:'Ataque a distancia',danio:100,coste:0},{nombre:'Bendición',desc:'Asalto en punto ciego',danio:120,coste:0}]},
  {id:5,  nombre:'Yuta Okkotsu',       tipo:'hechicero', hp:500,  energia:1000, emoji:'愛', color:'#ff88cc', gradiente:'linear-gradient(135deg,#2a0022,#ff88cc)',
    habilidades:[{nombre:'Copia: Discurso',desc:'Habla maldita copiada',danio:40,coste:20},{nombre:'Corte con Katana',desc:'Tajo básico',danio:60,coste:35},{nombre:'Rika: Ataque Físico',desc:'Puñetazo de Rika',danio:80,coste:50},{nombre:'RAYO DE AMOR VERDADERO',desc:'Haz concentrado de Rika',danio:100,coste:65},{nombre:'EXPANSIÓN: AMOR MUTUO',desc:'Potencia ataques 2 turnos',danio:60,coste:120,dominio:true}]},
  {id:6,  nombre:'Kinji Hakari',       tipo:'hechicero', hp:500,  energia:300,  emoji:'♠', color:'#ffcc00', gradiente:'linear-gradient(135deg,#1a1000,#ffcc00)',
    habilidades:[{nombre:'Puñetazo Áspero',desc:'Papel de lija maldito',danio:40,coste:20},{nombre:'Puerta Tren',desc:'Aplastamiento ferroviario',danio:60,coste:35},{nombre:'Combo',desc:'Golpes rítmicos',danio:80,coste:50},{nombre:'Cabezazo',desc:'Impacto de cráneo',danio:100,coste:65},{nombre:'EXPANSIÓN: IDLE DEATH GAMBLE',desc:'33% jackpot: inmortalidad 4T + CE infinita',danio:0,coste:120,dominio:true}]},
  {id:9,  nombre:'Megumi Fushiguro',   tipo:'hechicero', hp:420,  energia:350,  emoji:'影', color:'#4488ff', gradiente:'linear-gradient(135deg,#001033,#4488ff)',
    habilidades:[{nombre:'Perros Divinos',desc:'Ataque de shikigami',danio:40,coste:20},{nombre:'Nue',desc:'Descarga eléctrica',danio:60,coste:35},{nombre:'Elefante Máximo',desc:'Aplastamiento masivo',danio:80,coste:50},{nombre:'EXPANSIÓN: JARDÍN DE SOMBRAS',desc:'Dominio de sombras',danio:80,coste:65,dominio:true},{nombre:'MAHORAGA',desc:'Invoca al General Divino',danio:0,coste:100}]},
  {id:10, nombre:'Suguru Geto',        tipo:'hechicero', hp:500,  energia:500,  emoji:'霊', color:'#33aa44', gradiente:'linear-gradient(135deg,#001a00,#33aa44)',
    habilidades:[{nombre:'Maldiciones Menores',desc:'Horda de maldiciones',danio:40,coste:20},{nombre:'Calamar',desc:'Asfixia maldita',danio:60,coste:35},{nombre:'Dragón',desc:'Carga devastadora',danio:80,coste:50},{nombre:'Artes Marciales',desc:'Golpe físico preciso',danio:100,coste:65},{nombre:'UZUMAKI',desc:'Técnica Máxima concentrada',danio:140,coste:120}]},
  {id:11, nombre:'Nanami Kento',       tipo:'hechicero', hp:480,  energia:250,  emoji:'比', color:'#ccaa44', gradiente:'linear-gradient(135deg,#1a1400,#ccaa44)',
    habilidades:[{nombre:'Ratio 7:3',desc:'Punto débil maldito',danio:40,coste:20},{nombre:'Derrumbe',desc:'Destruye el entorno',danio:60,coste:35},{nombre:'Golpe Contundente',desc:'Fuerza bruta',danio:80,coste:50},{nombre:'Tajo',desc:'Corte limpio',danio:100,coste:65},{nombre:'Horas Extras',desc:'Liberación de energía reprimida',danio:140,coste:120}]},
  {id:13, nombre:'Aoi Todo',           tipo:'hechicero', hp:520,  energia:220,  emoji:'掌', color:'#ff6600', gradiente:'linear-gradient(135deg,#1a0a00,#ff6600)',
    habilidades:[{nombre:'Boogie Woogie',desc:'Intercambio posicional',danio:40,coste:20},{nombre:'Puñetazo',desc:'Golpe seco',danio:60,coste:35},{nombre:'Patada',desc:'Patada voladora',danio:80,coste:50},{nombre:'Aplauso Sorpresa',desc:'Desorienta al enemigo',danio:100,coste:65},{nombre:'Destello Negro',desc:'Impacto crítico garantizado',danio:140,coste:120}]},
  {id:14, nombre:'Nobara Kugisaki',    tipo:'hechicero', hp:400,  energia:250,  emoji:'钉', color:'#ff4488', gradiente:'linear-gradient(135deg,#1a000a,#ff4488)',
    habilidades:[{nombre:'Resonancia',desc:'Vínculo de alma',danio:40,coste:20},{nombre:'Horquilla',desc:'Explosión de clavo',danio:60,coste:35},{nombre:'Martillazo',desc:'Golpe cargado',danio:80,coste:50},{nombre:'Lluvia de Clavos',desc:'Área de clavos',danio:100,coste:65},{nombre:'Clavo Físico',desc:'Estocada final',danio:140,coste:120}]},
  {id:16, nombre:'Hajime Kashimo',     tipo:'hechicero', hp:490,  energia:400,  emoji:'雷', color:'#ffdd00', gradiente:'linear-gradient(135deg,#1a1500,#ffdd00)',
    habilidades:[{nombre:'Descarga',desc:'Rayo eléctrico seguro',danio:40,coste:20},{nombre:'Báculo Físico',desc:'Golpe conductor',danio:60,coste:35},{nombre:'Electrólisis',desc:'Vapor maldito',danio:80,coste:50},{nombre:'Patada Magnética',desc:'Ataque magnético',danio:100,coste:65},{nombre:'ÁMBAR MÍTICO',desc:'Forma final devastadora',danio:160,coste:120}]},
  {id:17, nombre:'Mei Mei',            tipo:'hechicero', hp:450,  energia:250,  emoji:'鸦', color:'#aa88ff', gradiente:'linear-gradient(135deg,#0a0022,#aa88ff)',
    habilidades:[{nombre:'Corte Hacha',desc:'Tajo de hacha',danio:40,coste:20},{nombre:'Bird Strike',desc:'Cuervo suicida letal',danio:60,coste:35},{nombre:'Patada',desc:'Golpe físico',danio:80,coste:50},{nombre:'Golpe de Mango',desc:'Ataque contundente',danio:100,coste:65},{nombre:'Ataque Rápido',desc:'Tajo veloz',danio:140,coste:120}]},
  {id:18, nombre:'Inumaki Toge',       tipo:'hechicero', hp:360,  energia:300,  emoji:'言', color:'#88ccff', gradiente:'linear-gradient(135deg,#001522,#88ccff)',
    habilidades:[{nombre:'¡Explota!',desc:'Comando fatal de explosión',danio:40,coste:20},{nombre:'¡Aplastate!',desc:'Presión gravitatoria',danio:60,coste:35},{nombre:'Grito Sónico',desc:'Onda de choque verbal',danio:80,coste:50},{nombre:'Golpe Leve',desc:'Físico básico',danio:100,coste:65},{nombre:'Sentencia Final',desc:'Daño extremo + autolesión 20%',danio:140,coste:120}]},
  {id:19, nombre:'Panda',              tipo:'hechicero', hp:550,  energia:200,  emoji:'熊', color:'#cccccc', gradiente:'linear-gradient(135deg,#111111,#888888)',
    habilidades:[{nombre:'Núcleo Gorila',desc:'Fuerza de gorila',danio:40,coste:20},{nombre:'Cañón Tambor',desc:'Daño interno',danio:60,coste:35},{nombre:'Núcleo Rhino',desc:'Embestida de rinoceronte',danio:80,coste:50},{nombre:'Zarpazo',desc:'Ataque físico',danio:100,coste:65},{nombre:'Trío de Golpes',desc:'Combo final definitivo',danio:140,coste:120}]},
  {id:20, nombre:'Hiromi Higuruma',    tipo:'hechicero', hp:470,  energia:380,  emoji:'⚖', color:'#8888cc', gradiente:'linear-gradient(135deg,#0a0a22,#8888cc)',
    habilidades:[{nombre:'Golpe de Mazo',desc:'Golpe físico de Judgeman',danio:55,coste:20},{nombre:'Confiscación',desc:'Debilita al rival 2 turnos',danio:40,coste:35},{nombre:'Testigo de Cargo',desc:'Evidencia maldita',danio:75,coste:50},{nombre:'VEREDICTO: CULPABLE',desc:'Daño masivo + inmoviliza 1T',danio:100,coste:80},{nombre:'EXPANSIÓN: TRIBUNAL MALDITO',desc:'Juicio de Judgeman',danio:0,coste:120,dominio:true}]},
  {id:21, nombre:'Angel (Hana Kurusu)',tipo:'hechicero', hp:440,  energia:420,  emoji:'✝', color:'#ffeecc', gradiente:'linear-gradient(135deg,#1a1533,#ffeecc)',
    habilidades:[{nombre:'Tajo Celestial',desc:'Corte que ignora defensa',danio:60,coste:25},{nombre:'Purificación',desc:'Elimina efectos negativos +80 HP',danio:0,coste:40},{nombre:'Lluvia de Plumas',desc:'Ráfaga angélica a distancia',danio:75,coste:55},{nombre:'JACOB: ANIQUILACIÓN',desc:'Daño doble a Maldiciones',danio:110,coste:85},{nombre:'ESCALERA DE JACOB',desc:'Técnica máxima: atraviesa toda defensa',danio:180,coste:130}]},
  {id:22, nombre:'Kenjaku',            tipo:'hechicero', hp:580,  energia:550,  emoji:'脳', color:'#cc44ff', gradiente:'linear-gradient(135deg,#110022,#cc44ff)',
    habilidades:[{nombre:'Manipulación de Maldiciones',desc:'Horda de maldiciones robadas',danio:65,coste:25},{nombre:'Técnica Robada: Ultravioleta',desc:'Rayo de energía copiado',danio:90,coste:45},{nombre:'Barrera Anti-Hechicero',desc:'Suprime CE rival 2 turnos',danio:30,coste:60},{nombre:'UZUMAKI MODIFICADO',desc:'Descarga de técnicas combinadas',danio:130,coste:90},{nombre:'EXPANSIÓN: GRAN JUEGO',desc:'Inmoviliza 2T + drena 60 CE/turno',danio:60,coste:130,dominio:true}]},
  {id:23, nombre:'Naoya Zenin',        tipo:'hechicero', hp:460,  energia:300,  emoji:'風', color:'#aaffee', gradiente:'linear-gradient(135deg,#001a15,#aaffee)',
    habilidades:[{nombre:'Vórtice',desc:'Espiral de aire comprimido',danio:65,coste:20},{nombre:'Ventilación: Ráfaga',desc:'Múltiples impactos de aire',danio:80,coste:35},{nombre:'Barrera de Sonido',desc:'Rompe barrera sónica, inmoviliza 1T',danio:55,coste:50},{nombre:'Ventilación: Espiral Letal',desc:'Vórtice que desgarra desde dentro',danio:120,coste:75},{nombre:'Torrente: Última Velocidad',desc:'Velocidad máxima, potencia +1T',danio:140,coste:100}]},
  {id:24, nombre:'Yuki Tsukumo',       tipo:'hechicero', hp:530,  energia:380,  emoji:'重', color:'#aa66ff', gradiente:'linear-gradient(135deg,#0a0022,#aa66ff)',
    habilidades:[{nombre:'Puñetazo de Masa Virtual',desc:'Peso aplastante en el puño',danio:70,coste:20},{nombre:'Garuda: Embestida',desc:'Shikigami con masa virtual máxima',danio:90,coste:40},{nombre:'Masa Virtual: Escudo',desc:'Defensa + contraataque 40 dmg',danio:40,coste:55},{nombre:'Garuda: Impacto Gravitacional',desc:'Deforma el espacio',danio:115,coste:80},{nombre:'MASA VIRTUAL: COLAPSO ESTELAR',desc:'Singularidad devastadora',danio:170,coste:125}]},
  // ── MALDICIONES ─────────────────────────────────────────────────────────
  {id:7,  nombre:'Mahito',             tipo:'maldicion', hp:450,  energia:350,  emoji:'魂', color:'#9933ff', gradiente:'linear-gradient(135deg,#1a0033,#9933ff)',
    habilidades:[{nombre:'Mutación',desc:'Altera el alma enemiga',danio:40,coste:20},{nombre:'Polimorfismo',desc:'Lanza transfigurados',danio:60,coste:35},{nombre:'Isomería',desc:'Clones de alma',danio:80,coste:50},{nombre:'Cuchilla Corporal',desc:'Brazo en cuchilla',danio:100,coste:65},{nombre:'EXPANSIÓN: AUTOENCARNACIÓN',desc:'Potencia ataques 2 turnos',danio:80,coste:120,dominio:true}]},
  {id:8,  nombre:'Jogo',               tipo:'maldicion', hp:380,  energia:450,  emoji:'火', color:'#ff4400', gradiente:'linear-gradient(135deg,#2a0800,#ff4400)',
    habilidades:[{nombre:'Insectos',desc:'Explosivos volcánicos',danio:40,coste:20},{nombre:'Vértice',desc:'Magma concentrado',danio:60,coste:35},{nombre:'Meteorito',desc:'Roca en llamas',danio:80,coste:50},{nombre:'Palmas Ardientes',desc:'Fuego directo',danio:100,coste:65},{nombre:'EXPANSIÓN: ATAÚD DE LA MONTAÑA',desc:'Potencia ataques 2 turnos',danio:80,coste:120,dominio:true}]},
  {id:12, nombre:'Choso',              tipo:'maldicion', hp:460,  energia:320,  emoji:'血', color:'#cc0033', gradiente:'linear-gradient(135deg,#1a0000,#cc0033)',
    habilidades:[{nombre:'Sangre Perforante',desc:'Rayo de sangre maldita',danio:40,coste:20},{nombre:'Supernova',desc:'Metralla de sangre',danio:60,coste:35},{nombre:'Escala Roja',desc:'Potencia sanguínea',danio:80,coste:50},{nombre:'Golpe de Ala',desc:'Cuchilla de sangre',danio:100,coste:65},{nombre:'Manantial',desc:'Inundación de sangre',danio:140,coste:120}]},
  {id:15, nombre:'Hanami',             tipo:'maldicion', hp:550,  energia:300,  emoji:'花', color:'#44cc44', gradiente:'linear-gradient(135deg,#001a00,#44cc44)',
    habilidades:[{nombre:'Raíces',desc:'Empalamiento subterráneo',danio:40,coste:20},{nombre:'Semillas',desc:'Drenaje de vida',danio:60,coste:35},{nombre:'Rayo Solar',desc:'Haz de luz concentrado',danio:80,coste:50},{nombre:'Golpe de Madera',desc:'Impacto forestal',danio:100,coste:65},{nombre:'EXPANSIÓN: MAR DE FLORES',desc:'Drena vida en área',danio:80,coste:120,dominio:true}]},
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

  // Usar estadísticas REALES del personaje (no hardcoded 500/300)
  const curanderos = ['Gojo Satoru','Sukuna','Yuta Okkotsu','Maki Zenin','Toji Fushiguro'];
  const mkChar = (def, idx) => ({
    ...def,
    hp: def.hp, maxHp: def.hp,
    energia: def.energia, maxEnergia: def.energia,
    playerIdx: idx,
    burnout: 0, inmortal: 0, inmovilizado: 0, potenciado: 0,
    causaInmovilizacion: 'técnica enemiga',
    defendiendo: false, dominioActivo: false,
    puedeEspeciales: !!(def.puedeEspeciales !== false && def.energia !== 0 || def.nombre === 'Gojo Satoru'),
    puedeCurarse: curanderos.includes(def.nombre),
  });

  const chars = [mkChar(char0Data, 0), mkChar(char1Data, 1)];

  state.chars       = chars;
  state.playerNames = [salaData.players[0].name, salaData.players[1].name];
  state.turnoActivo = 0;
  state.playerIdx   = 0;   // en offline, el jugador activo rota con el turno
  state.isMyTurn    = true;
  state.dominio     = null;
  state.offlineLog  = [
    { msg: `⚔️ ¡EL COMBATE COMIENZA!` },
    { msg: `${chars[0].nombre} VS ${chars[1].nombre}` }
  ];

  showScreen('screen-battle');
  renderBattle();
  renderLog(state.offlineLog);
  updateDomainOverlay(null);
  // Turno 0 arranca con los botones de acción
  activarTurnoOffline();
}

// ── Motor de combate offline ──────────────────────────
function activarTurnoOffline() {
  const at = state.chars[state.turnoActivo];
  state.playerIdx = state.turnoActivo;
  state.isMyTurn  = true;
  setActionPanelState('action');
  // Actualizar qué botones se muestran según el personaje activo
  document.getElementById('btn-recargar').style.display = at.puedeEspeciales ? '' : 'none';
  const cur = ['Gojo Satoru','Sukuna','Yuta Okkotsu','Maki Zenin','Toji Fushiguro'];
  document.getElementById('btn-curar').style.display = cur.includes(at.nombre) ? '' : 'none';
}

function offlineLog(msg) {
  state.offlineLog = [{ msg }, ...state.offlineLog].slice(0, 40);
}

function offlineDmg(atacante, hab) {
  let d = hab ? (hab.danio || 30) : 30;
  if (atacante.potenciado > 0) d = Math.floor(d * 1.5);
  else if (atacante.potenciado < 0) d = Math.floor(d * 0.6);
  const isFisico = hab ? (!!hab.fisico) : true;
  let bf = false;
  if (isFisico && atacante.puedeEspeciales) {
    bf = (hab && hab.nombre && hab.nombre.includes('Destello Negro')) || Math.random() < 0.05;
  }
  if (bf) { d = Math.floor(d * 2.5); offlineLog('💥 ¡DESTELLO NEGRO!'); }
  return d;
}

function offlineApply(atacante, defensor, dmg) {
  if (Math.random() < 0.15) { offlineLog(`💨 ¡${defensor.nombre} esquivó el ataque!`); return; }
  let d = defensor.defendiendo ? Math.floor(dmg / 2) : dmg;
  if (defensor.defendiendo) offlineLog(`🛡️ ${defensor.nombre} reduce el daño a la mitad.`);
  defensor.hp = Math.max(0, defensor.hp - d);
  offlineLog(`${defensor.nombre} recibe ${d} de daño. (HP: ${defensor.hp}/${defensor.maxHp})`);
}

function processOfflineAction(type, habIdx) {
  const atIdx  = state.turnoActivo;
  const defIdx = 1 - atIdx;
  const at  = state.chars[atIdx];
  const def = state.chars[defIdx];

  // Preparar turno
  at.defendiendo = false;
  if (at.burnout > 0) at.burnout--;
  if (at.potenciado > 0) at.potenciado--;
  else if (at.potenciado < 0) at.potenciado++;

  if (at.inmovilizado > 0) {
    at.inmovilizado--;
    offlineLog(`⛓ ${at.nombre} está inmovilizado — turno saltado.`);
    tickOfflineDominio();
    finishOfflineTurn();
    return;
  }

  if (type === 'basic') {
    offlineLog(`${at.nombre} lanza un Ataque Físico.`);
    offlineApply(at, def, offlineDmg(at, null));

  } else if (type === 'defend') {
    at.defendiendo = true;
    offlineLog(`🛡️ ${at.nombre} se pone en guardia.`);

  } else if (type === 'recargar') {
    at.energia = Math.min(at.maxEnergia, at.energia + 80);
    offlineLog(`⚡ ${at.nombre} recarga 80 CE. (CE: ${at.energia}/${at.maxEnergia})`);

  } else if (type === 'curar') {
    const esFisico = at.nombre === 'Maki Zenin' || at.nombre === 'Toji Fushiguro';
    const cost   = at.nombre === 'Gojo Satoru' ? 5 : esFisico ? 0 : 50;
    const amount = esFisico ? 150 : 250;
    if (at.energia < cost) {
      offlineLog(`⚠️ CE insuficiente para curarse.`);
      activarTurnoOffline();
      return;
    }
    at.energia -= cost;
    at.hp = Math.min(at.maxHp, at.hp + amount);
    offlineLog(`💚 ${at.nombre} se cura +${amount} HP. (HP: ${at.hp}/${at.maxHp})`);

  } else if (type === 'habilidad' && habIdx !== undefined) {
    const hab = at.habilidades[habIdx];
    if (!hab) { activarTurnoOffline(); return; }
    if (at.burnout > 0 && habIdx > 0) {
      offlineLog(`🔥 BURNOUT — solo puedes usar la habilidad 0.`);
      activarTurnoOffline(); return;
    }
    if (at.energia < (hab.coste || 0)) {
      offlineLog(`⚠️ CE insuficiente (necesita ${hab.coste}, tiene ${at.energia}).`);
      activarTurnoOffline(); return;
    }
    at.energia -= (hab.coste || 0);   // descontar UNA sola vez
    offlineLog(`✨ ${at.nombre} usa: ${hab.nombre}`);
    if (hab.desc) offlineLog(`   ${hab.desc}`);

    // ── Dominio ──────────────────────────────────────────
    if (hab.dominio) {
      // Ya tenemos un dominio propio activo
      if (state.dominio && state.dominio.ownerIdx === atIdx) {
        offlineLog(`⚠️ Ya tienes un dominio activo.`);
        tickOfflineDominio(); finishOfflineTurn(); return;
      }

      // Dominio rival activo → choque
      if (state.dominio && state.dominio.ownerIdx !== atIdx) {
        offlineLog(`⚡ ¡CHOQUE DE DOMINIOS! ${at.nombre} vs ${def.nombre}`);
        const atPrio  = (at.nombre  === 'Sukuna' || at.nombre  === 'Kenjaku') ? 1 : 0;
        const defPrio = (def.nombre === 'Sukuna' || def.nombre === 'Kenjaku') ? 1 : 0;
        const atScore  = atPrio  + (Math.random() < 0.5 ? 1 : 0);
        const defScore = defPrio + (Math.random() < 0.5 ? 1 : 0);
        if (atScore >= defScore) {
          offlineLog(`🏆 ¡${at.nombre} sobrepone su dominio!`);
          def.dominioActivo = false; def.burnout = 2;
          state.dominio = { ownerIdx: atIdx, nombre: hab.nombre, efectoDominio: hab.efectoDominio || '', turnosRestantes: 8 };
          at.dominioActivo = true;
        } else {
          offlineLog(`🛡️ ${def.nombre} mantiene su dominio intacto.`);
          at.burnout = 2;
        }
        updateDomainOverlay(state.dominio);
        tickOfflineDominio(); finishOfflineTurn(); return;
      }

      // Sin dominio rival → activar
      offlineLog(`🌀 ¡${at.nombre} EXPANDE SU DOMINIO — ${hab.nombre}!`);
      at.dominioActivo = true;

      // Efectos de activación según dominio
      if (hab.efecto === 'gamble') {
        if (Math.random() < 0.33) {
          offlineLog(`🎰 ¡JACKPOT! CE infinita e inmortalidad 4T.`);
          at.inmortal = 4; at.energia = 9999;
        } else offlineLog(`💀 Mala suerte en el IDLE DEATH GAMBLE.`);
      } else if (hab.efecto === 'potenciar') {
        at.potenciado = 2; offlineLog(`🔥 ${at.nombre} se potencia 2 turnos.`);
      } else if (hab.efecto === 'inmovilizar2' || (hab.nombre && hab.nombre.includes('VACÍO INFINITO'))) {
        def.inmovilizado = 2; offlineLog(`✨ ${def.nombre} queda inmovilizado 2 turnos.`);
      } else if (hab.efecto === 'gran-juego') {
        def.inmovilizado = 2; def.energia = 0;
        offlineLog(`🌀 ${def.nombre} inmovilizado 2T y sin CE.`);
      }

      state.dominio = { ownerIdx: atIdx, nombre: hab.nombre, efectoDominio: hab.efectoDominio || '', turnosRestantes: 8 };
      updateDomainOverlay(state.dominio);
      if ((hab.danio || 0) > 0) offlineApply(at, def, offlineDmg(at, hab));
      tickOfflineDominio(); finishOfflineTurn(); return;
    }

    // ── Habilidad normal (no dominio) ──────────────────────
    if (hab.efecto === 'potenciar') { at.potenciado = 2; offlineLog(`🔥 ${at.nombre} se potencia 2 turnos.`); }
    if (hab.efecto === 'inmovilizar1') { def.inmovilizado = 1; offlineLog(`⛓ ${def.nombre} inmovilizado 1T.`); }
    if (hab.efecto === 'inmovilizar2') { def.inmovilizado = 2; offlineLog(`⛓ ${def.nombre} inmovilizado 2T.`); }
    if (hab.efecto === 'debilitar')   { def.potenciado = Math.max(def.potenciado - 1, -2); offlineLog(`📜 ${def.nombre} debilitado.`); }
    if (hab.efecto === 'suprimir')    { def.potenciado = Math.max(def.potenciado - 2, -2); def.energia = 0; offlineLog(`🔮 ${def.nombre} suprimido y sin CE.`); }
    if (hab.efecto === 'purificar')   { at.burnout = 0; at.inmovilizado = 0; at.hp = Math.min(at.maxHp, at.hp + 80); offlineLog(`✝️ Purificación: efectos negativos eliminados +80 HP.`); }
    if (hab.efecto === 'escudo-masa') { at.defendiendo = true; def.hp = Math.max(0, def.hp - 40); offlineLog(`⚫ Masa Virtual: Escudo + contraataque 40 dmg.`); }
    if (hab.efecto === 'autolesion')  { const sl = Math.floor((hab.danio||0) * 0.2); at.hp = Math.max(0, at.hp - sl); offlineLog(`🩸 ${at.nombre} sufre ${sl} de retroceso.`); }

    if ((hab.danio || 0) > 0) offlineApply(at, def, offlineDmg(at, hab));
  }

  tickOfflineDominio();
  finishOfflineTurn();
}

function tickOfflineDominio() {
  if (!state.dominio) return;
  const dom   = state.dominio;
  const owner = state.chars[dom.ownerIdx];
  const defIdx = 1 - dom.ownerIdx;

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
    state.dominio = null;
    updateDomainOverlay(null);
  }
}

function finishOfflineTurn() {
  renderBattle();
  renderLog(state.offlineLog);

  const c0 = state.chars[0], c1 = state.chars[1];
  if (c0.hp <= 0 || c1.hp <= 0) {
    const wIdx = c0.hp > 0 ? 0 : 1;
    offlineLog(`🏆 ¡${state.chars[wIdx].nombre} [${state.playerNames[wIdx]}] ha ganado!`);
    renderLog(state.offlineLog);
    setTimeout(() => {
      showScreen('screen-gameover');
      updateDomainOverlay(null);
      document.getElementById('winner-title').textContent = `¡${state.playerNames[wIdx]} gana!`;
      document.getElementById('winner-title').style.color = '#e8b84b';
      document.getElementById('winner-char').textContent   = state.chars[wIdx].nombre;
      document.getElementById('winner-player').textContent = state.playerNames[wIdx];
      document.getElementById('gameover-log').innerHTML =
        state.offlineLog.slice(0, 12).map(e => `<div>${escHtml(e.msg || '')}</div>`).join('');
    }, 1200);
    return;
  }

  state.turnoActivo = 1 - state.turnoActivo;
  const next = state.chars[state.turnoActivo];
  offlineLog(`--- Turno de ${next.nombre} (${state.playerNames[state.turnoActivo]}) ---`);
  renderLog(state.offlineLog);
  activarTurnoOffline();
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

// domain_activated ya no existe; battle_update lleva el dominio completo.

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
  // En offline, el personaje activo es el del turno actual (no playerIdx fijo)
  const meIdx = MODO_OFFLINE ? state.turnoActivo : state.playerIdx;
  const me = state.chars[meIdx];
  if (!me) return;
  const cur = ['Gojo Satoru','Sukuna','Yuta Okkotsu','Maki Zenin','Toji Fushiguro'];
  document.getElementById('btn-recargar').style.display = me.puedeEspeciales ? '' : 'none';
  document.getElementById('btn-curar').style.display    = cur.includes(me.nombre) ? '' : 'none';
}

function sendAction(data) {
  if (MODO_OFFLINE) {
    // Procesar la acción localmente sin servidor
    processOfflineAction(data.type, data.habIdx);
    return;
  }
  state.isMyTurn = false;
  setActionPanelState('waiting', 'Procesando...');
  socket.emit('player_action', data);
}

function showHabilidades() {
  const meIdx = MODO_OFFLINE ? state.turnoActivo : state.playerIdx;
  const me = state.chars[meIdx];
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
//  MÚSICA — panel flotante + YouTube IFrame
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
      reproducirPista(p);                         // ← reproduce inmediatamente
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
  detenerMusica();                              // ← detiene YouTube
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