// Everyone in the martial world so far, by id. Each: name, title, bio, spec (the minifig's look), moves (ids in
// js/moves), build(scene) -> the figure and its things, idle(clock) -> a resting pose and face, and optionally
// idleTick(ctx) for what its props do at rest. Kept whole so the films to come can cast them.
import { YIRUI } from './yirui.js';
import { YISHUO } from './yishuo.js';
import { HEIXIONG, DAOBA, SHOUHOU } from './bandits.js';
import { XIAOTIAN } from './xiaotian.js';
import { CHANGFENG, TIEWUSI, SITU, BAIXIAN, GUARD1, GUARD2, ABO, DASHEN, XIAOFAN } from './longmen.js';
export const CAST = { yirui: YIRUI, yishuo: YISHUO, xiaotian: XIAOTIAN, heixiong: HEIXIONG, daoba: DAOBA, shouhou: SHOUHOU,
  changfeng: CHANGFENG, tiewusi: TIEWUSI, situ: SITU, baixian: BAIXIAN, guard1: GUARD1, guard2: GUARD2, abo: ABO, dashen: DASHEN, xiaofan: XIAOFAN };
export const HEROES = ['yirui', 'yishuo', 'xiaotian']; // the ones the practice ground shows
