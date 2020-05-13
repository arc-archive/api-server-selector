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

const apiChangeEventType = 'apiserverchanged';
const serverCountEventType = 'serverscountchanged';

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
       * When set the `Custom base URI` is rendered in the dropdown
       */
      allowCustom: { type: Boolean, reflect: true },

      /**
       * The current list of servers to render
       */
      servers: { type: Array },

      /**
       * Currently selected type of the input.
       * `server` | `uri` | `custom`
       */
      type: { type: String },

      /**
       * Current value of the server
       */
      value: { type: String },

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

      /**
       * A programmatic access to the opened state of the drop down.
       * Note, this does nothing when custom element is rendered.
       */
      opened: { type: Boolean },
    };
  }

  get styles() {
    return styles;
  }

  /**
   * @return {Array<String>} Computed list of all URI values from both the servers
   * and the list of rendered custom items.
   */
  get _serverValues() {
    const result = (this.servers || []).map((item) => this._getServerUri(item));
    return result.concat(this._customItems || []);
  }

  /**
   * @param {Array<Object>} value List of servers to set
   */
  set servers(value) {
    const old = this._servers;
    /* istanbul ignore if */
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

  get allowCustom() {
    return this._allowCustom;
  }

  set allowCustom(value) {
    const old = this.allowCustom;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }

    this._allowCustom = value;
    this._notifyServersCount();
    this.requestUpdate('allowCustom', old);
    if (!value && this.isCustom && !this._baseUri) {
      this._resetSelection();
    }
  }

  get baseUri() {
    return this._baseUri;
  }

  set baseUri(value) {
    const old = this._baseUri;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this.type = 'custom';
    this.value = value;
    this._baseUri = value;
    this.requestUpdate('baseUri', old);
  }

  /**
   * @return {String} Current base URI value from either (in order) the baseUri,
   * current value, or just empty string.
   */
  get value() {
    return this.baseUri || this._value || '';
  }

  /**
   * Sets currenlty rendered value.
   * If the value is not one of the drop down options then it renders custom control.
   *
   * This can be used to programatically set a value of the control.
   *
   * @param {String} value The value to render.
   */
  set value(value) {
    if (this.baseUri) {
      return;
    }
    const old = this._value;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    const { type, value: effectiveValue } = this._selectionInfo(value);
    if (type === 'custom' && !this.allowCustom) {
      return;
    }
    if (this.type !== type) {
      this.type = type;
    }
    this._value = effectiveValue;
    this.requestUpdate('value', old);
    this.dispatchEvent(
      new CustomEvent(apiChangeEventType, {
        detail: {
          value: effectiveValue,
          type: this.type,
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
    return this.type === 'custom';
  }

  /**
   * Checks whether the current value is a custom value related to current list of servers.
   * @return {Boolean} True if the value is not one of the server values or custom
   * servers.
   */
  get isValueCustom() {
    const { servers = [], value } = this;
    if (!value) {
      return false;
    }
    const srv = this._getServerIndexByUri(servers, value);
    if (srv !== -1) {
      return false;
    }
    return this._serverValues.indexOf(value) === -1;
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
    const { allowCustom, servers, _customNodesCount } = this;
    const offset = allowCustom ? 1 : 0;
    const serversCount = servers.length + _customNodesCount + offset;
    return serversCount;
  }

  constructor() {
    super();
    this._handleNavigationChange = this._handleNavigationChange.bind(this);
    this._customNodesCount = 0;
    this.value = '';
    this.opened = false;

    /**
     * A list of custom items rendered in the slot.
     * This property is received from the list box that mixes in `AnypointSelectableMixin`
     * that dispatches `items-changed` event when rendered items change.
     * @type {Array<String>}
     */
    this._customItems = [];
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
    const { _serversCount: value } = this;
    this.dispatchEvent(new CustomEvent(serverCountEventType, { detail: { value } }));
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
  async __amfChanged() {
    this.updateServers();
    await this.updateComplete;
    this.selectIfNeeded();
  }

  /**
   * Executes auto selection logic.
   * It selectes a fist available sever from the serves list when AMF or operation
   * selection changed.
   * If there are no servers, but there are custom slots available, then select
   * first custom slot
   * When there's already valid selection then it does nothing.
   */
  selectIfNeeded() {
    if (!this.autoSelect || this.isValueCustom) {
      return;
    }
    if (!this.value) {
      let srv = this.servers[0];
      if (srv) {
        this.value = this._getServerUri(srv);
      } else {
        srv = this._getExtraServers()[0];
        if (srv && this.amf) {
          this.type = 'custom';
          this.value = srv.getAttribute('value');
        }
      }

    }
  }

  /**
   * Collects information about selection from the current value.
   * @param {String} value Current value for the server URI.
   * @return {SelectionInfo} A selection info object
   */
  _selectionInfo(value = '') {
    const { isCustom } = this;
    // Default values.
    const result = {
      type: 'server',
      value
    };
    if (isCustom) {
      // prohibits closing the custom input.
      result.type = 'custom';
      return result;
    }
    if (!value) {
      // When a value is cleared it is always a server
      return result;
    }
    const values = this._serverValues;
    const index = values.indexOf(value);
    if (index === -1) {
      // no node in the dropdown with this value. Render custom input
      result.type = 'custom';
      return result;
    }
    const itemValue = values[index];
    const custom = this._customItems || [];
    const isSlotted = custom.indexOf(itemValue) !== -1;
    if (isSlotted) {
      result.type = 'uri';
    } else {
      result.type = 'server';
    }
    return result;
  }

  /**
   * Handler for the `api-navigation-selection-changed` event.
   * @param {CustomEvent} e
   */
  async _handleNavigationChange(e) {
    const { selected, type, endpointId } = e.detail;
    const serverDefinitionAllowedTypes = ['endpoint', 'method'];
    if (serverDefinitionAllowedTypes.indexOf(type) === -1) {
      return;
    }
    this.updateServers({ id: selected, type, endpointId });
    await this.updateComplete;
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
    if (!servers || this.type !== 'server') {
      return;
    }
    const index = this._getServerIndexByUri(servers, this.value);
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
   * @param {Object=} selectedNodeParams The currently selected node parameters to set the servers for
   * @param {String} selectedNodeParams.id The selected node ID where servers should be fetched
   * @param {String} selectedNodeParams.type The selected node type where servers should be fetched
   * @param {String=} selectedNodeParams.endpointId Optional endpoint id the method id belongs to
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
    let value = selectedItem.getAttribute('value');
    if (value === 'custom') {
      this.type = 'custom';
      value = '';
    }
    this.value = value;
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
    this.value = value;
  }

  /**
   * Resets current selection to a default value.
   */
  _resetSelection() {
    this.value = '';
    this.type = 'server';
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

  /**
   * Handler for the drop down's `opened-changed` event. It sets local value
   * for the opened flag.
   * @param {CustomEvent} e
   */
  _openedHandler(e) {
    this.opened = e.detail.value;
  }

  /**
   * Updates list of custom items rendered in the selector.
   * @param {CustomEvent} e
   */
  _listboxItemsHandler(e) {
    const { value } = e.detail;
    if (!Array.isArray(value) || !value.length) {
      this._customItems = [];
      return;
    }
    const result = [];
    value.forEach((node) => {
      const slot = node.getAttribute('slot');
      if (slot !== 'custom-base-uri') {
        return;
      }
      const value = node.getAttribute('value');
      if (!value) {
        return;
      }
      result.push(value);
    });
    this._customItems = result;
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
    const { compatibility, outlined, value } = this;
    return html`
    <anypoint-input
      class="uri-input"
      @input="${this._handleUriChange}"
      .value="${value}"
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
    const { compatibility, outlined, value, opened } = this;
    return html`
    <anypoint-dropdown-menu
      class="api-server-dropdown"
      ?compatibility="${compatibility}"
      ?outlined="${outlined}"
      .opened="${opened}"
      @opened-changed="${this._openedHandler}"
    >
      <label slot="label">Select server</label>
      <anypoint-listbox
        .selected="${value}"
        @selected-changed="${this._handleSelectionChanged}"
        slot="dropdown-content"
        tabindex="-1"
        ?compatibility="${compatibility}"
        ?outlined="${outlined}"
        attrforselected="value"
        selectable="[value]"
        @items-changed="${this._listboxItemsHandler}"
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
   * @return {Array<TemplateResult>} Template result for the drop down list
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
