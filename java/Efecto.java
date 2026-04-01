public class Efecto {
    public enum Tipo { NORMAL, ATURDIDO, DEBILITADO, POTENCIADO }
    private Tipo tipo;
    private int duracion;

    public Efecto(Tipo tipo, int duracion) {
        this.tipo = tipo;
        this.duracion = duracion;
    }

    public Tipo getTipo() { return tipo; }
    public int getDuracion() { return duracion; }
    public void reducirDuracion() { if (duracion > 0) duracion--; }
}