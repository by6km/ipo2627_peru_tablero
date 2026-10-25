// VISTA: lee y escribe el DOM. No contiene reglas del juego.
// Los elementos se localizan con atributos data-* (data-tablero, data-celda, ...).


const NOMBRES_FORMA = {
  circulo: 'círculo', cuadrado: 'cuadrado', triangulo: 'triángulo',
  rombo: 'rombo', hexagono: 'hexágono', estrella: 'estrella'
};

export class TableroView {
  constructor(raiz) {
    this.raiz = raiz;
    this.tablero = raiz.querySelector('[data-tablero]');
    this.formulario = raiz.querySelector('[data-formulario="config"]');
    this.mensaje = raiz.querySelector('[data-mensaje]');
    this.error = raiz.querySelector('[data-error]');
    this.marcador = raiz.querySelector('[data-marcador="movimientos"]');
    this.dialogoAyuda = raiz.querySelector('[data-dialogo="ayuda"]');
    this.origenArrastre = null;
    this.areaTablero = raiz.querySelector('[data-area-tablero]');
    this.panelAjustes = raiz.querySelector('#panel-ajustes');
    this.botonAjustes = raiz.querySelector('[data-accion="ajustes"]');
    this.dimensionActual = 4;

    // El contenedor tiene un alto y ancho limitados por el viewport.
    // ResizeObserver permite ajustar el tablero sin barras de desplazamiento
    // al redimensionar la ventana o modificar N.
    if (typeof ResizeObserver !== 'undefined') {
      this.observador = new ResizeObserver(() => this.ajustarTablero());
      this.observador.observe(this.areaTablero);
    } else {
      window.addEventListener('resize', () => this.ajustarTablero());
    }
  }

  // ---------- Lectura ----------
  leerConfiguracion() {
    const datos = new FormData(this.formulario);
    return {
      dimension: Number(datos.get('dimension')),
      tamano: datos.get('tamano'),
      tipos: [0, 1, 2].map(i => ({
        forma: datos.get(`forma-${i}`),
        color: datos.get(`color-${i}`)
      }))
    };
  }

  // ---------- Escritura ----------
  pintar(tablero, config, terminada = false) {
    // Conservar el foco de la ficha al reconstruir el tablero, especialmente
    // cuando el intercambio se ha realizado con Enter o Espacio.
    const activa = this.raiz.activeElement;
    const celdaActiva = this.tablero.contains(activa) ? activa.closest('[data-celda]') : null;
    const indiceFoco = celdaActiva ? Number(celdaActiva.dataset.celda) : null;
    const n = tablero.dimension;
    this.dimensionActual = n;
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
      ficha.tabIndex = terminada ? -1 : 0;
      if (terminada) ficha.setAttribute('aria-disabled', 'true');
      ficha.setAttribute('role', 'button');
      ficha.setAttribute(
        'aria-label',
        `Ficha tipo ${tipo + 1}, ${NOMBRES_FORMA[aspecto.forma]}, fila ${fila + 1}, columna ${columna + 1}`
      );

      celda.append(ficha);
      return celda;
    });

    this.tablero.replaceChildren(...celdas);
    this.ajustarTablero();
    if (indiceFoco !== null) {
      // Una ficha puede recibir foco programáticamente al terminar la partida.
      this._celda(indiceFoco)?.querySelector('[data-ficha]')?.focus({ preventScroll: true });
    }
  }

  // Cuadra exactamente N columnas y N filas dentro del espacio visible.
  ajustarTablero() {
    if (!this.areaTablero || !this.tablero) return;
    const n = this.dimensionActual;
    if (!n || !this.areaTablero.clientWidth || !this.areaTablero.clientHeight) return;

    const area = getComputedStyle(this.areaTablero);
    const estilo = getComputedStyle(this.tablero);
    const disponibleX = this.areaTablero.clientWidth - parseFloat(area.paddingLeft) - parseFloat(area.paddingRight);
    const disponibleY = this.areaTablero.clientHeight - parseFloat(area.paddingTop) - parseFloat(area.paddingBottom);
    const margenX = parseFloat(estilo.paddingLeft) + parseFloat(estilo.paddingRight)
      + parseFloat(estilo.borderLeftWidth) + parseFloat(estilo.borderRightWidth);
    const margenY = parseFloat(estilo.paddingTop) + parseFloat(estilo.paddingBottom)
      + parseFloat(estilo.borderTopWidth) + parseFloat(estilo.borderBottomWidth);
    const separacion = parseFloat(estilo.columnGap) || 0;
    const separacionVertical = parseFloat(estilo.rowGap) || 0;
    const ancho = (disponibleX - margenX - separacion * (n - 1)) / n;
    const alto = (disponibleY - margenY - separacionVertical * (n - 1)) / n;
    // La cota máxima evita celdas desmesuradas en monitores grandes.
    const lado = Math.max(1, Math.floor(Math.min(96, ancho, alto)));
    this.tablero.style.setProperty('--celda', `${lado}px`);
  }

  _mostrarAjustes(abierto) {
    this.panelAjustes.dataset.abierto = String(abierto);
    this.botonAjustes.setAttribute('aria-expanded', String(abierto));
    if (abierto) {
      this._pestanaAjustes('tablero');
      this.panelAjustes.querySelector('[data-accion="cerrar-ajustes"]').focus({ preventScroll: true });
    } else {
      this.botonAjustes.focus({ preventScroll: true });
    }
    this.raiz.querySelector('[data-accion="cerrar-ajustes"].ajustes-fondo').dataset.abierto = String(abierto);
  }

  _pestanaAjustes(tipo) {
    this.panelAjustes.dataset.vista = tipo;
    this.panelAjustes.querySelectorAll('[data-accion^="tab-ajustes-"]').forEach(boton => {
      boton.setAttribute('aria-selected', String(boton.dataset.accion === `tab-ajustes-${tipo}`));
    });
  }

  _abrirAyuda() {
    const d = this.dialogoAyuda;
    if (d.open) return;
    try { d.showModal(); } catch (e) { d.setAttribute('open', ''); }
  }

  setMovimientos(n) { this.marcador.textContent = n; }
  mostrarMensaje(texto) { this.mensaje.textContent = texto; }
  mostrarError(texto) { this.error.textContent = texto; }

  limpiarSeleccion() {
    this.tablero.querySelectorAll('[data-estado="seleccionada"]')
      .forEach(c => c.removeAttribute('data-estado'));
  }

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

    // Drag & Drop con delegación de eventos sobre el tablero.
    // Solo aceptamos intercambios que comenzaron arrastrando una ficha propia.
    t.addEventListener('dragstart', e => {
      const ficha = e.target.closest('[data-ficha]');
      if (!ficha || !ficha.draggable) {
        e.preventDefault();
        return;
      }
      const celda = ficha.closest('[data-celda]');
      const origen = Number(celda.dataset.celda);
      this.origenArrastre = origen;
      manejadores.onInicioArrastre();
      e.dataTransfer.setData('text/plain', String(origen));
      e.dataTransfer.effectAllowed = 'move';
      ficha.dataset.arrastrando = '';
    });

    t.addEventListener('dragenter', e => {
      const celda = e.target.closest('[data-celda]');
      if (this.origenArrastre === null || !celda ||
          Number(celda.dataset.celda) === this.origenArrastre) return;
      t.querySelectorAll('[data-estado="destino"]').forEach(c => c.removeAttribute('data-estado'));
      celda.dataset.estado = 'destino';
    });

    t.addEventListener('dragover', e => {
      if (this.origenArrastre !== null && e.target.closest('[data-celda]')) {
        e.preventDefault(); // necesario para permitir el drop
        e.dataTransfer.dropEffect = 'move';
      }
    });

    t.addEventListener('drop', e => {
      const celda = e.target.closest('[data-celda]');
      if (!celda || this.origenArrastre === null) return;
      e.preventDefault();
      const textoOrigen = e.dataTransfer.getData('text/plain');
      const origen = this.origenArrastre;
      const destino = Number(celda.dataset.celda);
      this.origenArrastre = null;
      this._limpiarEstados();
      if (textoOrigen === String(origen)) {
        manejadores.onIntercambio(origen, destino);
      }
    });

    t.addEventListener('dragend', () => {
      this.origenArrastre = null;
      this._limpiarEstados();
    });

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
        if (boton.dataset.accion === 'ajustes') this._mostrarAjustes(true);
        if (boton.dataset.accion === 'cerrar-ajustes') this._mostrarAjustes(false);
        if (boton.dataset.accion === 'tab-ajustes-tablero') this._pestanaAjustes('tablero');
        if (boton.dataset.accion === 'tab-ajustes-fichas') this._pestanaAjustes('fichas');
      });
    });

    this.raiz.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.panelAjustes.dataset.abierto === 'true') {
        this._mostrarAjustes(false);
      }
    });

    // Cualquier cambio de configuración crea un tablero nuevo
    this.formulario.addEventListener('change', manejadores.onConfiguracion);
    this.formulario.addEventListener('submit', e => {
      e.preventDefault();
      manejadores.onConfiguracion();
    });
  }
}
