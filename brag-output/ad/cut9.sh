#!/usr/bin/env bash
set -euo pipefail
# Mismas ventanas que el cuadrado, pero SIN escalar: site.mp4 ya es 486x1050,
# que es exactamente el tamano de la pantalla en el 9:16. El texto del sitio
# llega al anuncio a resolucion nativa.
cut () {
  ffmpeg -y -v error -ss "$2" -i site.mp4 -vf "fps=30" \
    -frames:v 132 -an -c:v libx264 -crf 15 -pix_fmt yuv420p "cut9_$1.mp4"
}
cut portada   3.2
cut catalogo 18.8
cut ficha    31.2
cut bolsa    40.0
