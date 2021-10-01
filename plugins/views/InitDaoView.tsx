import { h, JSX } from "preact";
import { useEffect, useState, useLayoutEffect, useReducer, useCallback } from "preact/hooks";
import { LocatablePlanet, LocationId, Planet, PlanetType } from "@darkforest_eth/types";
import * as ethers from 'ethers';
import { useWallet } from "../lib/flashbots";
import { DarkForestCore } from '@darkforest_eth/contracts/typechain';
import { getDaoContract, getCoreContract, usePlanetName, getPlanetName, useSelectedPlanet, useCoreContract } from "../lib/darkforest";
import DAO_ABI from "../abis/otherDaoContractPlayer.json";
import { DaoContractPlayer } from '../../typechain'

export function InitDaoView(): JSX.Element {
  //const print ()
  // @ts-expect-error
  console.log('rendered here df ui', df, ui);
  const coreContract = useCoreContract();


  const selectedPlanet = useSelectedPlanet();
  const selectedPlanetName = usePlanetName(selectedPlanet);
  const wallet = useWallet();

  
  const tempAddy = '0x9b25D251D785902e52ee79a328282217C02Bdc76'

  const daoPlayer = new ethers.Contract(tempAddy, DAO_ABI, wallet) as DaoContractPlayer;
  
  console.log(`connected to dao Player @ ${daoPlayer.address}`);


  const init = async () => {
    
    console.log('abi', DAO_ABI);
    // get player's privateKey
    console.log('wallet', wallet);

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
    console.log('selected planet', selectedPlanet);
    const playerId = '0x1c0f0af3262a7213e59be7f1440282279d788335'


    // @ts-expect-error
    const range = df.getPlanetsInRange(selectedPlanet)
    console.log('range', range);

    let count = 0;
    for(let planet of range) { 
      if (count < 1) {
        console.log('tryna capture ', planet)
        setTimeout(() => {}, 2000);
        const res = await changeOwner(playerId, planet.locationId);

        // @ts-expect-error
        await df.hardRefreshPlanet(planet.locationId);
        console.log('res', res);
        count +=1
      }
    }
  }

  const changeOwnerW = async () => {
    const playerId = '0x1c0f0af3262a7213e59be7f1440282279d788335'
    await changeOwner(playerId,selectedPlanet);
  }

  const changeOwner = async (playerId, planetId) => {
    const pId = ethers.BigNumber.from('0x' + planetId);
    // try getting the getRefreshedPlanet
    const res = await coreContract.getRefreshedPlanet(pId, Date.now());
    console.log('refreshed extended args', res);
    const perlin = res[1][3];
    // initializePlanet
    const isInitialized = res[1][0];
    console.log('planet initalized? ', isInitialized);
    if (!isInitialized) {
      console.log('initializing with perlin', perlin);
      await coreContract.initializePlanet(pId, perlin, false);
      const res1 = await coreContract.getRefreshedPlanet(pId, Date.now());
      console.log('refreshed extended args after init', res1);
    }
    const setOwnerReciept = await coreContract.setOwner(pId, playerId);
    await setOwnerReciept.wait()
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
    return `entity store: planet w id ${planetId} is owned by ${fp.owner}`;
  }

  const getContributions = async () => {
    console.log(`connected to dao Player @ ${daoPlayer.address}`);
    const balance = await wallet.provider.getBalance(daoPlayer.address)
    console.log('dao balance:', ethers.utils.formatEther(balance));
    const score = await daoPlayer.contributions(wallet.address);
    // @ts-expect-error
    df.terminal.current.println(`contributions[player]: ${score}`);
  };

  const contribute = async () => {

    // @ts-expect-error
    const planet = await df.getPlanetWithId(selectedPlanet)
    console.log(`sending planet to gift: `, planet);

    // @ts-expect-error
    let planets = await df.getMyPlanets();
    planets = [planet];
    // @ts-expect-error
    df.terminal.current.println(`sending ${planets.length} candidates to giftPlanets`)
    await giftPlanets(planets);
  }

  const checkDaoOwnership = async () => {
    // dao recognizes player as owner
    const pBigNumber = ethers.BigNumber.from(`0x${selectedPlanet}`);
    const updateTx = await daoPlayer.updatePlanetOwners([pBigNumber]);
    await updateTx.wait();
    const result = daoPlayer.interface.decodeFunctionData("updatePlanetOwners", updateTx.data);
    const owner = await daoPlayer.planetOwners(pBigNumber);
    console.log('owner', owner);
    console.log("tx result", result);
  }

  const bulkRefresh = async (planets: Planet[]) => {
    const locationIds = planets.map((p) => p.locationId)
    // @ts-expect-error
    await df.bulkHardRefreshPlanets(locationIds);
  }
  const updatePlanetOwners = async (planets: Planet[]) => {
    // dao recognizes player as owner
    const locationIds = planets.map((p) => ethers.BigNumber.from(`0x${p.locationId}`));
    const updateTx = await daoPlayer.updatePlanetOwners(locationIds);
    await updateTx.wait();
    // @ts-expect-error
    df.terminal.current.println(`registered ${locationIds.length} planets with dao`);
  }

  /* similar to gift empire */
  const transferPlanets = async (planets: Planet[]) => {
    for (let p of planets) {
      const id = ethers.BigNumber.from(`0x${p.locationId}`)
      // transfer ownership
      await coreContract.transferOwnership(id, daoPlayer.address);
      const pName = getPlanetName(p.locationId);

      await coreContract.refreshPlanet(id);
      const planet = await coreContract.planets(id);
      console.log(`transferred planet details`, planet);

      // @ts-expect-error
      df.terminal.current.println(`transferred ${pName} to dao`);
    }
    
    await bulkRefresh(planets);
    // @ts-expect-error
    df.terminal.current.println(`transferred ${planets.length} planets to dao`);
  }

  // TODO: import findMoveArgs type
  const processAndReturnPlanets = async (rips: Planet[], findArgsList: any[]) => {
    const locationIds = rips.map((p) => ethers.BigNumber.from(`0x${p.locationId}`));
    const processTx  = await daoPlayer.processAndReturnPlanets(locationIds, findArgsList);
    await processTx.wait();
    // @ts-expect-error
    df.terminal.current.println(`processed and returned ${locationIds.length} planets to player`);
    // @ts-expect-error
    await df.bulkHardRefreshPlanets(locationIds);
  }
  const giftPlanets = async (planets: Planet[]) => {

    const rips = planets.filter((p) => p.planetType == PlanetType.TRADING_POST);
    const foundries = planets.filter((p) => p.planetType == PlanetType.RUINS);
    const first2Rips = rips.slice(0,2);

    const prevScore = await daoPlayer.contributions(wallet.address);

    await updatePlanetOwners(first2Rips); 
    await transferPlanets(first2Rips); 
    await processAndReturnPlanets(first2Rips, []);

    const currScore = await daoPlayer.contributions(wallet.address)

    // @ts-expect-error
    df.terminal.current.println(`your score has increased ${currScore - prevScore} points for a total of ${currScore}!`);

    // // transfer ownership
    // await coreContract.transferOwnership(pBigNumber, daoPlayer.address);
    // // @ts-expect-error
    // await df.hardRefreshPlanet(p.locationId);

    let findArgsList = [];

    // for(let p of planets) {
    //   console.log('p is', p);
    //   // // @ts-expect-error
    //   // const pLocal = df.entityStore.getPlanetWithId(p.locationId);
    //   // console.log('pLocal', pLocal);
    //   const pBigNumber = ethers.BigNumber.from(`0x${p.locationId}`)
    //   const pName = getPlanetName(p.locationId);
    //   console.log(`received ${pName}`)

    //   if (p.planetType === PlanetType.RUINS) {
    //     continue;
    //     console.log('handling foundry')
    //     console.log(`prospecting ${pName}`);

    //     // prospect 
    //     const prospectTx = await coreContract.prospectPlanet(pBigNumber);
    //     const prospectTxReceipt = await prospectTx.wait();
    //     console.log('prospected block number', prospectTxReceipt.blockNumber);

    //     let planetDetails = await coreContract.getRefreshedPlanet(pBigNumber, Date.now());
    //     console.log('prospect details', planetDetails);
    //     console.log(`transferring ${pName}`);

    //     // transfer ownership
    //     await coreContract.transferOwnership(pBigNumber, daoPlayer.address);
    //     // @ts-expect-error
    //     await df.hardRefreshPlanet(p.locationId);

    //     console.log(`finding args for ${pName}`); 

    //     // find
    //     // @ts-expect-error
    //     const findArgs = await df.snarkHelper.getFindArtifactArgs(p.location.coords.x, p.location.coords.y);
    //     console.log('findArgs', findArgs);

    //     const findTx = await daoPlayer.processAndReturnPlanets([], [findArgs]);
    //     const findTxReceipt = await findTx.wait()
    //     console.log('found block number', findTxReceipt.blockNumber);

    //     planetDetails = await coreContract.getRefreshedPlanet(pBigNumber, Date.now());
    //     console.log('find details', planetDetails);

    //     // @ts-expect-error
    //     await df.hardRefreshPlanet(p.locationId);

    //     //findArgsList.push(findArgs);
    //   }      // 3 is rip
    //   else if (p.planetType === PlanetType.TRADING_POST) {
    //     console.log('handling rip')
    //     console.log(`transferring ${pName}`);
    //     console.log(`my address ${wallet.address}, dao: ${daoPlayer.address}`);
    //     console.log(`planet has ${p.silver} silver`)
    //     await coreContract.transferOwnership(pBigNumber, daoPlayer.address);
    //     await coreContract.refreshPlanet(pBigNumber);
    //     // @ts-expect-error -> will update planet to show silver gone
    //     await df.hardRefreshPlanet(p.locationId);
        
    //     const freshP = await coreContract.planets(pBigNumber)
    //     console.log(`${pName} owner is now ${freshP.owner} with ${freshP.silver} silver`);
    //   }
    //   else {
    //     console.log('cannot gift this planet')
    //     continue;
    //   }

    //   // const contributionsBefore = await daoPlayer.contributions(wallet.address)

    //   // const processTx = await daoPlayer.processAndReturnPlanets(locationIds, findArgsList);

    //   // // @ts-expect-error -> will update planet to show silver gone
    //   // await df.hardRefreshPlanet(p.locationId);

    //   // await processTx.wait();

    //   // const contributionsAfter = await daoPlayer.contributions(wallet.address)

    //   // console.log(`score before: ${contributionsBefore} score after: ${contributionsAfter}`);
    // };
    

  }
  const giftFoundrys = async (foundries: Planet[]) => {

  };
  // const giftRips = async (rips: Planet[]) => {
    
  //   console.log('handling rip')
  //   console.log(`transferring ${pName}`);
  //   console.log(`my address ${wallet.address}, dao: ${daoPlayer.address}`);
  //   console.log(`planet has ${p.silver} silver`)
  //   await coreContract.transferOwnership(pBigNumber, daoPlayer.address);
  //   await coreContract.refreshPlanet(pBigNumber);
  //   // @ts-expect-error -> will update planet to show silver gone
  //   await df.hardRefreshPlanet(p.locationId);
    
  //   const freshP = await coreContract.planets(pBigNumber)
  //   console.log(`${pName} owner is now ${freshP.owner} with ${freshP.silver} silver`);
  // };
 
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
          <button onClick={contribute}>contribute</button>
          <button onClick={checkDaoOwnership}>check dao ownership</button>
        </div>
      </div>
    );
  return content;
}
