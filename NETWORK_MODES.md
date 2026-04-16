# JJK Battle — Modos de Conexión 🌐

Este documento explica cómo funcionan los 3 modos de conexión disponibles en JJK Battle.

## 📋 Resumen Rápido

| Modo | Requiere | Ventajas | Desventajas |
|------|----------|----------|-------------|
| **Red Local (LAN)** | Misma red WiFi/Ethernet | Rápido, sin firewall | Solo LAN local |
| **Localtunnel** | Internet | Funciona de cualquier red | Requiere dependencias |
| **Peer-to-Peer (WebRTC)** | Servidor signaling | Directo, sin intermediarios | Más complejo |

---

## 🎯 Opción 1: Red Local (LAN) — Recomendado para jugar localmente

### Requisitos
- ✅ Ambos PCs en la misma red (WiFi o Ethernet)
- ✅ Sin necesidad de internet para jugar
- ✅ Sin permisos de administrador

### Pasos

#### Dispositivo 1 (Server/Host)
1. Ejecuta `arrancar.bat` en la carpeta `web/`
2. Selecciona **opción 1** (Red local)
3. El script mostrará las IPs disponibles
4. La primera IP se copió automáticamente al portapapeles
5. El servidor se inicia en `http://localhost:3000`

```
Mismo PC   >  http://localhost:3000
Otro PC    >  http://192.168.1.100:3000
```

#### Dispositivo 2 (Cliente)
1. Abre el navegador
2. Introduce la URL del host: `http://[IP-DEL-HOST]:3000`
3. Ejemplo: `http://192.168.1.100:3000`
4. El juego se carga automáticamente
5. En el lobby:
   - Deja el campo "IP o URL del servidor" **vacío** (se auto-rellena)
   - Ingresa tu nombre
   - Elige **Crear Sala** o **Unirse**

### Ventajas ✅
- **Más rápido** — Conexión directa en la red
- **Sin firewall** — Redes locales son seguras
- **Sin dependencias externas** — Funciona con Node.js incluido
- **Bajo latency** — Perfecto para jugar en tiempo real

### Posibles Problemas 🔧
- Si dice "Conexión rechazada":
  - Verifica que ambos dispositivos estén en la misma red WiFi
  - Comprueba que el servidor está ejecutándose
  - Desactiva temporalmente el firewall o permite puerto 3000

---

## 🌍 Opción 2: Túnel Internet (Localtunnel)

### Requisitos
- ✅ Conexión a internet en ambos dispositivos
- ✅ Acceso a npm (incluido en `node_portable`)

### Pasos

#### Dispositivo 1 (Server/Host)
1. Ejecuta `arrancar.bat` en la carpeta `web/`
2. Selecciona **opción 2** (Túnel internet)
3. El script instalará automáticamente `localtunnel` si no está
4. Espera a que aparezca la URL pública HTTPS:

```
╔══════════════════════════════════════════════════════╗
║  🌐 MODO TÚNEL ACTIVO — SIN FIREWALL                ║
║                                                      ║
║  URL PÚBLICA: https://xyz-123-abc.loca.lt           ║
║                                                      ║
║  Comparte esta URL con el otro jugador.             ║
║  Funciona desde cualquier red sin admin.            ║
╚══════════════════════════════════════════════════════╝
```

5. **Copia la URL** (algo como `https://xyz-123-abc.loca.lt`)
6. Comparte con el otro jugador

#### Dispositivo 2 (Cliente)
1. Recibe la URL compartida: `https://xyz-123-abc.loca.lt`
2. Abre el navegador y pega la URL
3. En el lobby:
   - Campo "IP o URL": deja vacío o pega la URL nuevamente
   - Ingresa tu nombre
   - Elige **Crear Sala** o **Unirse**

### Ventajas ✅
- **Funciona desde cualquier red** — Internet global
- **Sin firewall** — HTTPS automático
- **URL segura** — Disponible solo mientras el túnel está activo
- **Sin configuración manual** — Todo automático

### Desventajas ⚠️
- **Más latencia** — Pasa por servidor remoto
- **Requiere internet constante** — En ambos lados
- **URL temporal** — Cambia cada ejecución
- **Límite de tráfico** — Según localtunnel

### Posibles Problemas 🔧
- "No se pudo instalar localtunnel":
  - Verifica conexión a internet
  - Intenta ejecutar con permisos de administrador
  - O usa modo LAN/P2P
- Latencia muy alta:
  - Esto es esperado con túneles
  - Trata de mantener los PC cercanos
  - Cierra otras aplicaciones que usen ancho de banda

---

## 🔗 Opción 3: Peer-to-Peer (WebRTC) — Más avanzado

### Requisitos
- ✅ Servidor local ejecutándose (solo para signaling)
- ✅ Ambos dispositivos acceden al mismo servidor (para intercambiar datos P2P)
- ✅ Navegador con soporte WebRTC (todos modernos)

### Pasos

#### Dispositivo 1 (Server/Host)
1. Ejecuta `arrancar.bat` en la carpeta `web/`
2. Selecciona **opción 3** (Peer-to-Peer)
3. Servidor se inicia igual que en modo LAN
4. Abre el navegador en `http://localhost:3000`
5. Haz clic en **JUGAR**
6. En el modal de conexión, selecciona **Peer-to-Peer**
7. Comparte el código de sala con el otro jugador

```
Mismo PC   >  http://localhost:3000
Otro PC    >  http://192.168.1.100:3000
```

#### Dispositivo 2 (Cliente)
1. Abre el navegador: `http://[IP-DEL-HOST]:3000`
2. Haz clic en **JUGAR**
3. En el modal, selecciona **Peer-to-Peer**
4. Únete a la sala usando el código compartido
5. **Una vez conectados, la conexión se vuelve directa P2P**
   - El servidor solo se usa para intercambiar datos de conexión
   - El tráfico del juego va directamente entre los dos PC

### Ventajas ✅
- **Bajo latency** — Conexión directa
- **Reduce carga del servidor** — Solo para signaling
- **Escalable** — Múltiples partidas sin sobrecargar servidor
- **Privacidad** — Ambos jugadores intercambian datos directamente

### Desventajas ⚠️
- **Más complejidad técnica** — WebRTC requiere STUN servers
- **Puede fallar tras NAT** — Si ambos están tras routers agresivos
- **Requiere conocimiento**  — Usuario debe entender P2P

### Ventajas frente a LAN tradicional
| Aspecto | LAN Socket | P2P WebRTC |
|---------|-----------|-----------|
| Latency | Bajo | MÁS bajo |
| Carga servidor | Media/Alta | **Mínima** |
| Firewall | Requiere puerto abierto | Menos restrictivo |
| Internet | No requiere | No requiere |

### Posibles Problemas 🔧
- "No se conecta":
  - Verifica que ambos estén en la misma entrada del servidor
  - Comprueba que los navegadores soportan WebRTC
  - Intenta primero con LAN para verificar conectividad básica
- "Muy lento":
  - Verifica velocidad de red con `speedtest.net`
  - NAT puede afectar — prueba con TURN servers configurados
  - Cierra otras aplicaciones usando red

---

## 🎮 Cómo usar en el juego

### En el lobby
1. Haz clic en **JUGAR**
2. Aparece un modal: **"Modo de Conexión"**
3. Elige:
   - 🖥️ **Servidor**: Conexión vía Socket.io (servidor central)
   - 🔗 **Peer-to-Peer**: Conexión WebRTC directa
4. Continúa normalmente

### Indicador de conexión
- 🟢 **Verde** (pulsante): Conectado correctamente
- 🔴 **Rojo**: Desconectado
- 🟡 **Amarillo**: Conectando...

Aparece en la esquina superior derecha de la pantalla.

---

## 📊 Comparativa Técnica

```
┌─────────────────────────────────────────────────────────┐
│  SOCKET.IO (LAN / Server)                               │
├─────────────────────────────────────────────────────────┤
│  Cliente ←→ Servidor ←→ Otro Cliente                    │
│  Ventaja: Simple, centralizado                          │
│  Desventaja: Todo pasa por servidor                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  P2P WebRTC (Sin intermediarios)                         │
├─────────────────────────────────────────────────────────┤
│  Cliente ←→ [Signaling Server] ← Solo para setup        │
│       ↓                           ↓                      │
│  Cliente ←──────────────────→ Otro Cliente (DIRECTO)    │
│  Ventaja: Bajo latency, eficiente                       │
│  Desventaja: Más complejo de debuggear                  │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Recomendaciones Finales

### Para máxima compatibilidad → **Opción 1 (LAN)**
- Más fácil de configurar
- Funciona en casi cualquier red
- Perfecto para LAN parties

### Para jugar desde cualquier lugar → **Opción 2 (Localtunnel)**
- Comparte URL y listo
- No requiere saber IPs
- Ideal para amigos en internet

### Para máximo rendimiento → **Opción 3 (P2P)**
- Latency mínimo
- Escalable a muchas partidas
- Para los que quieren lo mejor

---

## 🆘 Soporte

Si algo no funciona:

1. **Verifica conectividad básica**
   ```bash
   ping [IP-del-otro-PC]
   ```

2. **Si es firewall de Windows**
   - Busca "Firewall y protección de red"
   - Permite puerto 3000 para "redes privadas"

3. **Reinicia todo**
   - Cierra navegadores
   - Mata servidores anteriores
   - Reinicia arrancar.bat

4. **Intenta cambiar de modo de conexión**
   - Si P2P falla, usa Socket.io
   - Si LAN falla, prueba túnel

---

**¡Que disfrutes del juego! ⚔️🔮**
