import { ArtifactRarity } from "@darkforest_eth/types";

export const colors = {
  muted: "#838383",
  gray: "#aaaaaa",
  background: "#151515",
  backgrounddark: "#252525",
  border: "#777",
  borderlight: "#5f5f5f",
  blueBackground: "#0a0a23",
  dfblue: "#00ADE1",
  dfgreen: "#00DC82",
  dfred: "#FF6492",
  dfyellow: "#e8e228",
  dfpurple: "#9189d9",
  dfwhite: "#ffffff",
  dfblack: "#000000",
  dfrare: "#6b68ff",
  dfepic: "#c13cff",
  dflegendary: "#f8b73e",
  dfmythic: "#ff44b7",
};

// https://github.com/darkforest-eth/client/blob/00492e06b8acf378e7dacc1c02b8ede61481bba3/src/Frontend/Styles/colors.tsx
export const Raritycolors = {
  [ArtifactRarity.Unknown]: colors.dfblack,
  [ArtifactRarity.Common]: colors.muted,
  [ArtifactRarity.Rare]: colors.dfrare,
  [ArtifactRarity.Epic]: colors.dfepic,
  [ArtifactRarity.Legendary]: colors.dflegendary,
  [ArtifactRarity.Mythic]: colors.dfmythic,
};
