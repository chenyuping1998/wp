#!/bin/zsh
# 用法：rig.sh <dj|host>　拆層/<who>/layers ＋ spine/<who>.joints.layout.json ＋ spine/<who>.motion.params.json → spine/<who>_L
D=${0:A:h}; who=$1
cd ~/tools/spine-generator-ss && node bin/spine-motion.js character $D/$who/layers -o $D/spine/${who}_L --name $who --joints $D/spine/$who.joints.layout.json --params $D/spine/$who.motion.params.json --frames 2>&1 | tail -4
