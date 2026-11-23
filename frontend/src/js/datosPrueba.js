// ============ DATOS DE PRUEBA (SOLO DESARROLLO) ============
// Selector "Datos reales / Peor caso / Vacío / Uno" para revisar cómo aguanta
// la página datos extremos pero posibles. Solo se activa en localhost; en el
// sitio publicado este archivo no hace nada.
//
// Uso: http://localhost:8000/?datos=peor#/productos (también vacio o uno).
// Reemplaza las respuestas GET de la API (catálogo, carrito, reservas, admin)
// por los datos de abajo. Las acciones que modifican algo quedan bloqueadas
// mientras se ven datos de prueba, para no tocar la base.

(() => {
  const enDesarrollo = ['localhost', '127.0.0.1'].includes(location.hostname);
  if (!enDesarrollo) return;

  const modo = new URLSearchParams(location.search).get('datos') || 'real';
  const MODOS = { real: 'Datos reales', peor: 'Peor caso', vacio: 'Vacío', uno: 'Uno' };

  // ---------- Productos: los límites vienen de backend/src/middlewares/validacion.js ----------
  const productos = [
    {
      _id: 'p-largo',
      // 150 caracteres: el máximo que acepta la validación
      nombre: 'Polín impregnado CCA 5-6" x 2,44 m, pack de 100 unidades para cabeceras de hilera en viñas, parronales y cercos ganaderos con despacho',
      descripcion: 'Polín grueso impregnado con CCA según norma NCh819, ideal para cabeceras de hilera en viñas y huertos, esquinas de cercos ganaderos y estructuras agrícolas expuestas a humedad. Cada pack incluye 100 unidades seleccionadas, rectas y sin grietas pasantes. Se recomienda enterrar al menos 60 cm y apisonar bien la tierra. Consulta por descuentos sobre 5 packs.',
      precio: 1250000, stock: 1, tipo: 'impregnado', categoria: 'agricola', activo: true
    },
    {
      _id: 'p-corto',
      nombre: 'Tutor',
      descripcion: '',
      precio: 0, stock: 12000, tipo: 'estandar', categoria: 'construccion', activo: true,
      // Foto que ya no existe (URL https válida para la validación)
      imagen: 'https://ejemplo.invalid/fotos/tutor.jpg'
    },
    {
      _id: 'p-codigo',
      // Código de producto sin espacios: no tiene dónde cortarse
      nombre: 'POLIN-IMPREGNADO-CCA-NCH819-5X6-244M-USO-AGRICOLA-REF-0042',
      descripcion: 'Referencia de proveedor.',
      precio: 9999999999.99, stock: 0, tipo: 'impregnado', categoria: 'industrial', activo: false
    },
    {
      _id: 'p-lena',
      nombre: 'Leña de eucalipto seca (saco 18 kg)',
      descripcion: 'Leña picada y seca, lista para la estufa.',
      precio: 4500, stock: 1, tipo: 'lena', categoria: 'lena', activo: true,
      imagen: 'src/img/fondo-pinos.jpg'
    },
    {
      _id: 'p-normal',
      nombre: 'Polín impregnado 3-4" x 2,44 m',
      descripcion: 'El más usado en viñas, parronales y cercos de campo.',
      precio: 2300, stock: 199, tipo: 'impregnado', categoria: 'agricola', activo: true
    }
  ];
  const porId = Object.fromEntries(productos.map((p) => [p._id, p]));

  // ---------- Personas ----------
  const clienteLargo = {
    _id: 'u-largo',
    // 100 caracteres: el máximo del nombre
    nombre: 'María de los Ángeles Wiśniewska-Kowalczyk Hernández-Valenzuela de la Fuente y Ruiz-Tagle Errázuriz',
    email: 'bartholomew.fitzgerald@northwind-industries-holdings.example.com',
    telefono: '+56 (9) 8765-4321 22',
    rol: 'cliente', activo: true
  };
  const clienteCorto = { _id: 'u-corto', nombre: 'Jo', email: 'jo@x.cl', telefono: null, rol: 'cliente', activo: false };
  const admin = { _id: 'u-admin', nombre: 'Lucas', email: 'admin@example.com', telefono: '+56912345678', rol: 'administrador', activo: true };

  const hoy = new Date();
  const diasDesdeHoy = (n) => { const f = new Date(hoy); f.setDate(f.getDate() + n); f.setHours(12, 0, 0, 0); return f.toISOString(); };
  const item = (id, cantidad) => ({ producto: porId[id], cantidad, precioUnitario: porId[id].precio, subtotal: cantidad * porId[id].precio });

  const pedidos = [
    {
      _id: 'r-1', numeroOrden: 'RES-HRMFBU', usuario: clienteLargo, estado: 'listo',
      total: 22499999999.99, fechaRetiro: diasDesdeHoy(-3), createdAt: diasDesdeHoy(-10),
      // 500 caracteres: el máximo de la nota, con un enlace largo sin espacios
      nota: 'Voy con camión 3/4 y acoplado, necesito que me ayuden a cargar porque voy solo. Si no estoy a la hora, mi cuñado Bartolomé pasa a retirar con mi carnet. La entrada al campo es por el camino interior, aquí está la ubicación exacta: https://www.google.com/maps/place/-36.826990,-73.049770/@-36.8269900,-73.0497700,17z/data=!3m1!4b1!4m5!3m4!1s0x0:0x0!8m2!3d-36.82699!4d-73.04977 Por favor llamar antes al teléfono fijo porque el celular no tiene buena señal en la parcela. Gracias.',
      items: [item('p-largo', 10000), item('p-codigo', 1), item('p-lena', 3), item('p-normal', 40), item('p-corto', 999)]
    },
    {
      _id: 'r-2', numeroOrden: 'RES-23456Z', usuario: clienteCorto, estado: 'pendiente',
      total: 4500, fechaRetiro: diasDesdeHoy(0), createdAt: diasDesdeHoy(0), nota: null,
      items: [item('p-lena', 1)]
    },
    {
      _id: 'r-3', numeroOrden: 'RES-ABCDEF', usuario: clienteLargo, estado: 'confirmado',
      total: 0, fechaRetiro: diasDesdeHoy(1), createdAt: diasDesdeHoy(-1), nota: '',
      items: [item('p-corto', 1)]
    },
    {
      _id: 'r-4', numeroOrden: 'RES-QWERTY', usuario: clienteLargo, estado: 'retirado',
      total: 2300, fechaRetiro: null, createdAt: diasDesdeHoy(-40), nota: null,
      items: [item('p-normal', 1)]
    }
  ];

  const carrito = {
    items: [
      { producto: porId['p-largo'], cantidad: 10000, precio: porId['p-largo'].precio },
      { producto: porId['p-codigo'], cantidad: 1, precio: porId['p-codigo'].precio },
      { producto: porId['p-lena'], cantidad: 1, precio: porId['p-lena'].precio }
    ]
  };
  carrito.total = carrito.items.reduce((s, i) => s + i.cantidad * i.precio, 0);

  const conjuntos = {
    peor: { productos, pedidos, carrito, usuarios: [clienteLargo, clienteCorto, admin] },
    vacio: { productos: [], pedidos: [], carrito: { items: [], total: 0 }, usuarios: [admin] },
    uno: {
      productos: [productos[4]],
      pedidos: [pedidos[1]],
      carrito: { items: [{ producto: porId['p-lena'], cantidad: 1, precio: 4500 }], total: 4500 },
      usuarios: [admin]
    }
  };

  // ---------- Reemplazo de la API ----------
  const datos = conjuntos[modo];
  if (datos) {
    const apiReal = api;
    const responder = (ruta) => {
      const [camino] = ruta.split('?');
      const visibles = datos.productos.filter((p) => p.activo);
      if (camino === '/productos') return { productos: visibles, total: visibles.length };
      if (camino === '/productos/admin/todos') return { productos: datos.productos };
      if (camino === '/carrito') return { carrito: datos.carrito };
      if (camino === '/pedidos/mis-pedidos') return { pedidos: datos.pedidos, total: datos.pedidos.length };
      if (camino === '/pedidos/retiros') {
        const activos = datos.pedidos.filter((p) => ['pendiente', 'confirmado', 'listo'].includes(p.estado) && p.fechaRetiro);
        return { pedidos: activos, total: activos.length };
      }
      if (camino === '/pedidos') return { pedidos: datos.pedidos, total: datos.pedidos.length };
      if (camino === '/auth/usuarios') return { usuarios: datos.usuarios };
      const pedido = datos.pedidos.find((p) => camino === `/pedidos/${p._id}`);
      if (pedido) return { pedido };
      return null;
    };

    api = async (ruta, opciones = {}) => {
      const metodo = (opciones.method || 'GET').toUpperCase();
      if (metodo !== 'GET') {
        throw new Error('Estás viendo datos de prueba: vuelve a "Datos reales" para hacer cambios.');
      }
      const respuesta = responder(ruta);
      return respuesta ? { success: true, ...respuesta } : apiReal(ruta, opciones);
    };
  }

  // ---------- Selector fijo abajo al centro ----------
  document.addEventListener('DOMContentLoaded', () => {
    const barra = document.createElement('div');
    barra.setAttribute('aria-label', 'Datos de prueba (solo desarrollo)');
    barra.style.cssText = 'position:fixed;left:50%;bottom:calc(12px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:9999;display:flex;gap:2px;padding:3px;border-radius:999px;background:#e5e5e5;font:12px system-ui,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.35)';
    Object.entries(MODOS).forEach(([clave, nombre]) => {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.textContent = nombre;
      const activo = clave === modo;
      boton.style.cssText = `white-space:nowrap;border:0;border-radius:999px;padding:5px 12px;cursor:pointer;color:#111;background:${activo ? '#fff' : 'transparent'};font-weight:${activo ? 600 : 400}`;
      boton.onclick = () => {
        const url = new URL(location.href);
        if (clave === 'real') url.searchParams.delete('datos'); else url.searchParams.set('datos', clave);
        location.href = url.toString();
      };
      barra.appendChild(boton);
    });
    document.body.appendChild(barra);
  });
})();
