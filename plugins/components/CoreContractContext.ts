import { createContext } from "preact";
import type { DarkForestCore } from "@darkforest_eth/contracts/typechain";

interface CoreContractContextInterface {
  coreContract: DarkForestCore
}

export const CoreContractContext = createContext<CoreContractContextInterface | null>(null);
export const CoreContractProvider = CoreContractContext.Provider;
