# 🔥 JUJUTSU KAISEN — BATTLE SYSTEM

Sistema de combate por turnos multijugador basado en el anime **Jujutsu Kaisen**. Enfrenta a rivales en tu red local con personajes únicos, habilidades especiales y Dominios Malditos.

---

## 📋 Tabla de Contenidos

1. [Descripción](#descripción)
2. [Requisitos e Instalación](#requisitos-e-instalación)
3. [Cómo Jugar](#cómo-jugar)
4. [Multijugador Local](#multijugador-local)
5. [Personajes](#personajes)
6. [Sistema de Combate](#sistema-de-combate)
7. [Mecánicas Especiales](#mecánicas-especiales)
8. [Banda Sonora](#banda-sonora)
9. [Consejos](#consejos)

---

## 📖 Descripción

**JJK Battle** es un juego de turnos estratégico con 25 personajes del universo de *Jujutsu Kaisen*. Cada combatiente tiene estadísticas únicas, cinco habilidades propias y, en algunos casos, un Dominio Maldito que transforma el campo de batalla.

### Características
- 🎮 **Multijugador local en red** — 2 jugadores en el mismo ordenador o en red LAN
- ⚔️ **25 personajes** — hechiceros y maldiciones con kits completamente distintos
- 🌀 **Dominios Malditos** — fondos visuales únicos y mecánicas de combate especiales
- 💥 **Choque de Dominios** — minijuego de memoria cuando ambos expanden un dominio
- ⚖️ **Tribunal Maldito** — juicio de Judgeman cuando Higuruma activa su dominio
- 🎵 **Banda Sonora** — openings y endings de la serie reproducibles en partida

---

## 💻 Requisitos e Instalación

- **Node.js 16+** — [nodejs.org](https://nodejs.org)
- **Navegador moderno** — Chrome, Firefox, Edge o Safari (actualizado)
- **Conexión de red local** para el modo multijugador entre distintos dispositivos

```bash
# 1. Entra en la carpeta del servidor
cd jjk-battle/web

# 2. Instala dependencias (solo la primera vez)
npm install

# 3. Arranca el servidor
npm start
```

Abre `http://localhost:3000` en el navegador. En la consola verás:
```
JJK Battle Server arrancado · Puerto 3000
```

---

## 🎮 Cómo Jugar

### Pantalla Principal
Pulsa **⚔ JUGAR** para entrar a la sala de combate.

### Lobby
1. Escribe tu **nombre de combatiente**.
2. Elige entre:
   - **⚡ CREAR SALA** → se genera un código de 5 letras; compártelo con tu rival.
   - **UNIRSE** → escribe el código del rival y pulsa unirse.

### Selección de Personaje
- Los personajes aparecen separados en **Hechiceros** y **Maldiciones**.
- Haz clic en una carta para verla en detalle (habilidades, daño, coste de CE).
- Ambos jugadores deben confirmar su selección para que empiece la batalla.

### Combate
En tu turno elige una de estas acciones:

| Acción | Coste CE | Efecto |
|--------|----------|--------|
| ⚡ **Habilidades** | 5–130 CE | Usa una de tus 5 habilidades especiales |
| 👊 **Ataque Básico** | 0 CE | 30 dmg físico · 5% de chance de Destello Negro (×2,5) |
| 🛡️ **Guardia** | 0 CE | Reduce el daño recibido este turno un 50% |
| 🔋 **Recargar CE** | 0 CE | Recupera 80 CE (no disponible para Maki/Toji) |
| 💚 **Curarse (RCT)** | 5–50 CE | Recupera 150–250 HP (solo personajes con RCT) |

> **Destello Negro** — hay un 5% de probabilidad en cada ataque físico de hacer ×2,5 de daño. Si la habilidad se llama "Destello Negro", el crítico es siempre garantizado.

> **Esquiva** — sin dominio activo, el defensor tiene un 15% de esquivar cualquier golpe. Maki y Toji resisten el golpe seguro de los dominios.

---

## 🌐 Multijugador Local

Hay **dos formas** de jugar con otra persona, dependiendo de si estáis en el mismo ordenador o en ordenadores distintos de la misma red.

---

### Opción A — Dos jugadores en el mismo ordenador

1. Arranca el servidor (`npm start`).
2. Abre **dos ventanas de navegador distintas** (no dos pestañas del mismo).
3. Las dos apuntan a `http://localhost:3000`.
4. Un jugador crea la sala → comparte el código → el otro se une.

---

### Opción B — Dos ordenadores en la misma red local (LAN/Wi-Fi)

**Paso 1 — Averigua la IP local del ordenador que hace de servidor**

En **Windows** abre PowerShell o CMD:
```powershell
ipconfig
# Busca "Dirección IPv4" → algo como 192.168.1.100
```

En **macOS / Linux** abre Terminal:
```bash
ifconfig
# Busca "inet" en la interfaz activa → algo como 192.168.1.100
```

**Paso 2 — Arranca el servidor en ese ordenador**
```bash
cd jjk-battle/web
npm start
```

**Paso 3 — Cada jugador abre el juego en su navegador**

| Jugador | URL a abrir |
|---------|-------------|
| El que tiene el servidor | `http://localhost:3000` |
| El otro jugador | `http://192.168.1.100:3000` (usa la IP del paso 1) |

**Paso 4 — Crear y unirse a la sala**

- **Jugador 1** → escribe su nombre → pulsa **⚡ CREAR SALA** → aparece un código de 5 letras.
- **Jugador 2** → escribe su nombre → pega el código → pulsa **UNIRSE**.

Los dos eligen personaje y la batalla comienza automáticamente.

---

### Solución de problemas

| Problema | Solución |
|----------|----------|
| El otro jugador no puede conectar | Verifica que ambos estáis en la misma red Wi-Fi o Ethernet |
| La página no carga | Comprueba la IP con `ipconfig`/`ifconfig` y que el servidor esté corriendo |
| El firewall bloquea la conexión | En Windows, acepta el permiso de red cuando Node.js lo solicite |
| El código de sala no funciona | Asegúrate de no confundir `O` con `0`; el código es sensible a mayúsculas |

---

## ⚔️ Personajes

### 🔯 HECHICEROS

#### ∞ Gojo Satoru — HP: 600 · CE: 450
*El hechicero más fuerte. Costes de CE casi nulos gracias al Infinito.*

| Habilidad | Dmg | Coste CE | Tipo |
|-----------|-----|----------|------|
| Azul | 40 | 5 | Maldita |
| Rojo | 60 | 5 | Maldita |
| VACÍO PÚRPURA | 80 | 5 | Maldita |
| Destello Negro | 100 | 5 | Física (Black Flash garantizado) |
| **EXPANSIÓN: VACÍO INFINITO** 🌀 | 60 | 15 | Dominio · inmoviliza rival 2T |

✅ RCT solo 5 CE · Inmune a confiscación de técnica

---

#### 呪 Sukuna — HP: 700 · CE: 950
*Rey de las Maldiciones. Prioridad en choque de dominios.*

| Habilidad | Dmg | Coste CE | Tipo |
|-----------|-----|----------|------|
| Desmantelar | 60 | 20 | Maldita |
| Cleave | 75 | 35 | Maldita (adaptada a la resistencia) |
| FUGA | 100 | 50 | Maldita |
| Golpe Físico | 80 | 35 | Física |
| **EXPANSIÓN: SANTUARIO MALÉVOLO** 🌀 | 80+50/T | 120 | Dominio · 50 dmg pasivo por turno |

✅ Puede curarse · +1 pto de ventaja en choque de dominios

---

#### 拳 Itadori Yuji — HP: 550 · CE: 250
*Fuerza bruta y artes marciales. Especialista en físico.*

| Habilidad | Dmg | Coste CE | Tipo |
|-----------|-----|----------|------|
| Puño Divergente | 60 | 20 | Física |
| Destello Negro | 80 | 35 | Física (BF garantizado) |
| Artes Marciales | 100 | 50 | Física |
| Corte de Alma | 120 | 65 | Física |
| Rencor | 140 | 100 | Física |

---

#### 武 Maki Zenin — HP: 650 · CE: 0
*Sin técnica maldita. Puro físico con herramienta maldita.*

| Habilidad | Dmg | Coste CE |
|-----------|-----|----------|
| Nube Itinerante | 40 | 0 |
| Katana Almas | 60 | 0 |
| Lanza | 80 | 0 |
| Ataque Pesado | 100 | 0 |
| Masacre | 120 | 0 |

✅ Regeneración física +150 HP · 🛠 Herramienta maldita · Inmune al golpe seguro de dominios

---

#### 剣 Toji Fushiguro — HP: 650 · CE: 0
*Cazador de hechiceros. Sin energía maldita, imparable.*

| Habilidad | Dmg | Coste CE |
|-----------|-----|----------|
| Navaja Invertida | 40 | 0 |
| Cadena | 60 | 0 |
| Espada Alma | 80 | 0 |
| Pistola | 100 | 0 |
| Bendición | 120 | 0 |

✅ Regeneración física +150 HP · 🛠 Herramienta maldita · Inmune al golpe seguro de dominios

---

#### 愛 Yuta Okkotsu — HP: 500 · CE: 1000
*Reserva de CE enorme. Daño doble contra Maldiciones con Jacob.*

| Habilidad | Dmg | Coste CE | Tipo |
|-----------|-----|----------|------|
| Copia: Discurso | 40 | 20 | Maldita |
| Corte con Katana | 60 | 35 | Física |
| Rika: Ataque Físico | 80 | 50 | Física |
| RAYO DE AMOR VERDADERO | 100 | 65 | Maldita |
| **EXPANSIÓN: AMOR MUTUO Y VERDADERO** 🌀 | 60 | 120 | Dominio · potencia ataques 2T |

✅ Puede curarse

---

#### ♠ Kinji Hakari — HP: 500 · CE: 300

| Habilidad | Dmg | Coste CE | Especial |
|-----------|-----|----------|---------|
| Puñetazo Áspero | 40 | 20 | — |
| Puerta Tren | 60 | 35 | — |
| Combo | 80 | 50 | — |
| Cabezazo | 100 | 65 | — |
| **EXPANSIÓN: IDLE DEATH GAMBLE** 🌀 | — | 120 | 33% jackpot: inmortalidad 4T + CE infinita |

---

#### 霊 Suguru Geto — HP: 500 · CE: 500

| Habilidad | Dmg | Coste CE |
|-----------|-----|----------|
| Maldiciones Menores | 40 | 20 |
| Calamar | 60 | 35 |
| Dragón | 80 | 50 |
| Artes Marciales | 100 | 65 |
| UZUMAKI | 140 | 120 |

---

#### 比 Nanami Kento — HP: 480 · CE: 250

| Habilidad | Dmg | Coste CE |
|-----------|-----|----------|
| Ratio 7:3 | 40 | 20 |
| Derrumbe | 60 | 35 |
| Golpe Contundente | 80 | 50 |
| Tajo | 100 | 65 |
| Horas Extras | 140 | 120 |

🛠 Herramienta maldita (mazo)

---

#### 影 Megumi Fushiguro — HP: 420 · CE: 350

| Habilidad | Dmg | Coste CE | Especial |
|-----------|-----|----------|---------|
| Perros Divinos | 40 | 20 | — |
| Nue | 60 | 35 | — |
| Elefante Máximo | 80 | 50 | — |
| **EXPANSIÓN: JARDÍN DE SOMBRAS** 🌀 | 80 | 65 | Dominio |
| **MAHORAGA** | — | 100 | Megumi abandona; invoca al General Divino (800 HP, instakill a maldiciones) |

---

#### ⚖ Hiromi Higuruma — HP: 470 · CE: 380

| Habilidad | Dmg | Coste CE | Especial |
|-----------|-----|----------|---------|
| Golpe de Mazo | 55 | 20 | — |
| Confiscación | 40 | 35 | Debilita al rival 2T |
| Testigo de Cargo | 75 | 50 | — |
| VEREDICTO: CULPABLE | 100 | 80 | Inmoviliza al rival 1T |
| **EXPANSIÓN: TRIBUNAL MALDITO** 🌀 | — | 120 | Juicio de Judgeman: cargo, defensa y veredicto |

---

#### ✝ Angel (Hana Kurusu) — HP: 440 · CE: 420

| Habilidad | Dmg | Coste CE | Especial |
|-----------|-----|----------|---------|
| Tajo Celestial | 60 | 25 | Ignora defensa mágica |
| Purificación | — | 40 | Elimina efectos negativos propios +80 HP |
| Lluvia de Plumas | 75 | 55 | — |
| JACOB: ANIQUILACIÓN | 220 | 85 | Daño doble a Maldiciones (110×2) |
| ESCALERA DE JACOB | 180 | 130 | Atraviesa toda defensa |

---

#### 脳 Kenjaku — HP: 580 · CE: 550
*Prioridad en choque de dominios. Drena CE del rival.*

| Habilidad | Dmg | Coste CE | Especial |
|-----------|-----|----------|---------|
| Manipulación de Maldiciones | 65 | 25 | — |
| Técnica Robada: Ultravioleta | 90 | 45 | — |
| Barrera Anti-Hechicero | 30 | 60 | Suprime CE rival 2T |
| UZUMAKI MODIFICADO | 130 | 90 | — |
| **EXPANSIÓN: GRAN JUEGO** 🌀 | 60 | 130 | Dominio · inmoviliza 2T + drena 60 CE/turno |

+1 pto de ventaja en choque de dominios

---

#### 風 Naoya Zenin — HP: 460 · CE: 300
*Si muere por golpe físico sin energía, renace como Maldición.*

| Habilidad | Dmg | Coste CE | Especial |
|-----------|-----|----------|---------|
| Vórtice | 65 | 20 | — |
| Ventilación: Ráfaga | 80 | 35 | — |
| Barrera de Sonido | 55 | 50 | Inmoviliza rival 1T |
| Ventilación: Espiral Letal | 120 | 75 | — |
| Torrente: Última Velocidad | 140 | 100 | Potencia +1T |

**Forma Maldición** (HP: 550 · CE: 0) — habilidades más potentes, sin coste de CE.

---

#### 重 Yuki Tsukumo — HP: 530 · CE: 380

| Habilidad | Dmg | Coste CE | Especial |
|-----------|-----|----------|---------|
| Puñetazo de Masa Virtual | 70 | 20 | — |
| Garuda: Embestida | 90 | 40 | — |
| Masa Virtual: Escudo | 40 | 55 | Defensa + contraataque 40 dmg |
| Garuda: Impacto Gravitacional | 115 | 80 | — |
| MASA VIRTUAL: COLAPSO ESTELAR | 170 | 125 | — |

---

### Otros hechiceros disponibles

| Personaje | HP | CE | Habilidad especial |
|-----------|----|----|-------------------|
| ⚖ Aoi Todo | 520 | 220 | Boogie Woogie (intercambio posicional) · Destello Negro garantizado |
| 钉 Nobara Kugisaki | 400 | 250 | Resonancia (vínculo de alma) · Lluvia de Clavos |
| 雷 Hajime Kashimo | 490 | 400 | ÁMBAR MÍTICO (160 dmg, forma final) |
| 鸦 Mei Mei | 450 | 250 | Bird Strike · 🛠 Herramienta |
| 言 Inumaki Toge | 360 | 300 | Comandos verbales · Sentencia Final (140 dmg + autolesión) |
| 熊 Panda | 550 | 200 | Núcleo Gorila · Núcleo Rhino · Trío de Golpes |

---

### 👹 MALDICIONES

| Personaje | HP | CE | Dominio |
|-----------|----|----|---------|
| 魂 Mahito | 450 | 350 | AUTOENCARNACIÓN DE LA PERFECCIÓN (potencia 2T) |
| 火 Jogo | 380 | 450 | ATAÚD DE LA MONTAÑA DE HIERRO (potencia 2T) |
| 花 Hanami | 550 | 300 | MAR DE FLORES (drena vida en área) |
| 血 Choso | 460 | 320 | — (Manantial 140 dmg) |

---

## ⚙️ Sistema de Combate

### Estructura del turno
```
TU TURNO → Elige acción → Servidor calcula resultado → TURNO RIVAL
```

### Daño y modificadores

- **Potenciado (+2T):** ×1,5 al daño de todas las habilidades.
- **Debilitado:** ×0,6 al daño.
- **Dominio activo (atacante):** ×1,3 al daño.
- **Destello Negro:** ×2,5 al daño del golpe (5% en físicos, 100% si la habilidad se llama "Destello Negro").
- **Guardia:** reduce el daño recibido ese turno un 50%.
- **Esquiva:** 15% de evadir cualquier golpe cuando no hay dominio activo.

### Energía Maldita (CE)
- Se gasta al usar habilidades especiales.
- Se recarga +80 CE con la acción "Recargar CE".
- Maki y Toji no tienen CE y no pueden recargar.
- Con **Burnout** (tras activar un dominio) solo puedes usar la habilidad 0 durante 2 turnos.

---

## 💥 Mecánicas Especiales

### Dominios Malditos 🌀
Cada dominio cambia el fondo visual del campo de batalla y activa efectos únicos:

| Personaje | Dominio | Efecto |
|-----------|---------|--------|
| Gojo | Vacío Infinito | Rival inmovilizado 2T |
| Sukuna | Santuario Malévolo | 50 dmg pasivo al rival por turno |
| Yuta | Amor Mutuo y Verdadero | +2T potenciado |
| Mahito | Autoencarnación | +2T potenciado |
| Jogo | Ataúd de la Montaña | +2T potenciado |
| Megumi | Jardín de Sombras | Dominio de sombras |
| Hanami | Mar de Flores | Drena vida en área |
| Hakari | Idle Death Gamble | 33%: inmortalidad 4T + CE ∞ |
| Higuruma | Tribunal Maldito | Juicio de Judgeman |
| Kenjaku | Gran Juego | Inmoviliza 2T + drena 60 CE/turno |

**Golpe Seguro** — dentro de un dominio, todos los golpes del propietario ignoran la esquiva del rival (excepto Maki y Toji, que lo resisten).

Duración: **4 turnos**. Al terminar, el propietario entra en Burnout 2T.

---

### Choque de Dominios ⚔️
Cuando ambos jugadores activan un dominio en el mismo turno:

1. Se muestra la pantalla de Choque.
2. **3 rondas** de secuencias crecientes: 4 → 5 → 6 dígitos.
3. Cada jugador ve **solo su propia secuencia** en su pantalla.
4. Memoriza la tuya → ocúltala → escríbela sin errores.
5. Gana quien acierte más rondas. Sukuna y Kenjaku tienen +1 punto de ventaja inicial.

---

### Tribunal Maldito ⚖️ (Higuruma)
Al activar el dominio de Higuruma:

1. Judgeman imputa un **crimen** al rival (leve / grave / fatal).
2. El rival elige entre 3 defensas (solo una es correcta).
3. **Inocente** → cargo retirado. **Culpable leve/grave** → Confiscación (herramienta o técnica). **Culpable fatal** → Higuruma obtiene la **Espada del Verdugo** (30% de impactar cada turno; dos impactos = muerte instantánea).
4. En sentencias graves o fatales el acusado puede solicitar **Apelación** (segundo juicio con cargo aleatorio).

---

### Transformación de Naoya
Si Naoya Zenin muere por un golpe **físico puro** (sin energía maldita), su rencor lo transforma en Maldición Especial con 550 HP, habilidades más potentes y sin coste de CE.

---

## 🎵 Banda Sonora

Controla la música con el botón **♪** en la esquina inferior derecha durante la batalla.

| # | Canción | Artista | Contexto |
|---|---------|---------|---------|
| 1 | 🔥 Kaikai Kitan | Eve | Opening 1 — Temporada 1 |
| 2 | ⚡ SPECIALZ | King Gnu | Opening Arco de Shibuya |
| 3 | 💫 Ao no Sumika | Tatsuya Kitani | Opening Inventario Oculto |
| 4 | 🌙 Lost in Paradise | ALI ft. AKLO | Ending 1 — Temporada 1 |
| 5 | 🎵 more more JUMP! | hololive | Pista especial del Colegio |

La música se reproduce automáticamente al seleccionar una pista y hace loop. Requiere conexión a internet (YouTube IFrame API).

---

## 🏆 Consejos para Ganar

**Ofensivo**
- Guarda CE para tu habilidad más fuerte y úsala en un turno potenciado.
- Activa tu dominio antes de hacer daño masivo (×1,3 al daño).
- Con Sukuna, el dominio ya hace 50 dmg gratis por turno — úsalo en turnos lentos.

**Defensivo**
- Guarda cuando tu HP baje del 40% — reduce el daño a la mitad.
- Recarga CE cuando estés por debajo de 80 CE para no quedarte sin recursos.
- Si el rival activa un dominio y no tienes el tuyo, guárdate o cúrate ese turno.

**Selección de personaje**
- **Principiantes:** Itadori, Nanami, Aoi Todo — kits simples y lineales.
- **Intermedios:** Gojo, Sukuna, Megumi — altas recompensas pero más difíciles de gestionar.
- **Avanzados:** Yuta, Hakari, Higuruma — mecánicas únicas que deciden la partida.

---

## 📝 Créditos

Fan-made basado en *Jujutsu Kaisen* de Gege Akutami · Shueisha.  
Proyecto educativo sin ánimo de lucro.

**¿Listo para la batalla? ⚔️ ¡Que comience el combate!**