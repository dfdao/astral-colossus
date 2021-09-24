import { h, JSX } from "preact";
import { useEffect, useState, useLayoutEffect, useReducer, useCallback } from "preact/hooks";
import type { LocationId } from "@darkforest_eth/types";

import { useCoreContract, usePlanetName, useSelectedPlanet, move } from "../../lib/darkforest";
import { useFlashbotsBundle, useWallet } from "../../lib/flashbots";

import { FlashbotsStatus } from "../components/FlashbotsStatus";
import { PlanetLabel } from "../components/PlanetLabel";

const descriptionStyle = {
  fontStyle: "italic",
};

const planetListStyle = {
  marginBottom: "15px",
  marginTop: "5px",
};


const actionContainerStyle = {
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
};

interface AddPlanet {
  type: "add_planet";
  payload: LocationId;
}

interface RemovePlanet {
  type: "remove_planet";
  payload: LocationId;
}

type Action = AddPlanet | RemovePlanet;

interface State {
  planets: LocationId[];
}

function stateReducer(state: State, action: Action): State {
  switch (action.type) {
    case "add_planet": {
      if (state.planets.includes(action.payload)) {
        return state;
      }
      const newPlanets = [...state.planets, action.payload];
      return { ...state, planets: newPlanets };
    }
    case "remove_planet": {
      const newPlanets = state.planets.filter((p) => p !== action.payload);
      return { ...state, planets: newPlanets };
    }
    default:
      return state;
  }
}

const distance = (from, to) => {
  const fromloc = from.location;
  const toloc = to.location;
  return Math.sqrt((fromloc.coords.x - toloc.coords.x) ** 2 + (fromloc.coords.y - toloc.coords.y) ** 2);
}



export function BasicView(): JSX.Element {
  const [state, dispatch] = useReducer(stateReducer, { planets: [] });
  const contract = useCoreContract();
  const selectedPlanet = useSelectedPlanet();
  const selectedPlanetName = usePlanetName(selectedPlanet);

  const wallet = useWallet();

  const refreshPlanets = useCallback(() => {
    state.planets.forEach((locationId) => {
      console.log(`Refresh planet ${locationId}`);
      // @ts-expect-error
      df.softRefreshPlanet(locationId);
    });
  }, [state]);

  const capturePlanets = async (fromId, minCaptureLevel, maxDistributeEnergyPercent, txs) => {
    // @ts-expect-error
    const from = df.getPlanetWithId(fromId);
  
    // Rejected if has pending outbound moves
    // @ts-expect-error
    const unconfirmed = df.getUnconfirmedMoves().filter(move => move.from === fromId)
    if (unconfirmed.length !== 0) {
      return;
    }
    console.log("here1");
    // @ts-expect-error
    const candidates_ = df.getPlanetsInRange(fromId, maxDistributeEnergyPercent)
      .filter(p => (
        // @ts-expect-error
        p.owner !== df.account &&
        p.owner === "0x0000000000000000000000000000000000000000" &&
        p.planetLevel >= minCaptureLevel
      ))
      .map(to => {
        return [to, distance(from, to)]
      })
      .sort((a, b) => a[1] - b[1]);
  
    let i = 0;
    const energyBudget = Math.floor((maxDistributeEnergyPercent / 100) * from.energy);
  
    let energySpent = 0;
    let moves = 0;
    
    console.log("here2");
    while (energyBudget - energySpent > 0 && i < candidates_.length) {
  
      const energyLeft = energyBudget - energySpent;
  
      // Remember its a tuple of candidates and their distance
      const candidate = candidates_[i++][0];
  
      // Rejected if has unconfirmed pending arrivals
      // @ts-expect-error
      const unconfirmed = df.getUnconfirmedMoves().filter(move => move.to === candidate.locationId)
      if (unconfirmed.length !== 0) {
        continue;
      }
      
      console.log("here3");
      // Rejected if has pending arrivals
      // const arrivals = getArrivalsForPlanet(candidate.locationId);
      // if (arrivals.length !== 0) {
      //   continue;
      // }
  
      const energyArriving = (candidate.energyCap * 0.15) + (candidate.energy * (candidate.defense / 100));
      // needs to be a whole number for the contract
      // @ts-expect-error
      const energyNeeded = Math.ceil(df.getEnergyNeededForMove(fromId, candidate.locationId, energyArriving));
      if (energyLeft - energyNeeded < 0) {
        continue;
      }

      console.log("here4");
      
      const core = await contract.connect(wallet);
      // need to populate transaction after zk snarks have been calculated? ...
      // @ts-expect-error 
      const to = df.getPlanetWithId(candidate.locationId);
      if(!to) {
        continue;
      }
      console.log(`from\n`, from, `to\n`, to);
      move(from, to, energyNeeded, 0, 0, core);
      // const tx = await contract.connect(wallet).populateTransaction["move(uint256[2],uint256[2][2],uint256[2],uint256[13])"];
      // const tx = await move(fromId, candidate.locationId, energyNeeded, 0);
      console.log("here5");
      // df.move(fromId, candidate.locationId, energyNeeded, 0);
      // console.log(`tx`, tx);
      // txs.push(tx);
      energySpent += energyNeeded;
      moves += 1;
    }
  
    return moves;
  }
  const selectMoves = (txs) => {
    console.log(`here`)
    const minPlanetLevel = 0;
    const maxEnergyPercent = 75;
    let count = 0;
    // @ts-expect-error
    for (const planet of df.getMyPlanets()) {
      setTimeout(async () => {
        if (count < 3) {
          count += await capturePlanets(
            planet.locationId,
            minPlanetLevel,
            maxEnergyPercent,
            txs,
          );
        }
      }, 0); 
    }
  }


  const {
    submitBundle,
    clear,
    bundles,
    completed,
    submitting,
    error: flashbotsError,
  } = useFlashbotsBundle({ onComplete: refreshPlanets });

  const centerOnPlanet = (locationId: LocationId) => {
    // @ts-expect-error
    ui.centerLocationId(locationId);
  };

  const submitMoveBundle = async () => {
    if (!contract) return;
    let transactions = [];
    selectMoves(transactions);

    for(let i = 0; i < transactions.length; i++) {
      console.log(`move tx`, transactions[i]);
    }
    // for (let i = 0; i < state.planets.length; i++) {
    //   const tx = await contract.connect(wallet).populateTransaction.prospectPlanet("0x" + state.planets[i]);
    //   transactions.push({
    //     to: contract.address,
    //     transaction: tx,
    //   });
    // }
    // submitBundle(transactions);
  };

 
  let content;
  if (flashbotsError) {
    content = (
      <div>
        <div>
          <span style={descriptionStyle}>Something went wrong submitting the bundle.</span>
        </div>
        <div>{flashbotsError}</div>
        <div>
          <button onClick={clear}>Go back</button>
        </div>
      </div>
    );
  } else if (submitting) {
    content = (
      <div>
        <div>
          <span style={descriptionStyle}>Submitting bundle to flashbots.</span>
        </div>
        {bundles.map((result, idx) => (
          <FlashbotsStatus key={idx} status={result} />
        ))}
        <div>{completed && <button onClick={clear}>Go back</button>}</div>
      </div>
    );
  } else {
    content = (
      <div>
        <div>
          <span style={descriptionStyle}>Make two moves in a single block.</span>
        </div>
        <div style={actionContainerStyle}>
          <button>
            "hello"
          </button>
          <button onClick={submitMoveBundle}>
            Submit
          </button>
        </div>
      </div>
    );
  }
  return content;
}
