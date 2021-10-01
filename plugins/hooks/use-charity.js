import { useState, useEffect } from "preact/hooks";
import { BigNumber } from "@ethersproject/bignumber";
import { parseEther, formatEther } from "@ethersproject/units";
import { POLL_INTERVAL } from "../helpers/constants";
import { useContract, useTransactions } from ".";

export function useCharity() {
  const { charity, charityAddress } = useContract();
  const transactions = useTransactions();
  const [planets, setPlanets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState();
  const planetsListed = planets.filter(
    (planet) => planet?.owner?.toLowerCase() === df.account.toLowerCase()
  );

  const buyPlanet = (planet) => {
    return charity
      .buy(BigNumber.from("0x" + planet.id), {
        value: planet.priceRaw,
        gasLimit: 250000,
      })
      .then(() => transactions.addPlanet(planet));
  };

  const listPlanet = (planet, price) => {
    return charity
      .list(BigNumber.from("0x" + planet.id), parseEther(price.toString()), {
        gasLimit: 250000,
      })
      .then(() => transactions.addPlanet(planet));
  };

  const withdrawPlanet = (planet) => {
    charity
      .unlist(BigNumber.from("0x" + planet.id))
      .then(() => transactions.addPlanet(planet))
      .catch(setError);
  };

  const fetchCharity = () =>
    df.contractsAPI
      .getPlayerPlanets(charityAddress)
      .then((plnt) =>
        Promise.all(
          plnt.map(async (planet) =>
            charity
              .listings(BigNumber.from("0x" + planet.id))
              .then(([owner, priceRaw]) => ({
                ...planet,
                owner,
                priceRaw,
                price: formatEther(priceRaw),
              }))
              .catch(setError)
          )
        )
      )
      .then((plnt) => {
        // check if currentOwner changed or if no longer exists
        const transactionsUpdate = transactions.planets.filter((planet) => {
          // if either of these occurred, remove from pending
          const planetUpdate = plnt.find((a) => a.id === planet.id);
          const wasRemoved = !plnt.map((a) => a.id).includes(planet.id);
          const ownerChanged =
            planetUpdate && planetUpdate.currentOwner !== planet.currentOwner;
          if (wasRemoved || ownerChanged) return false;
          else return true;
        });

        // if pending list changed, save it
        if (transactions.planets.length !== transactionsUpdate.length)
          transactions.setPlanets(transactionsUpdate);

        // save latest planets
        setPlanets(plnt);
      })
      .then(() => setLoading(false))
      .catch(setError);

  useEffect(() => {
    fetchCharity();
    const poll = setInterval(fetchCharity, POLL_INTERVAL);
    return () => clearInterval(poll);
  }, []);

  return {
    data: {
      planets,
      planetsListed,
    },
    loading,
    error,
    refetch: fetchCharity,
    isPlanetOwned: (a) => a.owner?.toLowerCase() === df.account.toLowerCase(),
    buyPlanet,
    listPlanet,
    withdrawPlanet,
    contract: charity,
    address: charityAddress,
  };
}
