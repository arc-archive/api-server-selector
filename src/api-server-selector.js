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
 * to true, and render an element associated to the slot name `custom-base-uri`.
 * The items rendered in this slot should be `anypoint-item` components, and have a
 * `value` attribute. This is the value that will be dispatched in the `api-server-changed`
 * event.
 *
 *
 *
 * @customElement
 * @demo demo/index.html
 * @mixes AmfHelperMixin
 * @mixes EventTargetMixin
 * @extends LitElement
 */
export class ApiServerSelector extends EventsTargetMixin(AmfHelperMixin(LitElement)) {
  static get properties() {
    return {
      /**
       * The baseUri to override any server definition
       */
      baseUri: { type: String },
      /**
       * If activated, `Custom URI` will not be in the dropdown options
       */
      noCustom: { type: Boolean, reflect: true  },
      /**
       * Holds the current servers to show in in the dropdown menu
       */
      servers: { type: Array },
      endpointId: { type: String },
      methodId: { type: String },
      /**
       * Currently selected type of an base URI.
       * `server` | `slot` | `custom`
       */
      selectedType: { type: String },
      /**
       * Current value of the server
       * Always a URI value
       */
      selectedValue: { type: String },
      /**
       * Current selected server index
       */
      _selectedIndex: { type: Number },
      /**
       * If activated, server selector will not be visible
       */
      hidden: { type: Boolean, reflect: true },
    };
  }

  constructor() {
    super();
    this._handleNavigationChange = this._handleNavigationChange.bind(this);
  }

  firstUpdated() {
    this._notifyServersCount()
  }

  get styles() {
    return css`
    :host{
      display: block;
    }

    :host([hidden]) {
      display: none;
    }

    .icon {
      display: inline-block;
      width: 24px;
      height: 24px;
      fill: currentColor;
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
    this.requestUpdate('servers', old);
    this._notifyServersCount();
  }

  get servers() {
    return this._servers || [];
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
    this.updateServers();
  }

  get amf() {
    return this._amf;
  }

  get baseUri() {
    return this._baseUri;
  }

  set baseUri(value) {
    const old = this._baseUri;
    if (old === value) {
      return;
    }

    this._selectedIndex = this._getServersCount();
    this.selectedType = 'custom';
    this._selectedValue = value;
    this._baseUri = value;
    this.requestUpdate('baseUri', old);
  }

  get selectedValue() {
    return this.baseUri || this._selectedValue;
  }

  set selectedValue(value) {
    if (this.baseUri) {
      return;
    }
    const old = this._selectedValue;
    if (old === value) {
      return;
    }

    if (this._isValueValid(value)) {
      const selectedIndex = this._getIndexForValue(value)
      const selectedValue = value;
      const selectedType = this.selectedType;
      this._selectedIndex = selectedIndex;
      this._selectedValue = selectedValue;
      this.requestUpdate('selectedValue', old);
      this.dispatchEvent(
        new CustomEvent('api-server-changed', {
          detail: {
            selectedValue,
            selectedType,
          },
          bubbles: true,
          composed: true,
        }),
      );
    }
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

  /**
   * @return {Boolean} True if selected type is "custom" type.
   */
  get isCustom() {
    return this.selectedType === 'custom';
  }

  _attachListeners(node) {
    super._attachListeners(node);
    node.addEventListener('api-navigation-selection-changed', this._handleNavigationChange);
  }

  _detachListeners(node) {
    super._detachListeners(node);
    node.removeEventListener('api-navigation-selection-changed', this._handleNavigationChange);
  }

  _notifyServersCount() {
    const { noCustom = false } = this
    const customServer = noCustom ? 0 : 1
    const serversCount = this._getServersCount() + customServer;
    this.dispatchEvent(new CustomEvent('servers-count-changed', { detail: { serversCount } }));
  }

  _isValueValid(value) {
    if (!this.selectedType && !value) {
      return true;
    }
    switch (this.selectedType) {
      case 'server':
        return Boolean(this._findServerByValue(value));
      case 'slot':
        return this._getIndexForSlotValue(value) > -1;
      case 'custom':
        return true;
      default:
        return !value;
    }
  }

  _findServerByValue(value) {
    const { servers } = this;
    if (!servers) {
      return undefined;
    }
    return servers.find(server => this._getServerUri(server) === value)
  }

  _findServerById(id) {
    const { servers } = this;
    if (!servers) {
      return undefined;
    }
    return servers.find(server => this._getServerValue(server) === id)
  }

  _getIndexForSlotValue(value) {
    const { servers = [] } = this;
    const extraServers = this._getExtraServers();
    if (!extraServers) {
      return -1;
    }
    const server = extraServers.find(elem => elem.getAttribute('value') === value);
    return extraServers.indexOf(server) + servers.length;
  }

  _getIndexForValue(value) {
    if (this.isCustom) {
      return this._getServersCount();
    }

    if (this.selectedType === 'slot') {
      return this._getIndexForSlotValue(value);
    }

    if (this.selectedType === 'server') {
      const server = this._findServerByValue(value);
      return this._getIndexOfServer(this._getServerValue(server), this.servers);
    }

    return undefined;
  }

  _handleNavigationChange(e) {
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
      const indexInNewServers = this._getIndexOfServerByUri(this._selectedValue, this.servers)
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

  _getIndexOfServerByUri(value, servers) {
    for (let i = 0; i < servers.length; i++) {
      const server = servers[i];
      if (this._getServerUri(server) === value) {
        return i;
      }
    }
    return -1;
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
   * @param {?Object} selectedNodeParams The currently selected node parameters to set the servers for
   * @param {String} selectedNodeParams.id The selected node ID where servers should be fetched
   * @param {String} selectedNodeParams.type The selected node type where servers should be fetched
   * @param {?String} selectedNodeParams.endpointId Optional endpoint id the method id belongs to
   */
  updateServers({ id, type, endpointId } = {}) {
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
  _handleSelectionChanged(e) {
    const { selectedItem } = e.target;
    const selectedIndex = e.detail.value;
    if (!selectedItem) {
      return;
    }
    let selectedValue = selectedItem.getAttribute('value');
    if (this._isServerIndex(selectedIndex)) {
      selectedValue = this._getServerUri(this._findServerById(selectedValue));
    } else if (this._isCustomIndex(selectedIndex) && !this.isCustom) {
      selectedValue = '';
    }
    if (selectedValue === this.selectedValue) {
      return;
    }
    this._changeSelected({ selectedIndex, selectedValue });
  }

  _isServerIndex(index) {
    const { servers } = this;
    if (!servers) {
      return false;
    }
    return index < servers.length;
  }

  _isCustomIndex(index) {
    return index === this._getServersCount();
  }

  /**
   *
   * @param {?Object} params Composed object
   * @param {?Number} params.selectedIndex The index of the selected item in the listbox
   * @param {?String} params.selectedValue The URI value of the selected item in the listbox
   */
  _changeSelected({ selectedIndex, selectedValue } = {}) {
    const oldValue = this.selectedValue;
    if (selectedIndex === this._selectedIndex && selectedValue === oldValue) {
      return;
    }
    const selectedType = this._getSelectedType(selectedIndex);
    this.selectedType = selectedType;
    this._selectedIndex = selectedIndex;
    this.selectedValue = selectedValue;
  }

  /**
   * Retrieves custom base uris elements assigned to the
   * custom-base-uri slot
   *
   * @return {Array} Elements assigned to custom-base-uri slot
   */
  _getExtraServers() {
    const slot = this.shadowRoot.querySelector('slot[name="custom-base-uri"]');
    return slot ? slot.assignedElements({ flatten: true }) : [];
  }

  /**
   * Retrieves the total amount of servers being rendered, without counting customServer
   *
   * @return {Number} total amount of servers being rendered
   */
  _getServersCount() {
    const { servers = [] } = this
    const extraServers = this._getExtraServers();
    return servers.length + extraServers.length;
  }

  _getSelectedType(selectedIndex) {
    if (selectedIndex === null || selectedIndex === undefined) {
      return undefined;
    }
    const { servers = [] } = this
    const customUriIndex = this._getServersCount()
    if (selectedIndex < servers.length) {
      return 'server';
    } else if (selectedIndex === customUriIndex) {
      return 'custom';
    } else {
      return 'slot';
    }
  }

  _handleUriChange(event) {
    const { value } = event.target;
    this.selectedValue = value;
  }

  _resetSelection() {
    this._changeSelected();
  }

  render() {
    const { styles, isCustom } = this;
    return html`<style>${styles}</style>
    ${isCustom
        ? this._renderUriInput()
        : this._renderDropdown()}
    `;
  }

  /**
   * Call the render functions for
   * - Server options (from AMF Model)
   * - Custom URI option
   * - Extra slot
   * @return {TemplateResult} The combination of all options
   */
  _renderItems() {
    return html`
      ${this._renderServerOptions()}
      ${this._renderExtraSlot()}
      ${this._renderCustomURIOption()}
    `;
  }

  /**
   * @return {TemplateResult} Custom URI `anypoint-item`
   */
  _renderCustomURIOption() {
    if (this.noCustom) {
      return '';
    }
    return html`<anypoint-item class="custom-option" value="custom">Custom URI</anypoint-item>`;
  }

  _getServerUri(server) {
    const key = this._getAmfKey(this.ns.aml.vocabularies.core.urlTemplate);
    return this._getValue(server, key);
  }

  _renderServerOptions() {
    const { servers } = this;

    const toAnypointItem = (server) => {
      return html`<anypoint-item value="${this._getServerValue(server)}">
        ${this._getServerUri(server)}
      </anypoint-item>`;
    };
    return servers ? servers.map(toAnypointItem) : [];
  }

  /**
   * Returns template result with `slot` element
   * @return {TemplateResult}
   */
  _renderExtraSlot() {
    return html`<slot @slotchange="${this._notifyServersCount}" name="custom-base-uri"></slot>`;
  }

  _renderUriInput() {
    return html`<anypoint-input class="uri-input" @input=${this._handleUriChange} value="${this.selectedValue}">
    <label slot="label">Base URI</label>
    <anypoint-icon-button
      aria-label="Activate to clear and close custom editor"
      title="Clear and close custom editor"
      slot="suffix"
      @click="${this._resetSelection}"
    >
      <span class="icon">${close}</span>
    </anypoint-icon-button>
  </anypoint-input>`;
  }

  _renderDropdown() {
    return html`
    <anypoint-dropdown-menu class="api-server-dropdown">
      <label slot="label">Select server</label>
      <anypoint-listbox
        .selected="${this._selectedIndex}"
        @selected-changed="${this._handleSelectionChanged}"
        slot="dropdown-content"
        tabindex="-1"
      >
        ${this._renderItems()}
      </anypoint-listbox>
    </anypoint-dropdown-menu>`;
  }
}
