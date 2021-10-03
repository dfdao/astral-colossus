import { h, render } from "preact";
import { AppView } from "./views/AppView";
import { getContract, getCoreContract } from "./helpers/df";

class HumanColossusPlugin {
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
      const coreContract = await getCoreContract();
      render(
        <AppView contract={contract} coreContract={coreContract} />,
        container
      );
    } catch (err) {
      console.error("[HumanColossusPlugin] Error starting plugin:", err);
      render(<div>{err.message}</div>, this.container);
    }
  }

  destroy() {
    render(null, this.container);
  }
}

export default HumanColossusPlugin;
