import { h, render } from "preact";
import { AppView } from "./views/AppView";
import { getContract } from "./helpers/df";

class CharityPlugin {
  container: HTMLDivElement | null;

  constructor() {
    this.container = null;
  }

  async render(container) {
    this.container = container;

    container.style.width = "600px";
    container.style.height = "400px";
    container.style.padding = 0;

    try {
      const contract = await getContract();
      render(<AppView contract={contract} />, container);
    } catch (err) {
      console.error("[CharityPlugin] Error starting plugin:", err);
      render(<div>{err.message}</div>, this.container);
    }
  }

  destroy() {
    render(null, this.container);
  }
}

export default CharityPlugin;
