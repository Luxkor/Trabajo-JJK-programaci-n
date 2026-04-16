/**
 * Network Manager
 * Abstracción que permite usar socket.io o WebRTC P2P indistintamente
 * El cliente puede elegir modo: servidor (Socket.io) o P2P (WebRTC)
 */

'use strict';

class NetworkManager {
  constructor() {
    this.mode = 'socket'; // 'socket' o 'p2p'
    this.socket = null;
    this.webrtcPeer = null;
    this.peerId = null;
    this.listeners = {}; // { eventName: [callbacks] }
    this.connected = false;
    this.connectionMode = 'unknown'; // 'socket' o 'p2p'
  }

  // ─────────────────────────────────────────────────
  // CONEXIÓN POR SOCKET.IO
  // ─────────────────────────────────────────────────

  connectViaSocket(url) {
    return new Promise((resolve, reject) => {
      try {
        if (!window.io) {
          reject(new Error('Socket.io no está disponible'));
          return;
        }

        const normalizeUrl = (u) => {
          if (!u) return '';
          u = u.trim();
          if (!/^https?:\/\//i.test(u)) {
            u = 'http://' + u;
          }
          return u.replace(/\/+$/, '');
        };

        const serverUrl = normalizeUrl(url);
        this.socket = io(serverUrl, {
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
          transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
          this.connected = true;
          this.connectionMode = 'socket';
          this.mode = 'socket';
          this.emit('network:connected', { mode: 'socket' });
          console.log('[NetworkManager] Conectado vía Socket.io');
          resolve();
        });

        this.socket.on('connect_error', (err) => {
          console.error('[NetworkManager] Error Socket.io:', err);
          this.emit('network:error', err);
          reject(err);
        });

        this.socket.on('disconnect', () => {
          this.connected = false;
          this.emit('network:disconnected');
          console.log('[NetworkManager] Desconectado de Socket.io');
        });

        // Re-emitir todos los eventos del socket
        this.socket.onAny((eventName, ...args) => {
          if (!eventName.startsWith('connect') && !eventName.includes('error')) {
            this.emit(eventName, ...args);
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  // ─────────────────────────────────────────────────
  // CONEXIÓN P2P VIA WEBRTC
  // ─────────────────────────────────────────────────

  /**
   * Conecta a un peer remoto via P2P WebRTC
   * Requiere un socket.io para signaling
   */
  connectViaP2P(remotePeerId, signalingSocket, isInitiator = true) {
    return new Promise((resolve, reject) => {
      try {
        if (!window.WebRTCPeer) {
          reject(new Error('WebRTCPeer no está disponible'));
          return;
        }

        this.peerId = signalingSocket ? signalingSocket.id : `peer_${Date.now()}`;

        // Crear instancia WebRTC con signaling
        this.webrtcPeer = new WebRTCPeer({
          socket: signalingSocket,
          peerId: this.peerId,
          debug: true,
          onOpen: () => {
            this.connected = true;
            this.connectionMode = 'p2p';
            this.mode = 'p2p';
            this.emit('network:connected', { mode: 'p2p' });
            console.log('[NetworkManager] Canal P2P ABIERTO');
            resolve();
          },
          onClose: () => {
            this.connected = false;
            this.emit('network:disconnected');
            console.log('[NetworkManager] Canal P2P cerrado');
          },
          onMessage: (data) => {
            // Re-emitir mensajes como eventos
            if (data.event) {
              this.emit(data.event, data.payload);
            }
          },
          onError: (err) => {
            console.error('[NetworkManager] Error WebRTC:', err);
            this.emit('network:error', err);
            reject(err);
          }
        });

        // Listener de signaling: oferta del peer remoto
        signalingSocket.on('webrtc:offer', async (data) => {
          if (data.from === remotePeerId) {
            console.log('[NetworkManager] Oferta SDP recibida');
            await this.webrtcPeer.handleOffer(data);
          }
        });

        // Listener de signaling: respuesta del peer remoto
        signalingSocket.on('webrtc:answer', async (data) => {
          if (data.from === remotePeerId) {
            console.log('[NetworkManager] Respuesta SDP recibida');
            await this.webrtcPeer.handleAnswer(data);
          }
        });

        // Listener de signaling: candidato ICE del peer remoto
        signalingSocket.on('webrtc:ice-candidate', async (candidate) => {
          if (candidate) {
            console.log('[NetworkManager] Candidato ICE recibido');
            await this.webrtcPeer.addIceCandidate(candidate);
          }
        });

        // Iniciar conexión (como initiator)
        if (isInitiator) {
          console.log('[NetworkManager] Iniciando conexión P2P hacia:', remotePeerId);
          this.webrtcPeer.initiateConnection(remotePeerId);
        } else {
          console.log('[NetworkManager] Esperando conexión P2P de:', remotePeerId);
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  // ─────────────────────────────────────────────────
  // EVENTO Y MENSAJER\u00cdA
  // ─────────────────────────────────────────────────

  /**
   * Emite un evento localmente (para listeners del NetworkManager)
   */
  emit(eventName, data) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].forEach(callback => {
      try {
        callback(data);
      } catch (err) {
        console.error(`Error en listener "${eventName}":`, err);
      }
    });
  }

  /**
   * Registra un listener para un evento
   */
  on(eventName, callback) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(callback);
  }

  /**
   * Desregistra un listener
   */
  off(eventName, callback) {
    if (!this.listeners[eventName]) return;
    this.listeners[eventName] = this.listeners[eventName].filter(cb => cb !== callback);
  }

  /**
   * Envía un mensaje al peer/servidor
   */
  send(eventName, data) {
    if (this.connectionMode === 'socket' && this.socket) {
      this.socket.emit(eventName, data);
    } else if (this.connectionMode === 'p2p' && this.webrtcPeer) {
      this.webrtcPeer.send({
        event: eventName,
        payload: data
      });
    } else {
      console.warn('[NetworkManager] No hay conexión activa para enviar');
    }
  }

  // ─────────────────────────────────────────────────
  // ESTADO Y CONTROL
  // ─────────────────────────────────────────────────

  isConnected() {
    if (this.connectionMode === 'socket') {
      return this.socket && this.socket.connected;
    } else if (this.connectionMode === 'p2p') {
      return this.webrtcPeer && this.webrtcPeer.isConnected();
    }
    return false;
  }

  getConnectionMode() {
    return this.connectionMode || 'unknown';
  }

  getConnectionState() {
    if (this.connectionMode === 'socket') {
      return {
        mode: 'socket',
        connected: this.socket && this.socket.connected,
        state: this.socket ? this.socket.connected ? 'connected' : 'disconnected' : 'no-socket'
      };
    } else if (this.connectionMode === 'p2p') {
      return {
        mode: 'p2p',
        connected: this.webrtcPeer && this.webrtcPeer.isConnected(),
        state: this.webrtcPeer ? this.webrtcPeer.getConnectionState() : 'no-webrtc'
      };
    }
    return {
      mode: 'unknown',
      connected: false,
      state: 'no-connection'
    };
  }

  async getStats() {
    if (this.connectionMode === 'p2p' && this.webrtcPeer) {
      return await this.webrtcPeer.getStats();
    }
    return null;
  }

  /**
   * Desconecta
   */
  disconnect() {
    if (this.connectionMode === 'socket' && this.socket) {
      this.socket.disconnect();
    } else if (this.connectionMode === 'p2p' && this.webrtcPeer) {
      this.webrtcPeer.close();
    }
    this.connected = false;
  }

  /**
   * Retorna socket para uso directo si está disponible (para retro-compatibilidad)
   */
  getSocket() {
    return this.connectionMode === 'socket' ? this.socket : null;
  }

  /**
   * Retorna WebRTC peer si está disponible
   */
  getWebRTCPeer() {
    return this.connectionMode === 'p2p' ? this.webrtcPeer : null;
  }
}

// Instancia global
const networkManager = new NetworkManager();

// Exportar para uso en Node.js si aplica
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NetworkManager;
}
