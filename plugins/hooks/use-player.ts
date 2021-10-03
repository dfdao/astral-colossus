import { ethers } from "ethers";

const CORE_CONTRACT_ADDRESS = '0x27a166aE00C33Bef64306760aCd7C9fD3c2fEB74'

const GAS_KEY = 'GasFeeGwei';

export function getLocalStorageSettingKey(
  account: any | undefined,
  setting: any
): string {
  if (account === undefined) {
    return CORE_CONTRACT_ADDRESS + ':anonymous:' + setting;
  }

  return CORE_CONTRACT_ADDRESS + ':' + account + ':' + setting;
}

export function getSetting(account: any | undefined, setting: any): string {
  const key = getLocalStorageSettingKey(account, setting);

  // console.log(`key for localStorage`, key);
  let valueInStorage = window.localStorage.getItem(key);

  if (valueInStorage === null) {
    valueInStorage = '10'; /* high lol */
  }
  // console.log(`gas ⛽️`, valueInStorage);
  return valueInStorage;
}

export const useGasPrice = (): string => {
  // @ts-expect-error
  return getSetting(df.account, GAS_KEY);
}

export const usePlayer = () => {
  // @ts-expect-error
  const provider = df.ethConnection.provider;
  // @ts-expect-error
  const wallet = new ethers.Wallet(df.getPrivateKey(), provider);

  return wallet
}