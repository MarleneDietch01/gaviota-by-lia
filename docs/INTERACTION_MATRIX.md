# Matriz de interacciones visibles

| Elemento | Ubicación | Acción esperada | Implementación actual | Funciona | Test | Pendiente |
|---|---|---|---|---:|---:|---|
| Tienda, Rituales, Kits, Nuestra historia | Header | Navegar | Links localizados a rutas existentes | ✅ | estático 🟡 | E2E |
| ES / EN | Header/drawer | Cambiar idioma conservando ruta | Sustituye solo el segmento locale | ✅ | typecheck | Traducir nuevo contenido administrable |
| Buscar | Header | Abrir búsqueda | `/search`, búsqueda server-side | ✅ | unit catálogo | sugerencias/debounce |
| Cuenta | Header/footer | Área personal | Entrada informativa segura | 🟡 | ruta | Auth UI |
| Favoritos | Header/tarjetas | Guardar, listar y quitar | localStorage guest + `/wishlist` | ✅ guest | manual | merge Supabase/E2E |
| Bolsa | Header/tarjetas | Añadir, editar y quitar | localStorage sin precio persistido + `/cart` | ✅ dev | unit pendiente | servidor, stock, checkout |
| Footer Tienda/Marca/Ayuda/Legal | Footer | Navegar | todas las rutas destino existen | ✅ | estático 🟡 | E2E |
| Instagram | Footer/contacto | Abrir perfil oficial | link externo seguro | ✅ | estático | — |
| Conocer nuestra historia | Home | Navegar | `/our-story` | ✅ | estático 🟡 | E2E |
| Novedades | Home | Abrir canal oficial | enlace seguro a Instagram; formulario oculto hasta tener backend | ✅ | estático | Newsletter: Route Handler, Zod, rate limit, persistencia |
| Filtros/sort/búsqueda catálogo | Shop | Actualizar URL compartible | GET/query params | ✅ parcial | 4 unit | más taxonomías reales |
| Producto | Cards | Abrir PDP | ruta por slug, 404 si no existe | ✅ | typecheck | PDP completo |
| Saltar al contenido / Ver colección | Layout/Home | Ancla interna | targets reales `#content`/`#collection` | ✅ | accesibilidad manual | E2E |

No se encontraron atributos `href="#"`. Las anclas con fragmento existentes tienen un destino real en la misma página.
