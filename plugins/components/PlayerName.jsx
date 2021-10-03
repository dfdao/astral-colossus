import { h } from "preact";
import { twitter, playerColor } from "../helpers/df";

export function PlayerName({ address }) {
  const handle = twitter(address.toLowerCase());
  const color = playerColor(address);
  const name = handle ? `@${handle}` : `${address.slice(0, 7)}...`;

  return (
    <a
      href={handle && `https://twitter.com/${handle}`}
      target="_blank"
      style={{ color }}
      children={name}
    />
  );
}
