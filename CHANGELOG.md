# Changelog 

## 0.7.0

### Refactor

The element has been refactored to use symbols for "private" APIs. However, the logic is almost intact.

- `#_serverValues` -> `#serverValues`
- `#_serversCount` -> `#serversCount`

### Value change and custom type

Before, the element sets the `custom` type automatically when a `value` is set but the value does not exist on the list of servers. This is invalid behavior because it causes the element to render custom input when changing API selection between endpoints that have different set of servers (OAS setup).

Now, when setting a value and the value is a custom value (not defined in API's servers list) you also need to explicitly set the `type` to `custom`.

This change only affects the imperative API.

### data-value vs. value

Before, the elements passed as options to the selector needed to have `value` attribute.

```html
<anypoint-item slot="..." value="https://server.org"><anypoint-item>
```

However, this is invalid attribute as the `<anypoint-item>` does not define the `value` attribute. From now the valid attribute is `data-value`. However, old `value` is also accepted for compatibility.

```html
<anypoint-item slot="..." data-value="https://server.org"><anypoint-item>
```
