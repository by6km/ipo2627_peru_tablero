// CONTROLADOR: conecta la vista con el modelo y gestiona el flujo del juego.

class JuegoController {
  constructor(vista) {
    this.vista = vista;
    this.config = vista.leerConfiguracion();
    this.tablero = null;
    this.movimientos = 0;
    this.seleccion = null;
    this.terminada = false;
  }

  iniciar() {
    this.vista.enlazar({
      onIntercambio: (a, b) => this.#intercambiar(a, b),
      onSeleccionar: i => this.#seleccionar(i),
      onInicioArrastre: () => this.#cancelarSeleccion(),
      // La nueva partida también valida el formulario actual; no emplea
      // silenciosamente una configuración anterior si hay un error.
      onNuevaPartida: () => this.#aplicarConfiguracion(),
      onConfiguracion: () => this.#aplicarConfiguracion()
    });
    this.#aplicarConfiguracion();
  }

  #aplicarConfiguracion() {
    const nueva = this.vista.leerConfiguracion();
    const error = validarConfiguracion(nueva);
    if (error) {
      this.vista.mostrarError(`${error} Se mantiene la partida con la última configuración válida.`);
      return;
    }
    this.vista.mostrarError('');
    this.config = nueva;
    this.#nuevaPartida();
  }

  #nuevaPartida() {
    this.tablero = new Tablero(this.config.dimension);
    this.movimientos = 0;
    this.seleccion = null;
    this.terminada = false;
    this.vista.pintar(this.tablero, this.config);
    this.vista.setMovimientos(0);
    this.vista.mostrarMensaje('');
  }

  #cancelarSeleccion() {
    this.seleccion = null;
    this.vista.limpiarSeleccion();
  }

  #seleccionar(indice) {
    if (this.terminada || !this.tablero ||
        !Number.isInteger(indice) || indice < 0 || indice >= this.tablero.celdas.length) return;

    if (this.seleccion === null) {
      this.seleccion = indice;
      this.vista.marcarSeleccion(indice);
    } else if (this.seleccion === indice) {
      this.#cancelarSeleccion();
    } else {
      const origen = this.seleccion;
      this.#intercambiar(origen, indice);
    }
  }

  #intercambiar(origen, destino) {
    // Se cancela SIEMPRE la selección anterior, también si el movimiento
    // llega por Drag & Drop o resulta inválido.
    this.#cancelarSeleccion();
    if (this.terminada || !this.tablero || !this.tablero.intercambiar(origen, destino)) return;

    this.movimientos++;
    this.terminada = this.tablero.estaCompleto();

    this.vista.pintar(this.tablero, this.config, this.terminada);
    this.vista.setMovimientos(this.movimientos);
    if (this.terminada) {
      this.vista.mostrarMensaje(`¡Completado en ${this.movimientos} movimientos!`);
    }
  }
}
