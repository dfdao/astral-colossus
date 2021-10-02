import { h } from "preact";
import { colors } from "../helpers/theme";

const styles = {
  marginBottom: 16,
  padding: 8,
  color: colors.dfgreen,
};

export function SuccessLabel({ success }) {
  return success ? <p style={styles}>{success}</p> : null;
}
