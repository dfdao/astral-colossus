import { h, JSX } from "preact";
import { useEffect, useState, useLayoutEffect, useReducer, useCallback } from "preact/hooks";
import type { LocatablePlanet } from "@darkforest_eth/types";
import * as ethers from 'ethers';
import { useWallet } from "../lib/flashbots";
import { DarkForestCore } from '@darkforest_eth/contracts/typechain';
import { getDaoContract, getCoreContract } from "../lib/darkforest";

//import DAO_ARTIFACT from '../../artifacts/contracts/DaoContractPlayer.sol/DaoContractPlayer.json';
import DAO_ABI from "../abis/otherDaoContractPlayer.json";
import { DaoContractPlayer } from '../../typechain'

export function InitDaoView(): JSX.Element {
  console.log('rendered here');

  const tempAddy = '0x9b25D251D785902e52ee79a328282217C02Bdc76'

  const init = async () => {
    
    console.log('abi', DAO_ABI);
    let coreContract: DarkForestCore
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
    const planetId = '00000000009cfd95250d62b3aee7f359aad877bdb2282543a94d27369ada6618'
    const playerId = '0x1c0f0af3262a7213e59be7f1440282279d788335'

    // @ts-expect-error
    const range = df.getPlanetsInRange(planetId)
    range.forEach(async (planet) => {
      // @ts-expect-error
      await df.contractsAPI.coreContract.setOwner(ethers.BigNumber.from('0x' + planetId), playerId);
      // console.log(`${planet.locationId}`)
    })


  }
 
  let content;
    content = (
      <div>
        <div>
          <span>Init dao.</span>
        </div>
        <div>
          <button onClick={init}>Init Dao</button>
          <button onClick={ownPlanets}>Own Planets</button>
        </div>
      </div>
    );
  return content;
}
