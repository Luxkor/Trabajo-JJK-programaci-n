public class Maldicion extends Personaje implements Combatiente {
    public Maldicion(String nombre, int vida, int energia) {
        super(nombre, vida, energia);
    }

    @Override
    public boolean esMaldicion() {
        return true;
    }

    @Override
    public void manifestarAura() {
        System.out.println("  💀 " + getNombre() + " deforma el aire a su alrededor con una presencia oscura y asfixiante.");
    }
}