'use strict';
/* ══════════════════════════════════════════════════
   JJK BATTLE — CLIENT
   Flujo: screen-main → screen-lobby → screen-select → screen-battle
   ══════════════════════════════════════════════════ */

const socket = io();

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
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.add('hidden'), ms);
}

// ════════════════════════════════════════════════════
//  MENÚ PRINCIPAL
// ════════════════════════════════════════════════════
document.getElementById('btn-jugar').addEventListener('click', () => {
  showScreen('screen-lobby');
});

// ════════════════════════════════════════════════════
//  LOBBY
// ════════════════════════════════════════════════════
document.getElementById('btn-back-lobby').addEventListener('click', () => {
  showScreen('screen-main');
  document.getElementById('room-code-display').classList.add('hidden');
  document.getElementById('lobby-error').classList.add('hidden');
});

document.getElementById('btn-create').addEventListener('click', () => {
  const name = document.getElementById('input-name').value.trim();
  if (!name) return showToast('Ingresa tu nombre de combatiente.');
  socket.emit('create_room', { playerName: name });
});

document.getElementById('btn-join').addEventListener('click', () => {
  const name = document.getElementById('input-name').value.trim();
  const room = document.getElementById('input-room').value.trim().toUpperCase();
  if (!name) return showToast('Ingresa tu nombre.');
  if (!room) return showToast('Ingresa el código de sala.');
  socket.emit('join_room', { roomId: room, playerName: name });
});

document.getElementById('input-name').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('btn-create').click(); });
document.getElementById('input-room').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('btn-join').click(); });

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

function renderCharacterGrid(chars) {
  const grid = document.getElementById('characters-grid');
  grid.innerHTML = '';
  chars.forEach(c => {
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
  });
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
  socket.emit('select_character', { charIdx: c.id });
  document.getElementById('select-status').textContent = `Seleccionaste: ${c.nombre} — esperando al rival...`;
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
  }
}

function renderActionMenu() {
  const menu = document.getElementById('action-menu');
  menu.classList.remove('hidden');

  const me = state.chars[state.playerIdx];
  if (!me) return;

  document.getElementById('btn-recargar').style.display = me.puedeEspeciales ? '' : 'none';
  document.getElementById('btn-curar').style.display    = me.puedeCurarse    ? '' : 'none';
}

document.getElementById('btn-habilidades').addEventListener('click', () => {
  if (!state.isMyTurn) return;
  document.getElementById('action-menu').classList.add('hidden');
  showHabilidades();
});

document.getElementById('btn-ataque').addEventListener('click', () => {
  if (!state.isMyTurn) return;
  sendAction({ type: 'basic' });
});

document.getElementById('btn-guardia').addEventListener('click', () => {
  if (!state.isMyTurn) return;
  sendAction({ type: 'defend' });
});

document.getElementById('btn-recargar').addEventListener('click', () => {
  if (!state.isMyTurn) return;
  sendAction({ type: 'recargar' });
});

document.getElementById('btn-curar').addEventListener('click', () => {
  if (!state.isMyTurn) return;
  sendAction({ type: 'curar' });
});

document.getElementById('btn-back-hab').addEventListener('click', () => {
  document.getElementById('habilidades-menu').classList.add('hidden');
  renderActionMenu();
});

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
