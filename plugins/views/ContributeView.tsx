import { h } from "preact";
import { useState, useEffect } from "preact/hooks";
import { Planet, PlanetType } from "@darkforest_eth/types";

import { isProspectable } from "../helpers/df";
import { getPlanetName, useSelectedPlanet } from "../lib/darkforest";
import { Button } from "../components/Button";
import { Loading } from "../components/Loading";
import { ErrorLabel } from "../components/ErrorLabel";
import { SuccessLabel } from "../components/SuccessLabel";

const styles = {
  view: {
    padding: 8,
  },
};

export function ContributeView() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");
  const [mockError, setMockError] = useState(false);
  const selectedPlanet = useSelectedPlanet();
  // @ts-expect-error
  const planet = df.getPlanetWithId(selectedPlanet) as Planet;
  const planetName = getPlanetName(selectedPlanet);
  const isFoundry = planet?.planetType === PlanetType.RUINS;
  const isRip = planet?.planetType === PlanetType.TRADING_POST;
  // @ts-expect-error
  const isOwnedByPlayer = planet?.owner === df.account;
  const isValidPlanet = (isOwnedByPlayer && isFoundry) || isRip;
  const isValidFoundry = planet && isProspectable(planet);
  const isValidRip = isRip && planet.silver > 100;

  // reset state defaults on planet change
  useEffect(() => {
    setLoading(false);
    setError(null);
    setSuccess("");
    setMockError(false);
  }, [planetName]);

  // mock method to load for 5 seconds then return true or false
  const onContributeClick = () => {
    setLoading(true);
    setError(null);
    setSuccess("");

    setTimeout(() => {
      if (mockError) {
        setError({
          message:
            "An issue occurred while submitting your transaction, please try again.",
        });
      } else {
        setSuccess(
          "Your contribution has been received, you will be remembered."
        );
      }
      setLoading(false);
      setMockError(!mockError);
    }, 5000);
  };

  if (!isValidPlanet)
    return (
      <div style={styles.view}>
        <p>Select a Rip or Foundry to contribute to the Colossus.</p>
      </div>
    );

  if (isFoundry && !isValidFoundry)
    return (
      <div style={styles.view}>
        <p>
          The Foundry selected has either already been prospected or has
          insufficient energy.
        </p>
      </div>
    );

  if (isRip && !isValidRip)
    return (
      <div style={styles.view}>
        <p>
          The Spacetime Rip selected does not have enough silver to conribute.
        </p>
      </div>
    );

  if (isValidFoundry)
    return (
      <div style={styles.view}>
        <p>
          The Foundry "{planetName}" is eligible to contribute to the Colossus.
        </p>
        <br />
        <Button theme="success" onClick={onContributeClick} disabled={loading}>
          Contribute
        </Button>
        {loading && <Loading />}
        <ErrorLabel error={error} />
        <SuccessLabel success={success} />
      </div>
    );

  if (isValidRip)
    return (
      <div style={styles.view}>
        <p>
          The Spacetime Rip "{planetName}" is eligible to contribute{" "}
          {planet.silver} silver to the Colossus.
        </p>
        <br />
        <Button theme="success" onClick={onContributeClick} disabled={loading}>
          Contribute
        </Button>
        {loading && <Loading />}
        <ErrorLabel error={error} />
        <SuccessLabel success={success} />
      </div>
    );

  return (
    <div style={styles.view}>
      <p>something went wrong</p>
    </div>
  );
}
