import { Planet, PlanetType } from "@darkforest_eth/types";
import { ethers, ContractReceipt } from "ethers";
import { useState } from "preact/hooks";
import { useContract, useSelectedPlanet, useColossus, useStore } from '.'

export const useContribute = () => {
  const { isContributing, setIsContributing } = useStore()
  const { coreContract } = useContract()
  const { 
    handleFindAndReturn, 
    handleWithdrawAndReturn,
  } = useColossus()
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const selectedPlanet = useSelectedPlanet();
  const loading = isContributing
  const setLoading = setIsContributing

  const print = (msg: string) => {
    // @ts-expect-error
    df.terminal.current.println(msg);
    setStatus(msg)
  };


  const giftPlanets = async (planets: Planet[]) => {
    print(`examinining ${planets.length} planets`);

    const rips = planets.filter((p) => p.planetType == PlanetType.TRADING_POST);
    const foundries = planets.filter((p) => p.planetType == PlanetType.RUINS);

    print(`gifting planets`);
    // await returnPlanets(planets);
    // await handleRips(rips);
    const res = await handleWithdrawAndReturn(rips);
    // await handleFoundries(foundries);
    if (foundries.length == 1) {
      const response = await handleFindAndReturn(foundries[0]);
    }
    else {
      print(`can only handle 1 foundry`)
    }
   
    print(`finished gifting`);
    setLoading(false)
    setSuccess(true)
  };

  const contribute = async () => {
    setLoading(true)
    setSuccess(false)
    // @ts-expect-error
    const planet = await df.getPlanetWithId(selectedPlanet);
    console.log(`sending planet to gift: `, planet);

    // @ts-expect-error
    let planets = await df.getMyPlanets();

    // run on selected planet if exists
    if (planet) {
      planets = [planet];
    }
    print(
      `sending ${planets.length} candidates to giftPlanets`
    );
    await giftPlanets(planets);
  };

  return {
    contribute,
    status,
    loading,
    error,
    success
  }
}
