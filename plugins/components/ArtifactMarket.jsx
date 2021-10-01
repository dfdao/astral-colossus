import { h } from "preact";
import { Raritycolors } from "../helpers/theme";
import { ArtifactTypeNames } from "@darkforest_eth/types";
import { UpgradeStatInfo } from "./UpgradeStatInfo";

export function ArtifactMarket({ artifact, action }) {
  const artifactStyle = {
    display: "grid",
    gridTemplateColumns: "2.75fr 1fr 1fr 1fr 1fr 1fr 1fr 1.75fr",
    gridColumnGap: "8px",
    textAlign: "right",
  };

  const artifactTypeStyle = {
    color: Raritycolors[artifact.rarity],
    textAlign: "left",
  };

  return (
    <div style={artifactStyle}>
      <div style={artifactTypeStyle}>
        {ArtifactTypeNames[artifact.artifactType]}
      </div>
      {Array.from({ length: 5 }, (_, i) => i).map((val) => (
        <UpgradeStatInfo
          upgrades={[artifact.upgrade, artifact.timeDelayedUpgrade]}
          stat={val}
          key={val}
        />
      ))}
      <div>{artifact.price ? Number(artifact.price).toFixed(2) : ""}</div>
      <div>{action}</div>
    </div>
  );
}
