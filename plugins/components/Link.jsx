import { h } from "preact";
import { colors } from "../helpers/theme";
import { useState } from "preact/hooks";

export function Link({ url, text }) {
  const [isActive, setIsActive] = useState(false);

  const style = {
    color: colors.dfblue,
    opacity: isActive ? 1 : 0.8,
  };

  return (
    <a
      href={url}
      target="_blank"
      style={style}
      onMouseEnter={() => setIsActive(true)}
      onMouseLeave={() => setIsActive(false)}
      children={text || url.replace("https://", "")}
    />
  );
}
