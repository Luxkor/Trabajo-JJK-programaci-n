/**
 * WebRTC P2P Connection Manager
 * Proporciona conexión directa P2P entre jugadores sin necesidad de servidor central
 * Usa Socket.io solo para signaling (intercambio de SDP y ICE candidates)
 */

'use strict';

class WebRTCPeer {
  constructor(options = {}) {
    this.config = {
      iceServers: [
        { urls: ['stun:stun.l.google.com:19302'] },
        { urls: ['stun:stun1.l.google.com:19302'] },
        { urls: ['stun:stun2.l.google.com:19302'] },
        { urls: ['stun:stun3.l.google.com:19302'] },
      ],
      ...options.iceConfig
    };

    this.peerConnection = null;
    this.dataChannel = null;
    this.socket = options.socket || null;
    this.peerId = options.peerId || `peer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.remotePeerId = null;

    // Event handlers
    this.onOpen = options.onOpen || (() => {});
    this.onClose = options.onClose || (() => {});
    this.onMessage = options.onMessage || (() => {});
    this.onError = options.onError || (() => {});
    this.onStateChange = options.onStateChange || (() => {});

    // Logging
    this.debug = options.debug !== false;
    this.log(`WebRTCPeer iniciado: ${this.peerId}`);
  }

  // ─────────────────────────────────────────────────
  // INICIALIZACIÓN
  // ─────────────────────────────────────────────────

  /**
   * Inicializa la conexión P2P como iniciador (Host/Jugador 1)
   */
  async initiateConnection(remotePeerId) {
    this.remotePeerId = remotePeerId;
    this.log(`Iniciando conexión con ${remotePeerId}`);

    try {
      this.peerConnection = new RTCPeerConnection({ iceServers: this.config.iceServers });
      this.setupPeerConnectionListeners();

      // Crear canal de datos
      this.dataChannel = this.peerConnection.createDataChannel('game-channel', {
        ordered: true,
        maxPacketLifeTime: 1000
      });
      this.setupDataChannelListeners();

      // Crear oferta
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      this.log('Oferta SDP creada');

      // Enviar SDP al peer remoto vía signaling (Socket.io)
      if (this.socket) {
        this.socket.emit('webrtc:offer', {
          from: this.peerId,
          to: remotePeerId,
          sdp: this.peerConnection.localDescription
        });
      }
    } catch (err) {
      this.log(`Error iniciando conexión: ${err.message}`, 'error');
      this.onError(err);
    }
  }

  /**
   * Responde a una conexión incoming (Jugador 2)
   */
  async handleOffer(offer) {
    this.log('Oferta SDP recibida');

    try {
      if (!this.peerConnection) {
        this.peerConnection = new RTCPeerConnection({ iceServers: this.config.iceServers });
        this.setupPeerConnectionListeners();
      }

      // Establecer descripción remota
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer.sdp));

      // Crear respuesta
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      this.log('Respuesta SDP creada');

      // Enviar respuesta al peer remoto
      if (this.socket) {
        this.socket.emit('webrtc:answer', {
          from: this.peerId,
          to: offer.from,
          sdp: this.peerConnection.localDescription
        });
      }
    } catch (err) {
      this.log(`Error procesando oferta: ${err.message}`, 'error');
      this.onError(err);
    }
  }

  /**
   * Procesa la respuesta SDP del peer remoto
   */
  async handleAnswer(answer) {
    this.log('Respuesta SDP recibida');
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer.sdp));
      this.log('Descripción remota configurada');
    } catch (err) {
      this.log(`Error procesando respuesta: ${err.message}`, 'error');
      this.onError(err);
    }
  }

  /**
   * Agrega un candidato ICE recibido del peer remoto
   */
  async addIceCandidate(candidate) {
    try {
      if (candidate && this.peerConnection) {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (err) {
      this.log(`Error añadiendo ICE candidate: ${err.message}`, 'error');
    }
  }

  // ─────────────────────────────────────────────────
  // CONFIGURACIÓN DE LISTENERS
  // ─────────────────────────────────────────────────

  setupPeerConnectionListeners() {
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.log('Nuevo candidato ICE');
        if (this.socket) {
          this.socket.emit('webrtc:ice-candidate', {
            from: this.peerId,
            to: this.remotePeerId,
            candidate: event.candidate
          });
        }
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      this.log(`Estado conexión: ${this.peerConnection.connectionState}`);
      this.onStateChange(this.peerConnection.connectionState);

      if (this.peerConnection.connectionState === 'disconnected' ||
          this.peerConnection.connectionState === 'failed' ||
          this.peerConnection.connectionState === 'closed') {
        this.onClose();
      }
    };

    this.peerConnection.ondatachannel = (event) => {
      this.log('Canal de datos recibido');
      this.dataChannel = event.channel;
      this.setupDataChannelListeners();
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      this.log(`ICE State: ${this.peerConnection.iceConnectionState}`);
    };

    this.peerConnection.onsignalingstatechange = () => {
      this.log(`Signaling State: ${this.peerConnection.signalingState}`);
    };
  }

  setupDataChannelListeners() {
    this.dataChannel.onopen = () => {
      this.log('📡 Canal P2P ABIERTO');
      this.onOpen();
    };

    this.dataChannel.onclose = () => {
      this.log('📡 Canal P2P CERRADO');
      this.onClose();
    };

    this.dataChannel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.onMessage(data);
      } catch (err) {
        this.log(`Error procesando mensaje: ${err.message}`, 'error');
      }
    };

    this.dataChannel.onerror = (event) => {
      this.log(`Error en canal: ${event.error}`, 'error');
      this.onError(event.error);
    };
  }

  // ─────────────────────────────────────────────────
  // ENVÍO DE MENSAJES
  // ─────────────────────────────────────────────────

  /**
   * Envía un mensaje al peer remoto
   */
  send(data) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      try {
        this.dataChannel.send(JSON.stringify(data));
      } catch (err) {
        this.log(`Error enviando: ${err.message}`, 'error');
      }
    } else {
      this.log('Canal P2P no listo para enviar', 'warn');
    }
  }

  /**
   * Envía datos de forma segura (sin perder si el canal no está listo)
   */
  sendSafe(data) {
    return new Promise((resolve, reject) => {
      if (this.dataChannel && this.dataChannel.readyState === 'open') {
        try {
          this.dataChannel.send(JSON.stringify(data));
          resolve();
        } catch (err) {
          reject(err);
        }
      } else {
        // Esperar a que se abra
        const checkInterval = setInterval(() => {
          if (this.dataChannel && this.dataChannel.readyState === 'open') {
            clearInterval(checkInterval);
            try {
              this.dataChannel.send(JSON.stringify(data));
              resolve();
            } catch (err) {
              reject(err);
            }
          }
        }, 100);

        // Timeout después de 5 segundos
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error('Timeout esperando que el canal se abra'));
        }, 5000);
      }
    });
  }

  // ─────────────────────────────────────────────────
  // ESTADO Y CONTROL
  // ─────────────────────────────────────────────────

  isConnected() {
    return this.peerConnection &&
           this.dataChannel &&
           this.dataChannel.readyState === 'open' &&
           (this.peerConnection.connectionState === 'connected' ||
            this.peerConnection.connectionState === 'completed');
  }

  getConnectionState() {
    return {
      peerConnection: this.peerConnection ? this.peerConnection.connectionState : 'no-connection',
      ice: this.peerConnection ? this.peerConnection.iceConnectionState : 'no-connection',
      dataChannel: this.dataChannel ? this.dataChannel.readyState : 'closed',
      signaling: this.peerConnection ? this.peerConnection.signalingState : 'stable'
    };
  }

  /**
   * Cierra la conexión P2P
   */
  close() {
    if (this.dataChannel) {
      this.dataChannel.close();
    }
    if (this.peerConnection) {
      this.peerConnection.close();
    }
    this.log('Conexión P2P cerrada');
  }

  // ─────────────────────────────────────────────────
  // UTILIDADES
  // ─────────────────────────────────────────────────

  log(message, level = 'info') {
    if (this.debug) {
      const prefix = `[WebRTC ${this.peerId.substr(0, 8)}]`;
      console.log(`${prefix} ${message}`);
    }
  }

  // ─────────────────────────────────────────────────
  // ESTADÍSTICAS
  // ─────────────────────────────────────────────────

  async getStats() {
    if (!this.peerConnection) return null;

    const stats = {
      timestamp: Date.now(),
      connection: this.getConnectionState()
    };

    try {
      const rtcStats = await this.peerConnection.getStats();
      rtcStats.forEach(report => {
        if (report.type === 'inbound-rtp' || report.type === 'outbound-rtp') {
          stats[report.type] = {
            bytesReceived: report.bytesReceived,
            bytesSent: report.bytesSent,
            packetsReceived: report.packetsReceived,
            packetsSent: report.packetsSent,
            jitter: report.jitter,
            roundTripTime: report.roundTripTime
          };
        }
      });
    } catch (err) {
      this.log(`Error obteniendo estadísticas: ${err.message}`, 'error');
    }

    return stats;
  }
}

// Exportar para uso en Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WebRTCPeer;
}
