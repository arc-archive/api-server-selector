import { html, LitElement } from 'lit-element';
import { AmfHelperMixin } from '@api-components/amf-helper-mixin/amf-helper-mixin.js';
import { EventsTargetMixin } from '@advanced-rest-client/events-target-mixin/events-target-mixin.js';

/**
 * `api-server-selector`
 * An element to generate view model for server
 * elements from AMF model
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

  get currentServer() {
    return this._currentServer;
  }

  set currentServer(value) {
    const old = this._currentServer;
    if (value === old) {
      return;
    }
    this._currentServer = value;
  }

  get serverId() {
    return this._serverId;
  }

  set serverId(value) {
    const old = this._serverId;
    if (value === old) {
      return;
    }

    this._serverId = value;
    dispatchEvent(
      new CustomEvent('api-server-changed', {
        detail: { value: value },
      }),
    );
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
   * Sets the selected server information
   *
   * @param {Object} selectedNodeParams The currently selected node parameters to set the servers for
   * @param {String} selectedNodeParams.id The selected node ID where servers should be fetched
   * @param {String} selectedNodeParams.type The selected node type where servers should be fetched
   * @param {String} selectedNodeParams.endpointId The selected endpointID where servers should be fetched
   * @param {?String} selectedNodeParams.serverId The currently selected server ID
   */
  set selected({ id, type, endpointId, serverId }) {
    const old = this._serverId;
    if (serverId === old) {
      return;
    }

    if (type === 'method') {
      this.methodId = id;
    }
    this.endpointId = endpointId;
    this.serverId = serverId;
    this.servers = this._getServers(endpointId, id);
    this.currentServer =
      this._getServer({ endpointId, methodId: id, id: serverId }) || this.servers[0];
  }

  handleNavigationChange(e) {
    const { selected, type, endpointId } = e.detail;

    const serverDefinitionAllowedTypes = ['endpoint', 'method'];
    if (serverDefinitionAllowedTypes.indexOf(type) === -1) {
      return;
    }

    this.selected = { id: selected, type, endpointId, serverId: this.serverId };
  }

  render() {
    // TODO list in dropdown Sever values
    // Add input/label with server baseURI considering when URL is editable and when it is readonly
    // Add slot for custom server options inside dropdown and slot for additionalOptions section
    return html`
      <anypoint-dropdown>
        <anypoint-listbox>
          <anypoint-item>Server 1</anypoint-item>
          <anypoint-item>Server 2</anypoint-item>
          <anypoint-item>Custom URL</anypoint-item>
        </anypoint-listbox>
      </anypoint-dropdown>
    `;
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
