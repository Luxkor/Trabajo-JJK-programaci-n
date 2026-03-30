public class Hechicero extends Personaje implements Combatiente {
    public Hechicero(String nombre, int vida, int energia) {
        super(nombre, vida, energia);
    }

    @Override
    public boolean esMaldicion() {
        return false;
    }

    @Override
    public void manifestarAura() {
        System.out.println("  ✨ " + getNombre() + " estabiliza su flujo de energía maldita y se prepara para el combate.");
    }
}