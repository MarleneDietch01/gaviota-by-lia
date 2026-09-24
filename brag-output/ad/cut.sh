#!/usr/bin/env bash
set -euo pipefail

# Ventanas elegidas sobre el perfil de movimiento real de site.mp4 (25 fps) Y
# sobre lo que se ve en cada una: un tramo que se mueve mucho pero enseña el
# pie de pagina no sirve de nada.
#
#   portada   3,2  hero + «Tu piel. Tu ritual. Tu momento.» quieto 1,3 s,
#                  luego el glide 4,5→7,0 baja a la coleccion con precios.
#   catalogo 18,8  0,2 s de entrada y el glide 19,0→21,5 sobre las fichas.
#   ficha    31,2  precio y MODO DE USO arriba; el glide 31,5→33,5 llega a
#                  ingredientes sin perder el encabezado.
#   bolsa    40,0  la bolsa ya trae subtotal, envio y total en pantalla; el
#                  glide 42,0→44,0 sube el Resumen a tamano legible y se corta
#                  ANTES de 44,2, que es cuando entra el pie de pagina.
#
# 4,4 s por tramo: 4,0 s visibles + 0,4 s que se come el fundido cruzado.
cut () {
  ffmpeg -y -v error -ss "$2" -i site.mp4 \
    -vf "fps=30,scale=324:700:flags=lanczos" \
    -frames:v 132 -an -c:v libx264 -crf 16 -pix_fmt yuv420p "cut_$1.mp4"
}
cut portada   3.2
cut catalogo 18.8
cut ficha    31.2
cut bolsa    40.0

for f in cut_*.mp4; do printf '%s  ' "$f"; ffprobe -v error -select_streams v:0 -show_entries stream=nb_frames,duration -of csv=p=0 "$f"; done
