import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

/**
 * Configuración de ESLint (formato plano).
 *
 * El proyecto declaraba `"lint": "eslint ."` en package.json pero NO tenía
 * archivo de configuración: el comando fallaba siempre con "couldn't find
 * eslint.config.js". Es decir, el lint nunca llegó a ejecutarse.
 *
 * Se usa `core-web-vitals` y no el preset base porque incluye las reglas que
 * más importan en este proyecto: `@next/next/no-img-element` (que obliga a pasar
 * por next/image) y las de `next/script`.
 *
 * Formato plano por requisito de Next 16: `@next/eslint-plugin-next` ya sirve
 * flat config por defecto, alineado con ESLint v10, que retirará el formato
 * heredado.
 */
export default defineConfig([
  ...nextVitals,

  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Artefactos de trabajo, no código de la aplicación.
    '.visual-check/**',
    'supabase/**',
    'originales/**',
    // Worktrees de agentes (`git worktree add .claude/worktrees/...`) traen su
    // propio `.next` anidado, que el glob `.next/**` de arriba no cubre por
    // no estar en la raíz. Sin esto, `npm run lint` reporta decenas de
    // errores falsos sobre código compilado que no es el del repo.
    '.claude/**',
  ]),

  {
    rules: {
      // El proyecto usa `<picture>` con `getImageProps()` para art direction,
      // que es el patrón recomendado por la propia documentación de Next 16.
      // La regla no distingue ese caso legítimo del `<img>` suelto, así que se
      // baja a aviso en lugar de desactivarse: sigue señalando los `<img>` que
      // sí deberían ser `next/image`.
      '@next/next/no-img-element': 'warn',
    },
  },
]);
