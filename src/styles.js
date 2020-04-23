import { css } from 'lit-element';
export default css`
:host{
  display: block;
  width: 100%;
}

:host([hidden]) {
  display: none;
}

.api-server-dropdown, .uri-input {
  width: calc(100% - 16px);
  max-width: 700px;
  min-width: 280px;
}

.icon {
  display: inline-block;
  width: 24px;
  height: 24px;
  fill: currentColor;
}
`;
