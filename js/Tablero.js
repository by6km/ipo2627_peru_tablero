// MODELO: estado y reglas del juego (sin tocar el DOM).

export const N_TIPOS = 3;

export class Tablero {
  #celdas = [];

  constructor(dimension) {
    this.dimension = dimension;
    this.#generar();
  }

  /** Copia de las celdas (cada valor es el tipo de ficha: 0, 1 o 2). */
  get celdas() {
    return [...this.#celdas];
  }

  /**
   * Genera un tablero solucionable: se asigna un tipo a cada fila (al menos
   * dos distintos) y se barajan todas las fichas. Como se puede intercambiar
   * cualquier par de celdas, cualquier reparto es siempre resoluble.
   */
  #generar() {
    const n = this.dimension;
    let tiposFila;
    do {
      tiposFila = Array.from({ length: n }, () => Math.floor(Math.random() * N_TIPOS));
    } while (new Set(tiposFila).size < 2);

    const fichas = tiposFila.flatMap(tipo => Array(n).fill(tipo));
    do {
      this.#barajar(fichas);
    } while (this.#esCompleto(fichas)); // que no empiece ya resuelto

    this.#celdas = fichas;
  }

  #barajar(lista) { // Fisher-Yates
    for (let i = lista.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lista[i], lista[j]] = [lista[j], lista[i]];
    }
  }

  #filaUniforme(celdas, fila) {
    const n = this.dimension;
    const inicio = fila * n;
    const primero = celdas[inicio];
    for (let c = 1; c < n; c++) {
      if (celdas[inicio + c] !== primero) return false;
    }
    return true;
  }

  #esCompleto(celdas) {
    for (let f = 0; f < this.dimension; f++) {
      if (!this.#filaUniforme(celdas, f)) return false;
    }
    return true;
  }

  intercambiar(a, b) {
    [this.#celdas[a], this.#celdas[b]] = [this.#celdas[b], this.#celdas[a]];
  }

  filaCompleta(fila) {
    return this.#filaUniforme(this.#celdas, fila);
  }

  estaCompleto() {
    return this.#esCompleto(this.#celdas);
  }
}
