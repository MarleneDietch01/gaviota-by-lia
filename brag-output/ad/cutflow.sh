#!/usr/bin/env bash
set -euo pipefail

# Tramos leidos sobre la rejilla de fotogramas de flow.mp4 (25 fps), no sobre
# las marcas del guion: las marcas se tomaban DESPUES de `waitForURL` y de los
# `settle`, asi que iban hasta 2 s por detras de lo que se ve en pantalla.
#
# 4,4 s cada uno = 4,0 s visibles + 0,4 s que se come el fundido cruzado.
# B1..B4 son continuos. B5 es el unico que hay que empalmar: entre pulsar
# «Ir a pagar» y que Stripe pinte pasan ~2 s de carga que en un anuncio son
# aire muerto, asi que se cortan.
cut () { # nombre  inicio  (4,4 s continuos)
  ffmpeg -y -v error -ss "$2" -i flow.mp4 -vf "fps=30" \
    -frames:v 132 -an -c:v libx264 -crf 15 -pix_fmt yuv420p "flow_$1.mp4"
}
cut b1_portada  8.0    # portada -> cursor pulsa «Descubrir la coleccion» -> tienda
cut b2_ficha   17.0    # tienda  -> cursor pulsa el Aceite -> ficha
cut b3_bolsa   21.6    # ficha   -> pulsa «Anadir a la bolsa» -> «Anadido» + contador
cut b4_resumen 26.6    # pulsa el icono de bolsa -> la bolsa con subtotal, envio y total

# B5: empalme. A = pulsar «Ir a pagar»; B = la pantalla de Stripe ya pintada.
ffmpeg -y -v error -ss 34.9 -i flow.mp4 -vf "fps=30" -frames:v 57 -an -c:v libx264 -crf 15 -pix_fmt yuv420p /tmp/b5a.mp4
ffmpeg -y -v error -ss 38.4 -i flow.mp4 -vf "fps=30" -frames:v 87 -an -c:v libx264 -crf 15 -pix_fmt yuv420p /tmp/b5b.mp4
ffmpeg -y -v error -i /tmp/b5a.mp4 -i /tmp/b5b.mp4 \
  -filter_complex "[0:v][1:v]xfade=transition=fade:duration=0.4:offset=1.5[v]" \
  -map "[v]" -frames:v 132 -an -c:v libx264 -crf 15 -pix_fmt yuv420p flow_b5_pago.mp4

for f in flow_b*.mp4; do printf '%-22s ' "$f"; ffprobe -v error -select_streams v:0 -show_entries stream=width,height,nb_frames,duration -of csv=p=0 "$f"; done
