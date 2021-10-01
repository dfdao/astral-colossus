import { h } from "preact";
import { twitter, playerColor } from "../helpers/df";

export function PlayerName({ address }) {
  const handle = twitter(address);
  const color = playerColor(address);
  const name = handle ? `@${handle}` : address;

  return (
    <a
      href={handle && `https://twitter.com/${handle}`}
      target="_blank"
      style={{ color }}
      children={name}
    />
  );
}
