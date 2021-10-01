import { useContext } from "preact/hooks";
import { TransactionContext } from "../components/TransactionContext";

export const useTransactions = () => {
  const { planets, setPlanets } = useContext(TransactionContext);

  return {
    planets,
    setPlanets,
    addPlanet: (a) => setPlanets([...planets, a]),
    removePlanet: (a) => setPlanets(planets.filter((b) => b.id !== a.id)),
    isPlanetPending: (a) => planets.map((b) => b.id).includes(a.id),
  };
};
