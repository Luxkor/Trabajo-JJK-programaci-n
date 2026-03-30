public class Habilidad {
    private String nombre, descripcion;
    private int danio, costeEnergia;
    private boolean esFisico; // Determina si puede hacer Black Flash

    public Habilidad(String nombre, String descripcion, int danio, int costeEnergia, Efecto.Tipo tipo, boolean esFisico) {
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.danio = danio;
        this.costeEnergia = costeEnergia;
        this.esFisico = esFisico;
    }

    public String getNombre() { return nombre; }
    public String getDescripcion() { return descripcion; }
    public int getDanio() { return danio; }
    public int getCosteEnergia() { return costeEnergia; }
    public boolean isFisico() { return esFisico; }
}