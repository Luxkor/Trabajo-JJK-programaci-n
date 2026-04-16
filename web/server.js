/* ══════════════════════════════════════════════════
   JJK BATTLE — SERVER
   ══════════════════════════════════════════════════ */
'use strict';
const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const path    = require('path');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname, 'public')));

// ════════════════════════════════════════════════════
//  CHARACTER DEFINITIONS
// ════════════════════════════════════════════════════
const CHARACTERS = [
  { id:0,  nombre:'Gojo Satoru',         tipo:'hechicero', hp:600,  energia:450,  emoji:'∞', color:'#00c8ff', gradiente:'linear-gradient(135deg,#003c6e,#00c8ff)', puedeEspeciales:true,  puedeCurarse:true,  tieneHerramienta:false, prioridadDominio:false,
    habilidades:[
      {nombre:'Azul',                         desc:'Atracción gravitacional',              danio:40,  coste:5,   fisico:false, dominio:false},
      {nombre:'Rojo',                         desc:'Repulsión amplificada',                danio:60,  coste:5,   fisico:false, dominio:false},
      {nombre:'VACÍO PÚRPURA',               desc:'Borra todo lo que toca',               danio:80,  coste:5,   fisico:false, dominio:false},
      {nombre:'Destello Negro',               desc:'Impacto físico garantizado',           danio:100, coste:5,   fisico:true,  dominio:false},
      {nombre:'EXPANSIÓN: VACÍO INFINITO',   desc:'Inmoviliza al rival 2 turnos',         danio:60,  coste:15,  fisico:false, dominio:true,  efectoDominio:'vacio-infinito', efecto:'inmovilizar2'}]},

  { id:1,  nombre:'Sukuna',               tipo:'hechicero', hp:700,  energia:950,  emoji:'呪', color:'#cc2200', gradiente:'linear-gradient(135deg,#2a0000,#cc2200)', puedeEspeciales:true,  puedeCurarse:true,  tieneHerramienta:false, prioridadDominio:true,
    habilidades:[
      {nombre:'Desmantelar',                  desc:'Cortes malditos',                      danio:60,  coste:20,  fisico:false, dominio:false},
      {nombre:'Cleave',                       desc:'Cortes adaptados a la resistencia',    danio:75,  coste:35,  fisico:false, dominio:false},
      {nombre:'FUGA',                         desc:'Flecha de fuego mortal',               danio:100, coste:50,  fisico:false, dominio:false},
      {nombre:'Golpe Físico',                 desc:'Velocidad sobrehumana',                danio:80,  coste:35,  fisico:true,  dominio:false},
      {nombre:'EXPANSIÓN: SANTUARIO MALÉVOLO',desc:'Cortes pasivos cada turno',            danio:80,  coste:120, fisico:false, dominio:true,  efectoDominio:'santuario-malevolo'}]},

  { id:2,  nombre:'Itadori Yuji',         tipo:'hechicero', hp:550,  energia:250,  emoji:'拳', color:'#ff7700', gradiente:'linear-gradient(135deg,#3a1500,#ff7700)', puedeEspeciales:true,  puedeCurarse:false, tieneHerramienta:false, prioridadDominio:false,
    habilidades:[
      {nombre:'Puño Divergente',              desc:'Golpe con retraso maldito',            danio:60,  coste:20,  fisico:true,  dominio:false},
      {nombre:'Destello Negro',               desc:'Crítico garantizado',                  danio:80,  coste:35,  fisico:true,  dominio:false},
      {nombre:'Artes Marciales',              desc:'Combo físico devastador',              danio:100, coste:50,  fisico:true,  dominio:false},
      {nombre:'Corte de Alma',                desc:'Daña directamente el alma',            danio:120, coste:65,  fisico:true,  dominio:false},
      {nombre:'Rencor',                       desc:'Frenesí de golpes imparable',          danio:140, coste:100, fisico:true,  dominio:false}]},

  { id:3,  nombre:'Maki Zenin',           tipo:'hechicero', hp:650,  energia:0,    emoji:'武', color:'#00cc66', gradiente:'linear-gradient(135deg,#003a1a,#00cc66)', puedeEspeciales:false, puedeCurarse:true,  tieneHerramienta:true,  prioridadDominio:false,
    habilidades:[
      {nombre:'Nube Itinerante',              desc:'Bastón maldito',                       danio:40,  coste:0,   fisico:true,  dominio:false},
      {nombre:'Katana Almas',                 desc:'Corte de alma',                        danio:60,  coste:0,   fisico:true,  dominio:false},
      {nombre:'Lanza',                        desc:'Estocada precisa',                     danio:80,  coste:0,   fisico:true,  dominio:false},
      {nombre:'Ataque Pesado',                desc:'Golpe bruto',                          danio:100, coste:0,   fisico:true,  dominio:false},
      {nombre:'Masacre',                      desc:'Frenesí veloz',                        danio:120, coste:0,   fisico:true,  dominio:false}]},

  { id:4,  nombre:'Toji Fushiguro',       tipo:'hechicero', hp:650,  energia:0,    emoji:'剣', color:'#aaaaaa', gradiente:'linear-gradient(135deg,#1a1a1a,#aaaaaa)', puedeEspeciales:false, puedeCurarse:true,  tieneHerramienta:true,  prioridadDominio:false,
    habilidades:[
      {nombre:'Navaja Invertida',             desc:'Anula técnicas malditas',              danio:40,  coste:0,   fisico:true,  dominio:false},
      {nombre:'Cadena',                       desc:'Ataque de largo alcance',              danio:60,  coste:0,   fisico:true,  dominio:false},
      {nombre:'Espada Alma',                  desc:'Corte mortal',                         danio:80,  coste:0,   fisico:true,  dominio:false},
      {nombre:'Pistola',                      desc:'Ataque a distancia',                   danio:100, coste:0,   fisico:true,  dominio:false},
      {nombre:'Bendición',                    desc:'Asalto en punto ciego',                danio:120, coste:0,   fisico:true,  dominio:false}]},

  { id:5,  nombre:'Yuta Okkotsu',         tipo:'hechicero', hp:500,  energia:1000, emoji:'愛', color:'#ff88cc', gradiente:'linear-gradient(135deg,#2a0022,#ff88cc)', puedeEspeciales:true,  puedeCurarse:true,  tieneHerramienta:false, prioridadDominio:false,
    habilidades:[
      {nombre:'Copia: Discurso',              desc:'Habla maldita copiada',                danio:40,  coste:20,  fisico:false, dominio:false},
      {nombre:'Corte con Katana',             desc:'Tajo básico',                          danio:60,  coste:35,  fisico:true,  dominio:false},
      {nombre:'Rika: Ataque Físico',          desc:'Puñetazo de Rika',                     danio:80,  coste:50,  fisico:true,  dominio:false},
      {nombre:'RAYO DE AMOR VERDADERO',       desc:'Haz concentrado de Rika',              danio:100, coste:65,  fisico:false, dominio:false},
      {nombre:'EXPANSIÓN: AMOR MUTUO',        desc:'Potencia ataques 2 turnos',            danio:60,  coste:120, fisico:false, dominio:true,  efectoDominio:'amor-mutuo', efecto:'potenciar'}]},

  { id:6,  nombre:'Kinji Hakari',         tipo:'hechicero', hp:500,  energia:300,  emoji:'♠', color:'#ffcc00', gradiente:'linear-gradient(135deg,#1a1000,#ffcc00)', puedeEspeciales:true,  puedeCurarse:false, tieneHerramienta:false, prioridadDominio:false,
    habilidades:[
      {nombre:'Puñetazo Áspero',              desc:'Papel de lija maldito',                danio:40,  coste:20,  fisico:true,  dominio:false},
      {nombre:'Puerta Tren',                  desc:'Aplastamiento ferroviario',            danio:60,  coste:35,  fisico:false, dominio:false},
      {nombre:'Combo',                        desc:'Golpes rítmicos',                      danio:80,  coste:50,  fisico:true,  dominio:false},
      {nombre:'Cabezazo',                     desc:'Impacto de cráneo',                    danio:100, coste:65,  fisico:true,  dominio:false},
      {nombre:'EXPANSIÓN: IDLE DEATH GAMBLE', desc:'33% jackpot: inmortalidad + CE ∞',     danio:0,   coste:120, fisico:false, dominio:true,  efectoDominio:'idle-death-gamble', efecto:'gamble'}]},

  { id:7,  nombre:'Mahito',               tipo:'maldicion', hp:450,  energia:350,  emoji:'魂', color:'#9933ff', gradiente:'linear-gradient(135deg,#1a0033,#9933ff)', puedeEspeciales:true,  puedeCurarse:false, tieneHerramienta:false, prioridadDominio:false,
    habilidades:[
      {nombre:'Mutación',                     desc:'Altera el alma enemiga',               danio:40,  coste:20,  fisico:false, dominio:false},
      {nombre:'Polimorfismo',                 desc:'Lanza transfigurados',                 danio:60,  coste:35,  fisico:false, dominio:false},
      {nombre:'Isomería',                     desc:'Clones de alma',                       danio:80,  coste:50,  fisico:false, dominio:false},
      {nombre:'Cuchilla Corporal',            desc:'Brazo en cuchilla',                    danio:100, coste:65,  fisico:true,  dominio:false},
      {nombre:'EXPANSIÓN: AUTOENCARNACIÓN',   desc:'Potencia ataques 2 turnos',            danio:80,  coste:120, fisico:false, dominio:true,  efectoDominio:'autoencarnacion', efecto:'potenciar'}]},

  { id:8,  nombre:'Jogo',                 tipo:'maldicion', hp:380,  energia:450,  emoji:'火', color:'#ff4400', gradiente:'linear-gradient(135deg,#2a0800,#ff4400)', puedeEspeciales:true,  puedeCurarse:false, tieneHerramienta:false, prioridadDominio:false,
    habilidades:[
      {nombre:'Insectos',                     desc:'Explosivos volcánicos',                danio:40,  coste:20,  fisico:false, dominio:false},
      {nombre:'Vértice',                      desc:'Magma concentrado',                    danio:60,  coste:35,  fisico:false, dominio:false},
      {nombre:'Meteorito',                    desc:'Roca en llamas',                       danio:80,  coste:50,  fisico:false, dominio:false},
      {nombre:'Palmas Ardientes',             desc:'Fuego directo',                        danio:100, coste:65,  fisico:true,  dominio:false},
      {nombre:'EXPANSIÓN: ATAÚD DE LA MONTAÑA',desc:'Potencia ataques 2 turnos',          danio:80,  coste:120, fisico:false, dominio:true,  efectoDominio:'ataud-montana', efecto:'potenciar'}]},

  { id:9,  nombre:'Megumi Fushiguro',     tipo:'hechicero', hp:420,  energia:350,  emoji:'影', color:'#4488ff', gradiente:'linear-gradient(135deg,#001033,#4488ff)', puedeEspeciales:true,  puedeCurarse:false, tieneHerramienta:false, prioridadDominio:false,
    habilidades:[
      {nombre:'Perros Divinos',               desc:'Ataque de shikigami',                  danio:40,  coste:20,  fisico:true,  dominio:false},
      {nombre:'Nue',                          desc:'Descarga eléctrica',                   danio:60,  coste:35,  fisico:false, dominio:false},
      {nombre:'Elefante Máximo',              desc:'Aplastamiento masivo',                 danio:80,  coste:50,  fisico:true,  dominio:false},
      {nombre:'EXPANSIÓN: JARDÍN DE SOMBRAS', desc:'Dominio de sombras',                   danio:80,  coste:65,  fisico:false, dominio:true,  efectoDominio:'jardin-sombras'},
      {nombre:'MAHORAGA',                     desc:'Invoca al General Divino',             danio:0,   coste:100, fisico:false, dominio:false, efecto:'mahoraga'}]},

  { id:10, nombre:'Suguru Geto',          tipo:'hechicero', hp:500,  energia:500,  emoji:'霊', color:'#33aa44', gradiente:'linear-gradient(135deg,#001a00,#33aa44)', puedeEspeciales:true,  puedeCurarse:false, tieneHerramienta:false, prioridadDominio:false,
    habilidades:[
      {nombre:'Maldiciones Menores',          desc:'Horda de maldiciones',                 danio:40,  coste:20,  fisico:false, dominio:false},
      {nombre:'Calamar',                      desc:'Asfixia maldita',                      danio:60,  coste:35,  fisico:false, dominio:false},
      {nombre:'Dragón',                       desc:'Carga devastadora',                    danio:80,  coste:50,  fisico:false, dominio:false},
      {nombre:'Artes Marciales',              desc:'Golpe físico preciso',                 danio:100, coste:65,  fisico:true,  dominio:false},
      {nombre:'UZUMAKI',                      desc:'Técnica Máxima concentrada',           danio:140, coste:120, fisico:false, dominio:false}]},

  { id:11, nombre:'Nanami Kento',         tipo:'hechicero', hp:480,  energia:250,  emoji:'比', color:'#ccaa44', gradiente:'linear-gradient(135deg,#1a1400,#ccaa44)', puedeEspeciales:true,  puedeCurarse:false, tieneHerramienta:true,  prioridadDominio:false,
    habilidades:[
      {nombre:'Ratio 7:3',                    desc:'Punto débil maldito',                  danio:40,  coste:20,  fisico:true,  dominio:false},
      {nombre:'Derrumbe',                     desc:'Destruye el entorno',                  danio:60,  coste:35,  fisico:false, dominio:false},
      {nombre:'Golpe Contundente',            desc:'Fuerza bruta',                         danio:80,  coste:50,  fisico:true,  dominio:false},
      {nombre:'Tajo',                         desc:'Corte limpio',                         danio:100, coste:65,  fisico:true,  dominio:false},
      {nombre:'Horas Extras',                 desc:'Liberación de energía reprimida',      danio:140, coste:120, fisico:true,  dominio:false}]},

  { id:12, nombre:'Choso',                tipo:'maldicion', hp:460,  energia:320,  emoji:'血', color:'#cc0033', gradiente:'linear-gradient(135deg,#1a0000,#cc0033)', puedeEspeciales:true,  puedeCurarse:false, tieneHerramienta:false, prioridadDominio:false,
    habilidades:[
      {nombre:'Sangre Perforante',            desc:'Rayo de sangre maldita',               danio:40,  coste:20,  fisico:false, dominio:false},
      {nombre:'Supernova',                    desc:'Metralla de sangre',                   danio:60,  coste:35,  fisico:false, dominio:false},
      {nombre:'Escala Roja',                  desc:'Potencia sanguínea',                   danio:80,  coste:50,  fisico:false, dominio:false},
      {nombre:'Golpe de Ala',                 desc:'Cuchilla de sangre',                   danio:100, coste:65,  fisico:true,  dominio:false},
      {nombre:'Manantial',                    desc:'Inundación de sangre',                 danio:140, coste:120, fisico:false, dominio:false}]},

  { id:13, nombre:'Aoi Todo',             tipo:'hechicero', hp:520,  energia:220,  emoji:'掌', color:'#ff6600', gradiente:'linear-gradient(135deg,#1a0a00,#ff6600)', puedeEspeciales:true,  puedeCurarse:false, tieneHerramienta:false, prioridadDominio:false,
    habilidades:[
      {nombre:'Boogie Woogie',                desc:'Intercambio posicional',               danio:40,  coste:20,  fisico:false, dominio:false},
      {nombre:'Puñetazo',                     desc:'Golpe seco',                           danio:60,  coste:35,  fisico:true,  dominio:false},
      {nombre:'Patada',                       desc:'Patada voladora',                      danio:80,  coste:50,  fisico:true,  dominio:false},
      {nombre:'Aplauso Sorpresa',             desc:'Desorienta al enemigo',                danio:100, coste:65,  fisico:false, dominio:false},
      {nombre:'Destello Negro',               desc:'Impacto crítico garantizado',          danio:140, coste:120, fisico:true,  dominio:false}]},

  { id:14, nombre:'Nobara Kugisaki',      tipo:'hechicero', hp:400,  energia:250,  emoji:'钉', color:'#ff4488', gradiente:'linear-gradient(135deg,#1a000a,#ff4488)', puedeEspeciales:true,  puedeCurarse:false, tieneHerramienta:false, prioridadDominio:false,
    habilidades:[
      {nombre:'Resonancia',                   desc:'Vínculo de alma',                      danio:40,  coste:20,  fisico:false, dominio:false},
      {nombre:'Horquilla',                    desc:'Explosión de clavo',                   danio:60,  coste:35,  fisico:false, dominio:false},
      {nombre:'Martillazo',                   desc:'Golpe cargado',                        danio:80,  coste:50,  fisico:true,  dominio:false},
      {nombre:'Lluvia de Clavos',             desc:'Área de clavos',                       danio:100, coste:65,  fisico:false, dominio:false},
      {nombre:'Clavo Físico',                 desc:'Estocada final',                       danio:140, coste:120, fisico:true,  dominio:false}]},

  { id:15, nombre:'Hanami',               tipo:'maldicion', hp:550,  energia:300,  emoji:'花', color:'#44cc44', gradiente:'linear-gradient(135deg,#001a00,#44cc44)', puedeEspeciales:true,  puedeCurarse:false, tieneHerramienta:false, prioridadDominio:false,
    habilidades:[
      {nombre:'Raíces',                       desc:'Empalamiento subterráneo',             danio:40,  coste:20,  fisico:false, dominio:false},
      {nombre:'Semillas',                     desc:'Drenaje de vida',                      danio:60,  coste:35,  fisico:false, dominio:false},
      {nombre:'Rayo Solar',                   desc:'Haz de luz concentrado',               danio:80,  coste:50,  fisico:false, dominio:false},
      {nombre:'Golpe de Madera',              desc:'Impacto forestal',                     danio:100, coste:65,  fisico:true,  dominio:false},
      {nombre:'EXPANSIÓN: MAR DE FLORES',     desc:'Drena vida en área',                   danio:80,  coste:120, fisico:false, dominio:true,  efectoDominio:'mar-flores'}]},

  { id:16, nombre:'Hajime Kashimo',       tipo:'hechicero', hp:490,  energia:400,  emoji:'雷', color:'#ffdd00', gradiente:'linear-gradient(135deg,#1a1500,#ffdd00)', puedeEspeciales:true,  puedeCurarse:false, tieneHerramienta:false, prioridadDominio:false,
    habilidades:[
      {nombre:'Descarga',                     desc:'Rayo eléctrico seguro',                danio:40,  coste:20,  fisico:false, dominio:false},
      {nombre:'Báculo Físico',                desc:'Golpe conductor',                      danio:60,  coste:35,  fisico:true,  dominio:false},
      {nombre:'Electrólisis',                 desc:'Vapor maldito',                        danio:80,  coste:50,  fisico:false, dominio:false},
      {nombre:'Patada Magnética',             desc:'Ataque magnético',                     danio:100, coste:65,  fisico:true,  dominio:false},
      {nombre:'ÁMBAR MÍTICO',                 desc:'Forma final devastadora',              danio:160, coste:120, fisico:true,  dominio:false}]},

  { id:17, nombre:'Mei Mei',              tipo:'hechicero', hp:450,  energia:250,  emoji:'鸦', color:'#aa88ff', gradiente:'linear-gradient(135deg,#0a0022,#aa88ff)', puedeEspeciales:true,  puedeCurarse:false, tieneHerramienta:true,  prioridadDominio:false,
    habilidades:[
      {nombre:'Corte Hacha',                  desc:'Tajo de hacha',                        danio:40,  coste:20,  fisico:true,  dominio:false},
      {nombre:'Bird Strike',                  desc:'Cuervo suicida letal',                 danio:60,  coste:35,  fisico:false, dominio:false},
      {nombre:'Patada',                       desc:'Golpe físico',                         danio:80,  coste:50,  fisico:true,  dominio:false},
      {nombre:'Golpe de Mango',               desc:'Ataque contundente',                   danio:100, coste:65,  fisico:true,  dominio:false},
      {nombre:'Ataque Rápido',                desc:'Tajo veloz',                           danio:140, coste:120, fisico:true,  dominio:false}]},

  { id:18, nombre:'Inumaki Toge',         tipo:'hechicero', hp:360,  energia:300,  emoji:'言', color:'#88ccff', gradiente:'linear-gradient(135deg,#001522,#88ccff)', puedeEspeciales:true,  puedeCurarse:false, tieneHerramienta:false, prioridadDominio:false,
    habilidades:[
      {nombre:'¡Explota!',                    desc:'Comando fatal de explosión',           danio:40,  coste:20,  fisico:false, dominio:false},
      {nombre:'¡Aplastate!',                  desc:'Presión gravitatoria',                 danio:60,  coste:35,  fisico:false, dominio:false},
      {nombre:'Grito Sónico',                 desc:'Onda de choque verbal',                danio:80,  coste:50,  fisico:false, dominio:false},
      {nombre:'Golpe Leve',                   desc:'Físico básico',                        danio:100, coste:65,  fisico:true,  dominio:false},
      {nombre:'Sentencia Final',              desc:'Daño extremo + autolesión 20%',        danio:140, coste:120, fisico:false, dominio:false, efecto:'autolesion'}]},

  { id:19, nombre:'Panda',                tipo:'hechicero', hp:550,  energia:200,  emoji:'熊', color:'#cccccc', gradiente:'linear-gradient(135deg,#111111,#888888)', puedeEspeciales:true,  puedeCurarse:false, tieneHerramienta:false, prioridadDominio:false,
    habilidades:[
      {nombre:'Núcleo Gorila',                desc:'Fuerza de gorila',                     danio:40,  coste:20,  fisico:true,  dominio:false},
      {nombre:'Cañón Tambor',                 desc:'Daño interno',                         danio:60,  coste:35,  fisico:false, dominio:false},
      {nombre:'Núcleo Rhino',                 desc:'Embestida de rinoceronte',             danio:80,  coste:50,  fisico:true,  dominio:false},
      {nombre:'Zarpazo',                      desc:'Ataque físico',                        danio:100, coste:65,  fisico:true,  dominio:false},
      {nombre:'Trío de Golpes',               desc:'Combo final definitivo',               danio:140, coste:120, fisico:true,  dominio:false}]},

  { id:20, nombre:'Hiromi Higuruma',      tipo:'hechicero', hp:470,  energia:380,  emoji:'⚖', color:'#8888cc', gradiente:'linear-gradient(135deg,#0a0a22,#8888cc)', puedeEspeciales:true,  puedeCurarse:false, tieneHerramienta:false, prioridadDominio:false,
    habilidades:[
      {nombre:'Golpe de Mazo',                desc:'Golpe físico de Judgeman',             danio:55,  coste:20,  fisico:true,  dominio:false},
      {nombre:'Confiscación',                 desc:'Debilita al rival 2 turnos',           danio:40,  coste:35,  fisico:false, dominio:false, efecto:'debilitar'},
      {nombre:'Testigo de Cargo',             desc:'Evidencia maldita',                    danio:75,  coste:50,  fisico:false, dominio:false},
      {nombre:'VEREDICTO: CULPABLE',          desc:'Daño masivo + inmoviliza 1 turno',     danio:100, coste:80,  fisico:false, dominio:false, efecto:'inmovilizar1'},
      {nombre:'EXPANSIÓN: TRIBUNAL MALDITO',  desc:'Juicio de Judgeman',                   danio:0,   coste:120, fisico:false, dominio:true,  efectoDominio:'tribunal', efecto:'tribunal'}]},

  { id:21, nombre:'Angel (Hana Kurusu)',  tipo:'hechicero', hp:440,  energia:420,  emoji:'✝', color:'#ffeecc', gradiente:'linear-gradient(135deg,#1a1533,#ffeecc)', puedeEspeciales:true,  puedeCurarse:false, tieneHerramienta:false, prioridadDominio:false,
    habilidades:[
      {nombre:'Tajo Celestial',               desc:'Corte que ignora defensa',             danio:60,  coste:25,  fisico:true,  dominio:false},
      {nombre:'Purificación',                 desc:'Elimina efectos negativos +80 HP',     danio:0,   coste:40,  fisico:false, dominio:false, efecto:'purificar'},
      {nombre:'Lluvia de Plumas',             desc:'Ráfaga angélica a distancia',          danio:75,  coste:55,  fisico:false, dominio:false},
      {nombre:'JACOB: ANIQUILACIÓN',          desc:'Daño doble a Maldiciones',             danio:110, coste:85,  fisico:true,  dominio:false, efecto:'jacob'},
      {nombre:'ESCALERA DE JACOB',            desc:'Técnica máxima: atraviesa toda defensa',danio:180,coste:130, fisico:true,  dominio:false}]},

  { id:22, nombre:'Kenjaku',              tipo:'hechicero', hp:580,  energia:550,  emoji:'脳', color:'#cc44ff', gradiente:'linear-gradient(135deg,#110022,#cc44ff)', puedeEspeciales:true,  puedeCurarse:false, tieneHerramienta:false, prioridadDominio:true,
    habilidades:[
      {nombre:'Manipulación de Maldiciones',  desc:'Horda de maldiciones robadas',         danio:65,  coste:25,  fisico:false, dominio:false},
      {nombre:'Técnica Robada: Ultravioleta', desc:'Rayo de energía copiado',              danio:90,  coste:45,  fisico:false, dominio:false},
      {nombre:'Barrera Anti-Hechicero',       desc:'Suprime CE rival 2 turnos',            danio:30,  coste:60,  fisico:false, dominio:false, efecto:'suprimir'},
      {nombre:'UZUMAKI MODIFICADO',           desc:'Descarga de técnicas combinadas',      danio:130, coste:90,  fisico:false, dominio:false},
      {nombre:'EXPANSIÓN: GRAN JUEGO',        desc:'Inmoviliza 2T + drena CE cada turno',  danio:60,  coste:130, fisico:false, dominio:true,  efectoDominio:'gran-juego', efecto:'gran-juego'}]},

  { id:23, nombre:'Naoya Zenin',          tipo:'hechicero', hp:460,  energia:300,  emoji:'風', color:'#aaffee', gradiente:'linear-gradient(135deg,#001a15,#aaffee)', puedeEspeciales:true,  puedeCurarse:false, tieneHerramienta:false, prioridadDominio:false,
    habilidades:[
      {nombre:'Vórtice',                      desc:'Espiral de aire comprimido',           danio:65,  coste:20,  fisico:true,  dominio:false},
      {nombre:'Ventilación: Ráfaga',          desc:'Múltiples impactos de aire',           danio:80,  coste:35,  fisico:true,  dominio:false},
      {nombre:'Barrera de Sonido',            desc:'Rompe barrera sónica, inmoviliza 1T',  danio:55,  coste:50,  fisico:true,  dominio:false, efecto:'inmovilizar1'},
      {nombre:'Ventilación: Espiral Letal',   desc:'Vórtice que desgarra desde dentro',    danio:120, coste:75,  fisico:true,  dominio:false},
      {nombre:'Torrente: Última Velocidad',   desc:'Velocidad máxima, potencia +1T',       danio:140, coste:100, fisico:true,  dominio:false, efecto:'potenciar'}]},

  { id:24, nombre:'Yuki Tsukumo',         tipo:'hechicero', hp:530,  energia:380,  emoji:'重', color:'#aa66ff', gradiente:'linear-gradient(135deg,#0a0022,#aa66ff)', puedeEspeciales:true,  puedeCurarse:false, tieneHerramienta:false, prioridadDominio:false,
    habilidades:[
      {nombre:'Puñetazo de Masa Virtual',     desc:'Peso aplastante en el puño',           danio:70,  coste:20,  fisico:true,  dominio:false},
      {nombre:'Garuda: Embestida',            desc:'Shikigami con masa virtual máxima',    danio:90,  coste:40,  fisico:false, dominio:false},
      {nombre:'Masa Virtual: Escudo',         desc:'Defensa + contraataque 40 dmg',        danio:40,  coste:55,  fisico:false, dominio:false, efecto:'escudo-masa'},
      {nombre:'Garuda: Impacto Gravitacional',desc:'Deforma el espacio',                   danio:115, coste:80,  fisico:true,  dominio:false},
      {nombre:'MASA VIRTUAL: COLAPSO ESTELAR',desc:'Singularidad devastadora',             danio:170, coste:125, fisico:true,  dominio:false}]}
];

const MAHORAGA_DEF = {
  id:99, nombre:'Mahoraga', tipo:'maldicion', hp:800, energia:500,
  emoji:'将', color:'#ffaa00', gradiente:'linear-gradient(135deg,#1a0800,#ffaa00)',
  puedeEspeciales:true, puedeCurarse:false, tieneHerramienta:false, prioridadDominio:false,
  habilidades:[
    {nombre:'Golpe Físico',         desc:'Ataque bruto',                               danio:50,  coste:0,   fisico:true,  dominio:false},
    {nombre:'Adaptación',           desc:'Se regenera +80 HP',                         danio:0,   coste:50,  fisico:false, dominio:false, efecto:'regenerar'},
    {nombre:'Tajo de Exterminio',   desc:'INSTAKILL a Maldiciones',                    danio:150, coste:100, fisico:true,  dominio:false, efecto:'exterminio'},
    {nombre:'Ráfaga de Golpes',     desc:'Multigolpe devastador',                      danio:70,  coste:20,  fisico:true,  dominio:false},
    {nombre:'Embestida Pesada',     desc:'Daño puro imparable',                        danio:90,  coste:30,  fisico:true,  dominio:false}]
};

// ════════════════════════════════════════════════════
//  TRIBUNAL CRIMES
// ════════════════════════════════════════════════════
const CRIMENES = [
  {crimen:'uso no autorizado de técnica maldita en zona residencial de Shibuya',
   defensa:'La técnica fue activada de manera involuntaria al contacto con una maldición de grado 2.',gravedad:1},
  {crimen:'participación en misión de exorcismo sin acreditación vigente del Consejo',
   defensa:'La acreditación estaba en renovación y actué bajo orden verbal de un supervisor superior.',gravedad:1},
  {crimen:'destrucción de infraestructura del Colegio Técnico de Magia de Tokio',
   defensa:'El daño fue consecuencia de un ataque no provocado; actué en defensa propia.',gravedad:1},
  {crimen:'colaboración con el Plan de Vuelta de Kenjaku para suprimir la barrera de Shibuya',
   defensa:'Fui manipulado mediante técnica de sustitución; mis acciones no respondían a mi voluntad.',gravedad:2},
  {crimen:'liberación deliberada del contenedor de maldición especial Ryomen Sukuna',
   defensa:'El contenedor fue dañado por una maldición de grado especial, no por acción propia.',gravedad:2},
  {crimen:'traición al Colegio facilitando información clasificada al Clan Kamo disidente',
   defensa:'La información fue transmitida bajo coerción mientras mis compañeros estaban retenidos.',gravedad:2},
  {crimen:'masacre del Hospital Eisei durante el incidente de Shibuya bajo control de Sukuna',
   defensa:'El cuerpo fue tomado por Ryomen Sukuna; no existe consciencia ni intencionalidad de mi parte.',gravedad:3},
  {crimen:'conspiración con Kenjaku para someter a la humanidad mediante Tengen',
   defensa:'No existe prueba física que demuestre participación activa; actué sin consentimiento propio.',gravedad:3},
  {crimen:'apertura del Juego de la Culpa con la muerte de más de mil hechiceros certificados',
   defensa:'La acusación carece de testigos supervivientes vinculantes y toda evidencia fue recopilada dentro del propio Juego.',gravedad:3}
];

// ════════════════════════════════════════════════════
//  ROOM MANAGEMENT
// ════════════════════════════════════════════════════
const rooms = {};
function makeRoomId() { return Math.random().toString(36).substr(2,5).toUpperCase(); }

function deepCloneChar(def, playerIdx) {
  return {
    ...def,
    hp: def.hp, maxHp: def.hp,
    energia: def.energia, maxEnergia: def.energia,
    playerIdx,
    burnout:0, inmortal:0, inmovilizado:0, potenciado:0,
    causaInmovilizacion:'técnica enemiga',
    defendiendo:false, dominioActivo:false,
    herramientaConfiscada:false,
    ultimoGolpeFisicoSinEnergia:false,
    espadaVerdugoActiva:false, golpesEspada:0,
    habilidades: def.habilidades.map(h => ({...h}))
  };
}

function crearBatalla(char0, char1) {
  return {
    chars: [deepCloneChar(char0,0), deepCloneChar(char1,1)],
    turnoActivo: 0,
    dominio: null,
    log: [],
    fase: 'battle',
    pendingTribunal: null,
    penaActiva: false, golpesPena: 0
  };
}

function addLog(battle, msg) {
  battle.log.unshift({msg, ts:Date.now()});
  if (battle.log.length > 60) battle.log.pop();
}

// ════════════════════════════════════════════════════
//  GAME LOGIC
// ════════════════════════════════════════════════════
function aplicarDanio(atacante, defensor, dmg, battle, forzar=false) {
  if (defensor.inmortal > 0) { addLog(battle,`¡${defensor.nombre} es inmortal y se regenera!`); return 0; }
  const esMakiToji = defensor.nombre==='Maki Zenin'||defensor.nombre==='Toji Fushiguro';
  const dentro = battle.dominio && battle.dominio.ownerIdx !== defensor.playerIdx && !esMakiToji;
  if (!forzar && !dentro && !esMakiToji && Math.random()<0.15) {
    addLog(battle,`💨 ¡${defensor.nombre} esquivó el ataque!`); return 0;
  }
  if (dentro) addLog(battle,`🎯 Golpe garantizado por el Dominio.`);
  let d = dmg;
  if (defensor.defendiendo) { d=Math.floor(d/2); addLog(battle,`🛡️ ${defensor.nombre} reduce el daño a la mitad.`); }
  defensor.hp = Math.max(0, defensor.hp-d);
  addLog(battle,`${defensor.nombre} recibe ${d} de daño. (HP: ${defensor.hp}/${defensor.maxHp})`);
  return d;
}

function calcDanio(atacante, hab) {
  let d = hab.danio;
  if (atacante.potenciado>0) d=Math.floor(d*1.5);
  else if (atacante.potenciado<0) d=Math.floor(d*0.6);
  if (atacante.dominioActivo) d=Math.floor(d*1.3);
  let bf=false;
  if (hab.fisico && atacante.puedeEspeciales) {
    if (hab.nombre.includes('Destello Negro')) bf=true;
    else bf=Math.random()<0.05;
  }
  if (bf) { d=Math.floor(d*2.5); }
  return {dmg:d, blackFlash:bf};
}

function prepTurno(c) {
  c.defendiendo=false;
  if(c.burnout>0)c.burnout--;
  if(c.inmortal>0)c.inmortal--;
  if(c.inmovilizado>0)c.inmovilizado--;
  if(c.potenciado>0)c.potenciado--;
  else if(c.potenciado<0)c.potenciado++;
}

function resolverAccion(battle, actionData) {
  const atIdx = battle.turnoActivo;
  const defIdx = 1-atIdx;
  const at = battle.chars[atIdx];
  const def = battle.chars[defIdx];

  prepTurno(at);

  if (at.inmovilizado>0) {
    addLog(battle,`⛓ ${at.nombre} está inmovilizado — turno saltado (${at.causaInmovilizacion}).`);
    battle.turnoActivo = defIdx;
    return {type:'action_resolved'};
  }

  const {type, habIdx} = actionData;

  if (type==='basic') {
    const res = calcDanio(at,{danio:30,fisico:true,nombre:'Ataque',puedeEspeciales:at.puedeEspeciales});
    if(res.blackFlash) addLog(battle,`💥 ¡DESTELLO NEGRO!`);
    addLog(battle,`${at.nombre} lanza un Ataque Físico.`);
    def.ultimoGolpeFisicoSinEnergia = !at.tieneHerramienta;
    aplicarDanio(at,def,res.dmg,battle);
    battle.turnoActivo=defIdx;
    return {type:'action_resolved'};
  }

  if (type==='defend') {
    at.defendiendo=true;
    addLog(battle,`🛡️ ${at.nombre} se pone en guardia.`);
    battle.turnoActivo=defIdx;
    return {type:'action_resolved'};
  }

  if (type==='recargar') {
    if (!at.puedeEspeciales) return null;
    at.energia=Math.min(at.maxEnergia,at.energia+80);
    addLog(battle,`⚡ ${at.nombre} recarga 80 CE.`);
    battle.turnoActivo=defIdx;
    return {type:'action_resolved'};
  }

  if (type==='curar') {
    const esRegFisica = at.nombre==='Maki Zenin'||at.nombre==='Toji Fushiguro';
    const coste = at.nombre==='Gojo Satoru' ? 5 : esRegFisica ? 0 : 50;
    if (!esRegFisica && at.energia<coste) { addLog(battle,`⚠️ Energía insuficiente para curarse.`); return null; }
    if (!esRegFisica) at.energia-=coste;
    const cur = esRegFisica ? 150 : 250;
    at.hp=Math.min(at.maxHp,at.hp+cur);
    addLog(battle,esRegFisica ? `💚 ${at.nombre} se regenera físicamente (+${cur} HP).` : `💚 ${at.nombre} usa Técnica Inversa (+${cur} HP).`);
    battle.turnoActivo=defIdx;
    return {type:'action_resolved'};
  }

  if (type==='habilidad') {
    const hab = at.habilidades[habIdx];
    if (!hab) return null;
    if (at.burnout>0 && habIdx>0) { addLog(battle,`🔥 BURNOUT — técnica desactivada.`); return null; }
    if (at.energia<hab.coste) { addLog(battle,`⚠️ CE insuficiente (necesita ${hab.coste}, tiene ${at.energia}).`); return null; }
    at.energia-=hab.coste;
    addLog(battle,`✨ ${at.nombre} usa: ${hab.nombre}`);
    addLog(battle,`   ${hab.desc}`);
    def.ultimoGolpeFisicoSinEnergia = (hab.coste===0 && !at.tieneHerramienta);

    if (hab.efecto==='mahoraga') {
      addLog(battle,`🐉 Megumi invoca a Mahoraga. ¡Megumi abandona el combate!`);
      battle.chars[atIdx]=deepCloneChar(MAHORAGA_DEF,atIdx);
      battle.turnoActivo=defIdx;
      return {type:'action_resolved'};
    }
    if (hab.efecto==='gamble') {
      if (Math.random()<0.33) {
        addLog(battle,`🎰 ¡¡JACKPOT!! ${at.nombre} obtiene CE infinita e inmortalidad (4T)!`);
        at.inmortal=4; at.energia=9999;
      } else { addLog(battle,`💀 Mala suerte en el IDLE DEATH GAMBLE.`); }
      battle.turnoActivo=defIdx;
      return {type:'action_resolved', domainEffect:'idle-death-gamble'};
    }
    if (hab.efecto==='purificar') {
      at.burnout=0; at.inmovilizado=0; at.hp=Math.min(at.maxHp,at.hp+80);
      addLog(battle,`✝️ ${at.nombre} se purifica: efectos negativos eliminados +80 HP.`);
      battle.turnoActivo=defIdx; return {type:'action_resolved'};
    }
    if (hab.efecto==='potenciar') { at.potenciado=2; addLog(battle,`🔥 ${at.nombre} se potencia 2 turnos.`); }
    if (hab.efecto==='debilitar') { def.potenciado=Math.max(def.potenciado-1,-2); addLog(battle,`📜 ${def.nombre} debilitado.`); }
    if (hab.efecto==='suprimir') { def.potenciado=Math.max(def.potenciado-2,-2); addLog(battle,`🔮 ${def.nombre} suprimido.`); }
    if (hab.efecto==='inmovilizar1') { def.inmovilizado=1; def.causaInmovilizacion=hab.nombre; addLog(battle,`⛓ ${def.nombre} inmovilizado 1T.`); }
    if (hab.efecto==='inmovilizar2') { def.inmovilizado=2; def.causaInmovilizacion=hab.nombre; addLog(battle,`⛓ ${def.nombre} inmovilizado 2T.`); }
    if (hab.efecto==='gran-juego') { def.inmovilizado=2; def.causaInmovilizacion='GRAN JUEGO'; def.energia=0; addLog(battle,`🌀 ${def.nombre} inmovilizado 2T y sin CE.`); }
    if (hab.efecto==='escudo-masa') {
      at.defendiendo=true;
      addLog(battle,`⚫ Masa Virtual: Escudo activo. Contraataque: 40 dmg.`);
      def.hp=Math.max(0,def.hp-40); addLog(battle,`${def.nombre} recibe 40 de contragolpe.`);
    }
    if (hab.efecto==='regenerar') { at.hp=Math.min(at.maxHp,at.hp+80); addLog(battle,`💚 ${at.nombre} se regenera +80 HP.`); battle.turnoActivo=defIdx; return {type:'action_resolved'}; }
    if (hab.efecto==='autolesion') { const a=Math.floor(hab.danio*0.2); at.hp=Math.max(0,at.hp-a); addLog(battle,`🩸 ${at.nombre} sufre ${a} de retroceso.`); }
    if (hab.efecto==='jacob' && def.tipo==='maldicion') {
      addLog(battle,`✝️ JACOB: ANIQUILACIÓN — daño doble a maldición!`);
      const d2=hab.danio*2; def.hp=Math.max(0,def.hp-d2);
      addLog(battle,`${def.nombre} recibe ${d2} de daño angélico. (HP:${def.hp})`);
      battle.turnoActivo=defIdx; return {type:'action_resolved'};
    }
    if (hab.efecto==='exterminio' && def.tipo==='maldicion') {
      addLog(battle,`✨ ¡Tajo de Exterminio! La maldición es purificada al instante.`);
      def.hp=0; battle.turnoActivo=defIdx; return {type:'action_resolved'};
    }
    if (hab.dominio) { battle.turnoActivo=defIdx; return {type:'domain', hab, atIdx, defIdx}; }
    if (hab.danio>0) {
      const res=calcDanio(at,hab);
      if (res.blackFlash) addLog(battle,`💥 ¡DESTELLO NEGRO!`);
      aplicarDanio(at,def,res.dmg,battle);
    }
    battle.turnoActivo=defIdx;
    return {type:'action_resolved'};
  }
  return null;
}

function resolverDominio(battle, hab, atIdx) {
  const defIdx=1-atIdx;
  const at=battle.chars[atIdx];
  const def=battle.chars[defIdx];

  if (!battle.dominio) { activarDominio(battle,atIdx,hab); return {type:'domain_activated',efectoDominio:hab.efectoDominio}; }
  if (battle.dominio.ownerIdx===atIdx) { addLog(battle,`⚠️ Ya tienes un dominio activo.`); return {type:'action_resolved'}; }

  const esMakiToji=def.nombre==='Maki Zenin'||def.nombre==='Toji Fushiguro';
  if (esMakiToji) { addLog(battle,`💪 ${def.nombre} resiste el golpe seguro del dominio.`); activarDominio(battle,atIdx,hab); return {type:'domain_activated',efectoDominio:hab.efectoDominio}; }

  const defTieneDominio=def.habilidades.some(h=>h.dominio);
  if (!defTieneDominio) { addLog(battle,`😱 ${def.nombre} no tiene dominio propio. Queda atrapado.`); activarDominio(battle,atIdx,hab); return {type:'domain_activated',efectoDominio:hab.efectoDominio}; }

  if (hab.efecto==='tribunal') { activarDominio(battle,atIdx,hab); return {type:'tribunal_start',efectoDominio:hab.efectoDominio}; }

  return {type:'domain_clash', hab, atIdx, defIdx};
}

function activarDominio(battle, ownerIdx, hab) {
  if (battle.dominio) {
    battle.chars[battle.dominio.ownerIdx].dominioActivo=false;
    battle.chars[battle.dominio.ownerIdx].burnout=2;
    battle.chars.forEach(c=>{c.dentrosDeDominio=false;});
  }
  battle.dominio={ownerIdx, nombre:hab.nombre, efectoDominio:hab.efectoDominio, turnosRestantes:8};
  const at=battle.chars[ownerIdx];
  at.dominioActivo=true;
  const defIdx=1-ownerIdx;
  const esMakiToji=battle.chars[defIdx].nombre==='Maki Zenin'||battle.chars[defIdx].nombre==='Toji Fushiguro';
  if (!esMakiToji) battle.chars[defIdx].dentrosDeDominio=true;
  addLog(battle,`🌀 ¡${at.nombre} EXPANDE SU DOMINIO — ${hab.nombre}!`);
}

function tickDominio(battle) {
  if (!battle.dominio) return;
  const dom=battle.dominio;
  dom.turnosRestantes--;
  const owner=battle.chars[dom.ownerIdx];
  if (owner.nombre==='Sukuna') {
    const defIdx=1-dom.ownerIdx;
    battle.chars[defIdx].hp=Math.max(0,battle.chars[defIdx].hp-50);
    addLog(battle,`⚔️ Santuario Malévolo: 50 dmg pasivo.`);
  }
  if (owner.nombre==='Kenjaku') {
    const defIdx=1-dom.ownerIdx;
    const d=Math.min(battle.chars[defIdx].energia,60);
    battle.chars[defIdx].energia-=d;
    addLog(battle,`🌀 Gran Juego drena ${d} CE.`);
  }
  if (dom.turnosRestantes<=0) {
    owner.dominioActivo=false; owner.burnout=2;
    battle.chars.forEach(c=>{c.dentrosDeDominio=false;});
    addLog(battle,`El dominio de ${owner.nombre} se ha disipado.`);
    battle.dominio=null;
  }
}

function comprobarNaoya(battle, idx) {
  const c=battle.chars[idx];
  if (c.nombre==='Naoya Zenin' && c.hp<=0 && c.ultimoGolpeFisicoSinEnergia===true) {
    addLog(battle,`☠️ ¡NAOYA ZENIN RENACE COMO MALDICIÓN ESPECIAL!`);
    const nm=deepCloneChar({
      id:230,nombre:'Naoya Zenin (Maldición)',tipo:'maldicion',hp:550,energia:0,
      emoji:'怨',color:'#aaffee',gradiente:'linear-gradient(135deg,#001a15,#ff4488)',
      puedeEspeciales:false,puedeCurarse:false,tieneHerramienta:false,prioridadDominio:false,
      habilidades:[
        {nombre:'Vórtice Maldito',desc:'Vórtice de aire corrompido',danio:95,coste:0,fisico:true,dominio:false},
        {nombre:'Torbellino de Odio',desc:'Espiral de odio puro',danio:115,coste:0,fisico:true,dominio:false},
        {nombre:'Barrera Sónica Maldita',desc:'Inmoviliza 2 turnos',danio:75,coste:0,fisico:true,dominio:false,efecto:'inmovilizar2'},
        {nombre:'Orgullo del Clan Zenin',desc:'+100 HP + potenciado 2T',danio:0,coste:0,fisico:false,dominio:false,efecto:'orgullo'},
        {nombre:'TORMENTA FINAL: RENCOR ETERNO',desc:'No puede bloquearse',danio:190,coste:0,fisico:true,dominio:false}
      ]},idx);
    battle.chars[idx]=nm;
    return true;
  }
  return false;
}

function generarSecuencia(len) { return Array.from({length:len},()=>Math.floor(Math.random()*4)+1); }

function sanitizeChar(c) {
  return {
    nombre:c.nombre, tipo:c.tipo, emoji:c.emoji, color:c.color,
    gradiente:c.gradiente, hp:c.hp, maxHp:c.maxHp,
    energia:c.energia, maxEnergia:c.maxEnergia,
    burnout:c.burnout, inmortal:c.inmortal,
    inmovilizado:c.inmovilizado, causaInmovilizacion:c.causaInmovilizacion,
    potenciado:c.potenciado, defendiendo:c.defendiendo,
    dominioActivo:c.dominioActivo, espadaVerdugoActiva:c.espadaVerdugoActiva,
    puedeEspeciales:c.puedeEspeciales, puedeCurarse:c.puedeCurarse,
    habilidades:c.habilidades.map(h=>({nombre:h.nombre,desc:h.desc,danio:h.danio,coste:h.coste,dominio:!!h.dominio,fisico:!!h.fisico}))
  };
}

function broadcast(room, event, data) { io.to(room.id).emit(event, data); }
function getSocket(room, idx) { const p=room.players[idx]; return p ? io.sockets.sockets.get(p.id) : null; }

function broadcastUpdate(room) {
  broadcast(room,'battle_update',{
    chars:room.battle.chars.map(sanitizeChar),
    turnoActivo:room.battle.turnoActivo,
    dominio:room.battle.dominio,
    log:room.battle.log.slice(0,30)
  });
}

// ════════════════════════════════════════════════════
//  FIX: notifyTurn envía your_turn al jugador activo
//  y opponent_turn al otro. Ambos eventos llegan
//  DESPUÉS de battle_update (mismo ciclo de evento),
//  garantizando que el panel de cada cliente muestre
//  el estado correcto sin ventanas de ambigüedad.
// ════════════════════════════════════════════════════
function notifyTurn(room) {
  if (!room.battle) return;
  const aIdx = room.battle.turnoActivo;
  const sActivo  = getSocket(room, aIdx);
  const sEspera  = getSocket(room, 1-aIdx);

  // Notificar al jugador cuyo turno es
  if (sActivo)  sActivo.emit('your_turn',    { playerIdx: aIdx });
  // Notificar al jugador que debe esperar
  if (sEspera) sEspera.emit('opponent_turn', { playerIdx: aIdx });
}

function checkGameOver(room) {
  if (!room.battle) return;
  const [c0,c1]=room.battle.chars;
  if (c0.hp<=0||c1.hp<=0) {
    const wIdx=c0.hp>0?0:1;
    addLog(room.battle,`🏆 ¡${room.battle.chars[wIdx].nombre} [${room.players[wIdx].name}] ha ganado!`);
    broadcast(room,'game_over',{
      winnerIdx:wIdx, winnerChar:room.battle.chars[wIdx].nombre,
      winnerPlayer:room.players[wIdx].name, log:room.battle.log.slice(0,20)
    });
    room.fase='over';
  } else {
    // ── FIX: notifyTurn siempre después de checkGameOver ──
    notifyTurn(room);
  }
}

function handleDomainResult(room, domResult, atIdx) {
  if (domResult.type==='domain_clash') {
    room.battle.fase='domain_clash';
    const seqs=[
      [generarSecuencia(4),generarSecuencia(5),generarSecuencia(6)],
      [generarSecuencia(4),generarSecuencia(5),generarSecuencia(6)]
    ];
    const at=room.battle.chars[atIdx];
    const def=room.battle.chars[1-atIdx];
    const s0=at.prioridadDominio?1:0;
    const s1=def.prioridadDominio?1:0;
    room.domainClashData={atIdx,sequences:seqs,scores:[s0,s1],responses:[null,null]};
    broadcastUpdate(room);
    broadcast(room,'domain_clash_begin',{
      atacante:at.nombre,defensor:def.nombre,
      atPrio:at.prioridadDominio||false, defPrio:def.prioridadDominio||false,
      scores:[s0,s1]
    });
    sendClashRound(room,1);
    // No llamar notifyTurn aquí: el turno se reanuda al resolver el clash
  } else if (domResult.type==='tribunal_start') {
    room.battle.fase='tribunal';
    const acusadoIdx=1-atIdx;
    const cIdx=Math.floor(Math.random()*CRIMENES.length);
    const crime=CRIMENES[cIdx];
    const opts=buildOpts(cIdx);
    room.battle.pendingTribunal={crimeIdx:cIdx,acusadoIdx,correctIdx:opts.correctIdx,esPrimera:true};
    broadcast(room,'tribunal_begin',{efectoDominio:domResult.efectoDominio,acusadoIdx});
    broadcastUpdate(room);
    const s=getSocket(room,acusadoIdx);
    if(s) s.emit('tribunal_accusation',{crimen:crime.crimen,gravedad:crime.gravedad,options:opts.opts,esApelacion:false});
    // No llamar notifyTurn aquí: el turno se reanuda al resolver el tribunal
  } else {
    // Dominio activado sin choque ni tribunal
    broadcastUpdate(room);
    checkGameOver(room); // checkGameOver llama notifyTurn si el juego continúa
  }
}

function sendClashRound(room,ronda) {
  const cl=room.domainClashData;
  for(let i=0;i<2;i++){
    const s=getSocket(room,i);
    if(s) s.emit('domain_clash_round',{ronda,sequence:cl.sequences[i][ronda-1],scores:cl.scores});
  }
}

function buildOpts(cIdx) {
  const correct=CRIMENES[cIdx].defensa;
  const others=CRIMENES.filter((_,i)=>i!==cIdx).map(c=>c.defensa).sort(()=>Math.random()-0.5).slice(0,2);
  const opts=[correct,...others].sort(()=>Math.random()-0.5);
  return {opts, correctIdx:opts.indexOf(correct)};
}

function resolverTribunal(battle, acIdx, acusadorIdx, eleccion, esPrimera) {
  const trib=battle.pendingTribunal;
  const crime=CRIMENES[trib.crimeIdx];
  const gravedad=crime.gravedad;
  const acusado=battle.chars[acIdx];
  const higurumaChar=battle.chars[acusadorIdx];

  if(eleccion===trib.correctIdx){
    addLog(battle,`✅ VEREDICTO: ¡INOCENTE! El cargo queda retirado.`);
    battle.pendingTribunal=null;
    return {veredicto:'inocente'};
  }
  if(esPrimera && gravedad>=2) {
    return {veredicto:'culpable_parcial',gravedad,puedeApelar:true};
  }
  if(gravedad<=2){
    addLog(battle,`🔨 CONFISCACIÓN ejecutada.`);
    if(acusado.tieneHerramienta && !acusado.herramientaConfiscada){
      acusado.herramientaConfiscada=true; acusado.potenciado=Math.min(acusado.potenciado-2,-2);
      addLog(battle,`📦 Herramienta maldita de ${acusado.nombre} destruida.`);
    } else if(acusado.puedeEspeciales){
      acusado.burnout=2; addLog(battle,`🚫 Técnica de ${acusado.nombre} sellada 2T.`);
    } else {
      acusado.energia=0; addLog(battle,`⚡ Energía de ${acusado.nombre} confiscada.`);
    }
    battle.pendingTribunal=null;
    return {veredicto:'culpable',tipo:'confiscacion'};
  } else {
    addLog(battle,`💀 PENA DE MUERTE: Higuruma obtiene la Espada del Verdugo.`);
    higurumaChar.espadaVerdugoActiva=true;
    battle.pendingTribunal=null;
    return intentarEspada(battle, acIdx, higurumaChar);
  }
}

function intentarEspada(battle, acIdx, hig) {
  const ac=battle.chars[acIdx];
  if(Math.random()<0.30){
    hig.golpesEspada=(hig.golpesEspada||0)+1;
    if(hig.golpesEspada===1){
      const d=Math.floor(ac.hp*0.6); ac.hp=Math.max(0,ac.hp-d);
      addLog(battle,`🩸 ¡PRIMER GOLPE DEL VERDUGO! ${ac.nombre} pierde el 60% de HP (${d} dmg).`);
    } else {
      ac.hp=0; hig.espadaVerdugoActiva=false; hig.golpesEspada=0;
      addLog(battle,`☠️ ¡SEGUNDO GOLPE! Sentencia cumplida.`);
    }
  } else { addLog(battle,`💨 La Espada del Verdugo falla esta vez...`); }
  return {veredicto:'pena_muerte'};
}

// ════════════════════════════════════════════════════
//  SOCKET EVENTS
// ════════════════════════════════════════════════════
io.on('connection', socket => {
  socket.on('create_room', ({playerName}) => {
    const id=makeRoomId();
    rooms[id]={id,players:[{id:socket.id,name:playerName,charIdx:null,ready:false}],battle:null,fase:'lobby',domainClashData:null};
    socket.join(id); socket.roomId=id; socket.playerIdx=0;
    socket.emit('room_created',{roomId:id,playerIdx:0});
  });

  socket.on('join_room', ({roomId, playerName}) => {
    const room=rooms[roomId];
    if(!room) return socket.emit('error',{msg:'Sala no encontrada.'});
    if(room.players.length>=2) return socket.emit('error',{msg:'Sala llena.'});
    room.players.push({id:socket.id,name:playerName,charIdx:null,ready:false});
    socket.join(roomId); socket.roomId=roomId; socket.playerIdx=1;
    socket.emit('room_joined',{roomId,playerIdx:1});
    broadcast(room,'player_joined',{players:room.players.map(p=>({name:p.name}))});
    room.fase='character_select';
    const charData=CHARACTERS.map(c=>({
      id:c.id, nombre:c.nombre, tipo:c.tipo, emoji:c.emoji,
      color:c.color, gradiente:c.gradiente, hp:c.hp, energia:c.energia,
      habilidades:c.habilidades.map(h=>({nombre:h.nombre,desc:h.desc,danio:h.danio,coste:h.coste,dominio:!!h.dominio}))
    }));
    broadcast(room,'phase_change',{fase:'character_select',characters:charData});
  });

  socket.on('select_character', ({charIdx}) => {
    const room=rooms[socket.roomId]; if(!room) return;
    const player=room.players[socket.playerIdx];
    player.charIdx=charIdx; player.ready=true;
    broadcast(room,'character_selected',{playerIdx:socket.playerIdx,charIdx});
    if(room.players.every(p=>p.ready)){
      const c0=CHARACTERS[room.players[0].charIdx];
      const c1=CHARACTERS[room.players[1].charIdx];
      room.battle=crearBatalla(c0,c1);
      room.fase='battle';
      addLog(room.battle,`⚔️ ¡EL COMBATE COMIENZA!`);
      addLog(room.battle,`${room.battle.chars[0].nombre} VS ${room.battle.chars[1].nombre}`);
      broadcast(room,'battle_start',{
        chars:room.battle.chars.map(sanitizeChar),
        playerNames:room.players.map(p=>p.name),
        turnoActivo:0, log:room.battle.log
      });
      // FIX: notifyTurn inmediatamente después de battle_start
      notifyTurn(room);
    }
  });

  socket.on('player_action', actionData => {
    const room=rooms[socket.roomId]; if(!room||!room.battle) return;

    // ── FIX: verificar turno en servidor y notificar al cliente si intenta fuera de turno ──
    if(room.battle.turnoActivo!==socket.playerIdx) {
      // Recordar al cliente que no es su turno (evita panel "bloqueado")
      const sEspera = getSocket(room, socket.playerIdx);
      if (sEspera) sEspera.emit('opponent_turn', { playerIdx: room.battle.turnoActivo });
      return;
    }
    if(room.battle.fase!=='battle') return;

    const result=resolverAccion(room.battle,actionData);
    if(!result){
      // Acción inválida: devolver el turno al mismo jugador
      socket.emit('action_invalid',{log:room.battle.log});
      // FIX: re-emitir your_turn para que el cliente restaure el panel
      socket.emit('your_turn', { playerIdx: socket.playerIdx });
      return;
    }

    if(result.type==='domain'){
      const domRes=resolverDominio(room.battle,result.hab,result.atIdx);
      handleDomainResult(room,domRes,result.atIdx); return;
    }
    for(let i=0;i<2;i++) comprobarNaoya(room.battle,i);
    tickDominio(room.battle);
    const hig=room.battle.chars.find(c=>c.espadaVerdugoActiva);
    if(hig){ const vIdx=1-hig.playerIdx; intentarEspada(room.battle,vIdx,hig); }
    broadcastUpdate(room);
    checkGameOver(room); // checkGameOver llama notifyTurn si el juego continúa
  });

  socket.on('domain_clash_response', ({sequence, ronda}) => {
    const room=rooms[socket.roomId]; if(!room||!room.domainClashData) return;
    const cl=room.domainClashData;
    cl.responses[socket.playerIdx]=sequence;
    if(cl.responses.every(r=>r!==null)){
      const r0=arrMatch(cl.sequences[0][ronda-1],cl.responses[0]);
      const r1=arrMatch(cl.sequences[1][ronda-1],cl.responses[1]);
      if(r0) cl.scores[0]++;
      if(r1) cl.scores[1]++;
      cl.responses=[null,null];
      if(ronda<3){ sendClashRound(room,ronda+1); }
      else {
        const atIdx=cl.atIdx; const defIdx=1-atIdx;
        const at=room.battle.chars[atIdx]; const def=room.battle.chars[defIdx];
        if(cl.scores[0]>cl.scores[1]){
          addLog(room.battle,`🏆 [${at.nombre}] sobrepone su dominio!`);
          def.dominioActivo=false; def.burnout=2;
          room.battle.chars.forEach(c=>{c.dentrosDeDominio=false;});
          const h=at.habilidades.find(h=>h.dominio);
          if(h) activarDominio(room.battle,atIdx,h);
        } else {
          addLog(room.battle,`🛡️ [${def.nombre}] mantiene su dominio intacto!`);
          at.burnout=2;
        }
        room.domainClashData=null; room.battle.fase='battle';
        broadcastUpdate(room);
        checkGameOver(room); // checkGameOver llama notifyTurn
      }
    }
  });

  socket.on('tribunal_response', ({choice, esPrimera}) => {
    const room=rooms[socket.roomId]; if(!room||!room.battle||!room.battle.pendingTribunal) return;
    const trib=room.battle.pendingTribunal;
    const acIdx=trib.acusadoIdx; const acusorIdx=1-acIdx;
    const result=resolverTribunal(room.battle,acIdx,acusorIdx,choice,esPrimera);
    if(result.puedeApelar){ const s=getSocket(room,acIdx); if(s) s.emit('tribunal_appeal_offer'); return; }
    room.battle.fase='battle';
    broadcastUpdate(room);
    checkGameOver(room); // checkGameOver llama notifyTurn
  });

  socket.on('tribunal_appeal', ({apela}) => {
    const room=rooms[socket.roomId]; if(!room||!room.battle||!room.battle.pendingTribunal) return;
    const trib=room.battle.pendingTribunal;
    if(apela){
      const cIdx=Math.floor(Math.random()*CRIMENES.length);
      const crime=CRIMENES[cIdx]; const opts=buildOpts(cIdx);
      trib.crimeIdx=cIdx; trib.correctIdx=opts.correctIdx; trib.esPrimera=false;
      const s=getSocket(room,trib.acusadoIdx);
      if(s) s.emit('tribunal_accusation',{crimen:crime.crimen,gravedad:crime.gravedad,options:opts.opts,esApelacion:true});
    } else {
      resolverTribunal(room.battle,trib.acusadoIdx,1-trib.acusadoIdx,-1,false);
      room.battle.fase='battle';
      broadcastUpdate(room);
      checkGameOver(room); // checkGameOver llama notifyTurn
    }
  });

  socket.on('disconnect', () => {
    const room=rooms[socket.roomId];
    if(room){ broadcast(room,'player_disconnected',{msg:'Un jugador se ha desconectado.'}); delete rooms[socket.roomId]; }
  });
});

function arrMatch(a,b){ if(!a||!b||a.length!==b.length) return false; return a.every((v,i)=>v===b[i]); }

const PORT=process.env.PORT||3000;
const MODO_TUNEL=process.argv.includes('--tunnel');

server.listen(PORT,'0.0.0.0',()=>{
  console.log(`\n╔══════════════════════════════════════════════╗`);
  console.log(`║  JJK Battle Server arrancado                 ║`);
  console.log(`║  Puerto: ${PORT}                                ║`);
  console.log(`║  Abre http://localhost:${PORT} en tu navegador  ║`);
  if(!MODO_TUNEL){
  console.log(`║  Para multijugador usa tu IP local           ║`);
  }
  console.log(`╚══════════════════════════════════════════════╝\n`);

  // ── Modo túnel (flag --tunnel) ─────────────────────────────
  // Crea una URL pública HTTPS usando localtunnel.
  // El otro jugador abre esa URL desde cualquier red, sin necesidad
  // de configurar firewall ni permisos de administrador.
  if(MODO_TUNEL){
    let lt;
    try { lt = require('localtunnel'); }
    catch(e){
      console.error('ERROR: localtunnel no está instalado.');
      console.error('Usa los scripts arrancar.bat / arrancar.sh para instalarlo.');
      return;
    }
    (async()=>{
      try{
        const tunnel = await lt({ port: PORT });
        const url = tunnel.url;
        const pad = (s, n) => s + ' '.repeat(Math.max(0, n - s.length));
        console.log(`╔══════════════════════════════════════════════════════════╗`);
        console.log(`║  🌐 MODO TÚNEL ACTIVO — SIN FIREWALL                     ║`);
        console.log(`║                                                          ║`);
        console.log(`║  URL PÚBLICA: ${pad(url, 46)}║`);
        console.log(`║                                                          ║`);
        console.log(`║  Comparte esta URL con el otro jugador.                  ║`);
        console.log(`║  Funciona desde cualquier red sin admin.                 ║`);
        console.log(`╚══════════════════════════════════════════════════════════╝\n`);
        tunnel.on('close', ()=>{ console.log('Túnel cerrado.'); process.exit(0); });
        tunnel.on('error', (err)=>console.error('Error de túnel:', err.message));
      } catch(err){
        console.error('No se pudo crear el túnel:', err.message);
        console.error('Comprueba tu conexión a internet.');
      }
    })();
  }
});
