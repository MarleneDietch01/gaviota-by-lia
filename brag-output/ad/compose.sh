#!/usr/bin/env bash
set -euo pipefail

# La pantalla es UNA pista continua de 16,4 s, no cuatro superposiciones con
# ventana propia. Los huecos de un fotograma salian de que dos clips median
# 119 frames dentro de una ventana de 120; encadenando con xfade ese fallo no
# puede reaparecer.
#
# EL CIERRE. El metraje se compone ENCIMA de base.mp4, y base.mp4 ya lleva el
# cierre dentro. Si el metraje sigue visible cuando entra el logotipo, le cae
# encima y lo parte en rodajas — que es justo lo que pasaba hasta 17,2 s.
# Ahora el metraje se desvanece a la vez que el telefono (16,0→16,6, el mismo
# tramo que `#stage`), asi que a las 16,6 s no queda nada delante del cierre.
#
# El parche marfil va DEBAJO del metraje durante ese desvanecido. Sin el, al
# bajar la opacidad del metraje asomaria el fondo espresso de la pantalla de
# base.mp4 y el telefono se apagaria en negro en vez de fundirse a marfil.
# Con el parche, el resultado dentro de la pantalla es exactamente
# alfa*metraje + (1-alfa)*marfil, que es el mismo fundido que hace el bisel.
ffmpeg -y -v error \
  -i base.mp4 \
  -i cut_portada.mp4 -i cut_catalogo.mp4 -i cut_ficha.mp4 -i cut_bolsa.mp4 \
  -i mask.png \
  -filter_complex "\
[1:v][2:v]xfade=transition=fade:duration=0.4:offset=4.0[x1];\
[x1][3:v]xfade=transition=fade:duration=0.4:offset=8.0[x2];\
[x2][4:v]xfade=transition=fade:duration=0.4:offset=12.0,tpad=stop_mode=clone:stop_duration=1.2[scr];\
[5:v]format=gray,split=2[m1][m2];\
[scr]format=rgba[s];[s][m1]alphamerge,fade=out:st=16:d=0.6:alpha=1[af];\
color=0xf7f0ec:s=324x700:r=30:d=21,format=rgba[pc];[pc][m2]alphamerge[p];\
[0:v][p]overlay=378:226:enable='between(t,16,16.62)'[b1];\
[b1][af]overlay=378:226:enable='between(t,0,16.62)':eof_action=pass[v]" \
  -map "[v]" -map 0:a \
  -c:v libx264 -crf 17 -preset slow -pix_fmt yuv420p -r 30 \
  -c:a copy -movflags +faststart \
  ad2.mp4

ffprobe -v error -select_streams v:0 -show_entries stream=nb_frames,duration -of csv=p=0 ad2.mp4
