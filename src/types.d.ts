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
 * The selected type
 * 
 * - `server`: server from the AMF model
 * - `custom`: custom base URI value (entered by the user)
 * - `extra`: an application controlled server value selected by the user.
 */
export type ServerType = 'server' | 'custom' | 'extra';
