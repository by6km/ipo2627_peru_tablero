// MODELO: estado y reglas del juego (sin tocar el DOM).

const N_TIPOS = 3;

class Tablero {
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
   * Genera un tablero solucionable: cada tipo ocupa al menos una fila en la
   * solución y el resto de filas recibe un tipo aleatorio. Después se barajan
   * todas las fichas, manteniendo cantidades múltiplos de N.
   */
  #generar() {
    const n = this.dimension;
    const tiposFila = Array.from({ length: N_TIPOS }, (_, i) => i);
    for (let fila = N_TIPOS; fila < n; fila++) {
      tiposFila.push(Math.floor(Math.random() * N_TIPOS));
    }
    this.#barajar(tiposFila);

    const fichas = tiposFila.flatMap(tipo => Array(n).fill(tipo));
    do {
      this.#barajar(fichas);
    } while (this.#esCompleto(fichas)); // Evitar una partida inicialmente resuelta.

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

  /** Un intercambio inválido o entre fichas iguales no modifica el tablero. */
  intercambiar(a, b) {
    const enRango = indice => Number.isInteger(indice) && indice >= 0 && indice < this.#celdas.length;
    if (!enRango(a) || !enRango(b) || a === b || this.#celdas[a] === this.#celdas[b]) {
      return false;
    }
    [this.#celdas[a], this.#celdas[b]] = [this.#celdas[b], this.#celdas[a]];
    return true;
  }

  filaCompleta(fila) {
    return this.#filaUniforme(this.#celdas, fila);
  }

  estaCompleto() {
    return this.#esCompleto(this.#celdas);
  }
}
