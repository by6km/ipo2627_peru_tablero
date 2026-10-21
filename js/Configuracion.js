// MODELO: reglas de la configuración (sin tocar el DOM).

export const N_MIN = 3;
export const N_MAX = 10;
export const TAMANOS = ['pequena', 'mediana', 'grande'];
export const FORMAS = ['circulo', 'cuadrado', 'triangulo', 'rombo', 'hexagono', 'estrella'];

/**
 * Devuelve un mensaje de error o null si la configuración es válida.
 * config = { dimension, tamano, tipos: [{forma, color}, {forma, color}, {forma, color}] }
 */
export function validarConfiguracion(config) {
  const { dimension, tamano, tipos } = config;

  if (!Number.isInteger(dimension) || dimension < N_MIN || dimension > N_MAX) {
    return `La dimensión debe ser un número entero entre ${N_MIN} y ${N_MAX}.`;
  }
  if (!TAMANOS.includes(tamano)) {
    return 'El tamaño de ficha no es válido.';
  }

  // Los 3 tipos deben distinguirse por forma o por color.
  const firmas = new Set(tipos.map(t => `${t.forma}|${t.color.toLowerCase()}`));
  if (firmas.size < tipos.length) {
    return 'Dos tipos de ficha son idénticos. Cambia la forma o el color de alguno.';
  }
  return null;
}
