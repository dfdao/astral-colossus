import { h } from "preact";
import { createContext } from "preact";
import { useState } from "preact/hooks";

export const TransactionContext = createContext([]);

export const TransactionProvider = (props) => {
  const [planets, setPlanets] = useState([]);

  return (
    <TransactionContext.Provider
      value={{ planets, setPlanets }}
      children={props.children}
    />
  );
};
