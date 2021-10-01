import { h } from "preact";
import { ArtifactRarityNames, BiomeNames } from "@darkforest_eth/types";
import { Detail } from "./Detail";
import { PlayerName } from "./PlayerName";
import { PlanetName } from "./PlanetName";
import { formatDateTime } from "../helpers/format";

const style = {
  margin: "16px auto",
};

export function ArtifactDetails({ artifact }) {
  return (
    <div style={style}>
      <Detail
        title="rarity"
        description={ArtifactRarityNames[artifact.rarity]}
      />

      <Detail title="biome" description={BiomeNames[artifact.planetBiome]} />

      <Detail
        title="seller"
        description={<PlayerName address={artifact.owner || df.account} />}
      />
      <Detail
        title="discoverer"
        description={<PlayerName address={artifact.discoverer} />}
      />

      <Detail
        title="discovered"
        description={formatDateTime(artifact.mintedAtTimestamp)}
      />

      <Detail
        title="discovered on"
        description={<PlanetName address={artifact.planetDiscoveredOn} />}
      />

      <Detail
        title="last activated"
        description={formatDateTime(artifact.lastActivated) || "never"}
      />

      <Detail
        title="last deactivated"
        description={formatDateTime(artifact.lastDeactivated) || "never"}
      />

      <Detail title="price" description={`${artifact.price} xDai`} />
    </div>
  );
}
