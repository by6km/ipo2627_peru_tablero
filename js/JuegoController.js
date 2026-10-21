// CONTROLADOR: conecta la vista con el modelo y gestiona el flujo del juego.

import { Tablero } from '../model/Tablero.js';
import { validarConfiguracion } from '../model/Configuracion.js';

export class JuegoController {
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
      onNuevaPartida: () => this.#nuevaPartida(),
      onConfiguracion: () => this.#aplicarConfiguracion()
    });
    this.#aplicarConfiguracion();
  }

  #aplicarConfiguracion() {
    const nueva = this.vista.leerConfiguracion();
    const error = validarConfiguracion(nueva);
    if (error) {
      this.vista.mostrarError(error);
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

  #seleccionar(indice) {
    if (this.terminada) return;
    if (this.seleccion === null) {
      this.seleccion = indice;
      this.vista.marcarSeleccion(indice);
    } else if (this.seleccion === indice) {
      this.seleccion = null;
      this.vista.pintar(this.tablero, this.config);
    } else {
      const origen = this.seleccion;
      this.seleccion = null;
      this.#intercambiar(origen, indice);
    }
  }

  #intercambiar(origen, destino) {
    if (this.terminada || origen === destino) return;

    this.tablero.intercambiar(origen, destino);
    this.movimientos++;
    this.terminada = this.tablero.estaCompleto();

    this.vista.pintar(this.tablero, this.config, this.terminada);
    this.vista.setMovimientos(this.movimientos);
    if (this.terminada) {
      this.vista.mostrarMensaje(`¡Completado en ${this.movimientos} movimientos!`);
    }
  }
}
