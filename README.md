# 武林積木 Wulin Bricks

The people of the martial world as brick minifigures, one at a time, each with their moves. Each one stands on a
practice ground at dusk, where you can watch their moves performed in 3D.

**Live:** https://ywchen0711.github.io/wulinbricks/

## 奕叡 Yi Rui · 啟程刀客 The Departing Blade

A young swordsman who left home with an old saber. He wears an indigo robe crossed over a white one, a blue
headband with flying ties, a high tail through a silver ring, a scabbard at the hip, and a broad saber with a ring
pommel.

**一刀啟程 One Cut to Set Out.** He gathers his qi: the blade lights up and the wind turns round his feet. He lifts
the saber over his head, steps in and cuts down once. The cut leaves the blade as an upright crescent of sword qi.
It runs along the ground, splits the training post and cuts a slit through the stone wall behind it, leaving a
glowing cut in the floor.

**Controls:** the move button, Space or 1 performs it. Drag to look around, use the wheel or pinch to zoom, and
double-click (or C) to get the auto camera back. S toggles slow motion, R resets the targets.

## How it is made

| File | What it holds |
|------|---------------|
| `js/brick/minifig.js` | the minifigure: legs, hips, a printed torso, bending arms, C-hands, a printed face |
| `js/cast/yirui.js` | a character: its look (`spec`) and what it wears and holds (`buildYiRui`) |
| `js/moves/yidao.js` | a move: key poses and their easing, the qi's glow, the moments things happen, the face, a camera |
| `js/fx.js` | the effects: the crescent of sword qi, the blade's trail, sparks, wind, rings, the cut in the floor |
| `js/targets.js` | the post and the wall, every brick its own piece so a cut can split it |
| `js/stage.js` | the practice ground at dusk |
| `js/sound.js` | the move's synthesised sounds |

To add a character, write one file in `js/cast/`. To add a move, write one file in `js/moves/`.
