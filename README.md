# 🔥 JUJUTSU KAISEN — BATTLE SYSTEM

Sistema de combate multijugador basado en el anime **Jujutsu Kaisen**. Enfrenta a otros jugadores en tu red local con personajes únicos, habilidades especiales y dominios malditos.

---

## 📋 Tabla de Contenidos

1. [Descripción del Proyecto](#descripción-del-proyecto)
2. [Requisitos del Sistema](#requisitos-del-sistema)
3. [Instalación](#instalación)
4. [Cómo Jugar](#cómo-jugar)
5. [Guía de Personajes](#guía-de-personajes)
6. [Sistema de Combate](#sistema-de-combate)
7. [Mecánicas Especiales](#mecánicas-especiales)

---

## 📖 Descripción del Proyecto

**JJK Battle** es un juego de turno basado en la serie de anime y manga *Jujutsu Kaisen*. Los jugadores controlan poderosos hechiceros y maldiciones en combates estratégicos.

### Características Principales
- 🎮 **Multijugador Local**: Conecta hasta 2 jugadores en la misma red
- ⚡ **16 Personajes Únicos**: Elige entre hechiceros y maldiciones
- 🛡️ **Sistema de Energía Maldita (CE)**: Gestiona recursos para usar habilidades
- 💥 **Dominios Malditos**: Desata poderes supremos
- 🎵 **Banda Sonora del Anime**: Disfruta de los OpeningsFamos
- ⚔️ **Combates Estratégicos**: Ataque, defensa, curación y habilidades especiales

---

## 💻 Requisitos del Sistema

- **Navegador Moderno**: Chrome, Firefox, Edge o Safari (última versión)
- **Node.js y npm** (para versión con servidor - opcional para versión offline)
- **Conexión de Red Local**: Para jugar multijugador
- **Pantalla**: Mínimo 1024x768px recomendado

---

## 🚀 Instalación

### Opción 1: Versión Web (Recomendado)

```bash
# 1. Navega a la carpeta del proyecto
cd jjk-battle/web/public

# 2. Abre en el navegador
# Windows:
start index.html

# macOS:
open index.html

# Linux:
xdg-open index.html
```

### Opción 2: Con Servidor Node.js

```bash
# 1. Instala dependencias
cd jjk-battle/web
npm install

# 2. Inicia el servidor
npm start

# 3. Abre en el navegador
http://localhost:3000
```

---

## 🎮 Cómo Jugar

### ⚡ MODO RÁPIDO - SIN SERVIDOR (Recomendado para empezar)

**No necesitas Node.js ni npm. Funciona con solo un navegador.**

#### Opción A: Con Python (recomendado)

```powershell
cd "d:\jjk-battle\jjk-battle\web\public"
python -m http.server 8000
```

Luego abre dos navegadores diferentes en `http://localhost:8000`

#### Opción B: Archivo local directo

```
file:///d:/jjk-battle/jjk-battle/web/public/index.html
```

Abre dos navegadores/pestañas diferentes.

#### Pasos para Jugar:

**Jugador 1:**
1. Escribe tu nombre
2. Haz clic en **"Crear Sala"**
3. Se genera un código de 4 caracteres (ej: `A3K7`)
4. Comparte este código con tu amigo

**Jugador 2:**
1. Escribe tu nombre
2. Haz clic en **"Unirse a Sala"**
3. Pega el código del Jugador 1
4. ¡Listo! El rival se conecta automáticamente

**Ambos:**
1. Selecciona un personaje diferentes
2. ¡Comienza la batalla automáticamente! ⚔️

---

### 🚀 MODO COMPLETO - CON SERVIDOR NODE.JS

Para juego multijugador completo con todas las mecánicas:

```bash
# 1. Instala Node.js desde nodejs.org (si no lo tienes)

# 2. Instala dependencias
cd jjk-battle/web
npm install

# 3. Inicia el servidor
npm start

# 4. Abre en el navegador
http://localhost:3000
```

---

### 📱 Modo Multijugador en Red Local (con npm)

#### **Requisitos Previos**
- Ambos jugadores en la **misma red WiFi o Ethernet**
- Dos dispositivos (PC, laptop, tablet)
- Navegador web actualizado

#### **Paso 1: Obtén la IP de tu PC**

**En Windows**:
```powershell
ipconfig
# Busca "Dirección IPv4" (ej: 192.168.1.100)
```

**En macOS/Linux**:
```bash
ifconfig
# Busca "inet" (ej: 192.168.1.100)
```

#### **Paso 2: Inicia servidor en tu PC**

```bash
cd jjk-battle/web
npm start
```

#### **Paso 3: Otro dispositivo se conecta**

En el otro dispositivo, abre:
```
http://[TU_IP]:3000
# Ejemplo: http://192.168.1.100:3000
```

---

### Pantalla Principal
1. Presiona **⚔️ JUGAR** para entrar a la sala de combate

### Sala de Combate (Lobby)
1. **Escribe tu nombre** de combatiente
2. Elige una opción:
   - **⚡ CREAR SALA**: Genera un código para invitar a un amigo
   - **UNIRSE**: Ingresa el código de un amigo

### Selección de Personaje
1. **Explora los 16 personajes disponibles**
2. Cada personaje tiene estadísticas únicas
3. Haz clic en un personaje para ver sus habilidades
4. Ambos jugadores deben seleccionar antes de comenzar

### Combate
1. **Pantalla de batalla**: Observa el VS central
2. **Panel de acciones**: Elige tu movimiento
3. **Barra de energía (CE)**: Gestiona tu energía maldita
4. **Combat Log**: Sigue el flujo del combate

---

### 🐛 Solución de Problemas

| Problema | Solución |
|----------|----------|
| **No se sincroniza** | Abre en dos navegadores DIFERENTES (no dos pestañas del mismo navegador) |
| **Rival no aparece** | Espera 2-3 segundos, verifica que escribió el código correcto |
| **Página no carga** | Verifica la IP correcta: `http://192.168.X.X:3000` |
| **Socket.io error** | Es normal sin servidor - modo offline funciona igualmente |
| **Conexión se pierde** | Recarga la página e intenta de nuevo |

---



## 🕹️ Guía de Multijugador Local

### ¿Cómo Jugar con Otro Jugador en Red Local?

#### **Requisitos Previos**
- Ambos jugadores en la **misma red WiFi o Ethernet**
- Dos dispositivos (PC, laptop, tablet)
- Navegador web actualizado en ambos

#### **Paso 1: Obtén la IP de tu PC**

**En Windows**:
```powershell
# Abre PowerShell/Símbolo del Sistema y escribe:
ipconfig

# Busca "Dirección IPv4" (ej: 192.168.1.100)
```

**En macOS/Linux**:
```bash
# Abre Terminal y escribe:
ifconfig

# Busca "inet" (ej: 192.168.1.100)
```

#### **Paso 2: Inicia el Servidor**

**Opción A - Servidor Local (Recomendado)**:
```bash
cd jjk-battle/web/public
# Sistema: Levanta un servidor HTTP
# Puedes usar cualquier servidor local (python, http-server, etc)
```

**Opción B - Archivo Directo**:
1. Abre `jjk-battle/web/public/index.html` en tu navegador

#### **Paso 3: Acceso desde Otro Dispositivo**

En el otro dispositivo, accede a:
```
http://[TU_IP]:3000/
# o
file:///ruta/a/jjk-battle/web/public/index.html
```

Ejemplo: `http://192.168.1.100:3000/`

#### **Paso 4: Crear y Unirse a la Sala**

**Jugador 1 (Anfitrión)**:
1. Ingresa tu nombre
2. Haz clic en **⚡ CREAR SALA**
3. Se genera un **código de 4 caracteres** (ej: `A3K7`, `Z9M2`)
4. ⚠️ **Comparte este código con tu amigo**

**Jugador 2 (Invitado)**:
1. Ingresa tu nombre
2. Haz clic en el campo **"Código de sala"**
3. Escribe el código que te compartió (ej: `A3K7`)
4. Haz clic en **UNIRSE**

#### **Paso 5: Seleccionar Personaje**

1. Ambos jugadores ven la pantalla de selección
2. Cada uno elige un personaje diferente
3. Los dos deben confirmar antes de comenzar

#### **Paso 6: ¡Combate!**

El juego comienza cuando ambos han seleccionado.

---

### Problemas Comunes

| Problema | Solución |
|----------|----------|
| No me conecta | Verifica que estén en la misma red (WiFi/Ethernet). Prueba con IP local |
| Código muy largo | El código es ahora solo **4 caracteres** - mucho más fácil de escribir |
| Página no carga | Copia la IP completa: `http://192.168.X.X:3000` |
| Socket.io error | Es normal si no tienes servidor - el juego funciona sin él |
| Timeout | La conexión se perdió. Recarga y intenta de nuevo |

---

### Modo Offline

Si no puedes conectar a la red local:
1. **Abre el archivo localmente** en tu dispositivo
2. El código de sala se genera automáticamente
3. El otro jugador debe acceder a su propia copia
4. Pueden compartir el código manualmente

---

## ⚔️ Guía de Personajes

### 👤 HECHICEROS (Magos Jujutsu)

#### **∞ Gojo Satoru** (HP: 600 | CE: 450)
*El mago más fuerte de la actualidad*
- **Azul** (40 daño): Atracción gravitacional básica
- **Rojo** (60 daño): Repulsión amplificada
- **VACÍO PÚRPURA** (80 daño): Borra lo que toca
- **Destello Negro** (100 daño): Impacto físico garantizado
- **EXPANSIÓN: VACÍO INFINITO** 🔴 (60 daño): Inmoviliza al rival 2 turnos
- ✅ Puede usar dominios | ✅ Puede curarse con RCT

---

#### **拳 Itadori Yuji** (HP: 550 | CE: 250)
*Anfitrión del Rey de las Maldiciones*
- **Puño Divergente** (60 daño): Golpe con retraso maldito
- **Destello Negro** (80 daño): Crítico garantizado
- **Artes Marciales** (100 daño): Combo físico devastador
- **Corte de Alma** (120 daño): Daña directamente el alma
- **Rencor** (140 daño): Frenesí de golpes imparable
- ✅ Puede usar dominios | ❌ No puede curarse

---

#### **武 Maki Zenin** (HP: 650 | CE: 0)
*Guerrera sin poder maldito*
- **Nube Itinerante** (40 daño): Bastón maldito
- **Katana Almas** (60 daño): Corte de alma
- **Lanza** (80 daño): Estocada precisa
- **Ataque Pesado** (100 daño): Golpe bruto
- **Masacre** (120 daño): Frenesí veloz
- ❌ No puede usar dominios | ✅ Puede curarse | 🛠️ Usa herramienta maldita

---

#### **剣 Toji Fushiguro** (HP: 650 | CE: 0)
*Cazadora de hechiceros sin poder maldito*
- **Navaja Invertida** (40 daño): Anula técnicas malditas
- **Cadena** (60 daño): Ataque de largo alcance
- **Espada Alma** (80 daño): Corte mortal
- **Pistola** (100 daño): Ataque a distancia
- **Bendición** (120 daño): Asalto en punto ciego
- ❌ No puede usar dominios | ✅ Puede curarse | 🛠️ Usa herramienta maldita

---

#### **愛 Yuta Okkotsu** (HP: 500 | CE: 1000)
*Hechicero con Rika*
- **Copia: Discurso** (40 daño): Habla maldita copiada
- **Corte con Katana** (60 daño): Tajo básico
- **Rika: Ataque Físico** (80 daño): Puñetazo de Rika
- **RAYO DE AMOR VERDADERO** (100 daño): Haz concentrado de Rika
- **EXPANSIÓN: AMOR MUTUO** 🔴 (60 daño): Potencia ataques 2 turnos
- ✅ Muy alta energía maldita | ✅ Puede curarse

---

#### **♠ Kinji Hakari** (HP: 500 | CE: 300)
*Hechicero de la escuela de Kyoto*
- **Puñetazo Áspero** (40 daño): Papel de lija maldito
- **Puerta Tren** (60 daño): Aplastamiento ferroviario
- **Combo** (80 daño): Golpes rítmicos
- **Cabezazo** (100 daño): Impacto de cráneo
- **EXPANSIÓN: IDLE DEATH GAMBLE** 🔴: 33% jackpot = inmortalidad + CE infinita
- ✅ Puede usar dominios con efecto especial

---

#### **霊 Suguru Geto** (HP: 500 | CE: 500)
*Maestro del control de maldiciones*
- **Maldiciones Menores** (40 daño): Horda de maldiciones
- **Calamar** (60 daño): Asfixia maldita
- **Dragón** (80 daño): Carga devastadora
- **Artes Marciales** (100 daño): Golpe físico preciso
- **UZUMAKI** (140 daño): Técnica Máxima concentrada
- ✅ Balance perfecto de poder y energía

---

#### **比 Nanami Kento** (HP: 480 | CE: 250)
*Apoderado jujutsu profesional*
- **Ratio 7:3** (40 daño): Punto débil maldito
- **Derrumbe** (60 daño): Destruye el entorno
- **Golpe Contundente** (80 daño): Fuerza bruta
- **Tajo** (100 daño): Corte limpio
- **Horas Extras** (140 daño): Liberación de energía reprimida
- 🛠️ Usa herramienta maldita (mazo)

---

#### **雷 Hajime Kashimo** (HP: 490 | CE: 400)
*Hechicero especializado en electricidad*
- **Descarga** (40 daño): Rayo eléctrico seguro
- Múltiples habilidades eléctricas

---

#### **掌 Aoi Todo** (HP: 520 | CE: 220)
*Campeón de la Escuela de Kyoto*
- **Boogie Woogie** (40 daño): Intercambio posicional
- **Puñetazo** (60 daño): Golpe seco
- **Patada** (80 daño): Patada voladora
- **Aplauso Sorpresa** (100 daño): Desorienta al enemigo
- **Destello Negro** (140 daño): Impacto crítico garantizado
- ✅ Especialista en combate físico

---

#### **钉 Nobara Kugisaki** (HP: 400 | CE: 250)
*Especialista en técnicas de resonancia*
- **Resonancia** (40 daño): Vínculo de alma
- **Horquilla** (60 daño): Explosión de clavo
- **Martillazo** (80 daño): Golpe cargado
- **Lluvia de Clavos** (100 daño): Área de clavos
- **Clavo Físico** (140 daño): Estocada final
- ✅ Uso de clavos malditos

---

### 😈 MALDICIONES (Entidades Malditas)

#### **呪 Sukuna** (HP: 700 | CE: 950)
*Rey de las Maldiciones*
- **Desmantelar** (60 daño): Cortes malditos
- **Cleave** (75 daño): Cortes adaptados a la resistencia
- **FUGA** (100 daño): Flecha de fuego mortal
- **Golpe Físico** (80 daño): Velocidad sobrehumana
- **EXPANSIÓN: SANTUARIO MALÉVOLO** 🔴: Cortes pasivos cada turno
- 🔥 **MÁS FUERTE**: Prioridad en dominios
- ✅ Puede curarse con su poder maldito

---

#### **魂 Mahito** (HP: 450 | CE: 350)
*Maldición del alma*
- **Mutación** (40 daño): Altera el alma enemiga
- **Polimorfismo** (60 daño): Lanza transfigurados
- **Isomería** (80 daño): Clones de alma
- **Cuchilla Corporal** (100 daño): Brazo en cuchilla
- **EXPANSIÓN: AUTOENCARNACIÓN** 🔴 (80 daño): Potencia ataques 2 turnos

---

#### **火 Jogo** (HP: 380 | CE: 450)
*Maldición de fuego*
- **Insectos** (40 daño): Explosivos volcánicos
- **Vértice** (60 daño): Magma concentrado
- **Meteorito** (80 daño): Roca en llamas
- **Palmas Ardientes** (100 daño): Fuego directo
- **EXPANSIÓN: ATAÚD DE LA MONTAÑA** 🔴 (80 daño): Potencia ataques 2 turnos

---

#### **花 Hanami** (HP: 550 | CE: 300)
*Maldición de la naturaleza*
- **Raíces** (40 daño): Empalamiento subterráneo
- **Semillas** (60 daño): Drenaje de vida
- **Rayo Solar** (80 daño): Haz de luz concentrado
- **Golpe de Madera** (100 daño): Impacto forestal
- **EXPANSIÓN: MAR DE FLORES** 🔴 (80 daño): Drena vida en área

---

#### **血 Choso** (HP: 460 | CE: 320)
*Maldición de sangre*
- **Sangre Perforante** (40 daño): Rayo de sangre maldita
- **Supernova** (60 daño): Metralla de sangre
- **Escala Roja** (80 daño): Potencia sanguínea
- **Golpe de Ala** (100 daño): Cuchilla de sangre
- **Manantial** (140 daño): Inundación de sangre

---

#### **影 Megumi Fushiguro** (HP: 420 | CE: 350)
*Hechicero con poder sobre sombras*
- **Perros Divinos** (40 daño): Ataque de shikigami
- **Nue** (60 daño): Descarga eléctrica
- **Elefante Máximo** (80 daño): Aplastamiento masivo
- **EXPANSIÓN: JARDÍN DE SOMBRAS** 🔴 (80 daño): Dominio de sombras
- **MAHORAGA** (0 daño): Invoca al General Divino

---

## ⚙️ Sistema de Combate

### Fases del Turno

```
INICIO → SELECCIÓN DE ACCIÓN → EJECUCIÓN → FIN DEL TURNO
```

### Opciones de Acción

| Acción | Costo | Efecto |
|--------|-------|--------|
| **Ataque Básico** | 0 CE | 30-40 daño físico |
| **Habilidad** | 5-65 CE | Daño + efectos especiales |
| **Defensa** | 0 CE | Reduce daño 50% próximo turno |
| **Curación (RCT)** | 20-50 CE | Recupera 50-100 HP |
| **Recargar CE** | 0 CE | Recupera 30-50 CE |

### Estadísticas

- **HP (Puntos de Salud)**: Rango 380-700 según personaje
- **CE (Energía Maldita)**: Rango 0-1000 según personaje
- **Ataque**: Varía por habilidad
- **Defensa**: Reduce daño recibido

---

## 💥 Mecánicas Especiales

### Dominios Malditos 🔴

Los **Dominios** son técnicas supremas que transforman el campo de batalla.

**Características**:
- Costo: 65-120 CE
- Solo personajes especializados
- Crean un efecto visual único
- Cambian las mecánicas de combate

### Choque de Dominios ⚔️

Cuando ambos jugadores activan dominios simultáneamente:
1. **Desafío de Memoria**: Memoriza y reproduce secuencias
2. **3 Rondas**: Secuencias crecientes (4→5→6 dígitos)
3. **Ganador**: Obtiene ventaja en combate

---

## 🎵 Banda Sonora

El juego incluye openings de Jujutsu Kaisen:
1. 🔥 Kaikai Kitan - Eve
2. ⚡ SPECIALZ - King Gnu
3. 💫 Ao no Sumika - Tatsuya Kitani
4. 🌙 Lost in Paradise - ALI ft. AKLO
5. 🎵 more more JUMP! - hololive

Control de música: Botón flotante en la esquina inferior derecha.

---

## 🎮 Consejos para Ganar

### Estrategia Ofensiva
- Usa habilidades especiales para máximo daño
- Combina ataques físicos con ataques malditos
- Aprovecha potenciaciones
- Activa dominios para ventaja decisiva

### Estrategia Defensiva
- Alterna defensa con ataques
- Mantén tu CE por encima de 100
- Cura cuando baje a 40% HP
- Anticipa dominios del enemigo

### Personajes Recomendados

- **Principiantes**: Itadori, Nanami, Aoi Todo
- **Intermedios**: Gojo, Sukuna, Megumi
- **Avanzados**: Yuta, Hakari, Geto

---

## 📝 Licencia

Este proyecto es un fan-made basado en Jujutsu Kaisen (Gege Akutami).

**¿Listo para la batalla? ⚔️ ¡Que comience el combate!**
