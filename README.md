[![Published on NPM](https://img.shields.io/npm/v/@api-components/api-server-selector.svg)](https://www.npmjs.com/package/@api-components/api-server-selector)

[![Build Status](https://travis-ci.org/advanced-rest-client/api-server-selector.svg?branch=stage)](https://travis-ci.org/advanced-rest-client/api-server-selector)


## &lt;api-server-selector&gt;

Custom element that renders and manages Servers state in AMF powered application

## Version compatibility

This version only works with AMF model version 2 (AMF parser >= 4.0.0).

### API components

This components is a part of [API components ecosystem](https://elements.advancedrestclient.com/)

## Usage

### Installation
```
npm install --save @api-components/api-server-selector
```

### In an html file

```html
<html>
  <head>
    <script type="module">
      import '@api-components/api-server-selector/api-server-selector.js';
    </script>
  </head>
  <body>
    <api-server-selector amf="..."></api-server-selector>
  </body>
</html>
```

### In a Polymer 3 element

```js
import { LitElement, html } from 'lit-element';
import '@api-components/api-server-selector/api-server-selector.js';

class SampleElement extends LitElement {
  render() {
    return html`
    <api-server-selector amf="${this.model}"></api-server-selector>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

### Subscribing to change events

Component dispatches events of type `api-server-changed` when the server value changes.

```js
addEventListener('api-server-changed', function(e) {
    const { value } = e.detail;
    // value is the url
});
```

When `Custom URL` is selected, each input change dispatches an `api-server-changed` event with the current value of the input.

## Local installation

```sh
git clone https://github.com/advanced-rest-client/api-server-selector
cd api-server-selector
npm install
```

### Running the demo locally

```sh
npm start
```

### Running the tests
```sh
npm test
```
