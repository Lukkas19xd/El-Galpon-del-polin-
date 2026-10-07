// Catálogo de productos que carga `npm run seed`.
//
// PROVISORIO: precios (CLP, IVA incluido) y stock son de referencia hasta
// tener el catálogo y la lista de precios definitivos. Para actualizarlos,
// editá este archivo y volvé a correr `npm run seed`: los productos se
// buscan por nombre, así que se actualizan en vez de duplicarse.
//
// Valores válidos (los usan los filtros del frontend):
//   tipo:      'impregnado' | 'estandar' | 'lena'
//   categoria: 'agricola' | 'construccion' | 'industrial' | 'lena'

const polin = ({ diametro, largo, ...resto }) => ({
  especificaciones: {
    diametro,
    largo,
    material: resto.tipo === 'impregnado' ? 'Pino radiata impregnado CCA' : 'Pino radiata sin tratar'
  },
  activo: true,
  ...resto
});

const lena = ({ especie, peso, ...resto }) => ({
  especificaciones: { especie, peso, presentacion: 'Saco' },
  activo: true,
  tipo: 'lena',
  categoria: 'lena',
  ...resto
});

export const catalogo = [
  // ---------- Agrícola ----------
  polin({
    nombre: 'Polín impregnado 2-3" x 2,44 m',
    descripcion: 'Polín delgado impregnado para conducción de huertos, tutores y cercos livianos.',
    precio: 1500,
    stock: 800,
    tipo: 'impregnado',
    categoria: 'agricola',
    diametro: '2-3"',
    largo: '2,44 m'
  }),
  polin({
    nombre: 'Polín impregnado 3-4" x 2,44 m',
    descripcion: 'El más usado en viñas, parronales y cercos de campo. Resistente a la humedad y a las plagas.',
    precio: 2300,
    stock: 600,
    tipo: 'impregnado',
    categoria: 'agricola',
    diametro: '3-4"',
    largo: '2,44 m'
  }),
  polin({
    nombre: 'Polín impregnado 4-5" x 2,44 m',
    descripcion: 'Polín intermedio para cercos ganaderos y estructuras agrícolas que requieren más firmeza.',
    precio: 3400,
    stock: 400,
    tipo: 'impregnado',
    categoria: 'agricola',
    diametro: '4-5"',
    largo: '2,44 m'
  }),
  polin({
    nombre: 'Polín impregnado 5-6" x 2,44 m',
    descripcion: 'Polín grueso para cabeceras de hilera en viñas y huertos, y esquinas de cerco.',
    precio: 5200,
    stock: 200,
    tipo: 'impregnado',
    categoria: 'agricola',
    diametro: '5-6"',
    largo: '2,44 m'
  }),

  // ---------- Construcción ----------
  polin({
    nombre: 'Polín impregnado 4-5" x 3,00 m',
    descripcion: 'Para pilotes de casetas, bodegas y cobertizos. Largo extra para mayor empotramiento.',
    precio: 4500,
    stock: 250,
    tipo: 'impregnado',
    categoria: 'construccion',
    diametro: '4-5"',
    largo: '3,00 m'
  }),
  polin({
    nombre: 'Polín impregnado 5-6" x 3,00 m',
    descripcion: 'Pilotes y pilares para terrazas, quinchos y ampliaciones.',
    precio: 6800,
    stock: 180,
    tipo: 'impregnado',
    categoria: 'construccion',
    diametro: '5-6"',
    largo: '3,00 m'
  }),
  polin({
    nombre: 'Polín impregnado 6-7" x 3,60 m',
    descripcion: 'Polín robusto para pilares estructurales y fundaciones de viviendas livianas.',
    precio: 9900,
    stock: 120,
    tipo: 'impregnado',
    categoria: 'construccion',
    diametro: '6-7"',
    largo: '3,60 m'
  }),
  polin({
    nombre: 'Polín estándar 3-4" x 2,44 m',
    descripcion: 'Polín sin impregnar para moldajes, alzaprimas y usos temporales en obra.',
    precio: 1500,
    stock: 300,
    tipo: 'estandar',
    categoria: 'construccion',
    diametro: '3-4"',
    largo: '2,44 m'
  }),
  polin({
    nombre: 'Polín estándar 4-5" x 2,44 m',
    descripcion: 'Polín sin impregnar para uso bajo techo o como apoyo provisorio en obra.',
    precio: 2200,
    stock: 250,
    tipo: 'estandar',
    categoria: 'construccion',
    diametro: '4-5"',
    largo: '2,44 m'
  }),

  // ---------- Industrial ----------
  polin({
    nombre: 'Polín impregnado 7-8" x 4,00 m',
    descripcion: 'Gran diámetro para galpones, muelles y estructuras de carga.',
    precio: 15900,
    stock: 60,
    tipo: 'impregnado',
    categoria: 'industrial',
    diametro: '7-8"',
    largo: '4,00 m'
  }),
  polin({
    nombre: 'Polín impregnado 8-9" x 5,00 m',
    descripcion: 'Máxima resistencia para postes de tendido, galpones de gran luz y obras pesadas.',
    precio: 24900,
    stock: 40,
    tipo: 'impregnado',
    categoria: 'industrial',
    diametro: '8-9"',
    largo: '5,00 m'
  }),

  // ---------- Leña en saco ----------
  lena({
    nombre: 'Leña de eucalipto seca (saco)',
    descripcion: 'Leña de eucalipto picada y seca, de alto poder calorífico y combustión duradera. Ideal para estufa y salamandra.',
    precio: 4500,
    stock: 300,
    especie: 'Eucalipto',
    peso: '~20 kg'
  }),
  lena({
    nombre: 'Leña de pino seca (saco)',
    descripcion: 'Leña de pino picada y seca. Enciende rápido; ideal para cocinas a leña, asados y para partir el fuego.',
    precio: 3500,
    stock: 300,
    especie: 'Pino',
    peso: '~20 kg'
  }),
  lena({
    nombre: 'Leña nativa seca (saco)',
    descripcion: 'Leña nativa (roble/hualle) picada y seca. Brasa firme y larga duración para las noches más frías.',
    precio: 5500,
    stock: 200,
    especie: 'Nativa (roble/hualle)',
    peso: '~20 kg'
  }),
  lena({
    nombre: 'Astillas para encender (saco)',
    descripcion: 'Astillas secas de pino para encender estufas, chimeneas y parrillas sin complicaciones.',
    precio: 2500,
    stock: 200,
    especie: 'Pino',
    peso: '~10 kg'
  })
];
