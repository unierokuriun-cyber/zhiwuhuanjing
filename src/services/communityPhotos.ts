/** One distinct generated scene per demo post, independently from its channel cover. */
export const communityPhotoChannels = [
  "bougainvillea",
  "rose",
  "monstera",
  "pothos",
  "succulents",
  "orchid",
  "foliage",
  "tomato",
  "strawberry",
  "mint",
  "pepper",
  "basil",
  "herbs",
] as const;
export const communityPhotoThemes = [
  "guides",
  "questions",
  "growth",
  "daily",
] as const;
export function communityPostPhoto(channelId: string, typeIndex: number) {
  const index =
    channelId === "foliage" && typeIndex === 1
      ? 13
      : communityPhotoChannels.findIndex((id) => id === channelId);
  const theme = communityPhotoThemes[typeIndex];
  return index >= 0 && theme
    ? `/images/community-${theme}.webp#${index}`
    : undefined;
}
export function communityPhotoTile(src: string) {
  const match =
    /^\/images\/community-(guides|questions|growth|daily)\.webp#(\d+)$/.exec(
      src,
    );
  if (!match) return undefined;
  const index = Number(match[2]);
  if (index > 15) return undefined;
  const column = index % 4,
    row = Math.floor(index / 4);
  return {
    key: `${match[1]}-${index}`,
    src: src.split("#")[0],
    viewBox: `${column + 0.005} ${row + 0.005} 0.99 0.99`,
    width: 4,
    height: 4,
  };
}
