import java.util.*;

/**
 * Clase abstracta que modela el sistema de música del juego.
 *
 * Se elige una clase ABSTRACTA porque:
 *  - Necesita mantener estado (lista de pistas, pista seleccionada).
 *  - Impone un contrato de comportamiento (reproducir, inicializarPistas)
 *    que cada implementación concreta debe cumplir de forma distinta.
 *  - Permite añadir en el futuro subclases que reproduzcan audio real
 *    sin cambiar el código de JuegoJJK.
 *
 * Subclase concreta incluida: MusicaConsola — reproduce mostrando
 * un mensaje de "ahora sonando" en la terminal.
 */
public abstract class MusicaJJK {

    // ── Colores ANSI (duplicados aquí para que la clase sea autónoma) ──
    private static final String RESET       = "\u001B[0m";
    private static final String NEGRITA     = "\u001B[1m";
    private static final String MAGENTA_INT = "\u001B[95m";
    private static final String CYAN_INT    = "\u001B[96m";
    private static final String AMARILLO    = "\u001B[33m";
    private static final String VERDE       = "\u001B[32m";
    private static final String ROJO        = "\u001B[31m";
    private static final String BLANCO      = "\u001B[37m";
    private static final String AZUL        = "\u001B[34m";

    // ── Registro de una pista ─────────────────────────────────────────
    protected static class Pista {
        final String titulo;
        final String artista;
        final String contexto;   // ej. "Opening 1 — Temporada 1"

        Pista(String titulo, String artista, String contexto) {
            this.titulo   = titulo;
            this.artista  = artista;
            this.contexto = contexto;
        }

        @Override
        public String toString() {
            return NEGRITA + titulo + RESET + " — " + artista +
                   AZUL + "  [" + contexto + "]" + RESET;
        }
    }

    // ── Estado compartido ─────────────────────────────────────────────
    protected final List<Pista> pistas = new ArrayList<>();
    protected int pistaSeleccionada = 0;   // 0 = sin música

    // ── Constructor ───────────────────────────────────────────────────
    protected MusicaJJK() {
        inicializarPistas();
    }

    // ── Métodos abstractos (cada subclase define su comportamiento) ───

    /**
     * Rellena la lista de pistas disponibles.
     * Cada subclase puede ofrecer un catálogo diferente.
     */
    protected abstract void inicializarPistas();

    /**
     * Reproduce la pista seleccionada.
     * En una subclase de audio real abriría un clip de sonido;
     * en MusicaConsola imprime el anuncio en pantalla.
     * Solo debe llamarse al INICIAR una pelea.
     */
    public abstract void reproducir();

    // ── Métodos concretos comunes ──────────────────────────────────────

    /** Muestra el menú de selección de pista y actualiza pistaSeleccionada. */
    public void mostrarMenuSeleccion(Scanner sc) {
        System.out.println("\n  " + CYAN_INT + NEGRITA + "── BANDA SONORA — SELECCIÓN ──" + RESET);
        System.out.println("  " + AZUL + "═".repeat(50) + RESET);
        for (int i = 0; i < pistas.size(); i++) {
            String marcador = (pistaSeleccionada == i + 1) ? VERDE + " ▶ " + RESET : "   ";
            System.out.println("  " + marcador + AMARILLO + (i + 1) + "." + RESET + " " + pistas.get(i));
        }
        System.out.println("  " + (pistaSeleccionada == 0 ? VERDE + " ▶ " + RESET : "   ") +
                AMARILLO + (pistas.size() + 1) + "." + RESET + " Sin música  " +
                AZUL + "[Predeterminado]" + RESET);
        System.out.println("  " + AZUL + "═".repeat(50) + RESET);
        System.out.print("  " + BLANCO + "▶ Elige una pista (1-" + (pistas.size() + 1) + "): " + RESET);

        try {
            int sel = Integer.parseInt(sc.nextLine().trim());
            if (sel >= 1 && sel <= pistas.size()) {
                pistaSeleccionada = sel;
                System.out.println("  " + VERDE + "✓ Pista seleccionada: " + pistas.get(sel - 1).titulo + RESET);
            } else if (sel == pistas.size() + 1) {
                pistaSeleccionada = 0;
                System.out.println("  " + VERDE + "✓ Música desactivada." + RESET);
            } else {
                System.out.println("  " + ROJO + "Opción inválida." + RESET);
            }
        } catch (NumberFormatException e) {
            System.out.println("  " + ROJO + "Entrada inválida." + RESET);
        }
    }

    public int getPistaSeleccionada()      { return pistaSeleccionada; }
    public boolean hayMusicaActiva()       { return pistaSeleccionada > 0; }
    public List<Pista> getPistas()         { return Collections.unmodifiableList(pistas); }

    // ══════════════════════════════════════════════════════════════════
    //  Subclase concreta: reproduce anunciando la pista en consola.
    // ══════════════════════════════════════════════════════════════════
    public static class MusicaConsola extends MusicaJJK {

        @Override
        protected void inicializarPistas() {
            pistas.add(new Pista("Kaikai Kitan",    "Eve",            "Opening 1 — Temporada 1"));
            pistas.add(new Pista("SPECIALZ",         "King Gnu",       "Opening Arco de Shibuya"));
            pistas.add(new Pista("Ao no Sumika",     "Tatsuya Kitani", "Opening Inventario Oculto"));
            pistas.add(new Pista("Lost in Paradise", "ALI ft. AKLO",   "Ending 1 — Temporada 1"));
            pistas.add(new Pista("AIZO",             "King GNU",       "Opening 5 - Temporada 3"));
        }

        /**
         * Anuncia la pista en pantalla. Solo debe llamarse al inicio de combate.
         * En el futuro, aquí iría javax.sound.sampled para audio real.
         */
        @Override
        public void reproducir() {
            if (!hayMusicaActiva()) return;
            Pista p = pistas.get(pistaSeleccionada - 1);
            System.out.println("\n  " + MAGENTA_INT + NEGRITA +
                    "♪♪ REPRODUCIENDO: " + p.titulo + " — " + p.artista + RESET);
            System.out.println("  " + AZUL + "   " + p.contexto + RESET);
        }
    }
}
