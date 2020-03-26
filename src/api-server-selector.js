import { html, LitElement } from 'lit-element';
import { AmfHelperMixin } from '@api-components/amf-helper-mixin/amf-helper-mixin.js';
import { EventsTargetMixin } from '@advanced-rest-client/events-target-mixin/events-target-mixin.js';

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
 * - Server value: the server id (for listed servers in the model), the URL
 *    value (when custom URL is selected), or the value of the `anypoint-item`
 *    component rendered into the extra slot
 * - Selected type: `server` | `custom` | `extra`
 *    - `server`: server from the AMF model
 *    - `custom`: custom URL input change
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
       * Holds the current servers to show in in the dropdown menu
       */
      _servers: { type: Array },
      _selectedIndex: { type: Number },
      _selectedValue: { type: String },
      _endpointId: { type: String },
      _methodId: { type: String },
    };
  }

  set servers(value) {
    const old = this._servers;
    if (old === value) {
      return;
    }

    this._servers = value;
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

  handleNavigationChange(e) {
    const { selected, type, endpointId } = e.detail;
    const serverDefinitionAllowedTypes = ['endpoint', 'method'];
    if (serverDefinitionAllowedTypes.indexOf(type) === -1) {
      return;
    }
    const oldServers = this.servers;
    this.updateServers({ id: selected, type, endpointId });
    this._checkForSelectedChange(oldServers);
  }

  _checkForSelectedChange(oldServers) {
    if (!oldServers) {
      oldServers = [];
    }
    if (this._selectedIndex === undefined || this._selectedIndex === null) {
      return;
    }
    let newIndex;
    let newValue = this._selectedValue;
    const isModelServerSelected = this._selectedIndex < oldServers.length
    if (isModelServerSelected) {
      const indexInNewServers = this._getIndexOfServer(this._selectedValue, this.servers)
      if (indexInNewServers > -1) {
        newIndex = indexInNewServers;
        // this._changeSelected({ selectedIndex: indexInNewServers, selectedValue: this._selectedValue })
      } else {
        newIndex = undefined;
        newValue = undefined;
        // this._resetSelectedServer();
      }
    } else {
      const serverOffest = this.servers.length - oldServers.length;
      newIndex = this._selectedIndex + serverOffest;
      // this._changeSelected({ selectedIndex: newIndex, selectedValue: this._selectedValue })
    }
    this._changeSelected({ selectedIndex: newIndex, selectedValue: newValue })
  }

  _getIndexOfServer(serverId, servers) {
    for (let i = 0; i < servers.length; i++) {
      const server = servers[i];
      if (this._getValue(server, '@id') === serverId) {
        return i;
      }
    }
    return -1;
  }

  _resetSelectedServer() {
    this._changeSelected({ selectedIndex: undefined, selectedValue: undefined });
  }

  _getServerValue(server) {
    if (server) {
      return this._getValue(server, '@id');
    }
    return undefined;
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
      this.methodId = methodId = id;
    }
    if (type === 'endpoint') {
      endpointId = id;
    }
    this.endpointId = endpointId;
    this.servers = this._getServers({ endpointId, methodId });
  }

  /**
   * Handler for the listbox's change event
   * @param {CustomEvent} e 
   */
  handleSelectionChanged(e) {
    const { selectedItem } = e.target
    const { value } = e.detail
    if (!selectedItem) {
      return;
    }
    const selectedValue = selectedItem.getAttribute('value');
    if (selectedValue === this._selectedValue) {
      return;
    }
    const selectedIndex = value;
    this._changeSelected({ selectedIndex, selectedValue });
  }

  /**
   * 
   * @param {Object} params Composed object
   * @param {Number} params.selectedIndex The index of the selected item in the listbox
   * @param {String} params.selectedValue The value of the selected item in the listbox
   */
  _changeSelected({ selectedIndex, selectedValue }) {
    if (selectedIndex === this._selectedIndex && selectedValue === this._selectedValue) {
      return;
    }
    this._selectedIndex = selectedIndex;
    this._selectedValue = selectedValue;
    dispatchEvent(
      new CustomEvent('api-server-changed', {
        detail: { value: selectedValue },
      }),
    );
  }

  /**
   * Call the render functions for
   * - Server options (from AMF Model)
   * - Custom URL option
   * - Extra slot
   * @return {TemplateResult} The combination of all options
   */
  renderItems() {
    return html`
      ${this.renderServerOptions()}
      ${this.renderCustomURLOption()}
      ${this.renderExtraSlot()}
    `;
  }

  renderServerOptions() {
    const { servers } = this;
    const key = this._getAmfKey(this.ns.aml.vocabularies.core.urlTemplate);
    const toAnypointItem = (server) => {
      const urlTemplate = this._getValue(server, key);
      return html`
      <anypoint-item value="${this._getServerValue(server)}">${urlTemplate}</anypoint-item>
    `;
    };
    return servers ? servers.map(toAnypointItem) : [];
  }

  /**
   * @return {TemplateResult} Custom URL `anypoint-item`
   */
  renderCustomURLOption() {
    return html`
      <anypoint-item value="custom">Custom URL</anypoint-item>
    `;
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
      return html`
        <slot name="api-server-extra-slot"></slot>
      `;
    }
    return undefined;
  }

  render() {
    // TODO
    // Add input/label with server baseURI considering when URL is editable and when it is readonly
    const { _selectedIndex } = this
    return html`
    <anypoint-dropdown-menu>
      <label slot="label">Select server</label>
      <anypoint-listbox
        .selected="${_selectedIndex}"
        @selected-changed="${this.handleSelectionChanged}"
        slot="dropdown-content"
        tabindex="-1"
      >
        ${this.renderItems()}
      </anypoint-listbox>
    </anypoint-dropdown>
    `;
  }

  _attachListeners(node) {
    super._attachListeners(node);
    node.addEventListener('api-navigation-selection-changed', this.handleNavigationChange.bind(this));
  }

  _detachListeners(node) {
    super._detachListeners(node);
    node.removeEventListener('api-navigation-selection-changed', this.handleNavigationChange.bind(this));
  }
}
