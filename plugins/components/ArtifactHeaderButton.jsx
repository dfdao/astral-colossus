import { h } from "preact";
import { colors } from "../helpers/theme";
import { Button } from "./Button";

const styleButton = {
  display: "flex",
  padding: 0,
  justifyContent: "flex-end",
  alignItems: "center",
  background: colors.background,
};

export function ArtifactHeaderButton({ children, style, onClick }) {
  return (
    <Button style={{ ...styleButton, ...style }} onClick={onClick}>
      {children}
    </Button>
  );
}
