// Every move, by id. Each: name, desc, len, keys (poses over time), face(t), cam (a camera in the mover's frame),
// events [{ t, run(ctx) }], tick(ctx) each frame, and optionally glow/gather/trail curves, hitstop, init/start/reset.
import { YIDAO } from './yidao.js';
import { XUANFENG } from './xuanfeng.js';
import { PUNCH, CLUB, KICK } from './melee.js';
import { XIAOJIN } from './xiaojin.js';
export const MOVES = { yidao: YIDAO, xuanfeng: XUANFENG, xiaojin: XIAOJIN, punch: PUNCH, club: CLUB, kick: KICK };
