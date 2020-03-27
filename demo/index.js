import { html } from 'lit-element';
import { ApiDemoPage } from '@advanced-rest-client/arc-demo-helper';
import '@advanced-rest-client/arc-demo-helper/arc-interactive-demo.js';
import '@anypoint-web-components/anypoint-checkbox/anypoint-checkbox.js';
import '../api-server-selector.js';

class DemoPage extends ApiDemoPage {
  constructor() {
    super();
    // list of properties that will trigger `render()` when changed
    this.initObservableProperties([
      'demoState',
      'outlined',
      'extraOptions',
      'servers',
    ]);
    this._componentName = 'api-server-selector';
    this.renderViewControls = true;
    this.darkThemeActive = false;
    this.demoStates = ['Filled', 'Outlined', 'Anypoint'];
    this.extraOptions = false;
  }

  _demoStateHandler(e) {
    const state = e.detail.value;
    this.demoState = state;
    this.outlined = state === 1;
    this.compatibility = state === 2;
    this._updateCompatibility();
  }

  // overrides base method for navigation change
  _navChanged(e) {
    // endpointId is only set when type === method
    const { selected, type, endpointId } = e.detail;
    if (['method', 'endpoint'].indexOf(type) === -1) {
      this.servers = null;
      return;
    }
    // by convention, I am usually using `setData()` function to do AMF
    // computations but it could be done here
    this.setData(type, selected, endpointId);
  }

  setData(type, selected, endpointId) {
    // todo: extract servers definition from the AMF model for current selection.
    const opts = {};
    if (type === 'method') {
      opts.methodId = selected;
      opts.endpointId = endpointId;
    } else {
      opts.endpointId = selected;
    }
    // the result should be set on the `servers` variable which is "observable"
    this.servers = this._getServers(opts);
    console.log(this.servers);
  }


  _demoTemplate() {
    const {
      amf,
      demoStates,
      darkThemeActive,
      compatibility,
      outlined,
      demoState,
      extraOptions,
      servers,
    } = this;
    return html`
      <section class="documentation-section">
        <h3>Interactive demo</h3>
        <p>
          This demo lets you preview the OAS' server selector element with various
          configuration options.
        </p>

        <arc-interactive-demo
          .states="${demoStates}"
          .selectedState="${demoState}"
          @state-chanegd="${this._demoStateHandler}"
          ?dark="${darkThemeActive}"
        >

          <api-server-selector
            .amf="${amf}"
            ?compatibility="${compatibility}"
            ?outlined="${outlined}"
            ?extraOptions="${extraOptions}"
            .servers="${servers}"
            slot="content"
          ></api-server-selector>

          <label slot="options" id="mainOptionsLabel">Options</label>
          <anypoint-checkbox
            aria-describedby="mainOptionsLabel"
            slot="options"
            name="extraOptions"
            @change="${this._toggleMainOption}"
            >Extra options</anypoint-checkbox
          >
        </arc-interactive-demo>
      </section>
    `;
  }

  contentTemplate() {
    return html`
      <h2>API Server Selector</h2>
      ${this._demoTemplate()}
    `;
  }
}

const instance = new DemoPage();
instance.render();
window._demo = instance;
