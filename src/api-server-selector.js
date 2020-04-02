import { html, LitElement, css } from 'lit-element';
import { AmfHelperMixin } from '@api-components/amf-helper-mixin/amf-helper-mixin.js';
import { EventsTargetMixin } from '@advanced-rest-client/events-target-mixin/events-target-mixin.js';
import '@anypoint-web-components/anypoint-input/anypoint-input.js';
import { close } from '@advanced-rest-client/arc-icons/ArcIcons.js';

/**
 * `api-server-selector`
 * An element to generate view model for server
 * elements from AMF model
 *
 * This component receives an AMF model, and listens
 * to navigation events to know which node's servers
 * it should render.
 *
 * When the selected server changes, it dispatches an `api-server-changed`
 * event, with the following details:
 * - Server value: the server id (for listed servers in the model), the URI
 *    value (when custom URI is selected), or the value of the `anypoint-item`
 *    component rendered into the extra slot
 * - Selected type: `server` | `custom` | `extra`
 *    - `server`: server from the AMF model
 *    - `custom`: custom URI input change
 *    - `extra`: extra slot's anypoint-item `value` attribute (see below)
 *
 * Adding extra slot:
 * This component renders a `slot` element to render anything the users wants
 * to add in there. To enable this, sit the `extraOptions` value in this component
 * to true, and render an element associated to the slot name `api-server-extra-slot`.
 * The items rendered in this slot should be `anypoint-item` components, and have a
 * `value` attribute. This is the value that will be dispatched in the `api-server-changed`
 * event.
 *
 *
 *
 * @customElement
 * @demo demo/index.html
 * @appliesMixin AmfHelperMixin
 * @appliesMixin EventTargetMixin
 * @memberof ApiElements
 */
export class ApiServerSelector extends EventsTargetMixin(AmfHelperMixin(LitElement)) {
  static get properties() {
    return {
      /**
       * If set to true, it will render extra options slots
       */
      extraOptions: { type: Boolean },
      /**
       * The baseUri to override any server definition
       */
      baseUri: { type: String },
      /**
       * AMF model to be rendered
       */
      amf: { type: Object },
      /**
       * If this property is set, the dropdown and the uri input are
       * rendered in the same line
       */
      inline: { type: Boolean },
      /**
       * If activated, `Custom URI` will not be in the dropdown options
       */
      hideCustom: { type: Boolean },
      /**
       * Holds the current servers to show in in the dropdown menu
       */
      _servers: { type: Array },
      _selectedIndex: { type: Number },
      _selectedValue: { type: String },
      _selectedType: { type: String },
      _endpointId: { type: String },
      _methodId: { type: String },
      _uri: { type: String },
    };
  }

  constructor() {
    super();
    this.handleNavigationChange = this.handleNavigationChange.bind(this);
  }

  get styles() {
    return css`
      .inline {
        display: flex
      }

      .inline anypoint-input {
        margin: 16px 8px;
      }
    `;
  }

  set servers(value) {
    const old = this._servers;
    if (old === value) {
      return;
    }

    this._servers = value;
    this._checkForSelectedChange(old);
  }

  get servers() {
    return this._servers;
  }

  get selected() {
    return this._selectedValue;
  }

  set amf(model) {
    const old = this._amf;
    if (old === model) {
      return;
    }

    this._amf = model;
    this.updateServers({ id: undefined, type: undefined, endpointId: undefined });
  }

  get amf() {
    return this._amf;
  }

  get methodId() {
    return this._methodId;
  }

  set methodId(value) {
    const old = this._methodId;
    if (value === old) {
      return;
    }

    this._methodId = value;
  }

  get endpointId() {
    return this._endpointId;
  }

  set endpointId(value) {
    const old = this._endpointId;
    if (value === old) {
      return;
    }

    this._endpointId = value;
  }

  get uri() {
    return this.baseUri || this._uri || '';
  }

  set uri(value) {
    const old = this._uri;
    if (value === old) {
      return;
    }
    this._uri = value;
    dispatchEvent(
      new CustomEvent('api-server-changed', {
        detail: { value },
      }),
    );
  }

  set selectedType(value) {
    const old = this._selectedType;
    if (value === old) {
      return;
    }
    this._selectedType = value;
  }

  get selectedType() {
    return this._selectedType;
  }

  handleNavigationChange(e) {
    const { selected, type, endpointId } = e.detail;
    const serverDefinitionAllowedTypes = ['endpoint', 'method'];
    if (serverDefinitionAllowedTypes.indexOf(type) === -1) {
      return;
    }
    this.updateServers({ id: selected, type, endpointId });
  }

  _checkForSelectedChange(oldServers) {
    if (this._selectedIndex === undefined || this._selectedIndex === null) {
      return;
    }
    if (!oldServers) {
      oldServers = [];
    }
    let newIndex;
    let newValue = this._selectedValue;
    const isModelServerSelected = this._selectedIndex < oldServers.length
    if (!this.servers) {
      newIndex = undefined;
      newValue = undefined;
    } else if (isModelServerSelected) {
      const indexInNewServers = this._getIndexOfServer(this._selectedValue, this.servers)
      if (indexInNewServers > -1) {
        newIndex = indexInNewServers;
      } else {
        newIndex = undefined;
        newValue = undefined;
      }
    } else {
      const serverOffest = this.servers.length - oldServers.length;
      newIndex = this._selectedIndex + serverOffest;
    }
    this._changeSelected({ selectedIndex: newIndex, selectedValue: newValue })
  }

  /**
   * Search for a server in a list of search, comparing against AMF id
   *
   * @param {String} serverId The desired server to search for
   * @param {Array} servers The list of AMF server models to search in,
   * @return {Number} The index of the server, or -1 if not found
   */
  _getIndexOfServer(serverId, servers) {
    for (let i = 0; i < servers.length; i++) {
      const server = servers[i];
      if (this._getValue(server, '@id') === serverId) {
        return i;
      }
    }
    return -1;
  }

  _getServerValue(server) {
    if (server) {
      return this._getValue(server, '@id');
    }
    return '';
  }

  /**
   * Update component's servers
   *
   * @param {Object} selectedNodeParams The currently selected node parameters to set the servers for
   * @param {String} selectedNodeParams.id The selected node ID where servers should be fetched
   * @param {String} selectedNodeParams.type The selected node type where servers should be fetched
   * @param {?String} selectedNodeParams.endpointId Optional endpoint id the method id belongs to
   */
  updateServers({ id, type, endpointId }) {
    let methodId;
    if (type === 'method') {
      methodId = id;
    }
    if (type === 'endpoint') {
      endpointId = id;
    }
    this.methodId = methodId;
    this.endpointId = endpointId;
    this.servers = this._getServers({ endpointId, methodId });
  }

  /**
   * Handler for the listbox's change event
   * @param {CustomEvent} e
   */
  handleSelectionChanged(e) {
    const { selectedItem } = e.target;
    const { value } = e.detail;
    if (!selectedItem) {
      return;
    }
    const selectedValue = selectedItem.getAttribute('value');
    if (selectedValue === this._selectedValue) {
      return;
    }
    this._changeSelected({ selectedIndex: value, selectedValue });
  }

  /**
   *
   * @param {Object} params Composed object
   * @param {Number} params.selectedIndex The index of the selected item in the listbox
   * @param {String} params.selectedValue The value of the selected item in the listbox
   */
  _changeSelected({ selectedIndex, selectedValue }) {
    const oldValue = this._selectedValue;
    if (selectedIndex === this._selectedIndex && selectedValue === oldValue) {
      return;
    }
    const selectedType = this._getSelectedType(selectedIndex);
    this._setUri({ selectedIndex, selectedValue, selectedType });
    this._selectedIndex = selectedIndex;
    this._selectedValue = selectedValue;
    this.selectedType = selectedType;
  }

  _setUri({ selectedIndex, selectedValue, selectedType }) {
    let uri;
    if (selectedType === 'server') {
      uri = this._getServerUri(this.servers[selectedIndex]);
    } else if (selectedType === 'custom') {
      if (this.selectedType === 'custom') {
        uri = this.uri;
      } else {
        uri = '';
      }
    } else {
      // `extra`
      uri = selectedValue;
    }
    this.uri = uri;
  }

  _getSelectedType(selectedIndex) {
    let { servers } = this
    if (!servers) {
      servers = []
    }
    const serversLength = servers.length
    if (selectedIndex < serversLength) {
      return 'server';
    } else if (selectedIndex === serversLength) {
      return 'custom';
    } else {
      return 'extra';
    }
  }

  /**
   * Call the render functions for
   * - Server options (from AMF Model)
   * - Custom URI option
   * - Extra slot
   * @return {TemplateResult} The combination of all options
   */
  renderItems() {
    return html`
      ${this.renderServerOptions()}
      ${this.renderCustomURIOption()}
      ${this.renderExtraSlot()}
    `;
  }

  _getServerUri(server) {
    const key = this._getAmfKey(this.ns.aml.vocabularies.core.urlTemplate);
    return this._getValue(server, key);
  }

  renderServerOptions() {
    const { servers } = this;

    const toAnypointItem = (server) => {

      return html`<anypoint-item value="${this._getServerValue(server)}">
        ${this._getServerUri(server)}
      </anypoint-item>`;
    };
    return servers ? servers.map(toAnypointItem) : [];
  }

  /**
   * @return {TemplateResult} Custom URI `anypoint-item`
   */
  renderCustomURIOption() {
    if (this.hideCustom) {
      return '';
    }
    return html`<anypoint-item class="custom-option" value="custom">Custom URI</anypoint-item>`;
  }

  /**
   * Returns template result with `slot` element if
   * `extraOptions` attribute is enabled, or undefined if
   * it is not.
   * @return {TemplateResult|undefined}
   */
  renderExtraSlot() {
    const { extraOptions } = this;
    if (extraOptions) {
      return html`<slot name="api-server-extra-slot"></slot>`;
    }
    return '';
  }

  _handleUriChange(event) {
    const { value } = event.target;
    this.uri = value;
  }

  _resetSelection() {
    this._changeSelected({ selectedIndex: undefined, selectedValue: undefined });
  }

  render() {
    const { _selectedIndex, inline } = this;
    const isCustom = this._selectedType === 'custom';
    return html`<style>${this.styles}</style>
    <div class="${inline ? 'inline' : ''}">
      ${isCustom
        ? html`<anypoint-input class="uri-input" @input=${this._handleUriChange} value="${this.uri}">
          <label slot="label">Base URI</label>
          <anypoint-icon-button
            aria-label="Activate to clear and close custom editor"
            title="Clear and close custom editor"
            slot="suffix"
            @click="${this._resetSelection}"
          >
            <span class="icon">${close}</span>
          </anypoint-icon-button>
        </anypoint-input>`
        : html`<anypoint-dropdown-menu
        class="api-server-dropdown"
        ?hidden="${isCustom}"
        >
         <label slot="label">Select server</label>
         <anypoint-listbox
           .selected="${_selectedIndex}"
           @selected-changed="${this.handleSelectionChanged}"
           slot="dropdown-content"
           tabindex="-1"
         >
           ${this.renderItems()}
         </anypoint-listbox>
        </anypoint-dropdown-menu>`}
      
    </div>`;
  }

  _attachListeners(node) {
    super._attachListeners(node);
    node.addEventListener('api-navigation-selection-changed', this.handleNavigationChange);
  }

  _detachListeners(node) {
    super._detachListeners(node);
    node.removeEventListener('api-navigation-selection-changed', this.handleNavigationChange);
  }
}
