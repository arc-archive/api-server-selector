[![Published on NPM](https://img.shields.io/npm/v/@api-components/api-server-selector.svg)](https://www.npmjs.com/package/@api-components/api-server-selector)

[![Build Status](https://travis-ci.com/advanced-rest-client/api-server-selector.svg)](https://travis-ci.com/advanced-rest-client/api-server-selector)


## &lt;api-server-selector&gt;

Custom element that renders a list of servers encoded in an API specification powered by the AMF model.

## Version compatibility

This version only works with AMF model version 2 (AMF parser >= 4.0.0).

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

### In a LitElement

```js
import { LitElement, html } from 'lit-element';
import '@api-components/api-server-selector/api-server-selector.js';

class SampleElement extends LitElement {
  render() {
    return html`
    <api-server-selector .amf="${this.model}"></api-server-selector>
    `;
  }
}
customElements.define('sample-element', SampleElement);
```

### Subscribing to change events

#### apiserverchanged event

The component dispatches the `apiserverchanged` custom event when the server selection changes.

```js
element.addEventListener('apiserverchanged', function(e) {
    const { value, type } = e.detail;
    // value is the selected base URI
    // type tells whether it's a server defined value of a custom property
    // This is also the same as const { value, type } = e.target;
});
```

When `Custom URL` is selected, a change in the input field dispatches the `api-server-changed` event with the current value of the input.

Additionally the element supports `onapiserverchange` setter for event callback function:

```javascript
element.onapiserverchange = (e) => {
  // ...
};
```

#### serverscountchanged event

The event is dispatched when a number of rendered servers changed.

```javascript
element.addEventListener('serverscountchanged', function(e) {
    const { value } = e.detail;
    // value is the number of rendered servers
});
```

```javascript
element.onserverscountchange = (e) => {
  // ...
};
```

### Custom servers

Sometimes the hosting application may want to define additional list of servers to render in the selector, other than the ones defined in the API sepcification. This can relate to additional services working with the components like a proxy or mocking service.

The element accepts list items as children that are insterted after the API defined servers.
We recommend using `anypoint-item` as it is already used to build the selecotr. However, it can be any HTML element. For a list item to be rendered it has to have `slot="custom-base-uri"` attribute. For the item to be selectable in the list it has to have the `value="..."` attribute.
If the value is missing then the item is rendered but the selector won't react on the list item click.

```html
<api-server-selector>
  <div slot="custom-base-uri">Other options</div>
  <anypoint-item slot="custom-base-uri" value="http://mocking.com">Mocking service</anypoint-item>
  <anypoint-item slot="custom-base-uri"><input type="checkbox"/> Configuration option</anypoint-item>
</api-server-selector>
```

When you decide to use a list item without a value, a click on an item won't close the selector. When the user perform the action related to the item then use `opened` property on the selector to close the drop down.

```html
<api-server-selector>
  <div slot="custom-base-uri">Other options</div>
  <anypoint-item slot="custom-base-uri"><input type="checkbox" id="option"/> Configuration option</anypoint-item>
</api-server-selector>

<script>
option.onclick = (e) => {
  e.target.parentNode.opened = false;
};
</script>
```

## Development

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
