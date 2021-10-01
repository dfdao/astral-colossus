import { h } from "preact";
import { Raritycolors } from "../helpers/theme";
import { ArtifactTypeNames } from "@darkforest_eth/types";
import { UpgradeStatInfo } from "./UpgradeStatInfo";

const styles = {
  artifact: {
    display: "grid",
    gridTemplateColumns: "2.75fr 1fr 1fr 1fr 1fr 1fr 1.75fr",
    gridColumnGap: "8px",
    textAlign: "right",
  },
};

export function Artifact({ artifact, action }) {
  const artifactTypeStyle = {
    color: Raritycolors[artifact.rarity],
    textAlign: "left",
  };

  return (
    <div style={styles.artifact}>
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
      <div>{action}</div>
    </div>
  );
}
