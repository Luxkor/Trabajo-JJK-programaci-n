import java.util.*;

public class JuegoJJK {
    private static List<Personaje> catalogo = new ArrayList<>();
    private static Scanner sc = new Scanner(System.in);
    private static Personaje duenyoDominioActual = null;
    private static int turnosRestantesDominio = 0;

    // Nombres de los jugadores humanos
    private static String nombreJugador1 = "Jugador 1";
    private static String nombreJugador2 = "Jugador 2";

    // Sistema de música (clase abstracta con subclase de consola)
    private static final MusicaJJK musica = new MusicaJJK.MusicaConsola();

    // ── Colores ANSI ──────────────────────────────────────────────
    static final String RESET   = "\u001B[0m";
    static final String NEGRITA = "\u001B[1m";
    static final String ROJO    = "\u001B[31m";
    static final String VERDE   = "\u001B[32m";
    static final String AMARILLO= "\u001B[33m";
    static final String AZUL    = "\u001B[34m";
    static final String MAGENTA = "\u001B[35m";
    static final String CYAN    = "\u001B[36m";
    static final String BLANCO  = "\u001B[37m";
    static final String ROJO_INT    = "\u001B[91m";
    static final String VERDE_INT   = "\u001B[92m";
    static final String AMARILLO_INT= "\u001B[93m";
    static final String AZUL_INT    = "\u001B[94m";
    static final String MAGENTA_INT = "\u001B[95m";
    static final String CYAN_INT    = "\u001B[96m";

    // ── Helpers de UI ─────────────────────────────────────────────

    /** Barra de HP coloreada según el porcentaje restante. */
    static String barraHP(int actual, int maximo) {
        int bloques = 20;
        int llenos = (int)((double) actual / maximo * bloques);
        llenos = Math.max(0, Math.min(bloques, llenos));
        String color = llenos > 12 ? VERDE_INT : llenos > 6 ? AMARILLO_INT : ROJO_INT;
        StringBuilder sb = new StringBuilder(color + "[");
        for (int i = 0; i < bloques; i++) sb.append(i < llenos ? "█" : "░");
        sb.append("] " + actual + "/" + maximo + RESET);
        return sb.toString();
    }

    /** Barra de energía (azul). */
    static String barraEnergia(int actual, int maximo) {
        if (maximo == 0) return AZUL + "[Sin energía maldita]" + RESET;
        int bloques = 15;
        int llenos = (int)((double) actual / maximo * bloques);
        llenos = Math.max(0, Math.min(bloques, llenos));
        StringBuilder sb = new StringBuilder(AZUL + "[");
        for (int i = 0; i < bloques; i++) sb.append(i < llenos ? "▰" : "▱");
        sb.append("] " + actual + "/" + maximo + RESET);
        return sb.toString();
    }

    /** Línea horizontal decorativa. */
    static String linea(int ancho, String color) {
        return color + "═".repeat(ancho) + RESET;
    }

    /** Caja centrada con título. */
    static void cajaTitulo(String titulo, String colorBorde, String colorTexto) {
        int ancho = 52;
        String borde = colorBorde + "╔" + "═".repeat(ancho) + "╗" + RESET;
        String fondo = colorBorde + "║" + RESET;
        int padding = (ancho - titulo.length()) / 2;
        String linTitulo = fondo + " ".repeat(padding) + colorTexto + NEGRITA + titulo + RESET + " ".repeat(ancho - padding - titulo.length()) + fondo;
        String cierre = colorBorde + "╚" + "═".repeat(ancho) + "╝" + RESET;
        System.out.println(borde);
        System.out.println(linTitulo);
        System.out.println(cierre);
    }

    public static void main(String[] args) {
        String opcion = "";

        System.out.println("\n" + MAGENTA + NEGRITA);
        System.out.println("  ╔══════════════════════════════════════════════════╗");
        System.out.println("  ║        JUJUTSU KAISEN  —  BATTLE SYSTEM          ║");
        System.out.println("  ║                    v 4.1                         ║");
        System.out.println("  ╚══════════════════════════════════════════════════╝" + RESET);

        System.out.print(CYAN + "  🎮 Nombre del Jugador 1: " + RESET);
        String n1 = sc.nextLine().trim();
        if (!n1.isEmpty()) nombreJugador1 = n1;
        System.out.print(AMARILLO + "  🎮 Nombre del Jugador 2: " + RESET);
        String n2 = sc.nextLine().trim();
        if (!n2.isEmpty()) nombreJugador2 = n2;
        System.out.println(VERDE_INT + "\n  ¡Bienvenidos, " + NEGRITA + nombreJugador1 + RESET + VERDE_INT + " y " + NEGRITA + nombreJugador2 + RESET + VERDE_INT + "!" + RESET);

        do {
            System.out.println("\n" + MAGENTA + NEGRITA);
            System.out.println("  ╔══════════════════════════════════════════════════╗");
            System.out.println("  ║        JUJUTSU KAISEN  —  BATTLE SYSTEM          ║");
            System.out.println("  ╚══════════════════════════════════════════════════╝" + RESET);
            System.out.println("  " + CYAN  + "J1: " + NEGRITA + nombreJugador1 + RESET + "   " +
                    AMARILLO + "J2: " + NEGRITA + nombreJugador2 + RESET);
            System.out.println("  " + linea(50, AZUL));
            System.out.println("  " + VERDE_INT + "1." + RESET + " JUGAR PARTIDA");
            System.out.println("  " + AMARILLO_INT + "2." + RESET + " ELEGIR MÚSICA DE FONDO");
            System.out.println("  " + ROJO_INT  + "3." + RESET + " SALIR");
            System.out.print("\n  " + BLANCO + "▶ Selecciona una opción: " + RESET);
            opcion = sc.nextLine();

            if (opcion.equals("1")) {
                comenzarPartida();
            } else if (opcion.equals("2")) {
                menuMusica();
            } else if (!opcion.equals("3")) {
                System.out.println("  " + ROJO + "Opción no válida." + RESET);
            }
        } while (!opcion.equals("3"));

        System.out.println(CYAN + "\n  Gracias por jugar. ¡Adiós!" + RESET);
    }

    private static void menuMusica() {
        musica.mostrarMenuSeleccion(sc);
    }

    private static void anunciarMusica() {
        // Solo suena al inicio del combate, no en el menú
        musica.reproducir();
    }

    private static void comenzarPartida() {
        try {
            catalogo.clear();
            llenarCatalogoFiel();

            duenyoDominioActual = null;
            turnosRestantesDominio = 0;
            penaDeMusertActiva   = false;
            golpesPenaDeMusert   = 0;
            espadaVerdugoActiva  = false;
            List<Personaje> equipo1 = seleccionarEquipo(1, 1);
            List<Personaje> equipo2 = seleccionarEquipo(2, 1);
            equipoActual1 = equipo1;
            equipoActual2 = equipo2;

            anunciarMusica();

            while (equipoVivo(equipo1) && equipoVivo(equipo2)) {
                ejecutarTurnoEquipo(equipo1, equipo2, "EQUIPO 1");
                if (equipoVivo(equipo2)) {
                    ejecutarTurnoEquipo(equipo2, equipo1, "EQUIPO 2");
                }
            }

            System.out.println("\n" + AMARILLO_INT + NEGRITA);
            System.out.println("  ╔══════════════════════════════════════════════════╗");
            System.out.println("  ║             ¡EL COMBATE HA TERMINADO!            ║");
            System.out.println("  ╚══════════════════════════════════════════════════╝" + RESET);
            String ganadorNombre, ganadorJugador;
            if (equipoVivo(equipo1)) { ganadorNombre = equipo1.get(0).getNombre(); ganadorJugador = nombreJugador1; }
            else                     { ganadorNombre = equipo2.get(0).getNombre(); ganadorJugador = nombreJugador2; }
            System.out.println("  " + AMARILLO_INT + "🏆 GANADOR: " + NEGRITA + ganadorNombre + RESET +
                    AMARILLO_INT + "  [" + ganadorJugador + "]" + RESET);
            System.out.print("\n  Presiona Enter para volver al menú...");
            sc.nextLine();

        } catch (Exception e) {
            System.out.println("Error en la partida: " + e.getMessage());
        }
    }

    private static void gestionarDominio(List<Personaje> todos) {
        if (duenyoDominioActual != null) {
            if (turnosRestantesDominio > 0 && duenyoDominioActual.estaVivo()) {
                turnosRestantesDominio--;
                System.out.println("\n" + MAGENTA + "  ┌─ DOMINIO ACTIVO: " + NEGRITA +
                        duenyoDominioActual.getNombre() + RESET + MAGENTA +
                        " — Turnos restantes: " + turnosRestantesDominio + " ─┐" + RESET);

                // ── Efecto Dominio Sukuna (Daño pasivo) ──
                if (duenyoDominioActual.getNombre().equals("Sukuna")) {
                    System.out.println("⚔️ Santuario Malévolo lanza cortes incesantes sobre el área...");
                    for (Personaje p : todos) {
                        if (p != duenyoDominioActual && p.estaVivo()) p.recibirDanioFijo(40);
                    }
                }

                // ── Efecto Dominio Kenjaku (Drena energía pasiva) ──
                if (duenyoDominioActual.getNombre().equals("Kenjaku")) {
                    System.out.println("🌀 El Gran Juego absorbe la energía maldita del área...");
                    for (Personaje p : todos) {
                        if (p != duenyoDominioActual && p.estaVivo()) p.drenarEnergia(60);
                    }
                }

                // Asegurar que el golpe seguro esté activo para el enemigo
                for (Personaje p : todos) {
                    if (p != duenyoDominioActual) p.setDentroDeDominio(true);
                }

            } else {
                System.out.println("\n" + MAGENTA + "  El dominio de " + NEGRITA + duenyoDominioActual.getNombre() + RESET + MAGENTA + " se ha disipado." + RESET);
                duenyoDominioActual.setDominioActivo(false);
                duenyoDominioActual.setBurnout(2);
                for (Personaje p : todos) p.setDentroDeDominio(false);
                duenyoDominioActual = null;
            }
        }
    }

    private static void ejecutarTurnoEquipo(List<Personaje> atacantes, List<Personaje> defensores, String nombreEq) {
        List<Personaje> todosEnCombate = new ArrayList<>(atacantes);
        todosEnCombate.addAll(defensores);
        gestionarDominio(todosEnCombate);

        String nombreJugadorAtacante = nombreEq.equals("EQUIPO 1") ? nombreJugador1 : nombreJugador2;
        String nombreJugadorDefensor = nombreEq.equals("EQUIPO 1") ? nombreJugador2 : nombreJugador1;

        for (int i = 0; i < atacantes.size(); i++) {
            Personaje p = atacantes.get(i);
            if (p == null || !p.estaVivo()) continue;

            p.prepararTurno();
            if (p.turnosInmovilizado > 0) {
                System.out.println("\n  " + ROJO + NEGRITA + "TURNO OMITIDO: " + RESET + ROJO + p.getNombre() +
                        " — inmovilizado por " + NEGRITA + p.getCausaInmovilizacion() + RESET);
                continue;
            }

            String colorJugador = nombreEq.equals("EQUIPO 1") ? CYAN : AMARILLO;
            System.out.println("\n" + colorJugador + NEGRITA);
            System.out.println("  ╔══════════════════════════════════════════════════╗");
            System.out.println("  ║  TURNO: " + p.getNombre() + RESET + colorJugador + " ".repeat(Math.max(1, 41 - p.getNombre().length())) + "║");
            System.out.println("  ║  🎮 " + nombreJugadorAtacante + " (" + nombreEq + ")" + " ".repeat(Math.max(1, 42 - nombreJugadorAtacante.length() - nombreEq.length())) + "║");
            System.out.println("  ╚══════════════════════════════════════════════════╝" + RESET);
            System.out.println("  ❤  HP:  " + barraHP(p.getVida(), p.getMaxVida()));
            if (p.getMaxEnergia() > 0)
                System.out.println("  ⚡ CE:  " + barraEnergia(p.getEnergia(), p.getMaxEnergia()));

            boolean turnoValido = false;
            while (!turnoValido) {
                System.out.println("\n  " + linea(50, AZUL));
                System.out.println("  " + VERDE_INT + "1." + RESET + " Habilidades Especiales");
                System.out.println("  " + VERDE_INT + "2." + RESET + " Ataque Básico (Físico)");
                System.out.println("  " + VERDE_INT + "3." + RESET + " Guardia");
                if (p.puedeUsarEspeciales()) System.out.println("  " + VERDE_INT + "4." + RESET + " Recargar Energía");
                if (p.puedeCurarse()) System.out.println("  " + VERDE_INT + "5." + RESET + " Curarse (RCT / Regeneración)");
                System.out.print("  " + BLANCO + "▶ Acción: " + RESET);
                try {
                    int accion = Integer.parseInt(sc.nextLine());

                    switch (accion) {
                        case 1:
                            List<Habilidad> habs = p.getHabilidades();
                            System.out.println("\n  " + CYAN + NEGRITA + "── Habilidades de " + p.getNombre() + " ──" + RESET);
                            for (int j = 0; j < habs.size(); j++) {
                                String costeStr = habs.get(j).getCosteEnergia() > 0
                                        ? AZUL + " (CE: " + habs.get(j).getCosteEnergia() + ")" + RESET
                                        : VERDE + " (Sin coste)" + RESET;
                                System.out.println("  " + AMARILLO_INT + j + "." + RESET + " " + habs.get(j).getNombre() + costeStr);
                            }
                            System.out.print("  " + BLANCO + "▶ Habilidad (0-" + (habs.size() - 1) + ") o -1 para volver: " + RESET);
                            int habElegida = Integer.parseInt(sc.nextLine());

                            if (habElegida >= 0 && habElegida < habs.size()) {
                                Habilidad h = habs.get(habElegida);

                                // Lógica de invocación de Mahoraga
                                if (h.getNombre().equals("MAHORAGA")) {
                                    System.out.println("\nMegumi une sus manos y canta: 'Con este tesoro invoco... ¡Al General Divino Mahoraga!'");
                                    Personaje mahoraga = crearMahoraga();
                                    atacantes.set(i, mahoraga);
                                    turnoValido = true;
                                    break;
                                }

                                // Espada del Verdugo: ruta directa a su lógica especial
                                if (h.getNombre().equals("ESPADA DEL VERDUGO")) {
                                    Personaje objetivo = buscarPrimerVivo(defensores);
                                    if (objetivo != null) ejecutarAtaquePenaDeMusert(objetivo);
                                    turnoValido = true;
                                    break;
                                }

                                boolean esDominio = h.getNombre().contains("EXPANSIÓN") || h.getNombre().contains("IDLE DEATH")
                                        || h.getNombre().contains("AUTOENCARNACIÓN") || h.getNombre().contains("ATAÚD");

                                if (esDominio) {
                                    Personaje rival = buscarPrimerVivo(defensores);
                                    // Tribunal Maldito: el rival no puede actuar, el juicio es automático
                                    if (h.getNombre().contains("TRIBUNAL MALDITO")) {
                                        resolverAcciones(p, habElegida, rival, new int[]{0, -1}, atacantes, defensores, i, todosEnCombate);
                                    } else {
                                        int[] accionRival = pedirAccionRival(rival, nombreJugadorDefensor, atacantes);
                                        resolverAcciones(p, habElegida, rival, accionRival, atacantes, defensores, i, todosEnCombate);
                                    }
                                } else {
                                    p.usarHabilidad(habElegida, buscarPrimerVivo(defensores));
                                }
                                comprobarTransformacionNaoya(defensores, atacantes);
                                comprobarTransformacionNaoya(atacantes, defensores);
                                turnoValido = true;
                            }
                            break;
                        case 2:
                            p.ataqueBasico(buscarPrimerVivo(defensores));
                            comprobarTransformacionNaoya(defensores, atacantes);
                            turnoValido = true;
                            break;
                        case 3:
                            p.setDefensa(true);
                            System.out.println(p.getNombre() + " se pone en guardia.");
                            turnoValido = true;
                            break;
                        case 4:
                            if (p.puedeUsarEspeciales()) {
                                p.recargarEnergia();
                                turnoValido = true;
                            } else { System.out.println("Este personaje no usa energía maldita."); }
                            break;
                        case 5:
                            if (p.puedeCurarse()) {
                                p.curarse();
                                turnoValido = true;
                            } else { System.out.println("Este personaje no puede curarse."); }
                            break;
                        default:
                            System.out.println("Acción no reconocida.");
                    }
                } catch (Exception e) {
                    System.out.println("Error: " + e.getMessage() + ". Intenta de nuevo.");
                }
            }
        }
    }

    private static int[] pedirAccionRival(Personaje rival, String nombreRival, List<Personaje> equipoRival) {
        System.out.println("\n╔══════════════════════════════════════════════════╗");
        System.out.println("  ⚠️  ¡DOMINIO DECLARADO! El rival expande su técnica.");
        System.out.println("  🎮 [" + nombreRival + "] — " + rival.getNombre() + " debe responder AHORA.");
        System.out.println("  HP: " + rival.getVida() + " | ENERGÍA: " + rival.getEnergia());
        System.out.println("╚══════════════════════════════════════════════════╝");

        while (true) {
            System.out.println("1. Habilidades Especiales (puedes responder con un dominio)");
            System.out.println("2. Ataque Básico (Físico)");
            System.out.println("3. Guardia");
            if (rival.puedeUsarEspeciales()) System.out.println("4. Recargar Energía");
            if (rival.puedeCurarse()) System.out.println("5. Curarse (RCT / Regeneración)");
            System.out.print("[" + nombreRival + "] Elige tu respuesta: ");

            try {
                int accion = Integer.parseInt(sc.nextLine());

                if (accion == 1) {
                    List<Habilidad> habs = rival.getHabilidades();
                    for (int j = 0; j < habs.size(); j++) {
                        System.out.println("  " + j + ". " + habs.get(j).getNombre() + " (Coste: " + habs.get(j).getCosteEnergia() + ")");
                    }
                    System.out.print("  Elige habilidad (0-" + (habs.size() - 1) + ") o -1 para volver: ");
                    int hab = Integer.parseInt(sc.nextLine());
                    if (hab >= 0 && hab < habs.size()) {
                        return new int[]{1, hab};
                    }
                } else if (accion == 2) {
                    return new int[]{2, -1};
                } else if (accion == 3) {
                    return new int[]{3, -1};
                } else if (accion == 4 && rival.puedeUsarEspeciales()) {
                    return new int[]{4, -1};
                } else if (accion == 5 && rival.puedeCurarse()) {
                    return new int[]{5, -1};
                } else {
                    System.out.println("Acción no válida, elige de nuevo.");
                }
            } catch (NumberFormatException e) {
                System.out.println("Entrada inválida.");
            }
        }
    }

    private static void resolverAcciones(Personaje atacante, int habAtacanteIdx,
                                         Personaje rival, int[] accionRival,
                                         List<Personaje> equipoAtacante, List<Personaje> equipoRival,
                                         int idxAtacanteEnEquipo, List<Personaje> todos) {

        Habilidad habAtacante = atacante.getHabilidades().get(habAtacanteIdx);
        if (habAtacante.getNombre().contains("TRIBUNAL MALDITO")) {
            System.out.println("\n══════════════ RESOLUCIÓN SIMULTÁNEA ══════════════");
            duenyoDominioActual = atacante;
            atacante.setDominioActivo(true);
            turnosRestantesDominio = 1;
            for (Personaje p2 : todos) {
                if (p2 != atacante && !esMakiOToji(p2)) p2.setDentroDeDominio(true);
            }
            System.out.println("⚖️  ¡" + atacante.getNombre() + " EXPANDE EL TRIBUNAL MALDITO!");
            System.out.println("   El espacio colapsa en una sala de juicios. Judgeman aparece.");
            String nombreJugadorRival = resolverNombreJugador(rival, todos);
            ejecutarJuicioTribunal(rival, nombreJugadorRival);
            duenyoDominioActual.setDominioActivo(false);
            duenyoDominioActual.setBurnout(2);
            for (Personaje p2 : todos) p2.setDentroDeDominio(false);
            duenyoDominioActual = null;
            turnosRestantesDominio = 0;
            System.out.println("════════════════════════════════════════════════════");
            return;
        }

        boolean rivalLanzaDominio = false;
        if (accionRival[0] == 1 && accionRival[1] >= 0 && rival.estaVivo()) {
            Habilidad hr = rival.getHabilidades().get(accionRival[1]);
            rivalLanzaDominio = hr.getNombre().contains("EXPANSIÓN") || hr.getNombre().contains("IDLE DEATH")
                    || hr.getNombre().contains("AUTOENCARNACIÓN") || hr.getNombre().contains("ATAÚD");
        }

        System.out.println("\n══════════════ RESOLUCIÓN SIMULTÁNEA ══════════════");

        if (rivalLanzaDominio) {
            System.out.println("⚡ ¡Ambos hechiceros expanden su dominio al mismo tiempo!");
            duenyoDominioActual = atacante;
            atacante.setDominioActivo(true);
            turnosRestantesDominio = 4;
            for (Personaje p2 : todos) if (p2 != atacante) p2.setDentroDeDominio(true);
            manejarChoqueDominio(rival, todos);
            try { atacante.usarHabilidad(habAtacanteIdx, rival); } catch (Exception ex) { System.out.println(ex.getMessage()); }
        } else {
            manejarChoqueDominio(atacante, todos);
            try { atacante.usarHabilidad(habAtacanteIdx, rival); } catch (Exception ex) { System.out.println(ex.getMessage()); }
            System.out.println("\n--- Acción de respuesta de " + rival.getNombre() + " ---");
            ejecutarAccionSimple(rival, accionRival, equipoAtacante, equipoRival, idxAtacanteEnEquipo);
        }
        System.out.println("════════════════════════════════════════════════════");
    }

    private static void ejecutarAccionSimple(Personaje p, int[] accion,
                                             List<Personaje> equipoObjetivo, List<Personaje> equipoPropio,
                                             int idxEnEquipoPropio) {
        try {
            switch (accion[0]) {
                case 1:
                    Habilidad h = p.getHabilidades().get(accion[1]);
                    if (h.getNombre().equals("MAHORAGA")) {
                        System.out.println("\nMegumi une sus manos y canta: 'Con este tesoro invoco... ¡Al General Divino Mahoraga!'");
                        equipoPropio.set(idxEnEquipoPropio, crearMahoraga());
                    } else {
                        p.usarHabilidad(accion[1], buscarPrimerVivo(equipoObjetivo));
                    }
                    break;
                case 2:
                    p.ataqueBasico(buscarPrimerVivo(equipoObjetivo));
                    break;
                case 3:
                    p.setDefensa(true);
                    System.out.println(p.getNombre() + " se pone en guardia.");
                    break;
                case 4:
                    if (p.puedeUsarEspeciales()) p.recargarEnergia();
                    break;
                case 5:
                    if (p.puedeCurarse()) p.curarse();
                    break;
            }
        } catch (Exception e) {
            System.out.println("Error al ejecutar acción del rival: " + e.getMessage());
        }
    }

    private static int  golpesPenaDeMusert   = 0;
    private static boolean penaDeMusertActiva  = false;
    private static boolean espadaVerdugoActiva = false;

    private static void ejecutarJuicioTribunal(Personaje acusado, String nombreJugador) {
        System.out.println("\n╔══════════════════════════════════════════════════════╗");
        System.out.println("  ⚖️  TRIBUNAL MALDITO — JUDGEMAN DICTA SENTENCIA        ");
        System.out.println("  Acusado: " + acusado.getNombre() + "  [" + nombreJugador + "]");
        System.out.println("╚══════════════════════════════════════════════════════╝");

        if (penaDeMusertActiva) {
            ejecutarAtaquePenaDeMusert(acusado);
            return;
        }

        String[][] crimenes = {
                {
                        "uso no autorizado de técnica maldita en zona residencial de Shibuya",
                        "La técnica fue activada de manera involuntaria al contacto con una maldición de grado 2 que atacó a civiles."
                },
                {
                        "participación en misión de exorcismo sin acreditación vigente del Consejo de Hechiceros",
                        "La acreditación estaba en proceso de renovación y actué bajo orden verbal de un supervisor de rango superior."
                },
                {
                        "destrucción de infraestructura del Colegio Técnico de Magia de Tokio durante entrenamiento",
                        "El daño fue consecuencia directa de un ataque no provocado por parte de otro alumno; actué en defensa propia."
                },
                {
                        "colaboración con el Plan de Vuelta de Kenjaku para suprimir la barrera de Shibuya",
                        "Fui manipulado mediante técnica de sustitución de cuerpo; mis acciones no respondían a mi voluntad."
                },
                {
                        "liberación deliberada del contenedor de maldición especial Ryomen Sukuna durante combate activo",
                        "El contenedor fue dañado por el ataque de una maldición de grado especial, no por acción propia."
                },
                {
                        "traición al Colegio Técnico de Magia al facilitar información clasificada al Clan Kamo disidente",
                        "La información fue transmitida bajo coerción extrema mientras mis compañeros estaban retenidos como rehenes."
                },
                {
                        "masacre del personal del Hospital Eisei durante el incidente de Shibuya bajo el control de Sukuna",
                        "El cuerpo fue tomado por Ryomen Sukuna de forma involuntaria; no existe consciencia ni intencionalidad de mi parte en dichos actos."
                },
                {
                        "conspiración con Kenjaku para ejecutar el Gran Juego y someter a la humanidad a la evolución forzada mediante Tengen",
                        "No existe prueba física que demuestre mi participación activa; las órdenes vinieron de una entidad que habitó mi cuerpo sin consentimiento."
                },
                {
                        "apertura del Juego de la Culpa que resultó en la muerte de más de mil hechiceros certificados en la Colonia de Tokio",
                        "La acusación carece de testigos supervivientes vinculantes y toda evidencia fue recopilada dentro del propio Juego, lo que invalida su valor legal."
                }
        };

        int[] resultado = celebrarJuicio(crimenes, acusado.getNombre(), nombreJugador, "PRIMER JUICIO");
        int gravedad       = resultado[0];
        boolean inocente   = resultado[1] == 1;

        if (inocente) {
            System.out.println("  ✅ Judgeman escucha los argumentos...");
            System.out.println("  ⚖️  VEREDICTO: ¡INOCENTE! El cargo queda retirado.");
            System.out.println("  " + acusado.getNombre() + " no sufre consecuencias este turno.");
            return;
        }

        System.out.println("  ❌ La defensa es insuficiente...");
        System.out.println("  ⚖️  VEREDICTO PROVISIONAL: ¡CULPABLE!");

        boolean puedeApelar = (gravedad >= 2);
        boolean apelo = false;

        if (puedeApelar) {
            System.out.println("\n  ⚠️  La sentencia es grave. ¿Deseas solicitar un SEGUNDO JUICIO?");
            System.out.println("  Si ganas la apelación, la sentencia queda anulada.");
            System.out.println("  Si la pierdes, se aplica la sentencia original sin cambios.");
            System.out.print("  [" + nombreJugador + "] ¿Apelar? (s/n): ");
            String resp = sc.nextLine().trim().toLowerCase();
            apelo = resp.equals("s") || resp.equals("si") || resp.equals("sí");
        }

        if (apelo) {
            System.out.println("\n  📜 El acusado solicita un segundo juicio. Judgeman acepta.");
            int[] resultado2 = celebrarJuicio(crimenes, acusado.getNombre(), nombreJugador, "APELACIÓN");
            boolean inocenteApel = resultado2[1] == 1;

            if (inocenteApel) {
                System.out.println("  ✅ La apelación prospera. Judgeman revisa el caso...");
                System.out.println("  ⚖️  SENTENCIA ANULADA. " + acusado.getNombre() + " queda en libertad.");
            } else {
                System.out.println("  ❌ La apelación fracasa. La sentencia original se confirma.");
                aplicarVeredicto(acusado, gravedad);
            }
        } else {
            aplicarVeredicto(acusado, gravedad);
        }
    }

    private static int[] celebrarJuicio(String[][] crimenes, String nombrePersonaje,
                                        String nombreJugador, String etiqueta) {
        int idx = (int)(Math.random() * crimenes.length);
        int gravedad = (idx < 3) ? 1 : (idx < 6) ? 2 : 3;
        String crimen        = crimenes[idx][0];
        String defensaCorr   = crimenes[idx][1];

        String nivelStr = gravedad == 1 ? "⚪ LEVE" : gravedad == 2 ? "🟡 GRAVE" : "🔴 FATAL";
        System.out.println("\n  ── " + etiqueta + " ──");
        System.out.println("  Judgeman golpea su mazo.");
        System.out.println("  Cargo: " + nivelStr + " — " + crimen.toUpperCase());
        System.out.println("\n  [" + nombreJugador + "], elige la defensa de " + nombrePersonaje + ":");

        List<String> opciones = new ArrayList<>();
        opciones.add(defensaCorr);
        List<Integer> otrosIdx = new ArrayList<>();
        for (int k = 0; k < crimenes.length; k++) if (k != idx) otrosIdx.add(k);
        Collections.shuffle(otrosIdx);
        opciones.add(crimenes[otrosIdx.get(0)][1]);
        opciones.add(crimenes[otrosIdx.get(1)][1]);
        Collections.shuffle(opciones);

        int posCorrecta = opciones.indexOf(defensaCorr);
        for (int k = 0; k < opciones.size(); k++) {
            System.out.println("  " + (k + 1) + ". " + opciones.get(k));
        }

        int eleccion = -1;
        while (eleccion < 1 || eleccion > 3) {
            System.out.print("  Tu defensa (1-3): ");
            try { eleccion = Integer.parseInt(sc.nextLine().trim()); }
            catch (NumberFormatException e) { eleccion = -1; }
        }

        boolean correcto = (eleccion - 1) == posCorrecta;
        return new int[]{gravedad, correcto ? 1 : 0};
    }

    private static void aplicarVeredicto(Personaje acusado, int gravedad) {
        if (gravedad <= 2) {
            System.out.println("\n  🔨 Judgeman ejecuta la CONFISCACIÓN.");
            if (acusado.tieneHerramientaMaldita()) {
                System.out.println("  📦 La herramienta maldita de " + acusado.getNombre() + " es destruida.");
                acusado.confiscarHerramienta();
            } else if (acusado.puedeUsarEspeciales()) {
                System.out.println("  🚫 La técnica maldita de " + acusado.getNombre() + " es sellada.");
                acusado.setBurnout(2);
            } else {
                System.out.println("  ⚡ La energía maldita de " + acusado.getNombre() + " es confiscada.");
                acusado.confiscarEnergia();
            }
        } else {
            System.out.println("\n  💀 Judgeman dicta la PENA DE MUERTE.");
            if (!espadaVerdugoActiva) {
                System.out.println("  ⚔️  ¡Higuruma obtiene la ESPADA DEL VERDUGO para el resto de la partida!");
                System.out.println("  Podrá usarla en cualquier turno desde su menú de habilidades.");
                espadaVerdugoActiva = true;
                agregarEspadaVerdugoAHiguruma();
            } else {
                System.out.println("  ⚔️  Higuruma blande la Espada del Verdugo...");
            }
            penaDeMusertActiva = true;
            golpesPenaDeMusert = 0;
            ejecutarAtaquePenaDeMusert(acusado);
        }
    }

    private static void agregarEspadaVerdugoAHiguruma() {
        List<List<Personaje>> equipos = new ArrayList<>();
        if (equipoActual1 != null) equipos.add(equipoActual1);
        if (equipoActual2 != null) equipos.add(equipoActual2);
        for (List<Personaje> eq : equipos) {
            for (Personaje p : eq) {
                if (p != null && p.getNombre().equals("Hiromi Higuruma")) {
                    boolean yaLaTiene = p.getHabilidades().stream()
                            .anyMatch(h -> h.getNombre().equals("ESPADA DEL VERDUGO"));
                    if (!yaLaTiene) {
                        p.addHabilidad(new Habilidad(
                                "ESPADA DEL VERDUGO",
                                "La sentencia de muerte otorgada por Judgeman. Probabilidad baja pero letal: " +
                                        "1 impacto quita el 60% de la vida restante; 2 impactos matan al instante.",
                                0, 0, Efecto.Tipo.NORMAL, true
                        ));
                    }
                    return;
                }
            }
        }
    }

    static void ejecutarAtaquePenaDeMusert(Personaje acusado) {
        if (!espadaVerdugoActiva) return;
        System.out.println("\n  ⚔️  LA ESPADA DEL VERDUGO APUNTA A " + acusado.getNombre().toUpperCase());
        if (Math.random() < 0.30) {
            acusado.marcarUltimoGolpe(true);
            golpesPenaDeMusert++;
            if (golpesPenaDeMusert == 1) {
                int danio = (int)(acusado.getVida() * 0.60);
                System.out.println("  🩸 ¡LA ESPADA CONECTA! Primer golpe del verdugo.");
                System.out.println("  " + acusado.getNombre() + " pierde el 60% de su vida (" + danio + " daño).");
                acusado.recibirDanioFijo(danio);
                System.out.println("  (Un segundo golpe sería letal. La espada persiste.)");
            } else {
                System.out.println("  ☠️  ¡SEGUNDO GOLPE DEL VERDUGO! La sentencia se cumple.");
                acusado.recibirDanioFijo(acusado.getVida());
                espadaVerdugoActiva  = false;
                penaDeMusertActiva   = false;
                golpesPenaDeMusert   = 0;
            }
        } else {
            System.out.println("  💨 La espada falla... " + acusado.getNombre() + " esquiva la ejecución por un pelo.");
        }
        if (turnosRestantesDominio == 0) {
            penaDeMusertActiva = false;
        }
    }

    private static boolean esMakiOToji(Personaje p) {
        return p.getNombre().equals("Maki Zenin") || p.getNombre().equals("Toji Fushiguro");
    }

    private static boolean tieneDominioPropio(Personaje p) {
        for (Habilidad h : p.getHabilidades()) {
            String n = h.getNombre();
            if (n.contains("EXPANSIÓN") || n.contains("IDLE DEATH")
                    || n.contains("AUTOENCARNACIÓN") || n.contains("ATAÚD")) return true;
        }
        return false;
    }

    private static void manejarChoqueDominio(Personaje atacante, List<Personaje> todos) {
        if (duenyoDominioActual == null || !duenyoDominioActual.estaVivo() || duenyoDominioActual == atacante) {
            System.out.println("\n⚡ ¡" + atacante.getNombre() + " EXPANDE SU DOMINIO!");
            activarDominio(atacante, todos);
            return;
        }

        Personaje defensor = duenyoDominioActual;

        if (esMakiOToji(defensor)) {
            System.out.println("\n⚡ ¡" + atacante.getNombre() + " intenta expandir su dominio!");
            System.out.println("💪 " + defensor.getNombre() + " carece de energía maldita: el dominio");
            System.out.println("   no puede encerrar su cuerpo. ¡El golpe seguro falla!");
            System.out.println("   Sin embargo, el dominio del atacante se expande igualmente.");
            defensor.setDentroDeDominio(false);
            activarDominio(atacante, todos);
            defensor.setDentroDeDominio(false);
            return;
        }

        if (!tieneDominioPropio(defensor)) {
            System.out.println("\n⚡ ¡" + atacante.getNombre() + " EXPANDE SU DOMINIO!");
            System.out.println("😱 " + defensor.getNombre() + " no posee una técnica de dominio propia.");
            System.out.println("   Queda atrapado dentro sin poder contraatacar.");
            activarDominio(atacante, todos);
            return;
        }

        String nombreAtacante = resolverNombreJugador(atacante, todos);
        String nombreDefensor = resolverNombreJugador(defensor, todos);

        System.out.println("\n" + MAGENTA_INT + NEGRITA);
        System.out.println("  ╔══════════════════════════════════════════════════╗");
        System.out.println("  ║            💥  CHOQUE DE DOMINIOS  💥            ║");
        System.out.println("  ║  " + centrar(atacante.getNombre() + "  VS  " + defensor.getNombre(), 48) + "║");
        System.out.println("  ╚══════════════════════════════════════════════════╝" + RESET);

        System.out.println("\n  " + BLANCO + "▶  SECUENCIA DE TECLAS BAJO PRESIÓN" + RESET);
        System.out.println("  Cada jugador recibe su propia secuencia secreta.");
        System.out.println("  Memorízala y reprodúcela sin errores. 3 rondas.");
        System.out.println("  La secuencia crece cada ronda: 4 → 5 → 6 dígitos.");

        boolean atacantePrioritario = atacante.getNombre().equals("Sukuna") || atacante.getNombre().equals("Kenjaku");
        boolean defensorPrioritario = defensor.getNombre().equals("Sukuna") || defensor.getNombre().equals("Kenjaku");

        int puntosAtacante = atacantePrioritario ? 1 : 0;
        int puntosDefensor = defensorPrioritario ? 1 : 0;

        if (atacantePrioritario) {
            System.out.println("\n  " + ROJO_INT + NEGRITA + "⚠  El dominio de " + atacante.getNombre() +
                    " tiene una densidad superior — arranca con 1 punto de ventaja." + RESET);
        }
        if (defensorPrioritario) {
            System.out.println("\n  " + ROJO_INT + NEGRITA + "⚠  El dominio de " + defensor.getNombre() +
                    " tiene una densidad superior — arranca con 1 punto de ventaja." + RESET);
        }

        System.out.println("\n  " + AMARILLO + "En caso de empate gana el DEFENSOR." + RESET);
        System.out.print("  Pulsa Enter cuando estéis listos...");
        sc.nextLine();

        for (int ronda = 1; ronda <= 3; ronda++) {
            int longitud = 3 + ronda;
            int[] secAtacante = generarSecuencia(longitud);
            int[] secDefensor = generarSecuencia(longitud);

            System.out.println("\n  " + CYAN + NEGRITA + "══ RONDA " + ronda + " ══" + RESET +
                    CYAN + "  (" + longitud + " dígitos — secuencias independientes)" + RESET);
            System.out.println("  " + CYAN + "[" + nombreAtacante + "] " + puntosAtacante +
                    "  —  " + puntosDefensor + "  [" + nombreDefensor + "]" + RESET);

            boolean aciertaAtacante = turnoSecuencia(secAtacante, atacante.getNombre(), nombreAtacante, CYAN);
            boolean aciertaDefensor = turnoSecuencia(secDefensor, defensor.getNombre(), nombreDefensor, AMARILLO);

            if (aciertaAtacante) puntosAtacante++;
            if (aciertaDefensor) puntosDefensor++;

            System.out.print("  Ronda " + ronda + ": ");
            if (aciertaAtacante && aciertaDefensor)
                System.out.println(VERDE + "Ambos acertaron. +1 a cada uno." + RESET + "  (" + puntosAtacante + "-" + puntosDefensor + ")");
            else if (aciertaAtacante)
                System.out.println(VERDE + "Punto para [" + nombreAtacante + "]" + RESET + "  (" + puntosAtacante + "-" + puntosDefensor + ")");
            else if (aciertaDefensor)
                System.out.println(AMARILLO_INT + "Punto para [" + nombreDefensor + "]" + RESET + "  (" + puntosAtacante + "-" + puntosDefensor + ")");
            else
                System.out.println(ROJO + "Ambos fallaron. Sin puntos." + RESET + "  (" + puntosAtacante + "-" + puntosDefensor + ")");
        }

        System.out.println("\n  " + linea(50, MAGENTA));
        System.out.println("  " + MAGENTA_INT + NEGRITA + "RESULTADO FINAL" + RESET);
        System.out.println("  [" + CYAN + NEGRITA + nombreAtacante + RESET + "] " + puntosAtacante +
                "  —  " + puntosDefensor + "  [" + AMARILLO + NEGRITA + nombreDefensor + RESET + "]");
        System.out.println("  " + linea(50, MAGENTA));

        boolean ganoAtacante = puntosAtacante > puntosDefensor;

        if (ganoAtacante) {
            System.out.println("  " + CYAN + NEGRITA + "🏆 [" + nombreAtacante + "] sobrepone su dominio!" + RESET);
            System.out.println("  " + ROJO + "El dominio de " + defensor.getNombre() + " colapsa." + RESET);
            defensor.setDominioActivo(false);
            defensor.setBurnout(2);
            for (Personaje p : todos) p.setDentroDeDominio(false);
            activarDominio(atacante, todos);
        } else {
            System.out.println("  " + AMARILLO + NEGRITA + "🛡  [" + nombreDefensor + "] mantiene su dominio intacto." + RESET);
            System.out.println("  " + ROJO + "El dominio de " + atacante.getNombre() + " es rechazado." + RESET);
            atacante.setBurnout(2);
        }
        System.out.println("  " + linea(50, MAGENTA));
    }

    private static String centrar(String texto, int ancho) {
        if (texto.length() >= ancho) return texto.substring(0, ancho);
        int izq = (ancho - texto.length()) / 2;
        int der = ancho - texto.length() - izq;
        return " ".repeat(izq) + texto + " ".repeat(der);
    }

    private static int[] generarSecuencia(int longitud) {
        int[] seq = new int[longitud];
        for (int i = 0; i < longitud; i++) seq[i] = (int)(Math.random() * 4) + 1;
        return seq;
    }

    private static boolean turnoSecuencia(int[] secuencia, String nombrePersonaje, String nombreJugador, String color) {
        System.out.println("\n  " + color + NEGRITA + "🎮 [" + nombreJugador + "] — " + nombrePersonaje + RESET);
        System.out.print("  Pulsa Enter para ver tu secuencia secreta...");
        sc.nextLine();

        StringBuilder sb = new StringBuilder("  " + color + NEGRITA + "► ");
        for (int d : secuencia) sb.append(d).append(" ");
        sb.append(RESET);
        System.out.println(sb);

        System.out.print("  Memorízala y pulsa Enter para ocultarla...");
        sc.nextLine();

        for (int i = 0; i < 8; i++) System.out.println();
        System.out.println("  " + ROJO_INT + NEGRITA + "*** SECUENCIA OCULTA — ESCRIBE LOS DÍGITOS ***" + RESET);
        System.out.print("  " + color + "▶ Tu secuencia (" + secuencia.length + " dígitos, sin espacios): " + RESET);
        String input = sc.nextLine().trim();

        if (input.length() != secuencia.length) {
            System.out.println("  " + ROJO + "✗ Longitud incorrecta. Fallo automático." + RESET);
            return false;
        }
        for (int i = 0; i < secuencia.length; i++) {
            if ((input.charAt(i) - '0') != secuencia[i]) {
                System.out.print("  " + ROJO + "✗ Error en posición " + (i + 1) + ". Tu secuencia era: ");
                for (int d : secuencia) System.out.print(d);
                System.out.println(RESET);
                return false;
            }
        }
        System.out.println("  " + VERDE_INT + NEGRITA + "✓ ¡Correcto!" + RESET);
        return true;
    }

    private static void activarDominio(Personaje atacante, List<Personaje> todos) {
        duenyoDominioActual = atacante;
        atacante.setDominioActivo(true);
        turnosRestantesDominio = 4;
        for (Personaje p : todos) {
            if (p != atacante) {
                if (!esMakiOToji(p)) p.setDentroDeDominio(true);
                else System.out.println("  ⚔️  " + p.getNombre() + " resiste el efecto de golpe seguro del dominio.");
            }
        }
    }

    private static String resolverNombreJugador(Personaje p, List<Personaje> todos) {
        if (equipoActual1 != null && equipoActual1.contains(p)) return nombreJugador1;
        if (equipoActual2 != null && equipoActual2.contains(p)) return nombreJugador2;
        return "Jugador ?";
    }

    private static List<Personaje> equipoActual1 = null;
    private static List<Personaje> equipoActual2 = null;

    private static List<Personaje> seleccionarEquipo(int numEq, int cant) {
        List<Personaje> eq = new ArrayList<>();
        String nombreJugador = (numEq == 1) ? nombreJugador1 : nombreJugador2;
        String colorJ = (numEq == 1) ? CYAN : AMARILLO;
        System.out.println("\n" + colorJ + NEGRITA + "  ── SELECCIÓN: " + nombreJugador.toUpperCase() + " (Equipo " + numEq + ") ──" + RESET);
        System.out.println("  " + linea(50, AZUL));
        for (int i = 0; i < catalogo.size(); i++) {
            Personaje c = catalogo.get(i);
            boolean esMald = c instanceof Maldicion;
            String tipoColor = esMald ? ROJO : VERDE;
            String tipo = esMald ? "[Maldición]" : "[Hechicero]";
            System.out.printf("  %s%2d.%s %-28s %s%s%s%n",
                    AMARILLO_INT, i, RESET, c.getNombre(), tipoColor, tipo, RESET);
        }
        System.out.println("  " + linea(50, AZUL));
        for (int j = 0; j < cant; j++) {
            System.out.print("  " + colorJ + "[" + nombreJugador + "] Elige tu personaje (ID): " + RESET);
            Personaje seleccionado = catalogo.get(Integer.parseInt(sc.nextLine()));
            eq.add(seleccionado);

            // Invocación a la Interfaz Combatiente para mostrar que funciona correctamente
            if (seleccionado instanceof Combatiente) {
                ((Combatiente) seleccionado).manifestarAura();
            }
        }
        return eq;
    }

    private static Personaje buscarPrimerVivo(List<Personaje> lista) {
        for (Personaje p : lista) if (p != null && p.estaVivo()) return p;
        return null;
    }

    private static boolean equipoVivo(List<Personaje> lista) {
        for (Personaje p : lista) if (p != null && p.estaVivo()) return true;
        return false;
    }

    private static Personaje crearP(String nom, int v, int e, String[] nHabs, String[] dHabs, boolean esMaldicion, boolean[] fisicos) {
        Personaje p = esMaldicion ? new Maldicion(nom, v, e) : new Hechicero(nom, v, e);
        for (int i = 0; i < 5; i++) {
            int coste = (i == 4) ? 120 : 20 + (i * 15);
            if (nom.contains("Maki") || nom.contains("Toji")) coste = 0;
            p.addHabilidad(new Habilidad(nHabs[i], dHabs[i], 40 + (i * 20), coste, Efecto.Tipo.NORMAL, fisicos[i]));
        }
        return p;
    }

    private static Personaje crearMahoraga() {
        Personaje maho = new Maldicion("Mahoraga (General Divino)", 800, 500);
        maho.addHabilidad(new Habilidad("Golpe Físico", "Ataque bruto", 50, 0, Efecto.Tipo.NORMAL, true));
        maho.addHabilidad(new Habilidad("Adaptación", "Se regenera rápidamente", 0, 50, Efecto.Tipo.NORMAL, false));
        maho.addHabilidad(new Habilidad("Tajo de Exterminio", "Elimina de un solo golpe a cualquier maldición", 150, 100, Efecto.Tipo.NORMAL, true));
        maho.addHabilidad(new Habilidad("Ráfaga de golpes", "Multigolpe", 70, 20, Efecto.Tipo.NORMAL, true));
        maho.addHabilidad(new Habilidad("Embestida pesada", "Daño puro", 90, 30, Efecto.Tipo.NORMAL, true));
        return maho;
    }

    private static void comprobarTransformacionNaoya(List<Personaje> equipo, List<Personaje> rivales) {
        for (int i = 0; i < equipo.size(); i++) {
            Personaje p = equipo.get(i);
            if (p == null) continue;
            if (p.getNombre().equals("Naoya Zenin") && !p.estaVivo()
                    && !p.ultimoGolpeFueEnergetico()) {
                System.out.println("\n╔══════════════════════════════════════════════════╗");
                System.out.println("  💀 Naoya Zenin ha caído... pero no descansa en paz.");
                System.out.println("  Su odio y orgullo de clan se condensan en maldición.");
                System.out.println("  ☠️  ¡NAOYA ZENIN RENACE COMO MALDICIÓN ESPECIAL!");
                System.out.println("╚══════════════════════════════════════════════════╝");
                equipo.set(i, crearNaoyaMaldicion());
                if (equipoActual1 == equipo) equipoActual1 = equipo;
                if (equipoActual2 == equipo) equipoActual2 = equipo;
                return;
            }
        }
    }

    private static Personaje crearNaoyaMaldicion() {
        Personaje naoyaMald = new Maldicion("Naoya Zenin (Maldición)", 550, 0);
        naoyaMald.addHabilidad(new Habilidad("Vórtice Maldito",
                "Vórtice de aire corrompido con energía maldita. Más rápido y potente que en vida.",
                95, 0, Efecto.Tipo.NORMAL, true));
        naoyaMald.addHabilidad(new Habilidad("Ventilación: Torbellino de Odio",
                "Naoya lanza una espiral de odio puro comprimido. Desgarra desde dentro.",
                115, 0, Efecto.Tipo.NORMAL, true));
        naoyaMald.addHabilidad(new Habilidad("Barrera Sónica Maldita",
                "La barrera de sonido ahora está envuelta en energía maldita corrosiva. Inmoviliza 2 turnos.",
                75, 0, Efecto.Tipo.ATURDIDO, true));
        naoyaMald.addHabilidad(new Habilidad("Orgullo del Clan Zenin",
                "Naoya canaliza el rencor acumulado en vida. Se potencia durante 2 turnos y recupera 100 HP.",
                0, 0, Efecto.Tipo.POTENCIADO, false));
        naoyaMald.addHabilidad(new Habilidad("TORMENTA FINAL: RENCOR ETERNO",
                "Técnica definitiva. Naoya libera toda su ira acumulada en una explosión de velocidad y odio que no puede bloquearse.",
                190, 0, Efecto.Tipo.NORMAL, true));
        return naoyaMald;
    }

    private static void llenarCatalogoFiel() {
        // 1. GOJO SATORU — costes casi nulos: su técnica del Infinito no le cuesta apenas energía
        Personaje gojo = new Hechicero("Gojo Satoru", 600, 450);
        gojo.addHabilidad(new Habilidad("Azul",                    "Atrae",                  40,  5,  Efecto.Tipo.NORMAL,   false));
        gojo.addHabilidad(new Habilidad("Rojo",                    "Repele",                 60,  5,  Efecto.Tipo.NORMAL,   false));
        gojo.addHabilidad(new Habilidad("VACÍO PÚRPURA",           "Borra materia",          80,  5,  Efecto.Tipo.NORMAL,   false));
        gojo.addHabilidad(new Habilidad("Destello Negro",          "Impacto físico letal",  100,  5,  Efecto.Tipo.NORMAL,   true));
        gojo.addHabilidad(new Habilidad("EXPANSIÓN: VACÍO INFINITO","Inmoviliza 2 turnos",  120, 15,  Efecto.Tipo.NORMAL,   false));
        catalogo.add(gojo);

        // 2. SUKUNA — energía máxima elevada: el Rey de las Maldiciones tiene CE inabarcable
        catalogo.add(crearP("Sukuna", 700, 950,
                new String[]{"Desmantelar", "Cleave", "FUGA", "Golpe Físico", "EXPANSIÓN: SANTUARIO MALÉVOLO"},
                new String[]{"Cortes", "Cortes precisos", "Flecha de fuego mortal", "Ataque veloz", "Cortes de daño pasivo en área por 2 turnos"},
                false, new boolean[]{false, false, false, true, false}));

        catalogo.add(crearP("Itadori Yuji", 550, 250,
                new String[]{"Puño Divergente", "Destello Negro", "Artes Marciales", "Corte de Alma", "Rencor"},
                new String[]{"Golpe con retraso", "Ataque crítico espacial", "Combo físico", "Daña el alma", "Frenesí de golpes"},
                false, new boolean[]{true, true, true, true, true}));

        catalogo.add(crearP("Maki Zenin", 650, 0,
                new String[]{"Nube Itinerante", "Katana Almas", "Lanza", "Ataque Pesado", "Masacre"},
                new String[]{"Bastón", "Corte de alma directo", "Estocada", "Golpe bruto", "Frenesí veloz"},
                false, new boolean[]{true, true, true, true, true}));

        catalogo.add(crearP("Toji Fushiguro", 650, 0,
                new String[]{"Navaja Invertida", "Cadena", "Espada Alma", "Pistola", "Bendición"},
                new String[]{"Anula técnicas", "Ataque largo", "Corte mortal", "Ataque a distancia", "Asalto en punto ciego"},
                false, new boolean[]{true, true, true, true, true}));

        catalogo.add(crearP("Yuta Okkotsu", 500, 1000,
                new String[]{"Copia: Discurso", "Corte con Katana", "Rika: Ataque Físico", "RAYO DE AMOR VERDADERO", "EXPANSIÓN: AMOR MUTUO Y VERDADERO"},
                new String[]{"Habla maldita", "Tajo básico", "Puñetazo de Rika", "Haz concentrado de Rika", "Aumenta el daño de Yuta por 2 turnos"},
                false, new boolean[]{false, true, true, false, false}));

        catalogo.add(crearP("Kinji Hakari", 500, 300,
                new String[]{"Puñetazo Áspero", "Puerta Tren", "Combo", "Cabezazo", "EXPANSIÓN: IDLE DEATH GAMBLE"},
                new String[]{"Papel de lija", "Aplastamiento", "Golpes rítmicos", "Impacto cráneo", "Probabilidad de ganar inmortalidad y CE infinita"},
                false, new boolean[]{true, false, true, true, false}));

        catalogo.add(crearP("Mahito", 450, 350,
                new String[]{"Mutación", "Polimorfismo", "Isomería", "Cuchilla Corporal", "EXPANSIÓN: AUTOENCARNACIÓN DE LA PERFECCIÓN"},
                new String[]{"Altera su forma", "Lanza transfigurados", "Clones", "Brazo cuchilla", "Potencia sus ataques por 2 turnos"},
                true, new boolean[]{false, false, false, true, false}));

        catalogo.add(crearP("Jogo", 380, 450,
                new String[]{"Insectos", "Vértice", "Meteorito", "Palmas Ardientes", "EXPANSIÓN: ATAÚD DE LA MONTAÑA DE HIERRO"},
                new String[]{"Explosivos", "Magma", "Roca en llamas", "Fuego directo", "Potencia sus ataques por 2 turnos"},
                true, new boolean[]{false, false, false, true, false}));

        catalogo.add(crearP("Megumi Fushiguro", 420, 350,
                new String[]{"Perros Divinos", "Nue", "Elefante Máximo", "EXPANSIÓN: JARDÍN DE SOMBRAS", "MAHORAGA"},
                new String[]{"Mordida", "Descarga", "Aplastamiento", "Dominio de sombras", "Invoca al General Divino y abandona el combate"},
                false, new boolean[]{true, false, true, false, false}));

        catalogo.add(crearP("Suguru Geto", 500, 500,
                new String[]{"Maldiciones Menores", "Calamar", "Dragón", "Artes Marciales", "UZUMAKI"},
                new String[]{"Horda", "Asfixia", "Carga", "Golpe físico", "Técnica Máxima concentrada"},
                false, new boolean[]{false, false, false, true, false}));

        catalogo.add(crearP("Nanami Kento", 480, 250,
                new String[]{"Ratio 7:3", "Derrumbe", "Golpe Contundente", "Tajo", "Horas Extras"},
                new String[]{"Punto débil", "Entorno", "Golpe bruto", "Corte limpio", "Liberación de energía"},
                false, new boolean[]{true, false, true, true, true}));

        catalogo.add(crearP("Choso", 460, 320,
                new String[]{"Sangre Perforante", "Supernova", "Escala Roja", "Golpe de Ala", "Manantial"},
                new String[]{"Rayo de sangre", "Metralla", "Potencia física", "Cuchilla de sangre", "Inundación"},
                true, new boolean[]{false, false, false, true, false}));

        catalogo.add(crearP("Aoi Todo", 520, 220,
                new String[]{"Boogie Woogie", "Puñetazo", "Patada", "Aplauso Sorpresa", "Destello Negro"},
                new String[]{"Intercambio posicional", "Golpe seco", "Patada voladora", "Desorienta", "Impacto crítico"},
                false, new boolean[]{false, true, true, false, true}));

        catalogo.add(crearP("Nobara Kugisaki", 400, 250,
                new String[]{"Resonancia", "Horquilla", "Martillazo", "Lluvia de Clavos", "Clavo Físico"},
                new String[]{"Vínculo de alma", "Explosión", "Golpe cargado", "Área de clavos", "Estocada"},
                false, new boolean[]{false, false, true, false, true}));

        catalogo.add(crearP("Hanami", 550, 300,
                new String[]{"Raíces", "Semillas", "Rayo Solar", "Golpe de Madera", "EXPANSIÓN: MAR DE FLORES"},
                new String[]{"Empalamiento", "Drenaje", "Haz de luz", "Impacto", "Drena vida en área"},
                true, new boolean[]{false, false, false, true, false}));

        catalogo.add(crearP("Hajime Kashimo", 490, 400,
                new String[]{"Descarga", "Báculo Físico", "Electrólisis", "Patada Magnética", "ÁMBAR MÍTICO"},
                new String[]{"Rayo seguro", "Golpe conductor", "Vapor", "Ataque", "Forma final"},
                false, new boolean[]{false, true, false, true, false}));

        catalogo.add(crearP("Mei Mei", 450, 250,
                new String[]{"Corte Hacha", "Bird Strike", "Patada", "Golpe de Mango", "Ataque Rápido"},
                new String[]{"Tajo", "Suicidio de cuervo letal", "Físico", "Ataque contundente", "Tajo leve"},
                false, new boolean[]{true, false, true, true, true}));

        catalogo.add(crearP("Inumaki Toge", 360, 300,
                new String[]{"¡Explota!", "¡Aplastate!", "Grito Sónico", "Golpe Leve", "Sentencia Final"},
                new String[]{"Comando fatal", "Presión gravitatoria", "Onda choque", "Físico", "Daño extremo con retroceso"},
                false, new boolean[]{false, false, false, true, false}));

        catalogo.add(crearP("Panda", 550, 200,
                new String[]{"Núcleo Gorila", "Cañón Tambor", "Núcleo Rhino", "Zarpazo", "Trío de Golpes"},
                new String[]{"Fuerza", "Daño interno", "Embestida", "Ataque físico", "Combo final"},
                false, new boolean[]{true, false, true, true, true}));

        Personaje higuruma = new Hechicero("Hiromi Higuruma", 470, 380);
        higuruma.addHabilidad(new Habilidad("Golpe de Mazo",
                "Golpe físico con el mazo de Judgeman", 55, 20, Efecto.Tipo.NORMAL, true));
        higuruma.addHabilidad(new Habilidad("Confiscación",
                "Judgeman confisca habilidades del rival temporalmente, reduciendo su daño", 40, 35, Efecto.Tipo.DEBILITADO, false));
        higuruma.addHabilidad(new Habilidad("Testigo de Cargo",
                "Invoca evidencia maldita que golpea al rival en el alma", 75, 50, Efecto.Tipo.NORMAL, false));
        higuruma.addHabilidad(new Habilidad("VEREDICTO: CULPABLE",
                "Judgeman dicta sentencia: daño masivo e inmoviliza 1 turno", 100, 80, Efecto.Tipo.ATURDIDO, false));
        higuruma.addHabilidad(new Habilidad("EXPANSIÓN: TRIBUNAL MALDITO",
                "El dominio de Higuruma. El enemigo es juzgado por Judgeman: debe defenderse del crimen que se le imputa.",
                0, 120, Efecto.Tipo.NORMAL, false));
        catalogo.add(higuruma);

        Personaje angel = new Hechicero("Angel (Hana Kurusu)", 440, 420);
        angel.addHabilidad(new Habilidad("Tajo Celestial",
                "Corte con la Katana Jacob que ignora defensa mágica", 60, 25, Efecto.Tipo.NORMAL, true));
        angel.addHabilidad(new Habilidad("Purificación",
                "Elimina efectos negativos propios y cura levemente", 0, 40, Efecto.Tipo.NORMAL, false));
        angel.addHabilidad(new Habilidad("Lluvia de Plumas",
                "Ráfaga de cortes angélicos a distancia", 75, 55, Efecto.Tipo.NORMAL, false));
        angel.addHabilidad(new Habilidad("JACOB: ANIQUILACIÓN",
                "La katana Jacob destruye técnicas malditas: daño doble a Maldiciones e ignora su esquiva", 110, 85, Efecto.Tipo.NORMAL, true));
        angel.addHabilidad(new Habilidad("ESCALERA DE JACOB",
                "Técnica máxima: Angel invoca la escalera celestial completa. Lluvia de cortes de luz que atraviesa cualquier defensa y purifica al objetivo.",
                180, 130, Efecto.Tipo.NORMAL, true));
        catalogo.add(angel);

        Personaje kenjaku = new Hechicero("Kenjaku", 580, 550);
        kenjaku.addHabilidad(new Habilidad("Manipulación de Maldiciones",
                "Lanza una horda de maldiciones robadas a enemigos anteriores. Daño moderado garantizado.",
                65, 25, Efecto.Tipo.NORMAL, false));
        kenjaku.addHabilidad(new Habilidad("Técnica Robada: Ultravioleta",
                "Kenjaku activa una técnica copiada de un hechicero caído. Rayo de energía concentrado.",
                90, 45, Efecto.Tipo.NORMAL, false));
        kenjaku.addHabilidad(new Habilidad("Barrera Anti-Hechicero",
                "Despliega una barrera que debilita las técnicas del rival durante 2 turnos y reduce su daño.",
                30, 60, Efecto.Tipo.DEBILITADO, false));
        kenjaku.addHabilidad(new Habilidad("UZUMAKI MODIFICADO",
                "Kenjaku combina varias técnicas robadas en una sola descarga devastadora. Daño masivo al alma.",
                130, 90, Efecto.Tipo.NORMAL, false));
        kenjaku.addHabilidad(new Habilidad("EXPANSIÓN: GRAN JUEGO",
                "El dominio de Kenjaku: sumerge al rival en el protocolo de fusión con Tengen. Inmoviliza 2 turnos y drena energía cada turno activo.",
                60, 130, Efecto.Tipo.ATURDIDO, false));
        catalogo.add(kenjaku);

        Personaje naoya = new Hechicero("Naoya Zenin", 460, 300);
        naoya.addHabilidad(new Habilidad("Vórtice",
                "Golpe físico potenciado por una espiral de aire comprimido. Muy veloz, difícil de esquivar.",
                65, 20, Efecto.Tipo.NORMAL, true));
        naoya.addHabilidad(new Habilidad("Ventilación: Ráfaga",
                "Descarga de aire a presión que golpea múltiples veces seguidas en fracciones de segundo.",
                80, 35, Efecto.Tipo.NORMAL, true));
        naoya.addHabilidad(new Habilidad("Barrera de Sonido",
                "Naoya se mueve tan rápido que rompe la barrera del sonido; el impacto causa desorientación. Inmoviliza 1 turno.",
                55, 50, Efecto.Tipo.ATURDIDO, true));
        naoya.addHabilidad(new Habilidad("Ventilación: Espiral Letal",
                "Técnica máxima física: vórtice de aire concentrado que desgarra desde adentro. Ignora guardia.",
                120, 75, Efecto.Tipo.NORMAL, true));
        naoya.addHabilidad(new Habilidad("Torrente: Última Velocidad",
                "Naoya alcanza su velocidad máxima absoluta. Golpe tan rápido que el rival no puede reaccionar. Alta probabilidad de Black Flash.",
                140, 100, Efecto.Tipo.NORMAL, true));
        catalogo.add(naoya);

        Personaje yuki = new Hechicero("Yuki Tsukumo", 530, 380);
        yuki.addHabilidad(new Habilidad("Puñetazo de Masa Virtual",
                "Yuki añade masa virtual a su puño. Golpe físico con un peso aplastante que atraviesa defensas débiles.",
                70, 20, Efecto.Tipo.NORMAL, true));
        yuki.addHabilidad(new Habilidad("Garuda: Embestida",
                "Lanza a su shikigami Garuda con masa virtual máxima. Impacto de alta energía cinética.",
                90, 40, Efecto.Tipo.NORMAL, false));
        yuki.addHabilidad(new Habilidad("Masa Virtual: Escudo",
                "Yuki rodea su cuerpo de masa virtual comprimida. Reduce el daño recibido a la mitad este turno y contraataca con 40 de daño fijo.",
                40, 55, Efecto.Tipo.NORMAL, false));
        yuki.addHabilidad(new Habilidad("Garuda: Impacto Gravitacional",
                "Garuda y Yuki combinan su masa virtual en un solo punto. Golpe que deforma el espacio a su alrededor.",
                115, 80, Efecto.Tipo.NORMAL, true));
        yuki.addHabilidad(new Habilidad("MASA VIRTUAL: COLAPSO ESTELAR",
                "Técnica máxima: Yuki concentra toda su masa virtual en un único punto de singularidad y lo libera sobre el rival. Daño devastador que ignora cualquier reducción.",
                170, 125, Efecto.Tipo.NORMAL, true));
        catalogo.add(yuki);
    }
}