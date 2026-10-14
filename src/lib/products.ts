import data from "../data/catalog.json";

export type Producto = (typeof data.productos)[number] & { slug: string };

// Dejamos el nombre y la referencia listos para una URL legible, sin tildes ni espacios.
const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const productos: Producto[] = data.productos.map((p) => ({
  ...p,
  slug: slugify(`${p.nombre}-${p.referencia}`),
}));

export const getProductHash = (slug: string) =>
  `#producto-${encodeURIComponent(slug)}`;

export const getProductPath = (slug: string) =>
  `/productos/${encodeURIComponent(slug)}/`;

// Pilas: los relacionados comparten tipo, pero nunca repetimos el producto actual.
export const relacionados = (p: Producto, n = 3) =>
  productos.filter((x) => x.tipo === p.tipo && x.slug !== p.slug).slice(0, n);
