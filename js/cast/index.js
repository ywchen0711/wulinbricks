// Everyone in the martial world so far, by id. Each: name, title, bio, spec (the minifig's look), moves (ids in
// js/moves), build(scene) -> the figure and its things, idle(clock) -> a resting pose and face, and optionally
// idleTick(ctx) for what its props do at rest. Kept whole so the films to come can cast them.
import { YIRUI } from './yirui.js';
import { YISHUO } from './yishuo.js';
import { HEIXIONG, DAOBA, SHOUHOU } from './bandits.js';
export const CAST = { yirui: YIRUI, yishuo: YISHUO, heixiong: HEIXIONG, daoba: DAOBA, shouhou: SHOUHOU };
export const HEROES = ['yirui', 'yishuo']; // the ones the practice ground shows
