# 武林積木 Wulin Bricks

The people of the martial world as brick minifigures, one at a time, each with their moves. Each one stands on a
practice ground at dusk, where you can watch their moves performed in 3D.

**Live:** https://ywchen0711.github.io/wulinbricks/ · **Episode 1:** https://ywchen0711.github.io/wulinbricks/film.html

The page has three modes. **Practice** shows one character on the practice ground, trying moves on a post and a
wall. **Duel** puts the brothers face to face to spar, with buttons to try a light hit, a heavy hit or a knockdown
on either, and an auto-sparring loop. **Story** plays the films.

## 奕叡 Yi Rui · 啟程刀客 The Departing Blade

A young swordsman who left home with an old saber. He wears an indigo robe crossed over a white one, a blue
headband with flying ties, a high tail through a silver ring, a scabbard at the hip, and a broad saber with a ring
pommel.

**一刀啟程 One Cut to Set Out.** He gathers his qi: the blade lights up and the wind turns round his feet. He lifts
the saber over his head, steps in and cuts down once. The cut leaves the blade as an upright crescent of sword qi.
It runs along the ground, splits the training post and cuts a slit through the stone wall behind it, leaving a
glowing cut in the floor.

## 奕碩 Yi Shuo · 旋風少俠 The Whirlwind Kid

Yi Rui's younger brother, a minifig on short legs. He wears a vermilion jacket tied with his brother's indigo sash, a
red headband and white wraps on his trousers. He never cared for blades: his weapon is a football. At rest he keeps
it up off his foot.

**旋風球 Whirlwind Ball.** He flicks the ball up, and the wind winds round it into a little whirlwind while it spins
faster and faster. He turns right round, leg far back, and kicks it with everything. The ball goes off in a drill
of wind and tears through the post, whose bricks are carried up and away. It punches a round hole in the wall, then
flies back in a high arc, and he traps it under his foot.

**Controls:** the move button, Space or 1 performs it, and Tab or the tabs at the top switch the character. Drag to look around, use the wheel or pinch to zoom, and
double-click (or C) to get the auto camera back. S toggles slow motion, R resets the targets.

## 黑風寨 The Black Wind gang

They are the villains of episode 1. 黑熊 Black Bear is the bearded chief with a wooden club. 刀疤 Scar is the second,
with a scar across his eye and a broadsword. 瘦猴 Skinny Monkey is the quick lackey. Their moves are 重拳 Heavy
Punch and 掄棍 Club Swing.

## 第一集 奕碩遇險 Episode 1: Yi Shuo in Trouble

At dusk, outside the village, Yi Shuo is playing ball when the Black Wind come and want it. His Whirlwind Ball
knocks Skinny Monkey flat, but Scar's fist and Black Bear's club put him on the ground. As the club goes up again,
Yi Rui arrives, and his One Cut to Set Out knocks all three down; they run. The episode has subtitles in Chinese
and English (no recorded voices yet). Drag the picture to look around while it plays.

## Taking a blow

`js/react.js` decides how a figure takes a hit:

- **light:** a flinch, eyes shut, a half step back;
- **heavy:** thrown back, arms flung out, staggering, then walking back to his mark;
- **down:** thrown through the air, flat on his back and dazed, then up in one spring (鯉魚打挺) and back to his mark.

A film can hold someone down until a cue releases him.

## When things meet

`js/physics.js` handles collisions.

- **Blows meeting blows.** A crescent of sword qi, a whirlwind ball and other projectiles are things in the world.
  When two from different fighters meet, they clash in a burst of light.
  - If their power is close (each strike's power varies a little), they cancel each other out. The ball is not
    destroyed: it is knocked into the air and goes on under its own physics.
  - Otherwise the stronger breaks through, weakened by what it overcame, and strikes with less force.
- **Bodies.** Figures cannot pass through each other. Standing figures shove apart, and one thrown back by a blow
  crashes into whoever is behind him and knocks him on.
- **The loose ball.** It bounces, rolls to a stop and glances off anyone it hits; Yi Shuo goes to fetch it and
  dribbles it home.

In the duel, **⚔ 同時出招 Both at once** has the brothers strike together, and auto sparring does this every third
round.

## How it is made

| File | What it holds |
|------|---------------|
| `js/brick/minifig.js` | the minifigure: legs, hips, a printed torso, bending arms, C-hands, a printed face |
| `js/cast/*.js` | a character: its look (`spec`), its build (`build(scene)`), its rest (`idle`, `idleTick`); listed in `js/cast/index.js` |
| `js/moves/*.js` | a move: key poses and their easing, events at moments, a per-frame `tick`, the face, a camera; listed in `js/moves/index.js` |
| `js/fx.js` | the effects: the crescent of sword qi, the blade's trail, sparks, wind, rings, the cut in the floor |
| `js/targets.js` | the post and the wall, every brick its own piece so a cut can split it |
| `js/engine.js` | the world: fighters with marks, walking, turning, gestures, moves, blows, the camera |
| `js/physics.js` | blows that meet (cancel or break through), bodies that can't overlap, the loose ball |
| `js/react.js`, `js/gestures.js` | taking a blow; small actions for films (point, raise, cower, cheer...) |
| `js/films/*.js`, `js/film.js` | an episode (cast and marks, lines, cues, shots) and its player |
| `js/stage.js` | the practice ground at dusk |
| `js/sound.js` | the move's synthesised sounds |

To add a character, write one file in `js/cast/`. To add a move, write one file in `js/moves/`. Each character and
move is self-contained and driven by time, so they can be cast in the films to come: pose a character with a move at
any moment `t`, and its effects follow.
