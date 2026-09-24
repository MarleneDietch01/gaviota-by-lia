#!/usr/bin/env bash
set -euo pipefail
# A: la bolsa, el cursor pulsa «Ir a pagar», el boton pasa a «Iniciando el pago».
# B: Stripe YA asentado. Antes de 42,0 s el maquetado sigue moviendose —las
#    carteras (Apple Pay / Link / Amazon Pay) entran tarde y desplazan el
#    formulario—, asi que empezar antes se veria como un salto.
# Entre A y B hay ~5,5 s de carga real que en un anuncio son aire muerto.
ffmpeg -y -v error -ss 34.9 -i flow.mp4 -vf "fps=30" -frames:v 48 -an -c:v libx264 -crf 15 -pix_fmt yuv420p /tmp/b5a.mp4
ffmpeg -y -v error -ss 42.0 -i flow.mp4 -vf "fps=30" -frames:v 96 -an -c:v libx264 -crf 15 -pix_fmt yuv420p /tmp/b5b.mp4
ffmpeg -y -v error -i /tmp/b5a.mp4 -i /tmp/b5b.mp4 \
  -filter_complex "[0:v][1:v]xfade=transition=fade:duration=0.4:offset=1.2[v]" \
  -map "[v]" -frames:v 132 -an -c:v libx264 -crf 15 -pix_fmt yuv420p flow_b5_pago.mp4
ffprobe -v error -select_streams v:0 -show_entries stream=nb_frames,duration -of csv=p=0 flow_b5_pago.mp4
