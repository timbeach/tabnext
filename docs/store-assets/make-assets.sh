#!/bin/sh
# Regenerate the Web Store promo images from the source penguin art.
# Usage: ./make-assets.sh [path-to-penguin.png]
set -e
cd "$(dirname "$0")"
PENGUIN="${1:-$HOME/Pictures/for-websites/aegix-penguin_1.png}"

BG='#2e3440'; TAB='#3b4252'; ACTIVE='#4c566a'; NEW='#88c0d0'
TEXT='#eceff4'; DIM='#7b88a1'; FONT='DejaVu-Sans'; BOLD='DejaVu-Sans-Bold'

magick "$PENGUIN" -trim +repage -resize 260x260 -background none \
  -gravity center -extent 260x260 penguin-tmp.png

# ---- screenshot 1280x800: mock tab strip + pitch ----
magick -size 1280x800 "xc:$BG" \
  -fill '#242933' -draw 'rectangle 0,80 1280,190' \
  -fill "$TAB"    -draw 'roundrectangle  60,110 240,180 10,10' \
  -fill "$ACTIVE" -draw 'roundrectangle 250,110 430,180 10,10' \
  -fill "$NEW"    -draw 'roundrectangle 440,110 620,180 10,10' \
  -fill "$TAB"    -draw 'roundrectangle 630,110 810,180 10,10' \
  -fill "$TAB"    -draw 'roundrectangle 820,110 1000,180 10,10' \
  -fill none -stroke "$DIM" -strokewidth 2 -draw 'stroke-dasharray 8 6 roundrectangle 1030,110 1210,180 10,10' \
  -stroke none \
  -font "$FONT" -pointsize 26 -fill "$TEXT" \
  -annotate +290+155 'you are here' \
  -fill '#2e3440' -font "$BOLD" -annotate +475+155 'new tab' \
  -fill "$DIM" -font "$FONT" -pointsize 24 -annotate +1062+152 'not here' \
  -fill "$NEW" -font "$BOLD" -pointsize 30 -annotate +440+250 '^' \
  -fill "$TEXT" -font "$BOLD" -pointsize 30 -annotate +330+260 'new tabs open right of the current tab' \
  -font "$BOLD" -pointsize 96 -fill "$TEXT" -annotate +500+480 'tabnext' \
  -font "$FONT" -pointsize 30 -fill "$DIM" \
  -annotate +500+545 'live tab-count badge on the icon' \
  -annotate +500+598 'tab-group and session-restore safe' \
  -annotate +500+651 'zero permissions - reads nothing, stores nothing' \
  screenshot-1280x800.png
magick screenshot-1280x800.png \( penguin-tmp.png \) -geometry +180+380 -composite \
  -fill "$ACTIVE" -draw 'roundrectangle 360,570 440,620 12,12' \
  -font "$BOLD" -pointsize 34 -fill "$TEXT" -annotate +374+606 '42' \
  screenshot-1280x800.png

# ---- small promo tile 440x280 ----
magick -size 440x280 "xc:$BG" \
  \( penguin-tmp.png -resize 170x170 \) -geometry +30+55 -composite \
  -fill "$ACTIVE" -draw 'roundrectangle 150,180 205,216 10,10' \
  -font "$BOLD" -pointsize 26 -fill "$TEXT" -annotate +160+207 '42' \
  -font "$BOLD" -pointsize 44 -fill "$TEXT" -annotate +218+126 'tabnext' \
  -font "$FONT" -pointsize 19 -fill "$DIM" -annotate +218+166 'new tabs, next to you' \
  screenshot-tile-preview.png
mv screenshot-tile-preview.png tile-440x280.png

rm -f penguin-tmp.png
echo "wrote screenshot-1280x800.png tile-440x280.png"
