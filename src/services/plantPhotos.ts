export const botanicalAtlas = "/images/botanical-atlas.webp";
export const botanicalPhotos = [
  {
    id: "monstera",
    name: "龟背竹",
    latin: "Monstera deliciosa",
    category: "观赏性" as const,
    column: 0,
    row: 0,
    note: "把新叶的舒展，留给日常",
  },
  {
    id: "pothos",
    name: "绿萝",
    latin: "Epipremnum aureum",
    category: "观赏性" as const,
    column: 1,
    row: 0,
    note: "让绿意沿着窗边慢慢生长",
  },
  {
    id: "fiddle-leaf-fig",
    name: "琴叶榕",
    latin: "Ficus lyrata",
    category: "观赏性" as const,
    column: 2,
    row: 0,
    note: "一片宽大的叶，一角安静的家",
  },
  {
    id: "snake-plant",
    name: "虎尾兰",
    latin: "Dracaena trifasciata",
    category: "观赏性" as const,
    column: 3,
    row: 0,
    note: "挺拔的叶片，自有从容节奏",
  },
  {
    id: "bougainvillea",
    name: "三角梅",
    latin: "Bougainvillea",
    category: "观赏性" as const,
    column: 0,
    row: 1,
    note: "把阳光，养成一簇花开",
  },
  {
    id: "mint",
    name: "薄荷",
    latin: "Mentha",
    category: "实用性" as const,
    column: 1,
    row: 1,
    note: "指尖轻触，就是一阵清新",
  },
  {
    id: "rosemary",
    name: "迷迭香",
    latin: "Salvia rosmarinus",
    category: "实用性" as const,
    column: 2,
    row: 1,
    note: "在阳台，种一点香草气息",
  },
  {
    id: "tomato",
    name: "小番茄",
    latin: "Solanum lycopersicum",
    category: "实用性" as const,
    column: 3,
    row: 1,
    note: "从一朵小花，到一颗小小丰收",
  },
];
export const photoForSpecies = (id: string) =>
  botanicalPhotos.some((p) => p.id === id)
    ? `${botanicalAtlas}#${id}`
    : undefined;
export function resolvePlantPhoto(src: string, speciesId?: string) {
  if (speciesId && /^\/images\/(hero|monstera)\.(jpg|webp)$/.test(src))
    return photoForSpecies(speciesId) || src;
  if (/^\/images\/monstera\.(jpg|webp)$/.test(src))
    return photoForSpecies("monstera")!;
  return src;
}
