import { createContext } from "preact";
import { DaoContractPlayer } from "../types";

interface ContractContextInterface {
  colossus: DaoContractPlayer
  colossusAddress: string
  colossusABI: string
}

export const ContractContext = createContext<ContractContextInterface | null>(null);
export const ContractProvider = ContractContext.Provider;
