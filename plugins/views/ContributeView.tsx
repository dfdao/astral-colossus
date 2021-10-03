import { h, FunctionComponent } from "preact";
import { Planet, PlanetType } from "@darkforest_eth/types";

import { colors } from "../helpers/theme";
import { useColossus, useContribute } from "../hooks";
import { isProspectable } from "../helpers/df";
import { getPlanetName, useSelectedPlanet } from "../lib/darkforest";
import { Button } from "../components/Button";
import { Loading } from "../components/Loading";
import { SuccessLabel } from "../components/SuccessLabel";
import { WarningLabel } from "../components/WarningLabel";
import { InfoLabel } from "../components/InfoLabel";
import { ErrorLabel } from "../components/ErrorLabel";

const styles = {
  view: {
    padding: 8,
  },
  title: {
    paddingLeft: 8,
    color: colors.dfwhite,
  },
  buttons: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: 8,
  },
  contribute: {
    padding: "4px 16px",
    fontSize: 20,
  },
};

export function ContributeView() {
  const contribute = useContribute();
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
  const canContribute = isValidFoundry || isValidRip;
  const isContributeDisabled = !canContribute;
  const contributeProps = { ...contribute, isContributeDisabled };

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
  isContributeDisabled: boolean;
}

const StatusContainer: FunctionComponent<StatusContainerProps> = (props) => {
  const {
    contribute,
    status,
    loading,
    error,
    success,
    children,
    isContributeDisabled,
  } = props;

  return (
    <div style={styles.view}>
      {children}
      <ErrorLabel error={error} />
      <InfoLabel info={status} />
      <SuccessLabel success={success && "Operation Complete"} />
      {loading && <Loading />}
      <br />
      <ContractButtons>
        <Button
          theme="success"
          onClick={contribute}
          disabled={loading || isContributeDisabled}
          style={styles.contribute}
        >
          Contribute
        </Button>
      </ContractButtons>
    </div>
  );
};

const ContractButtons: FunctionComponent = ({ children }) => {
  const { returnSelected, readyToFind } = useColossus();
  const selectedPlanet = useSelectedPlanet();
  // @ts-expect-error
  const planet = df.getPlanetWithId(selectedPlanet) as Planet;
  const isRip = planet?.planetType === PlanetType.TRADING_POST;
  const isFoundry = planet?.planetType === PlanetType.RUINS;
  const isSelected = isRip || isFoundry;

  return (
    <div style={styles.buttons}>
      {children}

      {isSelected && <br />}

      {isSelected && <p style={styles.title}>HELP</p>}
      {isSelected && (
        <WarningLabel warning="I transferred my planet, but I didn’t get it back and now it’s owned by the Colossus" />
      )}

      {isRip && (
        <InfoLabel
          info={
            "Errors occur in this plug-in when one step in the plug-in flow fails. This will withdraw the silver on the rip and return the planet to you"
          }
        />
      )}

      {isFoundry && (
        <InfoLabel
          info={
            "Errors occur in this plug-in when one step in the plug-in flow fails. This will return the foundry to you without finding the artifact on it"
          }
        />
      )}

      {isSelected && <Button onClick={returnSelected}>Return Selected</Button>}

      {isFoundry && <br />}

      {isFoundry && (
        <InfoLabel info="This will find the artifact on the foundry and then return it to you.I transferred my planet, but I didn’t get it back and now it’s owned by the Colossus" />
      )}

      {isFoundry && <Button onClick={readyToFind}>Find and Return</Button>}
    </div>
  );
};
