import { css } from 'lit-element';

export default css`
:host{
  display: block;
  width: 100%;
  margin: 16px 0px;
}

:host([hidden]) {
  display: none;
}

.api-server-dropdown, .uri-input {
  margin: 0;
  padding: 0;
  width: 100%;
}

.icon {
  display: inline-block;
  width: 24px;
  height: 24px;
  fill: currentColor;
}
`;
