// 10 avatares graciosos (DiceBear "fun-emoji", PNG). Deterministas por seed.
const SEEDS = ['Milo', 'Coco', 'Ziggy', 'Pepper', 'Bandido', 'Nacho', 'Chispa', 'Rocco', 'Atún', 'Fito'];

export const AVATARES = SEEDS.map(
  s => `https://api.dicebear.com/9.x/fun-emoji/png?seed=${encodeURIComponent(s)}&size=200`,
);
