# Paleta de interfaz

Revisión del 9 de septiembre de 2026 en `feat/caramel-gold-palette`.
Esta distribución sustituye las propuestas de color de `DESIGN_DIRECTION.md`.

El envase inspira el rosa y el oro. La dirección vigente usa champagne y
espresso: una sombra del metal, aplicada como color plano, no reproduce su
brillo, por eso el collar se expresa con una superficie champán y un reflejo
dorado en interacción.

| Uso                                         | Token      | Color     |
| ------------------------------------------- | ---------- | --------- |
| Fondo principal                             | ivory      | `#f7f0ec` |
| Superficie clara                            | white-warm | `#fffaf8` |
| Rosa suave                                  | blush      | `#f3e4ee` |
| Franja de confianza y kits                  | powder     | `#e6c6de` |
| Titulares                                   | ink        | `#3d2b26` |
| Cursiva del hero (lámina dorada)            | gold-deep  | `#6a5304` |
| Pie                                         | ivory      | `#f7f0ec` |
| Botones principales                         | champagne  | `#c9a44a` |
| Texto de botones principales                | ink        | `#3d2b26` |
| Hover y pulsación de botones principales    | gold       | `#ebdaaa` |
| Fondos editoriales oscuros                  | espresso   | `#3d2b26` |
| Profundidad de fondos oscuros               | espresso-deep | `#2b1d19` |
| Barra de anuncio y filetes                  | champagne  | `#c9a44a` |
| Detalles sobre oscuro                       | gold       | `#ebdaaa` |
| Antetítulos y detalles pequeños sobre claro | gold-deep  | `#6a5304` |
| Acentos sobre rosa y foco sobre claro       | gold-ink   | `#4a3903` |

La cursiva del hero no es un color plano: es un degradado de `gold-ink` a
`gold-deep` recortado sobre el texto (`background-clip: text`), con un barrido
que solo corre bajo `prefers-reduced-motion: no-preference`. `color` queda en
`gold-deep` como reserva para navegadores sin `background-clip: text`. Medido
sobre la crema del hero: 9.92:1 en el extremo oscuro y 6.53:1 en el claro.

El pie usa crema, con el panel del logo en blanco cálido y sombras discretas.
Sus enlaces y textos corridos usan `body`; los encabezados y estados hover
usan `gold-deep`, legible sobre crema. Los botones propios de formularios, catálogo y
administración siguen la misma combinación que el componente `Button`.
Los colores semánticos de éxito y error conservan su función.

El degradado rosa va de `blush` a `powder`, con una iluminación clara.
Se eliminó el extremo adicional `#dcb4d0`, que reducía a 4.03:1 el contraste
con `gold-deep`. Sobre `powder`, usar `body` para texto secundario y
`gold-ink` para acentos; evitar `muted`.

Contrastes calculados para los colores sólidos:

| Texto / fondo          | Ratio   |
| ---------------------- | ------- |
| ink / champagne        | 5.66:1  |
| ink / gold             | 9.63:1  |
| white-warm / espresso  | 12.90:1 |
| gold / espresso        | 9.63:1  |
| gold-deep / powder     | 4.73:1  |
| gold-ink / powder      | 7.19:1  |
| body / powder          | 5.33:1  |
| muted / ivory          | 4.54:1  |

Estos pares no equivalen a una auditoría de accesibilidad completa. Las
superposiciones, estados y superficies con imágenes se revisan en contexto.
Todo el pie usa el foco oscuro habitual de las superficies claras.

Los bloques editoriales y los correos usan espresso. La ciruela violeta se
eliminó de la implementación.
