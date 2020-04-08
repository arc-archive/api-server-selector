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
      hideCustom: { type: Boolean },
      /**
       * Holds the current servers to show in in the dropdown menu
       */
      servers: { type: Array },
      endpointId: { type: String },
      methodId: { type: String },
      uri: { type: String },
      /**
       * Currently selected type of an base URI.
       */
      selectedType: { type: String },
      _selectedIndex: { type: Number },
      _selectedValue: { type: String },
      hidden: { type: Boolean },
    };
  }

  constructor() {
    super();
    this._handleNavigationChange = this._handleNavigationChange.bind(this);
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

    this._selectedIndex = this._getCustomUriIndex();
    this.selectedType = 'custom';
    this._selectedValue = value;
    this._baseUri = value;
    this.requestUpdate('baseUri', old);
  }

  get selectedValue() {
    return this._selectedValue;
  }

  set selectedValue(value) {
    const old = this._selectedValue;
    if (old === value) {
      return;
    }

    if (this._isValueValid(value)) {
      const selectedIndex = this._getIndexForValue(value)
      const selectedValue = value;
      this._selectedIndex = selectedIndex;
      this._selectedValue = selectedValue;
      this.uri = selectedValue;
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

  get uri() {
    return this.baseUri || this._uri || '';
  }

  set uri(value) {
    const old = this._uri;
    if (value === old) {
      return;
    }
    this._uri = value;
    const selectedType = this.selectedType;
    this.dispatchEvent(
      new CustomEvent('api-server-changed', {
        detail: {
          value,
          selectedValue: value,
          selectedType,
        },
        bubbles: true,
        composed: true,
      }),
    );
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

  _isValueValid(value) {
    if (this.isCustom) {
      return true;
    }

    return Boolean(this._findServerByValue(value));
  }

  _findServerByValue(value) {
    const { servers = [] } = this;
    return servers.find(server => this._getServerUri(server) === value)
  }

  _getIndexForValue(value) {
    if (this.isCustom) {
      return this._getCustomUriIndex();
    }

    if (this.selectedType === 'slot') {
      return this._getCustomUriIndex() - 1;
    }

    const server = this._findServerByValue(value);
    return this._getIndexOfServer(this._getServerValue(server), this.servers);
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
   * @param {?Object} params Composed object
   * @param {?Number} params.selectedIndex The index of the selected item in the listbox
   * @param {?String} params.selectedValue The value of the selected item in the listbox
   */
  _changeSelected({ selectedIndex, selectedValue } = {}) {
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

  /**
   * Retrieves custom base uris elements assigned to the
   * custom-base-uri slot
   *
   * @return {Array} Elements assigned to custom-base-uri slot
   */
  _getExtraServers() {
    const slot = this.shadowRoot.querySelector('slot[name="custom-base-uri"]');
    return slot ? slot.assignedElements() : [];
  }

  /**
   * Retrieves custom base uri option's index
   *
   * @return {Number} custom base uri option's index
   */
  _getCustomUriIndex() {
    const { servers = [] } = this
    const extraServers = this._getExtraServers();
    return servers.length + extraServers.length;
  }

  _getSelectedType(selectedIndex) {
    const { servers = [] } = this
    const customUriIndex = this._getCustomUriIndex()
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
    this.uri = value;
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
    if (this.hideCustom) {
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
    return html`<slot name="custom-base-uri"></slot>`;
  }

  _renderUriInput() {
    return html`<anypoint-input class="uri-input" @input=${this._handleUriChange} value="${this.uri}">
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
