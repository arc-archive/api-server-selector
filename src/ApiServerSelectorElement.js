/* eslint-disable arrow-body-style */
/* eslint-disable no-plusplus */
/* eslint-disable class-methods-use-this */
import { html, LitElement } from 'lit-element';
import { AmfHelperMixin, AmfSerializer } from '@api-components/amf-helper-mixin';
import '@anypoint-web-components/anypoint-input/anypoint-input.js';
import '@anypoint-web-components/anypoint-dropdown-menu/anypoint-dropdown-menu.js';
import '@anypoint-web-components/anypoint-listbox/anypoint-listbox.js';
import '@anypoint-web-components/anypoint-item/anypoint-item.js';
import '@anypoint-web-components/anypoint-button/anypoint-icon-button.js';
import { close } from '@advanced-rest-client/arc-icons/ArcIcons.js';
import elementStyles from './styles.js';
import { ServerEvents } from './ServerEvents.js';
import { EventTypes } from './EventTypes.js';

/** @typedef {import('lit-html').TemplateResult} TemplateResult */
/** @typedef {import('@api-components/amf-helper-mixin').AmfDocument} AmfDocument */
/** @typedef {import('@api-components/amf-helper-mixin').ApiServer} ApiServer */
/** @typedef {import('./types').SelectionInfo} SelectionInfo */
/** @typedef {import('./types').UpdateServersOptions} UpdateServersOptions */

export const customNodesCount = Symbol('customNodesCount');
export const allowCustomValue = Symbol('allowCustomValue');
export const baseUriValue = Symbol('baseUriValue');
export const valueValue = Symbol('valueValue');
export const customItems = Symbol('customItems');
export const serializerValue = Symbol('serializerValue');
export const serversValue = Symbol('serversValue');
export const onServersCountChangeValue = Symbol('onServersCountChangeValue');
export const onApiServerChange = Symbol('onApiServerChange');
export const selectedShapeValue = Symbol('selectedShapeValue');
export const selectedShapeTypeValue = Symbol('selectedShapeTypeValue');
export const getServerIndexByUri = Symbol('getServerIndexByUri');
export const getSelectionInfo = Symbol('getSelectionInfo');
export const getEndpointIdForMethod = Symbol('getEndpointIdForMethod');
export const getExtraServers = Symbol('getExtraServers');
export const processShapeChange = Symbol('processShapeChange');
export const resetSelection = Symbol('resetSelection');
export const updateServerSelection = Symbol('updateServerSelection');
export const notifyServersCount = Symbol('notifyServersCount');
export const setValue = Symbol('setValue');
export const customUriChangeHandler = Symbol('customUriChangeHandler');
export const selectionChangeHandler = Symbol('selectionChangeHandler');
export const childrenHandler = Symbol('childrenHandler');
export const dropDownOpenedHandler = Symbol('dropDownOpenedHandler');
export const listboxItemsHandler = Symbol('listboxItemsHandler');
export const slotTemplate = Symbol('slotTemplate');
export const selectorTemplate = Symbol('selectorTemplate');
export const selectorListTemplate = Symbol('selectorListTemplate');
export const serverListTemplate = Symbol('serverListTemplate');
export const serverListItemTemplate = Symbol('serverListItemTemplate');
export const customUriTemplate = Symbol('customUriTemplate');
export const customUriInputTemplate = Symbol('customUriInputTemplate');

/**
 * An element that renders a selection of servers defined in AMF graph model for an API.
 *
 * This component receives an AMF model, and selected node's id and type
 * to know which servers to render
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
 */
export default class ApiServerSelectorElement extends AmfHelperMixin(LitElement) {
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
       * When set it automatically selected the first server from the list
       * of servers when selection is missing.
       */
      autoSelect: { type: Boolean },

      /**
       * A programmatic access to the opened state of the drop down.
       * Note, this does nothing when custom element is rendered.
       */
      opened: { type: Boolean },

      /**
       * An `@id` of selected AMF shape.
       * When changed, it computes servers for the selection
       */
      selectedShape: { type: String },
      /**
       * The type of the selected AMF shape.
       * When changed, it computes servers for the selection
       */
      selectedShapeType: { type: String },
    };
  }

  get styles() {
    return elementStyles;
  }

  /**
   * @return {string[]} Computed list of all URI values from both the servers
   * and the list of rendered custom items.
   */
  get serverValues() {
    const result = (this.servers || []).map(item => item.url);
    return result.concat(this[customItems] || []);
  }

  /**
   * @param {ApiServer[]} value List of servers to set
   */
  set servers(value) {
    const old = this[serversValue];
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this[serversValue] = value;
    this[updateServerSelection](value);
    this.requestUpdate('servers', old);
    this[notifyServersCount]();
  }

  /**
   * @returns {ApiServer[]}
   */
  get servers() {
    return this[serversValue] || [];
  }

  /**
   * @returns {boolean}
   */
  get allowCustom() {
    return this[allowCustomValue];
  }

  /**
   * @param {boolean} value
   */
  set allowCustom(value) {
    const old = this.allowCustom;
    /* istanbul ignore if */
    if (old === value) {
      return;
    }

    this[allowCustomValue] = value;
    this[notifyServersCount]();
    this.requestUpdate('allowCustom', old);
    if (!value && this.isCustom && !this[baseUriValue]) {
      this[resetSelection]();
    }
  }

  get baseUri() {
    return this[baseUriValue];
  }

  set baseUri(value) {
    const old = this[baseUriValue];
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this.type = 'custom';
    this.value = value;
    this[baseUriValue] = value;
    this.requestUpdate('baseUri', old);
  }

  /**
   * @return {String} Current base URI value from either (in order) the baseUri,
   * current value, or just empty string.
   */
  get value() {
    return this.baseUri || this[valueValue] || '';
  }

  /**
   * Sets currently rendered value.
   * If the value is not one of the drop down options then it renders custom control.
   *
   * This can be used to programmatically set a value of the control.
   *
   * @param {String} value The value to render.
   */
  set value(value) {
    if (this.baseUri) {
      return;
    }
    const old = this[valueValue];
    /* istanbul ignore if */
    if (old === value) {
      return;
    }
    this[valueValue] = value;
    this[setValue](value);
    this.requestUpdate('value', old);
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
    const hasServer = servers.some(s => s.url === value);
    if (hasServer) {
      return false;
    }
    return this.serverValues.indexOf(value) === -1;
  }

  /**
   * @return {EventListener|null} Previously registered callback function for
   * the `api-server-changed` event.
   */
  get onapiserverchange() {
    return this[onApiServerChange];
  }

  /**
   * @param {EventListener} value A callback function to be called
   * when `api-server-changed` event is dispatched.
   */
  set onapiserverchange(value) {
    const old = this[onApiServerChange];
    if (old) {
      this.removeEventListener(EventTypes.serverChange, old);
    }
    const isFn = typeof value === 'function';
    if (isFn) {
      this[onApiServerChange] = value;
      this.addEventListener(EventTypes.serverChange, value);
    } else {
      this[onApiServerChange] = null;
    }
  }

  /**
   * @return {EventListener|null} Previously registered callback function for
   * the `servers-count-changed` event.
   */
  get onserverscountchange() {
    return this[onServersCountChangeValue] || null;
  }

  /**
   * @param {EventListener} value A callback function to be called
   * when `servers-count-changed` event is dispatched.
   */
  set onserverscountchange(value) {
    const old = this[onServersCountChangeValue];
    if (old) {
      this.removeEventListener(EventTypes.serverCountChange, old);
    }
    const isFn = typeof value === 'function';
    if (isFn) {
      this[onServersCountChangeValue] = value;
      this.addEventListener(EventTypes.serverCountChange, value);
    } else {
      this[onServersCountChangeValue] = null;
    }
  }

  /**
   * @return {Number} Total number of list items being rendered.
   */
  get serversCount() {
    const { allowCustom, servers } = this;
    const offset = allowCustom ? 1 : 0;
    const serversCount = servers.length + this[customNodesCount] + offset;
    return serversCount;
  }

  /**
   * Sets new selectedShape, then tries to update servers
   * @param {String} value AMF shape id
   */
  set selectedShape(value) {
    const old = this[selectedShapeValue];
    if (old === value) {
      return;
    }
    this[selectedShapeValue] = value;
    this[processShapeChange](value, this.selectedShapeType);
    this.requestUpdate('selectedShape', old);
  }

  get selectedShape() {
    return this[selectedShapeValue];
  }

  /**
   * Sets new selectedShapeType, then tries to update servers
   * @param {string} value AMF shape type
   */
  set selectedShapeType(value) {
    const old = this[selectedShapeTypeValue];
    if (old === value) {
      return;
    }
    this[selectedShapeTypeValue] = value;
    this[processShapeChange](this.selectedShape, value);
    this.requestUpdate('selectedShapeType', old);
  }

  get selectedShapeType() {
    return this[selectedShapeTypeValue];
  }

  constructor() {
    super();
    /**
     * Holds the size of rendered custom servers.
     * @type number
     */
    this[customNodesCount] = 0;
    this.opened = false;
    this.autoSelect = false;
    this.compatibility = false;
    this.outlined = false;

    /**
     * A list of custom items rendered in the slot.
     * This property is received from the list box that mixes in `AnypointSelectableMixin`
     * that dispatches `items-changed` event when rendered items change.
     * @type {string[]}
     */
    this[customItems] = [];
    /** @type AmfSerializer */
    this[serializerValue] = new AmfSerializer();
    /** @type EventListener */
    this[onServersCountChangeValue] = undefined;
  }

  firstUpdated() {
    this[notifyServersCount]();
  }

  /**
   * Async function to set value after component has finished updating
   * @param {String} value
   * @return {Promise<void>}
   * @private
   */
  async [setValue](value) {
    await this.updateComplete;
    const { type, value: effectiveValue } = this[getSelectionInfo](value);
    if (type === 'custom' && !this.allowCustom) {
      return;
    }
    if (this.type !== type) {
      this.type = type;
    }
    ServerEvents.serverChange(this, effectiveValue, this.type);
  }

  /**
   * Receives shape id and shape type, and looks for endpointId
   * if the type is 'endpoint'
   * @param {string} id AMF shape id
   * @param {string} type AMF shape type
   * @private
   */
  [processShapeChange](id, type) {
    let endpointId;
    if (type === 'endpoint') {
      endpointId = this[getEndpointIdForMethod](id);
    }
    this.updateServers({ id, type, endpointId });
  }

  /**
   * Computes the endpoint id based on a given method id
   * Returns undefined is endpoint is not found
   * @param {string} methodId The AMF id of the method
   * @returns {string|undefined}
   */
  [getEndpointIdForMethod](methodId) {
    const webApi = this._computeApi(this.amf)
    let endpoint = this._computeMethodEndpoint(webApi, methodId);
    if (Array.isArray(endpoint)) {
      [endpoint] = endpoint;
    }
    return endpoint ? /** @type string */ (this._getValue(endpoint, '@id')) : undefined;
  }

  /**
   * Dispatches the `servers-count-changed` event with the current number of rendered servers.
   */
  [notifyServersCount]() {
    ServerEvents.serverCountChange(this, this.serversCount);
  }

  /**
   * A handler called when slotted number of children change.
   * It sets the `[customNodesCount]` property with the number of properties
   * and notifies the change.
   */
  [childrenHandler]() {
    const nodes = this[getExtraServers]();
    this[customNodesCount] = nodes.length;
    this[notifyServersCount]();
  }

  /**
   * @param {AmfDocument} amf
   * @override callback function when AMF change.
   * This is asynchronous operation.
   */
  async __amfChanged(amf) {
    this[serializerValue].amf = amf;
    const { selectedShape, selectedShapeType } = this;
    this[processShapeChange](selectedShape, selectedShapeType);
    await this.updateComplete;
    this.selectIfNeeded();
  }

  /**
   * Executes auto selection logic.
   * It selects a fist available sever from the serves list when AMF or operation
   * selection changed.
   * If there are no servers, but there are custom slots available, then select
   * first custom slot
   * When there's already valid selection then it does nothing.
   */
  selectIfNeeded() {
    if (!this.autoSelect || this.isValueCustom) {
      return;
    }
    if (this.value) {
      return;
    }
    const [first] = this.servers;
    if (first) {
      this.value = first.url;
    } else {
      const [extra] = this[getExtraServers]();
      if (extra && this.amf) {
        this.type = 'uri';
        this.value = extra.getAttribute('data-value') || extra.getAttribute('value');
      }
    }
  }

  /**
   * Collects information about selection from the current value.
   * @param {string} value Current value for the server URI.
   * @return {SelectionInfo} A selection info object
   */
  [getSelectionInfo](value = '') {
    const { isCustom } = this;
    // Default values.
    const result = {
      type: 'server',
      value,
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
    const values = this.serverValues;
    const index = values.indexOf(value);
    if (index === -1) {
      // this is not a custom value (isCustom would be set)
      // so this is happening when navigation change but the server is not 
      // in the list of selected servers. We return the set value but the 
      // later logic will reset the selection to the first server.
      return result;
    }
    const itemValue = values[index];
    const custom = this[customItems] || [];
    const isSlotted = custom.indexOf(itemValue) !== -1;
    if (isSlotted) {
      result.type = 'uri';
    } else {
      result.type = 'server';
    }
    return result;
  }

  /**
   * Takes care of recognizing whether a server selection should be cleared.
   * This happens when list of servers change and with the new list of server
   * current selection does not exist.
   * This ignores the selection when current type is not a `server`.
   *
   * @param {ApiServer[]} servers List of new servers
   */
  [updateServerSelection](servers) {
    if (!servers) {
      this[resetSelection]();
    }
    if (!servers || this.type !== 'server') {
      return;
    }
    const index = this[getServerIndexByUri](servers, this.value);
    if (index === -1) {
      this[resetSelection]();
    }
  }

  /**
   * @param {ApiServer[]} servers List of current servers
   * @param {string} value The value to look for
   * @return {number} The index of found server or -1 if none found.
   */
  [getServerIndexByUri](servers, value) {
    return servers.findIndex(s => s.url === value);
  }

  /**
   * Update component's servers.
   *
   * @param {UpdateServersOptions=} selectedNodeParams The currently selected node parameters to set the servers for
   */
  updateServers({ id, type, endpointId } = {}) {
    let methodId;
    if (type === 'method') {
      methodId = id;
    }
    if (type === 'endpoint') {
      // eslint-disable-next-line no-param-reassign
      endpointId = id;
    }
    const servers = this._getServers({ endpointId, methodId });
    if (Array.isArray(servers)) {
      this.servers = servers.map(s => this[serializerValue].server(s));
    } else {
      this.servers = undefined;
    }
  }

  /**
   * Handler for the listbox's change event
   * @param {CustomEvent} e
   */
  [selectionChangeHandler](e) {
    const { selectedItem } = /** @type {any} */ (e.target);
    if (!selectedItem) {
      return;
    }
    let value = selectedItem.getAttribute('data-value') || selectedItem.getAttribute('value');
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
  [getExtraServers]() {
    const slot = this.shadowRoot.querySelector('slot');
    const items = slot ? ( /** @type HTMLSlotElement */ (slot)).assignedElements({ flatten: true }) : [];
    return items.filter((elm) => elm.hasAttribute('value') || elm.hasAttribute('data-value'));
  }

  /**
   * Handler for the input field change.
   * @param {Event} e
   */
  [customUriChangeHandler](e) {
    const { value } = /** @type HTMLInputElement */ (e.target);
    this.value = value;
  }

  /**
   * Resets current selection to a default value.
   */
  [resetSelection]() {
    this.value = '';
    this.type = 'server';
    this.selectIfNeeded();
  }

  /**
   * Handler for the drop down's `opened-changed` event. It sets local value
   * for the opened flag.
   * @param {CustomEvent} e
   */
  [dropDownOpenedHandler](e) {
    this.opened = e.detail.value;
  }

  /**
   * Updates list of custom items rendered in the selector.
   * @param {CustomEvent} e
   */
  [listboxItemsHandler](e) {
    const { value } = e.detail;
    if (!Array.isArray(value) || !value.length) {
      this[customItems] = [];
      return;
    }
    const result = [];
    value.forEach((node) => {
      const slot = node.getAttribute('slot');
      if (slot !== 'custom-base-uri') {
        return;
      }
      const v = node.getAttribute('data-value') || node.getAttribute('value');
      if (!v) {
        return;
      }
      result.push(v);
    });
    this[customItems] = result;
  }

  render() {
    const { styles, isCustom } = this;
    return html`
    <style>${styles}</style>
    ${isCustom ? this[customUriInputTemplate]() : this[selectorTemplate]()}
    `;
  }

  /**
   * @return {TemplateResult} Template result for the custom input.
   */
  [customUriInputTemplate]() {
    const { compatibility, outlined, value } = this;
    return html`
    <anypoint-input
      class="uri-input"
      @input="${this[customUriChangeHandler]}"
      .value="${value}"
      ?compatibility="${compatibility}"
      ?outlined="${outlined}"
    >
      <label slot="label">API base URI</label>
      <anypoint-icon-button
        aria-label="Activate to clear and close custom editor"
        title="Clear and close custom editor"
        slot="suffix"
        @click="${this[resetSelection]}"
        ?compatibility="${compatibility}"
      >
        <span class="icon">${close}</span>
      </anypoint-icon-button>
  </anypoint-input>`;
  }

  /**
   * @return {TemplateResult} Template result for the drop down element.
   */
  [selectorTemplate]() {
    const { compatibility, outlined, value, opened } = this;
    return html`
    <anypoint-dropdown-menu
      class="api-server-dropdown"
      ?compatibility="${compatibility}"
      ?outlined="${outlined}"
      .opened="${opened}"
      fitPositionTarget
      @opened-changed="${this[dropDownOpenedHandler]}"
    >
      <label slot="label">Select server</label>
      <anypoint-listbox
        .selected="${value}"
        @selected-changed="${this[selectionChangeHandler]}"
        slot="dropdown-content"
        tabindex="-1"
        ?compatibility="${compatibility}"
        attrforselected="data-value"
        selectable="[value],[data-value]"
        @items-changed="${this[listboxItemsHandler]}"
      >
        ${this[selectorListTemplate]()}
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
  [selectorListTemplate]() {
    return html`
      ${this[serverListTemplate]()}
      ${this[slotTemplate]()}
      ${this[customUriTemplate]()}
    `;
  }

  /**
   * @return {TemplateResult|string} The template for the custom URI list item.
   */
  [customUriTemplate]() {
    const { allowCustom, compatibility } = this;
    if (!allowCustom) {
      return '';
    }
    return html`<anypoint-item
      class="custom-option"
      data-value="custom"
      ?compatibility="${compatibility}"
    >Custom base URI</anypoint-item>`;
  }

  /**
   * @return {TemplateResult[]|string} Template result for the drop down list
   * options for current servers
   */
  [serverListTemplate]() {
    const { servers } = this;
    if (!Array.isArray(servers)) {
      return '';
    }
    return servers.map(server => this[serverListItemTemplate](server));
  }

  /**
   * @param {ApiServer} server The server definition
   * @returns {TemplateResult} The template for a server list item.
   */
  [serverListItemTemplate](server) {
    const { compatibility } = this;
    return html`
    <anypoint-item
      data-value="${server.url}"
      ?compatibility="${compatibility}"
      data-item="server-dropdown-option"
    >
      ${server.url}
    </anypoint-item>
    `
  }

  /**
   * @return {TemplateResult} Template result for the `slot` element
   */
  [slotTemplate]() {
    return html`<slot
      @slotchange="${this[childrenHandler]}"
      name="custom-base-uri"
    ></slot>`;
  }
}
