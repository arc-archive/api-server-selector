import {TemplateResult, LitElement, CSSResult} from 'lit-element';
import {AmfHelperMixin} from '@api-components/amf-helper-mixin/amf-helper-mixin.js';

export declare interface SelectionInfo {
  /**
   * Type of the detected selection
   */
  type: string;
  /**
   * The normalized value to be used by API editors
   */
  value: string;
}

export declare interface UpdateServersOptions {
  /**
   * The selected node type where servers should be fetched
   */
  type?: string;
  /**
   * The selected node ID where servers should be fetched
   */
  id?: string;
  /**
   * Optional endpoint id the method id belongs to
   */
  endpointId?: string;
}

/**
 * `api-server-selector`
 * An element to generate view model for server
 * elements from AMF model
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
export declare class ApiServerSelector extends AmfHelperMixin(LitElement) {
  /**
   * A list of custom items rendered in the slot.
   * This property is received from the list box that mixes in `AnypointSelectableMixin`
   * that dispatches `items-changed` event when rendered items change.
   */
  _customItems: string[]|undefined;
  get styles(): CSSResult;
  get _serverValues(): string[]|undefined;

  /**
   * The current list of servers to render
   */
  servers: any[]|undefined;

  /**
   * When set the `Custom base URI` is rendered in the dropdown
   * @attribute
   */
  allowCustom?: boolean;

  /**
   * The baseUri to override any server definition
   * @attribute
   */
  baseUri?: string;

  /**
   * The current value of the server
   * @attribute
   */
  value?: string;
  get isCustom(): boolean;

  /**
   * Checks whether the current value is a custom value related to current list of servers.
   */
  get isValueCustom(): boolean;
  onapiserverchange: EventListenerObject|null;
  onserverscountchange: EventListenerObject|null;
  get _serversCount(): number;

  /**
   * An `@id` of selected AMF shape.
   * When changed, it computes servers for the selection
   * @attribute
   */
  selectedShape?: string;

  /**
   * The type of the selected AMF shape.
   * When changed, it computes servers for the selection
   * @attribute
   */
  selectedShapeType?: string;

  /**
   * Currently selected type of the input.
   * `server` | `uri` | `custom`
   * @attribute
   */
  type: string;

  /**
   * Enables outlined material theme
   * @attribute
   */
  outlined: boolean;

  /**
   * Enables compatibility with the anypoint platform
   * @attribute
   */
  compatibility: boolean;

  /**
   * Holds the size of rendered custom servers.
   */
  _customNodesCount: number;

  /**
   * When set it automatically selected the first server from the list
   * of servers when selection is missing.
   * @attribute
   */
  autoSelect: boolean;

  /**
   * A programmatic access to the opened state of the drop down.
   * Note, this does nothing when custom element is rendered.
   * @attribute
   */
  opened: boolean;
  constructor();
  firstUpdated(): void;
  render(): any;

  /**
   * Dispatches the `servers-count-changed` event with the current number of rendered servers.
   */
  _notifyServersCount(): void;

  /**
   * A handler called when slotted number of children change.
   * It sets `_customNodesCount` property with the number of properties
   * and notifies the change.
   */
  _childrenHandler(): void;

  /**
   * Executes auto selection logic.
   * It selects a fist available sever from the serves list when AMF or operation
   * selection changed.
   * If there are no servers, but there are custom slots available, then select
   * first custom slot
   * When there's already valid selection then it does nothing.
   */
  selectIfNeeded(): void;

  /**
   * Collects information about selection from the current value.
   *
   * @param value Current value for the server URI.
   * @returns A selection info object
   */
  _selectionInfo(value?: String|null): SelectionInfo|null;

  /**
   * Takes care of recognizing whether a server selection should be cleared.
   * This happens when list of servers change and with the new list of server
   * current selection does not exist.
   * This ignores the selection when current type is not a `server`.
   *
   * @param servers List of new servers
   */
  _updateServerSelection(servers: any[]): void;

  /**
   * @param servers List of current servers
   * @param value The value to look for
   * @returns The index of found server or -1 if none found.
   */
  _getServerIndexByUri(servers: any[], value: string): number;

  /**
   * Update component's servers.
   */
  updateServers(opts: UpdateServersOptions): void;

  /**
   * Handler for the listbox's change event
   */
  _handleSelectionChanged(e: CustomEvent): void;

  /**
   * Retrieves custom base uris elements assigned to the
   * custom-base-uri slot
   *
   * @returns Elements assigned to custom-base-uri slot
   */
  _getExtraServers(): Array<Element>;

  /**
   * Handler for the input field change.
   */
  _handleUriChange(e: Event): void;

  /**
   * Resets current selection to a default value.
   */
  _resetSelection(): void;

  /**
   * Computes the URI of a server.
   *
   * @param server Server definition to get the value from.
   * @returns Server base URI.
   */
  _getServerUri(server: any): string;

  /**
   * Handler for the drop down's `opened-changed` event. It sets local value
   * for the opened flag.
   */
  _openedHandler(e: CustomEvent): void;

  /**
   * Updates list of custom items rendered in the selector.
   */
  _listboxItemsHandler(e: CustomEvent): void;

  /**
   * @returns Template result for the custom input.
   */
  _uriInputTemplate(): TemplateResult;

  /**
   * @returns Template result for the drop down element.
   */
  _renderDropdown(): TemplateResult;

  /**
   * Call the render functions for
   * - Server options (from AMF Model)
   * - Custom URI option
   * - Extra slot
   *
   * @returns The combination of all options
   */
  _renderItems(): TemplateResult;

  /**
   * @returns Custom URI `anypoint-item`
   */
  _renderCustomURIOption(): TemplateResult|string;

  /**
   * @returns Template result for the drop down list
   * options for current servers
   */
  _renderServerOptions(): Array<TemplateResult>;

  /**
   * @returns Template result for the `slot` element
   */
  _renderExtraSlot(): TemplateResult;
}
