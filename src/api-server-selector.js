import { html, LitElement } from 'lit-element';
import { AmfHelperMixin } from '@api-components/amf-helper-mixin/amf-helper-mixin.js';
import { EventsTargetMixin } from '@advanced-rest-client/events-target-mixin/events-target-mixin.js';
import '@anypoint-web-components/anypoint-input/anypoint-input.js';
import '@anypoint-web-components/anypoint-dropdown-menu/anypoint-dropdown-menu.js';
import '@anypoint-web-components/anypoint-listbox/anypoint-listbox.js';
import '@anypoint-web-components/anypoint-item/anypoint-item.js';
import '@anypoint-web-components/anypoint-button/anypoint-icon-button.js';
import { close } from '@advanced-rest-client/arc-icons/ArcIcons.js';
import styles from './styles.js';

/** @typedef {import('lit-html').TemplateResult} TemplateResult */

/**
 * @typedef {Object} SelectionInfo
 * @property {String} type Type of detected selection
 * @property {String} value Normalized value to be used as editor value
 */

const apiChangeEventType = 'api-server-changed';
const serverCountEventType = 'servers-count-changed';

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
 *    value (when custom base URI is selected), or the value of the `anypoint-item`
 *    component rendered into the extra slot
 * - Selected type: `server` | `custom` | `extra`
 *    - `server`: server from the AMF model
 *    - `custom`: custom base URI input change
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
       * If activated, `Custom base URI` will be in the dropdown options
       */
      allowCustom: { type: Boolean, reflect: true  },

      /**
       * Holds the current servers to show in in the dropdown menu
       */
      servers: { type: Array },

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
       * Enables outlined material theme
       */
      outlined: { type: Boolean },

      /**
       * Enables compatibility with the anypoint platform
       */
      compatibility: { type: Boolean },

      /**
       * Holds the size of rendered custom servers.
       */
      _customNodesCount: { type: Number },

      /**
       * When set it automaticallt selected the first server from the list
       * of servers when selection is missing.
       */
      autoSelect: { type: Boolean },
    };
  }

  get styles() {
    return styles;
  }

  /**
   * @return {Array<Element>} List of rendered items in the drop down.
   */
  get _listItems() {
    const node = /** @type {any} */ (this.shadowRoot.querySelector('anypoint-listbox'));
    return node ? node.items : [];
  }

  /**
   * @param {Array<Object>} value List of servers to set
   */
  set servers(value) {
    const old = this._servers;
    if (old === value) {
      return;
    }

    this._servers = value;
    this._updateServerSelection(value);
    this.requestUpdate('servers', old);
    this._notifyServersCount();
  }

  get servers() {
    return this._servers || [];
  }

  get selected() {
    return this._selectedValue;
  }

  get allowCustom() {
    return this._allowCustom;
  }

  set allowCustom(value) {
    const old = this.allowCustom;
    if (old === value) {
      return;
    }

    this._allowCustom = value;
    this._notifyServersCount();
    this.requestUpdate('allowCustom', old);
  }

  get baseUri() {
    return this._baseUri;
  }

  set baseUri(value) {
    const old = this._baseUri;
    if (old === value) {
      return;
    }
    this.selectedType = 'custom';
    this.selectedValue = value;
    this._baseUri = value;
    this.requestUpdate('baseUri', old);
  }

  get selectedValue() {
    return this.baseUri || this._selectedValue;
  }

  /**
   * Sets currenlty rendered value.
   * If the value is not one of the drop down options then it renders custom control.
   *
   * This can be used to programatically set a value of the control.
   *
   * @param {String} value The value to render.
   */
  set selectedValue(value) {
    if (this.baseUri) {
      return;
    }
    const old = this._selectedValue;
    if (old === value) {
      return;
    }
    const { type, value: effectiveValue } = this._selectionInfo(value);
    if (this.selectedType !== type) {
      this.selectedType = type;
    }
    this._selectedValue = effectiveValue;
    this.requestUpdate('selectedValue', old);
    this.dispatchEvent(
      new CustomEvent(apiChangeEventType, {
        detail: {
          selectedValue: effectiveValue,
          selectedType: this.selectedType,
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

  /**
   * @return {EventListenerObject|null} Previously registed callback function for
   * the `api-server-changed` event.
   */
  get onapiserverchange() {
    return this._onapiserverchange;
  }

  /**
   * @param {EventListenerObject} value A callback function to be called
   * when `api-server-changed` event is dispatched.
   */
  set onapiserverchange(value) {
    const old = this._onapiserverchange;
    if (old) {
      this.removeEventListener(apiChangeEventType, old);
    }
    const isFn = typeof value === 'function';
    if (isFn) {
      this._onapiserverchange = value;
      this.addEventListener(apiChangeEventType, value);
    } else {
      this._onapiserverchange = null;
    }
  }

  /**
   * @return {EventListenerObject|null} Previously registed callback function for
   * the `servers-count-changed` event.
   */
  get onserverscountchange() {
    return this._onserverscountchange || null;
  }

  /**
   * @param {EventListenerObject} value A callback function to be called
   * when `servers-count-changed` event is dispatched.
   */
  set onserverscountchange(value) {
    const old = this._onserverscountchange;
    if (old) {
      this.removeEventListener(serverCountEventType, old);
    }
    const isFn = typeof value === 'function';
    if (isFn) {
      this._onserverscountchange = value;
      this.addEventListener(serverCountEventType, value);
    } else {
      this._onserverscountchange = null;
    }
  }

  /**
   * @return {Number} Total number of list items being rendered.
   */
  get _serversCount() {
    const { allowCustom, servers, _customNodesCount=0 } = this;
    const offset = allowCustom ? 1 : 0;
    const serversCount = servers.length + _customNodesCount + offset;
    return serversCount;
  }

  constructor() {
    super();
    this._handleNavigationChange = this._handleNavigationChange.bind(this);
    this._customNodesCount = 0;
  }

  firstUpdated() {
    this._notifyServersCount();
  }

  _attachListeners(node) {
    super._attachListeners(node);
    node.addEventListener('api-navigation-selection-changed', this._handleNavigationChange);
  }

  _detachListeners(node) {
    super._detachListeners(node);
    node.removeEventListener('api-navigation-selection-changed', this._handleNavigationChange);
  }

  /**
   * Dispatches the `servers-count-changed` event with the current number of rendered servers.
   */
  _notifyServersCount() {
    const { _serversCount: serversCount } = this;
    this.dispatchEvent(new CustomEvent(serverCountEventType, { detail: { serversCount } }));
  }

  /**
   * A handler called when slotted number of children change.
   * It sets `_customNodesCount` proeprty with the number of properties
   * and notifies the change.
   */
  _childrenHandler() {
    const nodes = this._getExtraServers();
    this._customNodesCount = nodes.length;
    this._notifyServersCount();
  }

  /**
   * @override callback function when AMF change.
   * This is asynchronous operation.
   */
  __amfChanged() {
    this.updateServers();
    this.selectIfNeeded();
  }

  /**
   * Executes auto selection logic.
   * It selectes a fist available sever from the serves list when AMF or operation
   * selection changed.
   * When there's already valid selection then it does nothing.
   */
  selectIfNeeded() {
    const { selectedValue, isCustom, autoSelect } = this;
    if (isCustom || !autoSelect) {
      return;
    }
    if (!selectedValue) {
      const srv = this.servers[0];
      if (!srv) {
        return;
      }
      this.selectedValue = this._getServerUri(srv);
    }
  }

  /**
   * Collects information about selection from the current value.
   * @param {String} value Current value for the server URI.
   * @return {SelectionInfo} A selection info object
   */
  _selectionInfo(value) {
    const { isCustom } = this;
    const result = {
      type: 'server',
      value
    };
    if (isCustom) {
      result.type = 'custom';
      return result;
    }
    const items = this._listItems;
    const node = items.find((node) => node.getAttribute('value') === value);
    if (!node) {
      return result;
    }
    if (value === 'custom') {
      result.value = '';
      result.type = 'custom';
      return result;
    }
    const slot = node.getAttribute('slot');
    const isSlotted = slot === 'custom-base-uri';
    if (isSlotted) {
      result.type = 'slot';
    } else {
      result.type = 'server';
    }
    return result;
  }

  /**
   * Handler for the `api-navigation-selection-changed` event.
   * @param {CustomEvent} e
   */
  _handleNavigationChange(e) {
    const { selected, type, endpointId } = e.detail;
    const serverDefinitionAllowedTypes = ['endpoint', 'method'];
    if (serverDefinitionAllowedTypes.indexOf(type) === -1) {
      return;
    }
    this.updateServers({ id: selected, type, endpointId });
    this.selectIfNeeded();
  }

  /**
   * Takes care of recognizing whether a server selection should be cleared.
   * This happes when list of servers change and with the new list of server
   * current selection does not exist.
   * This ignores the selection when current type is not a `server`.
   *
   * @param {Array<Object>} servers List of new servers
   */
  _updateServerSelection(servers) {
    if (!servers || this.selectedType !== 'server') {
      return;
    }
    const index = this._getServerIndexByUri(servers, this.selectedValue);
    if (index === -1) {
      this._resetSelection();
    }
  }

  /**
   * @param {Array<Object>} servers List of current servers
   * @param {String} value The value to look for
   * @return {Number} The index of found server or -1 if none found.
   */
  _getServerIndexByUri(servers, value) {
    for (let i = 0; i < servers.length; i++) {
      const server = servers[i];
      if (this._getServerUri(server) === value) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Update component's servers.
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
    this.servers = this._getServers({ endpointId, methodId });
  }

  /**
   * Handler for the listbox's change event
   * @param {CustomEvent} e
   */
  _handleSelectionChanged(e) {
    const { selectedItem } = /** @type {any} */ (e.target);
    if (!selectedItem) {
      return;
    }
    const selectedValue = selectedItem.getAttribute('value');
    this.selectedValue = selectedValue;
  }

  /**
   * Retrieves custom base uris elements assigned to the
   * custom-base-uri slot
   *
   * @return {Array<Element>} Elements assigned to custom-base-uri slot
   */
  _getExtraServers() {
    const slot = this.shadowRoot.querySelector('slot');
    const items = slot ? ( /** @type HTMLSlotElement */ (slot)).assignedElements({ flatten: true }) : [];
    return items.filter((elm) => elm.hasAttribute('value'));
  }

  /**
   * Handler for the input field change.
   * @param {Event} e
   */
  _handleUriChange(e) {
    const { value } = /** @type HTMLInputElement */ (e.target);
    this.selectedValue = value;
  }

  /**
   * Resets current selection to a default value.
   */
  _resetSelection() {
    this.selectedValue = '';
    this.selectedType = 'server';
    this.selectIfNeeded();
  }

  /**
   * Computes the URI of a server.
   * @param {Object} server Server definition to get the value from.
   * @return {String} Server base URI.
   */
  _getServerUri(server) {
    const key = this._getAmfKey(this.ns.aml.vocabularies.core.urlTemplate);
    return this._getValue(server, key);
  }

  render() {
    const { styles, isCustom } = this;
    return html`
    <style>${styles}</style>
    ${isCustom ? this._uriInputTemplate() : this._renderDropdown()}
    `;
  }

  /**
   * @return {TemplateResult} Template result for the custom input.
   */
  _uriInputTemplate() {
    const { compatibility, outlined, selectedValue } = this;
    return html`
    <anypoint-input
      class="uri-input"
      @input=${this._handleUriChange}
      value="${selectedValue}"
      ?compatibility="${compatibility}"
      ?outlined="${outlined}"
    >
      <label slot="label">Base URI</label>
      <anypoint-icon-button
        aria-label="Activate to clear and close custom editor"
        title="Clear and close custom editor"
        slot="suffix"
        @click="${this._resetSelection}"
        ?compatibility="${compatibility}"
      >
        <span class="icon">${close}</span>
      </anypoint-icon-button>
  </anypoint-input>`;
  }

  /**
   * @return {TemplateResult} Template result for the drop down element.
   */
  _renderDropdown() {
    const { compatibility, outlined, selectedValue } = this;
    return html`
    <anypoint-dropdown-menu
      class="api-server-dropdown"
      ?compatibility="${compatibility}"
      ?outlined="${outlined}"
    >
      <label slot="label">Select server</label>
      <anypoint-listbox
        .selected="${selectedValue}"
        @selected-changed="${this._handleSelectionChanged}"
        slot="dropdown-content"
        tabindex="-1"
        ?compatibility="${compatibility}"
        ?outlined="${outlined}"
        attrforselected="value"
      >
        ${this._renderItems()}
      </anypoint-listbox>
    </anypoint-dropdown-menu>`;
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
   * @return {TemplateResult|string} Custom URI `anypoint-item`
   */
  _renderCustomURIOption() {
    const { allowCustom, compatibility } = this;
    if (!allowCustom) {
      return '';
    }
    return html`<anypoint-item
      class="custom-option"
      value="custom"
      ?compatibility="${compatibility}"
    >Custom base URI</anypoint-item>`;
  }

  /**
   * @return {TemplateResult} Template result for the drop down list
   * options for current servers
   */
  _renderServerOptions() {
    const { servers, compatibility } = this;
    const toAnypointItem = (server) => {
      return html`<anypoint-item
        value="${this._getServerUri(server)}"
        ?compatibility="${compatibility}"
      >
        ${this._getServerUri(server)}
      </anypoint-item>`;
    };
    return servers ? servers.map(toAnypointItem) : [];
  }

  /**
   * @return {TemplateResult} Template result for the `slot` element
   */
  _renderExtraSlot() {
    return html`<slot
      @slotchange="${this._childrenHandler}"
      name="custom-base-uri"
    ></slot>`;
  }
}
