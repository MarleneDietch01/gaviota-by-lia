#!/usr/bin/env bash
set -euo pipefail

# Cinco tramos de 4,4 s encadenados con fundidos de 0,4 s = una sola pista
# continua de 20,4 s. Ninguna ventana por tramo, asi que no puede reaparecer
# el hueco de un fotograma.
#
# El cierre arranca en 20,0 s: la pista se desvanece en el mismo tramo que
# `#stage` (20,0→20,6) para no quedarse encima del logotipo, y el parche
# marfil va debajo para que al bajar la opacidad no asome el fondo espresso.

FMT="$1"   # 1x1 | 9x16
case "$FMT" in
  1x1)  BASE=base-flow-1x1.mp4;  MASK=mask.png;        W=324; H=700;  X=378; Y=226; OUT=ad-flow-1x1.mp4 ;;
  9x16) BASE=base-flow-9x16.mp4; MASK=mask-9x16.png;   W=486; H=1050; X=297; Y=518; OUT=ad-flow-9x16.mp4 ;;
  *) echo "formato?"; exit 1 ;;
esac

ffmpeg -y -v error \
  -i "$BASE" \
  -i flow_b1_portada.mp4 -i flow_b2_ficha.mp4 -i flow_b3_bolsa.mp4 \
  -i flow_b4_resumen.mp4 -i flow_b5_pago.mp4 \
  -i "$MASK" \
  -filter_complex "\
[1:v]scale=$W:$H:flags=lanczos[c1];[2:v]scale=$W:$H:flags=lanczos[c2];\
[3:v]scale=$W:$H:flags=lanczos[c3];[4:v]scale=$W:$H:flags=lanczos[c4];\
[5:v]scale=$W:$H:flags=lanczos[c5];\
[c1][c2]xfade=transition=fade:duration=0.4:offset=4.0[x1];\
[x1][c3]xfade=transition=fade:duration=0.4:offset=8.0[x2];\
[x2][c4]xfade=transition=fade:duration=0.4:offset=12.0[x3];\
[x3][c5]xfade=transition=fade:duration=0.4:offset=16.0,tpad=stop_mode=clone:stop_duration=1.2[scr];\
[6:v]format=gray,split=2[m1][m2];\
[scr]format=rgba[s];[s][m1]alphamerge,fade=out:st=20:d=0.6:alpha=1[af];\
color=0xf7f0ec:s=${W}x${H}:r=30:d=25,format=rgba[pc];[pc][m2]alphamerge[p];\
[0:v][p]overlay=$X:$Y:enable='between(t,20,20.62)'[b1];\
[b1][af]overlay=$X:$Y:enable='between(t,0,20.62)':eof_action=pass[v]" \
  -map "[v]" -map 0:a \
  -c:v libx264 -crf 17 -preset slow -pix_fmt yuv420p -r 30 \
  -c:a copy -movflags +faststart \
  "$OUT"

printf '%-20s ' "$OUT"; ffprobe -v error -select_streams v:0 -show_entries stream=width,height,nb_frames,duration -of csv=p=0 "$OUT"
