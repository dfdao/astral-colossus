import { h, JSX } from "preact";
import { useEffect, useState, useLayoutEffect, useReducer, useCallback } from "preact/hooks";
import type { LocatablePlanet, LocationId } from "@darkforest_eth/types";
import * as ethers from 'ethers';
import { useWallet } from "../lib/flashbots";
import { DarkForestCore } from '@darkforest_eth/contracts/typechain';
import { getDaoContract, getCoreContract, usePlanetName, useSelectedPlanet } from "../lib/darkforest";
import DAO_ABI from "../abis/otherDaoContractPlayer.json";
import { DaoContractPlayer } from '../../typechain'

export function InitDaoView(): JSX.Element {
  // @ts-expect-error
  console.log('rendered here df ui', df, ui);
  let coreContract: DarkForestCore


  const selectedPlanet = useSelectedPlanet();
  const selectedPlanetName = usePlanetName(selectedPlanet);

  const tempAddy = '0x9b25D251D785902e52ee79a328282217C02Bdc76'

  const init = async () => {
    
    console.log('abi', DAO_ABI);
    coreContract = await getCoreContract();
    // get player's privateKey
    const wallet = useWallet();
    console.log('wallet', wallet);
    const daoPlayer = new ethers.Contract(tempAddy, DAO_ABI, wallet) as DaoContractPlayer;

    console.log(`connected to dao Player @ ${daoPlayer.address}`);
    const balance = await wallet.provider.getBalance(daoPlayer.address)
    console.log('dao balance:', ethers.utils.formatEther(balance));
    
    let locatable: LocatablePlanet;
    // @ts-expect-error
    locatable = await df.findRandomHomePlanet();
    const x = locatable.location.coords.x;
    const y = locatable.location.coords.y;
    const r = Math.floor(Math.sqrt(x ** 2 + y ** 2)) + 1;
    // const r = df.worldRadius
    console.log('found location', locatable);

    console.log('making call Args');
    // @ts-expect-error
    const callArgs = await df.snarkHelper.getInitArgs(x,y,r);
    console.log('call Args', callArgs);
    
    await daoPlayer.initializePlayer(callArgs[0], callArgs[1], callArgs[2], callArgs[3]);
    const p = await coreContract.players(daoPlayer.address);
    console.log('is initialized?', p.isInitialized);
  };

  const ownPlanets = async () => {
    coreContract = await getCoreContract();
    console.log('selected planet', selectedPlanet);
    //const planetId = '00000000009cfd95250d62b3aee7f359aad877bdb2282543a94d27369ada6618'
    const playerId = '0x1c0f0af3262a7213e59be7f1440282279d788335'

    console.log('coreContract address', coreContract.address);
    // @ts-expect-error
    console.log('df.contractsAPI.coreContract.address', df.contractsAPI.coreContract.address);
    let count = 0;
    // @ts-expect-error
    const range = df.getPlanetsInRange(selectedPlanet)
    console.log('range', range);

    for(let planet of range) {
      await changeOwner(playerId, planet.locationId);
    }
  }

  const changeOwnerW = async () => {
    const playerId = '0x1c0f0af3262a7213e59be7f1440282279d788335'
    await changeOwner(playerId,selectedPlanet);
  }

  const changeOwner = async (playerId, planetId) => {
    coreContract = await getCoreContract();
    const pId = ethers.BigNumber.from('0x' + planetId);
    // try getting the getRefreshedPlanet
    const res = await coreContract.getRefreshedPlanet(pId, Date.now());
    console.log('refreshed extended args', res);
    const perlin = res[1][3];
    // initializePlanet
    const isInitialized = res[1][0];
    console.log('planet initalized? ', isInitialized);
    if (!isInitialized) {
      await coreContract.initializePlanet(pId, perlin, false);
      const res1 = await coreContract.getRefreshedPlanet(pId, Date.now());
      console.log('refreshed extended args after init', res1);
    }
    const setOwnerReciept = await coreContract.setOwner(pId, playerId);
    // @ts-expect-error
    await df.hardRefreshPlanet(planetId);
    const freshPlanet = await coreContract.planets(pId);

    const res1 = await coreContract.getRefreshedPlanet(pId, Date.now());
    console.log('ext args after new owner', res1);
    // @ts-expect-error
    const fp = await df.entityStore.getPlanetWithId(planetId);
    // @ts-expect-error
    const fp1 = await df.contractsAPI.getPlanetById(planetId);
    // console.log('fp1', fp1);
    console.log(`contract: planet w id ${planetId} is owned by ${freshPlanet.owner}`);
    console.log(`contract api: planet w id ${planetId} is owned by ${fp1.owner}`);
    console.log(`entity store: planet w id ${planetId} is owned by ${fp.owner}`);

  }

  const getContributions = async () => {
    coreContract = await getCoreContract();
    // get player's privateKey
    const wallet = useWallet();
    console.log('wallet', wallet);
    const daoPlayer = new ethers.Contract(tempAddy, DAO_ABI, wallet) as DaoContractPlayer;
    console.log(`connected to dao Player @ ${daoPlayer.address}`);
    const score = await daoPlayer.contributions(wallet.address);
    // @ts-expect-error
    df.terminal.current.println(`contributions[player]: ${score}`);
  };

  const giftSelected = async () => {

  };
 
  let content;
    content = (
      <div>
        <div>
          <span>Init dao.</span>
        </div>
        <div>
          <button onClick={init}>Init Dao</button>
          <button onClick={ownPlanets}>Own Planets</button>
          <button onClick={changeOwnerW}>Own Selected</button>
          <button onClick={getContributions}>check score</button>
        </div>
      </div>
    );
  return content;
}
