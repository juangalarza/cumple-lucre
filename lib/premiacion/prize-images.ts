const MAP: Record<string, string> = {
  'mate':  '/images/mate.png',
  'gorra': '/images/gorra.png',
  'miton': '/images/miton.png',
  'taza':  '/images/taza.png',
}

export function getPrizeImageSrc(nombre: string): string | null {
  return MAP[nombre.toLowerCase().trim()] ?? null
}
