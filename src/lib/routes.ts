/** Id de la categoría si la ruta actual es /categories/[id]. */
export function categoryIdFromPath(pathname: string) {
  return pathname.match(/^\/categories\/([\w-]+)$/)?.[1]
}
