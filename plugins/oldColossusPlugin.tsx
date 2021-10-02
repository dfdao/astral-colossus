import { h, JSX, render } from "preact";

import { ColossusView } from "./views/ColossusView"

export default class initDaoPlugin {
  container: HTMLDivElement | null;

  constructor() {
    this.container = null;
  }

  async render(container: HTMLDivElement): Promise<void> {
    console.log('rendered');
    this.container = container;
    container.style.width = "500px";
    //render(null, container);
    render(<ColossusView />, container);
  }

  destroy(): void {
    if (this.container) {
      render(null, this.container);
    }
  }
}
