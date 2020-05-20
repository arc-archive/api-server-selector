/**
 * DO NOT EDIT
 *
 * This file was automatically generated by
 *   https://github.com/Polymer/tools/tree/master/packages/gen-typescript-declarations
 *
 * To modify these typings, edit the source file(s):
 *   src/api-server-selector.js
 */


// tslint:disable:variable-name Describing an API that's defined elsewhere.
// tslint:disable:no-any describes the API as best we are able today

import {html, LitElement} from 'lit-element';

import {AmfHelperMixin} from '@api-components/amf-helper-mixin/amf-helper-mixin.js';

export {ApiServerSelector};

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
declare class ApiServerSelector extends
  AmfHelperMixin(
  EventTargetMixin(
  LitElement)) {

  /**
   * A list of custom items rendered in the slot.
   * This property is received from the list box that mixes in `AnypointSelectableMixin`
   * that dispatches `items-changed` event when rendered items change.
   */
  _customItems: Array<String|null>|null;
  readonly styles: any;
  readonly _serverValues: Array<String|null>|null;

  /**
   * The current list of servers to render
   */
  servers: any[]|null|undefined;

  /**
   * When set the `Custom base URI` is rendered in the dropdown
   */
  allowCustom: boolean|null|undefined;

  /**
   * The baseUri to override any server definition
   */
  baseUri: string|null|undefined;

  /**
   * Current value of the server
   */
  value: String|null;
  readonly isCustom: Boolean|null;

  /**
   * Checks whether the current value is a custom value related to current list of servers.
   */
  readonly isValueCustom: Boolean|null;
  onapiserverchange: EventListenerObject|null;
  onserverscountchange: EventListenerObject|null;
  readonly _serversCount: Number|null;

  /**
   * An `@id` of selected AMF shape.
   * When changed, it computes servers for the selection
   */
  selectedShape: string|null|undefined;

  /**
   * The type of the selected AMF shape.
   * When changed, it computes servers for the selection
   */
  selectedShapeType: string|null|undefined;

  /**
   * Currently selected type of the input.
   * `server` | `uri` | `custom`
   */
  type: string|null|undefined;

  /**
   * Enables outlined material theme
   */
  outlined: boolean|null|undefined;

  /**
   * Enables compatibility with the anypoint platform
   */
  compatibility: boolean|null|undefined;

  /**
   * Holds the size of rendered custom servers.
   */
  _customNodesCount: number|null|undefined;

  /**
   * When set it automaticallt selected the first server from the list
   * of servers when selection is missing.
   */
  autoSelect: boolean|null|undefined;

  /**
   * A programmatic access to the opened state of the drop down.
   * Note, this does nothing when custom element is rendered.
   */
  opened: boolean|null|undefined;
  constructor();
  firstUpdated(): void;
  render(): any;

  /**
   * Dispatches the `servers-count-changed` event with the current number of rendered servers.
   */
  _notifyServersCount(): void;

  /**
   * A handler called when slotted number of children change.
   * It sets `_customNodesCount` proeprty with the number of properties
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
   * This happes when list of servers change and with the new list of server
   * current selection does not exist.
   * This ignores the selection when current type is not a `server`.
   *
   * @param servers List of new servers
   */
  _updateServerSelection(servers: Array<object|null>|null): void;

  /**
   * @param servers List of current servers
   * @param value The value to look for
   * @returns The index of found server or -1 if none found.
   */
  _getServerIndexByUri(servers: Array<object|null>|null, value: String|null): Number|null;

  /**
   * Update component's servers.
   */
  updateServers({
  id,
  type,
  endpointId
} = {}: any): void;
  _isNodeIdOfType(id: any, type: any): any;

  /**
   * Handler for the listbox's change event
   */
  _handleSelectionChanged(e: CustomEvent|null): void;

  /**
   * Retrieves custom base uris elements assigned to the
   * custom-base-uri slot
   *
   * @returns Elements assigned to custom-base-uri slot
   */
  _getExtraServers(): Array<Element|null>|null;

  /**
   * Handler for the input field change.
   */
  _handleUriChange(e: Event|null): void;

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
  _getServerUri(server: object|null): String|null;

  /**
   * Handler for the drop down's `opened-changed` event. It sets local value
   * for the opened flag.
   */
  _openedHandler(e: CustomEvent|null): void;

  /**
   * Updates list of custom items rendered in the selector.
   */
  _listboxItemsHandler(e: CustomEvent|null): void;

  /**
   * @returns Template result for the custom input.
   */
  _uriInputTemplate(): TemplateResult|null;

  /**
   * @returns Template result for the drop down element.
   */
  _renderDropdown(): TemplateResult|null;

  /**
   * Call the render functions for
   * - Server options (from AMF Model)
   * - Custom URI option
   * - Extra slot
   *
   * @returns The combination of all options
   */
  _renderItems(): TemplateResult|null;

  /**
   * @returns Custom URI `anypoint-item`
   */
  _renderCustomURIOption(): TemplateResult|string|null;

  /**
   * @returns Template result for the drop down list
   * options for current servers
   */
  _renderServerOptions(): Array<TemplateResult|null>|null;

  /**
   * @returns Template result for the `slot` element
   */
  _renderExtraSlot(): TemplateResult|null;
}
