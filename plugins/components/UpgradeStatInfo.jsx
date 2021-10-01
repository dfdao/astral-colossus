import { h } from "preact";
import {
  formatMultiplierValue,
  formatMultiplierText,
  formatMultiplierColor,
} from "../helpers/format";

export function UpgradeStatInfo({ upgrades, stat }) {
  const val = formatMultiplierValue({ upgrades, stat });
  const text = formatMultiplierText({ upgrades, stat });

  return <div style={{ color: formatMultiplierColor(val) }}>{text}</div>;
}
