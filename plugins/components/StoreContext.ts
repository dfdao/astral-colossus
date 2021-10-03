import { h } from "preact";
import { createContext } from "preact";

interface StoreContextInterface {
  isContributing: boolean
  setIsContributing: (state: boolean) => null
}

export const StoreContext = createContext<StoreContextInterface | null>(null);
export const StoreProvider = StoreContext.Provider;
