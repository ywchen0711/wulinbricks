// Writes an episode's lines out for recording: node tools/lines.mjs ep1 > tools/lines.json
// Each line: its index, who says it (the actor's name in the episode and the cast id), the Chinese text, a feeling.
import { pathToFileURL } from 'url';
const id = process.argv[2] || 'ep1';
const mod = await import(pathToFileURL(`js/films/${id}.js`).href);
const EP = Object.values(mod).find((v) => v && v.id === id);
const lines = EP.lines.map(([t, who, zh, en, feel], i) => ({ i, t, who, cast: EP.cast[who][0], text: EP.say?.[i] || zh, feel: feel || '' }));
process.stdout.write(JSON.stringify({ ep: id, pace: EP.pace || 0, lines }, null, 1));
