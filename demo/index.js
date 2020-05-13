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
      'renderCustom',
      'servers',
      'selectedServer',
      'selectedType',
      'allowCustom',
      'serversCount',
      'autoSelect',
    ]);
    this.componentName = 'api-server-selector';
    this.renderViewControls = true;
    this.darkThemeActive = false;
    this.demoStates = ['Filled', 'Outlined', 'Anypoint'];
    this.renderCustom = false;
    this.allowCustom = true;
    this.autoSelect = true;
    this._apiSrvHandler = this._apiSrvHandler.bind(this);
    this._countHandler = this._countHandler.bind(this);
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
    // console.log(this.servers);
  }

  _apiSrvHandler(e) {
    const { value, type } = e.detail;
    this.selectedServer = value;
    this.selectedType = type;
    console.log('Selection changed', value, type);
  }

  _countHandler(e) {
    this.serversCount = e.detail.value;
  }

  _demoTemplate() {
    const {
      amf,
      demoStates,
      darkThemeActive,
      compatibility,
      outlined,
      demoState,
      servers,
      allowCustom,
      selectedServer,
      selectedType,
      serversCount,
      autoSelect,
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
        <div class="selector-container" slot="content">
          <api-server-selector
              .amf="${amf}"
              ?compatibility="${compatibility}"
              ?allowCustom="${allowCustom}"
              ?outlined="${outlined}"
              ?autoSelect="${autoSelect}"
              .servers="${servers}"
              .selected="${selectedServer}"
              .type="${selectedType}"
              @apiserverchanged="${this._apiSrvHandler}"
              @serverscountchanged="${this._countHandler}"
            >
            ${this._extraSlotItems()}
            </api-server-selector>
        </div>
          <label slot="options" id="mainOptionsLabel">Options</label>
          <anypoint-checkbox
            aria-describedby="mainOptionsLabel"
            slot="options"
            name="renderCustom"
            @change="${this._toggleMainOption}"
            >Add custom srv</anypoint-checkbox
          >
          <anypoint-checkbox
            aria-describedby="mainOptionsLabel"
            slot="options"
            name="allowCustom"
            checked
            @change="${this._toggleMainOption}"
            >Allow Custom</anypoint-checkbox
          >
          <anypoint-checkbox
            aria-describedby="mainOptionsLabel"
            slot="options"
            name="autoSelect"
            checked
            @change="${this._toggleMainOption}"
            >Auto select server</anypoint-checkbox
          >
        </arc-interactive-demo>

        ${selectedServer ? html`<p>Selected: ${selectedServer}</p>` : ''}
        ${serversCount ? html`<p>Servers count: ${serversCount}</p>` : ''}
      </section>
    `;
  }

  _extraSlotItems() {
    if (!this.renderCustom) {
      return;
    }
    const { compatibility } = this;
    return html`
    <div class="other-section" slot="custom-base-uri">Other options</div>
    <anypoint-item
      slot="custom-base-uri"
      value="http://customServer.com"
      ?compatibility="${compatibility}"
    >
      Mocking service
    </anypoint-item>
    <anypoint-item
      slot="custom-base-uri"
      value="http://customServer2.com"
      ?compatibility="${compatibility}"
    >
      Custom instance
    </anypoint-item>
    <anypoint-item
      slot="custom-base-uri"
      ?compatibility="${compatibility}"
    >
      Unselectable
    </anypoint-item>`;
  }

  contentTemplate() {
    return html`
      <h2>API Server Selector</h2>
      ${this._demoTemplate()}
    `;
  }

  _apiListTemplate() {
    return [
      ['demo-api', 'Demo API'],
      ['no-servers-api', 'No Servers API'],
    ].map(([file, label]) => html`
      <anypoint-item data-src="${file}-compact.json">${label} - compact model</anypoint-item>
      `);
  }
}

const instance = new DemoPage();
instance.render();
window._demo = instance;
