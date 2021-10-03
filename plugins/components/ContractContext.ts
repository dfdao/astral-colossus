import { createContext } from "preact";
import { HumanColossus } from "../types";

interface ContractContextInterface {
  colossus: HumanColossus
  colossusAddress: string
  colossusABI: string
}

export const ContractContext = createContext<ContractContextInterface | null>(null);
export const ContractProvider = ContractContext.Provider;
