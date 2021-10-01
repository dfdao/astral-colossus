import { colors } from "../helpers/theme";
import { StatIdx, StatNames } from "../helpers/types";

export function getUpgradeStat(upgrade, stat) {
  if (stat === StatIdx.EnergyCap) return upgrade.energyCapMultiplier;
  else if (stat === StatIdx.EnergyGro) return upgrade.energyGroMultiplier;
  else if (stat === StatIdx.Range) return upgrade.rangeMultiplier;
  else if (stat === StatIdx.Speed) return upgrade.speedMultiplier;
  else if (stat === StatIdx.Defense) return upgrade.defMultiplier;
  else return upgrade.energyCapMultiplier;
}

export function formatMultiplierArtifact(artifact, statName) {
  const upgrades = [artifact.upgrade, artifact.timeDelayedUpgrade];
  const stat = StatIdx[StatNames[statName]];
  return formatMultiplierValue({ upgrades, stat });
}

export function formatMultiplierValue({ upgrades, stat }) {
  return upgrades.reduce((mult, upgrade) => {
    if (upgrade) mult *= getUpgradeStat(upgrade, stat) / 100;
    return mult;
  }, 100);
}

export function formatMultiplierText({ upgrades, stat }) {
  const val = formatMultiplierValue({ upgrades, stat });
  if (val === 100) return `+0%`;
  if (val > 100) return `+${Math.round(val) - 100}%`;
  return `-${100 - Math.round(val)}%`;
}

export function formatMultiplierColor(value) {
  if (value === 100) return colors.muted;
  if (value > 100) return colors.dfgreen;
  return colors.dfred;
}

export function formatDateTime(timestamp) {
  if (!timestamp) return 0;
  const date = new Date(timestamp * 1000);
  return `${date.toDateString()} ${date.toLocaleTimeString()}`;
}
