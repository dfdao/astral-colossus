import { useState, useEffect } from "preact/hooks";
import { POLL_INTERVAL } from "../helpers/constants";

export function useInventory() {
  const [planets, setPlanet] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState();

  useEffect(() => {
    const fetchInventory = () =>
      df.contractsAPI
        .getPlayerPlanet(df.account)
        .then(setPlanet)
        .then(() => setLoading(false))
        .catch(setError);

    fetchInventory();
    const poll = setInterval(fetchInventory, POLL_INTERVAL);
    return () => clearInterval(poll);
  }, []);

  return {
    data: { planets },
    loading,
    error,
  };
}
