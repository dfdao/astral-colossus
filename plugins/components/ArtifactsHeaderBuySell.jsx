import { h } from "preact";
import { colors } from "../helpers/theme";
import {
  EnergySVG,
  EnergyGrowthSVG,
  RangeSVG,
  SpeedSVG,
  DefenseSVG,
  PriceSVG,
} from "./Icon";

const styles = {
  header: {
    display: "grid",
    marginBottom: "4px",
    gridTemplateColumns: "2.75fr 1fr 1fr 1fr 1fr 1fr 1fr 1.75fr",
    gridColumnGap: "8px",
    textAlign: "right",
    alignItems: "center",
  },
  title: {
    display: "flex",
    justifyContent: "flex-start",
    color: colors.muted,
  },
  item: { display: "flex", justifyContent: "flex-end" },
};

export function ArtifactsHeaderBuySell() {
  return (
    <div style={styles.header}>
      <div style={styles.title}>Artifact</div>
      <div style={styles.item}>
        <EnergySVG />
      </div>
      <div style={styles.item}>
        <EnergyGrowthSVG />
      </div>
      <div style={styles.item}>
        <RangeSVG />
      </div>
      <div style={styles.item}>
        <SpeedSVG />
      </div>
      <div style={styles.item}>
        <DefenseSVG />
      </div>
      <div style={styles.item}>
        <PriceSVG />
      </div>
      <div></div>
    </div>
  );
}
