import java.util.*;

public abstract class Personaje {
    protected String nombre;
    protected int vida, maxVida, energia, maxEnergia;
    protected boolean defendiendo = false;
    protected boolean dominioActivo = false;
    protected boolean dentroDeDominioEnemigo = false;
    protected int turnosBurnout = 0;
    protected int turnosInmortal = 0;
    protected int turnosInmovilizado = 0;
    protected String causaInmovilizacion = "técnica enemiga"; // nombre de la técnica que inmovilizó
    protected int turnosPotenciado = 0;

    protected List<Habilidad> habilidades = new ArrayList<>();

    public Personaje(String nombre, int vida, int energia) {
        this.nombre = nombre;
        this.vida = vida;
        this.maxVida = vida;
        this.energia = energia;
        this.maxEnergia = energia;
    }

    public boolean puedeUsarEspeciales() {
        return !nombre.equals("Maki Zenin") && !nombre.equals("Toji Fushiguro");
    }

    public boolean puedeCurarse() {
        List<String> curanderos = Arrays.asList("Gojo Satoru", "Sukuna", "Yuta Okkotsu", "Maki Zenin", "Toji Fushiguro");
        return curanderos.contains(this.nombre);
    }

    public void curarse() {
        if (nombre.equals("Maki Zenin") || nombre.equals("Toji Fushiguro")) {
            this.vida = Math.min(this.maxVida, this.vida + 150);
            System.out.println(">>> " + nombre + " se cura usando su factor de regeneración física extrema.");
        } else if (nombre.equals("Gojo Satoru")) {
            // Gojo: la Técnica Inversa le cuesta casi nada gracias al Infinito
            if (energia >= 5) {
                this.energia -= 5;
                this.vida = Math.min(this.maxVida, this.vida + 250);
                System.out.println(">>> " + nombre + " activa la Técnica Inversa al instante. El Infinito amplifica la curación.");
            } else {
                System.out.println("No hay suficiente energía para curarse.");
            }
        } else if (energia >= 50) {
            this.energia -= 50;
            this.vida = Math.min(this.maxVida, this.vida + 250);
            System.out.println(">>> " + nombre + " usa la Técnica Inversa para sanar sus heridas.");
        } else {
            System.out.println("No hay suficiente energía para curarse.");
        }
    }

    public void ataqueBasico(Personaje objetivo) {
        System.out.println("\n>>> " + this.nombre + " lanza un Ataque Físico Común.");
        int danio = 30;

        if (puedeUsarEspeciales() && Math.random() < 0.05) {
            System.out.println("¡💥 DESTELLO NEGRO! (Black Flash)");
            danio *= 2.5;
        }
        objetivo.marcarUltimoGolpe(false); // físico puro, sin energía maldita
        objetivo.recibirDanio(danio);
    }

    public void recargarEnergia() {
        if (puedeUsarEspeciales()) {
            this.energia = Math.min(this.maxEnergia, this.energia + 80);
            System.out.println(">>> " + this.nombre + " recarga su Energía Maldita.");
        }
    }

    public void usarHabilidad(int indice, Personaje objetivo) throws Exception {
        if (turnosInmovilizado > 0) {
            throw new Exception(this.nombre + " está inmovilizado y no puede atacar.");
        }
        if (this.turnosBurnout > 0 && indice > 0) {
            throw new Exception("¡BURNOUT! Tu técnica ritual está desactivada tras usar un dominio.");
        }

        Habilidad h = habilidades.get(indice);
        if (this.energia < h.getCosteEnergia()) {
            throw new Exception("Energía maldita insuficiente.");
        }

        this.energia -= h.getCosteEnergia();

        // Determinar si este golpe cuenta como "energético" para la mecánica de Naoya.
        // Es energético si: la habilidad tiene coste de energía > 0,
        // o si el atacante usa herramientas malditas (Maki, Toji, Mei Mei, Nanami).
        boolean golpeEnergetico = h.getCosteEnergia() > 0 || this.tieneHerramientaMaldita();
        objetivo.marcarUltimoGolpe(golpeEnergetico);

        // INSTAKILL DE MAHORAGA A MALDICIONES
        if (h.getNombre().equals("Tajo de Exterminio") && objetivo instanceof Maldicion) {
            System.out.println("\n>>> " + this.nombre + " usa: " + h.getNombre());
            System.out.println("✨ ¡La Espada del Exterminio está envuelta en energía positiva pura!");
            System.out.println("💀 " + objetivo.getNombre() + " es purificado al instante y desaparece.");
            objetivo.vida = 0;
            return;
        }

        // INSTAKILL / DAÑO DOBLE DE JACOB A MALDICIONES
        if (h.getNombre().equals("JACOB: ANIQUILACIÓN") && objetivo instanceof Maldicion) {
            System.out.println("\n>>> " + this.nombre + " usa: " + h.getNombre());
            System.out.println("✝️  ¡La Katana Celestial Jacob destruye la maldición sin defensa posible!");
            objetivo.setDentroDeDominio(true); // ignora esquiva
            objetivo.vida = Math.max(0, objetivo.vida - h.getDanio() * 2);
            System.out.println(objetivo.getNombre() + " recibe " + (h.getDanio() * 2) + " de daño angélico. (HP: " + objetivo.vida + ")");
            return;
        }

        int danioFinal = h.getDanio();

        if (this.turnosPotenciado > 0) danioFinal = (int)(danioFinal * 1.5);
        else if (this.turnosPotenciado < 0) danioFinal = (int)(danioFinal * 0.6);
        if (this.dominioActivo) danioFinal *= 1.3;

        if (h.isFisico() && puedeUsarEspeciales()) {
            boolean blackFlash = h.getNombre().contains("DESTELLO NEGRO") || h.getNombre().equals("Destello Negro")
                    ? true
                    : Math.random() < 0.05;
            if (blackFlash) {
                System.out.println("¡💥 DESTELLO NEGRO! Las chispas oscuras vuelan.");
                danioFinal *= 2.5;
            }
        }

        System.out.println("\n>>> " + this.nombre + " usa: " + h.getNombre());
        System.out.println("INFO: " + h.getDescripcion());

        if (h.getNombre().contains("VACÍO INFINITO")) {
            System.out.println("✨ El Vacío Infinito inunda la mente de " + objetivo.getNombre() + " con información ilimitada. Queda paralizado.");
            objetivo.setTurnosInmovilizado(2, "EXPANSIÓN: VACÍO INFINITO");
        } else if (h.getNombre().contains("AMOR MUTUO Y VERDADERO") || h.getNombre().contains("AUTOENCARNACIÓN") || h.getNombre().contains("ATAÚD")) {
            this.turnosPotenciado = 2;
            System.out.println("🔥 Las estadísticas de " + this.nombre + " se potencian dramáticamente.");
        } else if (h.getNombre().contains("IDLE DEATH GAMBLE")) {
            if (Math.random() < 0.33) {
                System.out.println("🎰 ¡JACKPOT! " + this.nombre + " obtiene energía infinita e inmortalidad temporal.");
                this.turnosInmortal = 4;
                this.energia = 9999;
            } else {
                System.out.println("💀 Mala suerte en la tirada del IDLE DEATH GAMBLE. Se perdió la energía del dominio.");
            }
        } else if (h.getNombre().contains("VEREDICTO: CULPABLE")) {
            System.out.println("⚖️  ¡Judgeman dicta VEREDICTO: CULPABLE! " + objetivo.getNombre() + " queda inmovilizado por la sentencia.");
            objetivo.setTurnosInmovilizado(1, "VEREDICTO: CULPABLE");
        } else if (h.getNombre().contains("Confiscación")) {
            System.out.println("📜 Judgeman ejecuta la Confiscación sobre " + objetivo.getNombre() + ". Su próximo ataque hace menos daño.");
            objetivo.setTurnosPotenciado(-1);
        } else if (h.getNombre().contains("Purificación")) {
            this.turnosBurnout = 0;
            this.turnosInmovilizado = 0;
            this.vida = Math.min(this.maxVida, this.vida + 80);
            System.out.println("✝️  La Purificación de " + this.nombre + " elimina sus efectos negativos y restaura 80 HP.");
        } else if (h.getNombre().contains("Barrera de Sonido")) {
            System.out.println("💨 ¡La Barrera de Sonido de " + this.nombre + " rompe la barrera del sonido! " + objetivo.getNombre() + " queda desorientado.");
            objetivo.setTurnosInmovilizado(1, "Barrera de Sonido");
        } else if (h.getNombre().contains("Barrera Sónica Maldita")) {
            System.out.println("💀 ¡La Barrera Sónica Maldita de " + this.nombre + " desgarra el alma de " + objetivo.getNombre() + "! Queda inmovilizado 2 turnos.");
            objetivo.setTurnosInmovilizado(2, "Barrera Sónica Maldita");
        } else if (h.getNombre().contains("Barrera Anti-Hechicero")) {
            System.out.println("🔮 La Barrera Anti-Hechicero de " + this.nombre + " suprime la energía maldita de " + objetivo.getNombre() + ".");
            objetivo.setTurnosPotenciado(-2);
        } else if (h.getNombre().contains("GRAN JUEGO")) {
            System.out.println("🌀 El Gran Juego de " + this.nombre + " atrapa a " + objetivo.getNombre() + " en el protocolo de fusión con Tengen. Queda inmovilizado y sin energía.");
            objetivo.setTurnosInmovilizado(2, "EXPANSIÓN: GRAN JUEGO");
            objetivo.confiscarEnergia();
        } else if (h.getNombre().contains("Torrente: Última Velocidad")) {
            this.turnosPotenciado = 1;
            System.out.println("⚡ " + this.nombre + " alcanza velocidad absoluta con Torrente: Última Velocidad. Sus ataques están potenciados este turno.");
        } else if (h.getNombre().contains("Orgullo del Clan Zenin")) {
            this.turnosPotenciado = 2;
            this.vida = Math.min(this.maxVida, this.vida + 100);
            System.out.println("💀 El Orgullo del Clan Zenin arde en " + this.nombre + ". +100 HP y potenciado durante 2 turnos.");
        } else if (h.getNombre().contains("TORMENTA FINAL")) {
            objetivo.setDentroDeDominio(true);
            System.out.println("☠️  La TORMENTA FINAL: RENCOR ETERNO de " + this.nombre + " no puede ser bloqueada ni esquivada.");
        } else if (h.getNombre().contains("Masa Virtual: Escudo")) {
            this.defendiendo = true;
            System.out.println("⚫ La Masa Virtual: Escudo de " + this.nombre + " comprime masa virtual alrededor de su cuerpo. Reducirá el daño recibido a la mitad.");
            System.out.println("💥 La masa virtual rebota: " + objetivo.getNombre() + " recibe 40 de daño de contragolpe.");
            objetivo.recibirDanioFijo(40);
        } else if (h.getNombre().contains("COLAPSO ESTELAR")) {
            // Sin golpe seguro: la técnica es devastadora por su daño, no por ser un dominio
            System.out.println("🌑 El MASA VIRTUAL: COLAPSO ESTELAR de " + this.nombre + " libera una singularidad sobre " + objetivo.getNombre() + ".");
        }

        if (danioFinal > 0) objetivo.recibirDanio(danioFinal);
    }

    public void recibirDanio(int cantidad) {
        if (this.turnosInmortal > 0) {
            System.out.println("¡" + nombre + " es inmortal y se regenera al instante!");
            return;
        }

        if (!dentroDeDominioEnemigo && Math.random() < 0.15) {
            System.out.println("💨 ¡" + this.nombre + " ha esquivado el ataque rápidamente!");
            return;
        } else if (dentroDeDominioEnemigo) {
            System.out.println("🎯 Golpe garantizado por el Dominio.");
        }

        int danioFinal = cantidad;
        if (defendiendo) {
            danioFinal /= 2;
            System.out.println("🛡️ " + nombre + " se protege y reduce el daño a la mitad.");
        }

        this.vida = Math.max(0, this.vida - danioFinal);
        System.out.println(nombre + " recibe " + danioFinal + " de daño. (HP Restante: " + this.vida + ")");
    }

    public void recibirDanioFijo(int cantidad) {
        if (this.turnosInmortal > 0) return;
        this.vida = Math.max(0, this.vida - cantidad);
        System.out.println("🩸 " + nombre + " sufre " + cantidad + " de daño continuo. (HP: " + this.vida + ")");
    }

    public void prepararTurno() {
        this.defendiendo = false;
        if (turnosBurnout > 0) turnosBurnout--;
        if (turnosInmortal > 0) turnosInmortal--;
        if (turnosInmovilizado > 0) turnosInmovilizado--;
        if (turnosPotenciado > 0) turnosPotenciado--;
    }

    public boolean estaVivo() { return vida > 0; }
    public String getNombre() { return nombre; }
    public int getVida() { return vida; }
    public int getMaxVida() { return maxVida; }
    public int getEnergia() { return energia; }
    public int getMaxEnergia() { return maxEnergia; }
    public List<Habilidad> getHabilidades() { return habilidades; }
    public void addHabilidad(Habilidad h) { this.habilidades.add(h); }
    public void setDefensa(boolean d) { this.defendiendo = d; }
    public void setBurnout(int t) { this.turnosBurnout = t; }
    public boolean isDominioActivo() { return dominioActivo; }
    public void setDominioActivo(boolean b) { this.dominioActivo = b; }
    public void setDentroDeDominio(boolean b) { this.dentroDeDominioEnemigo = b; }
    public void setTurnosInmovilizado(int t) { this.turnosInmovilizado = t; }
    public void setTurnosInmovilizado(int t, String causa) {
        this.turnosInmovilizado = t;
        this.causaInmovilizacion = causa;
    }
    public String getCausaInmovilizacion() { return causaInmovilizacion; }
    public void setTurnosPotenciado(int t) { this.turnosPotenciado = Math.max(this.turnosPotenciado + t, -2); }

    // ── Rastreo del último tipo de golpe recibido (para la transformación de Naoya) ──
    // true  = el golpe que mató usó energía maldita o herramienta maldita
    // false = fue físico puro (ataque básico o habilidad sin coste de energía)
    protected boolean ultimoGolpeFueEnergetico = true; // por defecto true (caso seguro)

    public void marcarUltimoGolpe(boolean fueEnergetico) {
        this.ultimoGolpeFueEnergetico = fueEnergetico;
    }

    public boolean ultimoGolpeFueEnergetico() {
        return ultimoGolpeFueEnergetico;
    }

    // ── Confiscación del Tribunal de Higuruma ──
    // Los personajes que usan herramientas (Maki, Toji, Mei Mei, Nanami)
    // son tratados como portadores de "herramienta maldita" para la confiscación.
    // Perder la herramienta les aplica burnout permanente en ese combate.
    protected boolean herramientaConfiscada = false;

    public boolean tieneHerramientaMaldita() {
        if (herramientaConfiscada) return false;
        // Personajes cuyo kit es predominantemente de herramientas
        List<String> portadoresHerramienta = Arrays.asList(
                "Maki Zenin", "Toji Fushiguro", "Mei Mei", "Nanami Kento"
        );
        return portadoresHerramienta.contains(this.nombre);
    }

    public void confiscarHerramienta() {
        herramientaConfiscada = true;
        // Sin herramienta sus habilidades físicas tienen la mitad de daño: simulamos con debuff
        this.turnosPotenciado = Math.min(this.turnosPotenciado - 2, -2);
    }

    public void confiscarEnergia() {
        this.energia = 0;
        System.out.println("  " + nombre + " queda sin energía maldita.");
    }

    public void drenarEnergia(int cantidad) {
        int drenado = Math.min(this.energia, cantidad);
        this.energia -= drenado;
        if (drenado > 0)
            System.out.println("  " + nombre + " pierde " + drenado + " de energía maldita. (Energía: " + this.energia + ")");
    }
}