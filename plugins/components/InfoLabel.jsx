import { h } from "preact";
import { colors } from "../helpers/theme";

const styles = {
  marginBottom: 8,
  padding: 8,
  color: colors.dfblue,
};

export function InfoLabel({ info }) {
  return info ? <p style={styles}>{info}</p> : null;
}
