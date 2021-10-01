import { h } from "preact";
import { planetName } from "../helpers/df";

export function PlanetName({ address }) {
  const name = planetName(address);
  return <span children={name} />;
}
