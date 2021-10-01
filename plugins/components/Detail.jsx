import { h } from "preact";
import { colors } from "../helpers/theme";

export function Detail({ title, description }) {
  return (
    <p>
      {title} <span style={{ color: colors.dfwhite }}>{description}</span>
    </p>
  );
}
