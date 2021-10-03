import { h } from "preact";
import { colors } from "../helpers/theme";

const styles = {
  marginBottom: 8,
  padding: 8,
  color: colors.dfyellow,
};

export function WarningLabel({ warning }) {
  return warning ? <p style={styles}>{warning}</p> : null;
}
