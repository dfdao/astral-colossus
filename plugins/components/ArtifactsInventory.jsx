import { h } from "preact";
import { useState } from "preact/hooks";
import { ArtifactTypeNames, ArtifactRarityNames } from "@darkforest_eth/types";
import { Artifact } from "./Artifact";
import { ArtifactsHeaderInventory } from "./ArtifactsHeaderInventory";
import { ArtifactSortType } from "../helpers/types";
import { formatMultiplierArtifact } from "../helpers/format";

const styles = {
  artifacts: {
    display: "grid",
    gridRowGap: "4px",
  },
  empty: {
    color: "#838383",
  },
};

export function ArtifactsInventory({
  empty,
  artifacts = [],
  setActiveArtifact,
}) {
  const [sort, setSort] = useState(null);
  const [filter, setFilter] = useState("");
  const [reverse, setReverse] = useState(false);
  const clear = () => {
    setSort(null);
    setReverse(false);
  };

  const bySort = (a, b) => {
    if (!sort) return b.rarity - a.rarity;
    if (sort === ArtifactSortType.type) {
      const nameA = ArtifactTypeNames[a[sort]];
      const nameB = ArtifactTypeNames[b[sort]];
      if (nameA < nameB) return reverse ? 1 : -1;
      if (nameA > nameB) return reverse ? -1 : 1;
      return 0;
    }
    const valA = formatMultiplierArtifact(a, sort);
    const valB = formatMultiplierArtifact(b, sort);
    return reverse ? valA - valB : valB - valA;
  };

  const byFilter = ({ artifactType, rarity }) => {
    const letters = filter.toLowerCase();
    const hasLetters = (text) => text.toLowerCase().includes(letters);
    if (hasLetters(ArtifactTypeNames[artifactType])) return true;
    if (hasLetters(ArtifactRarityNames[rarity])) return true;
  };

  const artifactsChildren = artifacts.length ? (
    artifacts
      .sort(bySort)
      .filter(byFilter)
      .map((artifact) => (
        <Artifact
          key={artifact.id}
          artifact={artifact}
          action={setActiveArtifact(artifact)}
        />
      ))
  ) : (
    <p style={styles.empty}>{empty}</p>
  );

  return (
    <div>
      {!!artifacts.length && (
        <ArtifactsHeaderInventory
          sort={sort}
          setSort={setSort}
          filter={filter}
          setFilter={setFilter}
          reverse={reverse}
          setReverse={setReverse}
          clear={clear}
        />
      )}
      <div style={styles.artifacts}>{artifactsChildren}</div>
    </div>
  );
}
