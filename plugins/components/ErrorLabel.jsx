import { h } from "preact";
import { colors } from "../helpers/theme";

const styles = {
  marginBottom: 8,
  padding: 8,
  color: colors.dfred,
};

export function ErrorLabel({ error }) {
  return error ? <p style={styles}>Error: {error.message}</p> : null;
}
