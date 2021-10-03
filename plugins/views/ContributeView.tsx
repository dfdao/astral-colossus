import { h, FunctionComponent } from "preact";
import { Planet, PlanetType } from "@darkforest_eth/types";

import { useColossus, useContribute } from "../hooks";
import { isProspectable } from "../helpers/df";
import { getPlanetName, useSelectedPlanet } from "../lib/darkforest";
import { Button } from "../components/Button";
import { Loading } from "../components/Loading";
import { SuccessLabel } from "../components/SuccessLabel";
import { WarningLabel } from "../components/WarningLabel";
import { ErrorLabel } from "../components/ErrorLabel";

const styles = {
  view: {
    padding: 8,
  },
  buttons: {
    display: "flex",
    gap: 8,
  },
};

export function ContributeView() {
  const contributeProps = useContribute();
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

  if (!isValidPlanet)
    return (
      <StatusContainer {...contributeProps}>
        <p>Select a Rip or Foundry to contribute to the Colossus.</p>
      </StatusContainer>
    );

  if (isFoundry && !isValidFoundry)
    return (
      <StatusContainer {...contributeProps}>
        <p>
          The Foundry selected has either already been prospected or has
          insufficient energy.
        </p>
      </StatusContainer>
    );

  if (isRip && !isValidRip)
    return (
      <StatusContainer {...contributeProps}>
        <p>
          The Spacetime Rip selected does not have enough silver to conribute.
        </p>
      </StatusContainer>
    );

  if (isValidFoundry)
    return (
      <StatusContainer {...contributeProps}>
        <p>
          The Foundry "{planetName}" is eligible to contribute to the Colossus.
        </p>
      </StatusContainer>
    );

  if (isValidRip)
    return (
      <StatusContainer {...contributeProps}>
        <p>
          The Spacetime Rip "{planetName}" is eligible to contribute{" "}
          {planet.silver} silver to the Colossus.
        </p>
      </StatusContainer>
    );

  return (
    <StatusContainer {...contributeProps}>
      <p>something went wrong</p>
    </StatusContainer>
  );
}

interface StatusContainerProps {
  contribute: () => Promise<void>;
  status: string;
  loading: boolean;
  error: string;
  success: boolean;
}

const StatusContainer: FunctionComponent<StatusContainerProps> = (props) => {
  const { contribute, status, loading, error, success, children } = props;

  return (
    <div style={styles.view}>
      {children}
      <ErrorLabel error={error} />
      <WarningLabel warning={status} />
      <SuccessLabel success={success && "Operation Complete"} />
      {loading && <Loading />}
      <br />
      <ContractButtons>
        <Button theme="success" onClick={contribute} disabled={loading}>
          Contribute
        </Button>
      </ContractButtons>
    </div>
  );
};

const ContractButtons: FunctionComponent = ({ children }) => {
  const { returnSelected, checkDaoOwnership, readyToFind, registerOwnership } = useColossus();

  return (
    <div style={styles.buttons}>
      {children}
      <Button onClick={returnSelected}>Return Selected</Button>
      <Button onClick={checkDaoOwnership}>Check Ownership</Button>
      <Button onClick={readyToFind}>Find?</Button>
      <Button onClick={registerOwnership}>register selected</Button>
    </div>
  );
};
