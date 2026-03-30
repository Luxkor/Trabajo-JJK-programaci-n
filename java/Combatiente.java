public interface Combatiente {
    /**
     * Determina si el combatiente es una entidad nacida de energía maldita negativa.
     */
    boolean esMaldicion();

    /**
     * Muestra un mensaje de ambientación o aura al ser seleccionado.
     */
    void manifestarAura();
}