import { h, JSX, render } from "preact";

import { BasicView } from "./views/BasicView";

export default class ProspectPlugin {
  container: HTMLDivElement | null;

  constructor() {
    this.container = null;
  }

  async render(container: HTMLDivElement): Promise<void> {
    this.container = container;
    container.style.width = "500px";
    render(<BasicView />, container);
  }

  destroy(): void {
    if (this.container) {
      render(null, this.container);
    }
  }
}
