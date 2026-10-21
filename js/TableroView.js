// VISTA: lee y escribe el DOM. No contiene reglas del juego.
// Los elementos se localizan con atributos data-* (data-tablero, data-celda, ...).

const NOMBRES_FORMA = {
  circulo: 'círculo', cuadrado: 'cuadrado', triangulo: 'triángulo',
  rombo: 'rombo', hexagono: 'hexágono', estrella: 'estrella'
};

class TableroView {
  constructor(raiz) {
    this.raiz = raiz;
    this.tablero = raiz.querySelector('[data-tablero]');
    this.formulario = raiz.querySelector('[data-formulario="config"]');
    this.mensaje = raiz.querySelector('[data-mensaje]');
    this.error = raiz.querySelector('[data-error]');
    this.marcador = raiz.querySelector('[data-marcador="movimientos"]');
    this.dialogoAyuda = raiz.querySelector('[data-dialogo="ayuda"]');
  }

  // ---------- Lectura ----------
  leerConfiguracion() {
    const datos = new FormData(this.formulario);
    return {
      dimension: Number(datos.get('dimension')),
      tamano: datos.get('tamano'),
      tipos: [0, 1, 2].map(i => ({
        forma: FORMAS.includes(datos.get(`forma-${i}`)) ? datos.get(`forma-${i}`) : 'circulo',
        color: datos.get(`color-${i}`)
      }))
    };
  }

  // ---------- Escritura ----------
  pintar(tablero, config, terminada = false) {
    const n = tablero.dimension;
    this.tablero.style.setProperty('--n', n);
    this.tablero.dataset.tamano = config.tamano;
    this.tablero.dataset.estado = terminada ? 'completo' : 'jugando';

    const celdas = tablero.celdas.map((tipo, i) => {
      const fila = Math.floor(i / n);
      const columna = i % n;
      const aspecto = config.tipos[tipo];

      const celda = document.createElement('div');
      celda.className = 'celda';
      celda.dataset.celda = i;
      celda.dataset.fila = fila;
      celda.dataset.columna = columna;
      if (tablero.filaCompleta(fila)) celda.dataset.filaCompleta = '';

      const ficha = document.createElement('div');
      ficha.className = 'ficha';
      ficha.dataset.ficha = '';
      ficha.dataset.tipo = tipo;
      ficha.dataset.forma = aspecto.forma;
      ficha.style.setProperty('--color', aspecto.color);
      ficha.draggable = !terminada;
      ficha.tabIndex = 0;
      ficha.setAttribute('role', 'button');
      ficha.setAttribute(
        'aria-label',
        `Ficha tipo ${tipo + 1}, ${NOMBRES_FORMA[aspecto.forma]}, fila ${fila + 1}, columna ${columna + 1}`
      );

      celda.append(ficha);
      return celda;
    });

    this.tablero.replaceChildren(...celdas);
  }

  _abrirAyuda() {
    const d = this.dialogoAyuda;
    if (d.open) return;
    try { d.showModal(); } catch (e) { d.setAttribute('open', ''); }
  }

  setMovimientos(n) { this.marcador.textContent = n; }
  mostrarMensaje(texto) { this.mensaje.textContent = texto; }
  mostrarError(texto) { this.error.textContent = texto; }

  marcarSeleccion(indice) {
    this._limpiarEstados();
    this._celda(indice)?.setAttribute('data-estado', 'seleccionada');
  }

  _celda(indice) {
    return this.tablero.querySelector(`[data-celda="${indice}"]`);
  }

  _limpiarEstados() {
    this.tablero.querySelectorAll('[data-estado]').forEach(c => c.removeAttribute('data-estado'));
    this.tablero.querySelectorAll('[data-arrastrando]').forEach(f => f.removeAttribute('data-arrastrando'));
  }

  // ---------- Eventos ----------
  /**
   * manejadores: { onIntercambio(origen, destino), onSeleccionar(indice),
   *                onNuevaPartida(), onConfiguracion() }
   */
  enlazar(manejadores) {
    const t = this.tablero;

    // Drag & Drop con delegación de eventos sobre el tablero
    t.addEventListener('dragstart', e => {
      const ficha = e.target.closest('[data-ficha]');
      if (!ficha) return;
      const celda = ficha.closest('[data-celda]');
      e.dataTransfer.setData('text/plain', celda.dataset.celda);
      e.dataTransfer.effectAllowed = 'move';
      ficha.dataset.arrastrando = '';
    });

    t.addEventListener('dragenter', e => {
      const celda = e.target.closest('[data-celda]');
      if (!celda || celda.querySelector('[data-arrastrando]')) return;
      t.querySelectorAll('[data-estado="destino"]').forEach(c => c.removeAttribute('data-estado'));
      celda.dataset.estado = 'destino';
    });

    t.addEventListener('dragover', e => {
      if (e.target.closest('[data-celda]')) {
        e.preventDefault(); // necesario para permitir el drop
        e.dataTransfer.dropEffect = 'move';
      }
    });

    t.addEventListener('drop', e => {
      const celda = e.target.closest('[data-celda]');
      if (!celda) return;
      e.preventDefault();
      const origen = Number(e.dataTransfer.getData('text/plain'));
      const destino = Number(celda.dataset.celda);
      this._limpiarEstados();
      manejadores.onIntercambio(origen, destino);
    });

    t.addEventListener('dragend', () => this._limpiarEstados());

    // Alternativa sin arrastrar: ratón/teclado (pulsar dos fichas)
    t.addEventListener('click', e => {
      const celda = e.target.closest('[data-celda]');
      if (celda) manejadores.onSeleccionar(Number(celda.dataset.celda));
    });

    t.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const celda = e.target.closest('[data-celda]');
      if (!celda) return;
      e.preventDefault();
      manejadores.onSeleccionar(Number(celda.dataset.celda));
    });

    // Botones por data-accion (enlazados directamente a cada botón)
    this.raiz.querySelectorAll('[data-accion]').forEach(boton => {
      boton.addEventListener('click', () => {
        if (boton.dataset.accion === 'nueva') manejadores.onNuevaPartida();
        if (boton.dataset.accion === 'ayuda') this._abrirAyuda();
      });
    });

    // Cualquier cambio de configuración crea un tablero nuevo
    this.formulario.addEventListener('change', manejadores.onConfiguracion);
    this.formulario.addEventListener('submit', e => {
      e.preventDefault();
      manejadores.onConfiguracion();
    });
  }
}
