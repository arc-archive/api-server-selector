import { fixture, assert, nextFrame } from '@open-wc/testing';
import { AmfLoader } from './amf-loader.js';
import { AmfHelper } from './amf-helper.js';
import '../api-server-selector.js';

describe('<api-server-selector>', () => {
  async function basicFixture() {
    return (await fixture(`<api-server-selector></api-server-selector>`));
  }

  async function hideCustomFixture() {
    return (await fixture(`<api-server-selector hideCustom></api-server-selector>`));
  }

  async function extraOptionsFixture() {
    return (await fixture(`<api-server-selector>
                                        <anypoint-item slot="custom-base-uri" value="http://customServer.com">
                                          http://customServer.com
                                        </anypoint-item>
                                        <anypoint-item slot="custom-base-uri" value="http://customServer2.com">
                                          http://customServer2.com
                                        </anypoint-item>
                                    </api-server-selector>`));
  }

  async function baseUriFixture() {
    return (await fixture(`<api-server-selector baseUri="https://www.google.com"></api-server-selector>`));
  }

  function simulateSelection(element, index, value) {
    const target = { selectedItem: { getAttribute: () => value } };
    const detail = {
      value: index,
    };
    element._handleSelectionChanged({ detail, target });
  }

  describe('Basic - No model', () => {
    let element;

    beforeEach(async () => {
      element = await basicFixture();
      await nextFrame();
    });

    it('should render dropdown', () => {
      assert.exists(element.shadowRoot.querySelector('.api-server-dropdown'));
    });

    it('should not render uri input field', () => {
      assert.notExists(element.shadowRoot.querySelector('.uri-input'));
    });

    it('should render uri input field when any value is selected', async () => {
      simulateSelection(element, 0, 'custom');
      await nextFrame();
      assert.exists(element.shadowRoot.querySelector('.uri-input'));
    });

    it('should have empty URI field', async () => {
      simulateSelection(element, 0, 'custom');
      await nextFrame();
      assert.isEmpty(element.shadowRoot.querySelector('.uri-input').value);
    });

    it('should render empty extra servers slot', () => {
      assert.exists(element.shadowRoot.querySelector('slot[name="custom-base-uri"]'));
      assert.lengthOf(element.shadowRoot.querySelector('slot[name="custom-base-uri"]').assignedElements(), 0)
    });

    it('should select custom uri', () => {
      const target = { selectedItem: { getAttribute: () => 'custom' } };
      const detail = {
        value: 0,
      };
      element._handleSelectionChanged({ detail, target });
      assert.equal(element._selectedIndex, 0);
      assert.equal(element.selectedValue, '');
      assert.equal(element.selectedType, 'custom');
    });

    it('should unrender uri input when clicking close', () => {
      const target = { selectedItem: { getAttribute: () => 'custom' } };
      const detail = {
        value: 0,
      };
      element._handleSelectionChanged({ detail, target });
      element._resetSelection();
      assert.equal(element._selectedIndex, undefined);
      assert.equal(element._selectedValue, undefined);
      assert.notExists(element.shadowRoot.querySelector('.uri-input'));
    });

    it('should render `Custom URI` option by default', () => {
      assert.exists(element.shadowRoot.querySelector('.custom-option'));
    });

    it('should set baseUri and render as Custom even when `hideCustom` is enabled', async () => {
      element = await baseUriFixture();
      await nextFrame();
      element.hideCustom = true;
      assert.equal(element.selectedValue, 'https://www.google.com');
      assert.equal(element.selectedType, 'custom');
      assert.equal(element.baseUri, 'https://www.google.com');
    })

    it('should not render `Custom URI` when `hideCustom` is enabled', async () => {
      element = await hideCustomFixture()
      await nextFrame();
      assert.notExists(element.shadowRoot.querySelector('.custom-option'));
    });

    describe('renderCustomURIOption()', () => {
      it('should return custom uri option', () => {
        assert.isNotEmpty(element._renderCustomURIOption());
      });

      it('should not return custom uri option when `hideCustom` is enabled', () => {
        element.hideCustom = true;
        assert.isEmpty(element._renderCustomURIOption());
      });
    });

    it('should dispatch `api-server-changed` event', async () => {
      element = await basicFixture();
      let event;
      const handler = (e) => {
        event = e;
      }
      element.addEventListener('api-server-changed', handler);
      element.selectedType = 'custom';
      element.selectedValue = 'https://example.com';
      await nextFrame();
      assert.deepEqual(event.detail, {
        selectedValue: 'https://example.com',
        selectedType: 'custom',
      })
    });

    it('should not update selectedValue if selectedType is `server` and it is not an option', async () => {
      element = await basicFixture();
      element.selectedType = 'server';
      element.selectedValue = 'https://example.com';
      assert.equal(element.selectedType, 'server');
      assert.isUndefined(element.selectedvalue);
    });

    it('should update selectedValue if selectedType is `custom`', async () => {
      element = await basicFixture();
      element.selectedType = 'custom';
      element.selectedValue = 'https://example.com';
      assert.equal(element.selectedType, 'custom');
      assert.equal(element.selectedValue, 'https://example.com');
    });
  });

  describe('With fixed baseUri', () => {
    let element;

    before(async () => {
      element = await baseUriFixture();
      await nextFrame();
    });

    it('should have baseUri as selectedValue', () => {
      assert.equal(element.selectedValue, 'https://www.google.com');
    })

    it('should return baseUri as selectedValue after setting selectedValue', () => {
      element.selectedValue = 'test uri';
      assert.equal(element.selectedValue, 'https://www.google.com');
    })

    it('should update when new baseUri is set', () => {
      element.baseUri = 'https://www.google.com/v1';
      assert.equal(element.selectedValue, 'https://www.google.com/v1');
      assert.equal(element.baseUri, 'https://www.google.com/v1');
      assert.equal(element.selectedType, 'custom');
    })
  });

  describe('With extra options', () => {
    let element;

    before(async () => {
      element = await extraOptionsFixture();
      await nextFrame();
    });

    it('should render extra servers slot', () => {
      assert.exists(element.shadowRoot.querySelector('slot[name="custom-base-uri"]'));
    });

    it('should have two assigned nodes to slot', () => {
      assert.lengthOf(element.shadowRoot.querySelector('slot[name="custom-base-uri"]').assignedElements(), 2);
    });

    it('should have customUri at last index', () => {
      assert.equal(element._getCustomUriIndex(), 2)
    })
  });

  [
    ['Compact model', true],
    ['Regular model', false]
  ].forEach((item) => {
    describe('_renderServerOptions()', () => {
      let amf;
      let element;

      beforeEach(async () => {
        amf = await AmfLoader.load(item[1]);
        element = await basicFixture();
        element.amf = amf;
        await nextFrame();
      });

      it('Returns empty array when servers is null', () => {
        element.servers = null;
        assert.lengthOf(element._renderServerOptions(), 0);
      });

      it('Returns servers for document', () => {
        assert.lengthOf(element._renderServerOptions(), 4);
      });

      it('Returns servers for endpoint', () => {
        const endpoint = AmfHelper.getEndpoint(element, amf, '/ping');
        const endpointId = endpoint['@id'];
        const detail = {
          selected: endpointId,
          type: 'endpoint',
        };
        element._handleNavigationChange({ detail });
        assert.lengthOf(element._renderServerOptions(), 1);
      });

      it('Returns servers for method', () => {
        const endpoint = AmfHelper.getEndpoint(element, amf, '/ping');
        const method = AmfHelper.getMethod(element, amf, '/ping', 'get');
        const endpointId = endpoint['@id'];
        const methodId = method['@id'];
        const detail = {
          selected: methodId,
          type: 'method',
          endpointId,
        };
        element._handleNavigationChange({ detail });
        assert.lengthOf(element._renderServerOptions(), 2);
      });
    });

    describe('_handleSelectionChanged()', () => {
      let amf;
      let element;

      beforeEach(async () => {
        amf = await AmfLoader.load(item[1]);
        element = await basicFixture();
        element.amf = amf;
        await nextFrame();
      });

      it('should select server', () => {
        const encodes = AmfHelper.getEncodes(element, amf);
        const server = AmfHelper.getServer(element, encodes, 'https://{customerId}.saas-app.com:{port}/v2');
        const id = server['@id'];
        const index = AmfHelper.indexOfServer(element, encodes, id);
        simulateSelection(element, index, id);
        assert.equal(element.selectedValue, 'https://{customerId}.saas-app.com:{port}/v2');
        assert.equal(element.selectedType, 'server');
        assert.equal(element._selectedIndex, index);
      });

      it('should select custom uri', () => {
        const index = element.servers.length;
        simulateSelection(element, index, 'custom');
        assert.equal(element.selectedValue, '');
        assert.equal(element.selectedType, 'custom');
        assert.equal(element._selectedIndex, index);
      });
    })

    describe('_checkForSelectedChange()', () => {
      let amf;
      let element;

      beforeEach(async () => {
        amf = await AmfLoader.load(item[1]);
        element = await basicFixture();
        element.amf = amf;
        await nextFrame();
      });

      it('should reset selected if server is no longer in list', () => {
        const encodes = AmfHelper.getEncodes(element, amf)
        const server = AmfHelper.getServer(element, encodes, 'https://{customerId}.saas-app.com:{port}/v2');
        const id = server['@id'];
        const index = AmfHelper.indexOfServer(element, encodes, id)
        simulateSelection(element, index, id);
        element.servers = [];
        assert.isUndefined(element._selectedIndex);
        assert.isUndefined(element._selectedValue);
      });

      it('should reset selected if servers is undefined', () => {
        const encodes = AmfHelper.getEncodes(element, amf)
        const server = AmfHelper.getServer(element, encodes, 'https://{customerId}.saas-app.com:{port}/v2');
        const id = server['@id'];
        const index = AmfHelper.indexOfServer(element, encodes, id)
        simulateSelection(element, index, id);
        element.servers = undefined;
        assert.isUndefined(element._selectedIndex);
        assert.isUndefined(element._selectedValue);
      });

      it('should update index if custom uri is selected and servers change', async () => {
        element = await basicFixture();
        simulateSelection(element, 0, 'custom');
        element.amf = amf;
        assert.equal(element._selectedIndex, element.servers.length);
        assert.equal(element.selectedValue, '');
        assert.equal(element.selectedType, 'custom');
      });

      it('should update index if servers change and selected is in new servers', () => {
        const encodes = AmfHelper.getEncodes(element, amf)
        const server = AmfHelper.getServer(element, encodes, 'https://{customerId}.saas-app.com:{port}/v2');
        const id = server['@id'];
        const index = AmfHelper.indexOfServer(element, encodes, id)
        simulateSelection(element, index, id);
        element.servers = [...element.servers];
        assert.isDefined(element._selectedIndex);
        assert.equal(element.selectedType, 'server');
        assert.equal(element.selectedValue, 'https://{customerId}.saas-app.com:{port}/v2');
      });
    });

    describe('_getIndexOfServer()', () => {
      let amf;
      let element;

      beforeEach(async () => {
        amf = await AmfLoader.load(item[1]);
        element = await basicFixture();
        element.amf = amf;
        await nextFrame();
      });

      it('should return -1 if not found', () => {
        assert.equal(element._getIndexOfServer('foo', element.servers), -1);
      });

      it('should return index if found', () => {
        const first = element.servers[0];
        assert.equal(element._getIndexOfServer(first['@id'], element.servers), 0);
      });
    });

    describe('_getServerValue()', () => {
      let amf;
      let element;

      beforeEach(async () => {
        amf = await AmfLoader.load(item[1]);
        element = await basicFixture();
        element.amf = amf;
        await nextFrame();
      });

      it('should return undefined if no server', () => {
        assert.isEmpty(element._getServerValue(undefined));
      });

      it('should return server id', () => {
        const first = element.servers[0];
        assert.equal(element._getServerValue(first), first['@id']);
      });
    });

    describe('updateServers()', () => {
      let amf;
      let element;

      beforeEach(async () => {
        amf = await AmfLoader.load(item[1]);
        element = await basicFixture();
        element.amf = amf;
        await nextFrame();
      });

      it('should update servers for endpoint', () => {
        const endpointId = AmfHelper.getEndpoint(element, amf, '/ping')['@id'];
        element.updateServers({ type: 'endpoint', id: endpointId })
        assert.equal(element.endpointId, endpointId);
        assert.isUndefined(element.methodId);
        assert.lengthOf(element.servers, 1);
      });

      it('should update servers for method', () => {
        const endpointId = AmfHelper.getEndpoint(element, amf, '/ping')['@id'];
        const methodId = AmfHelper.getMethod(element, amf, '/ping', 'get')['@id'];
        element.updateServers({ type: 'method', id: methodId, endpointId })
        assert.equal(element.endpointId, endpointId);
        assert.equal(element.methodId, methodId);
        assert.lengthOf(element.servers, 2);
      });
    });

    describe('_isValueValid()', () => {
      let amf;
      let element;

      beforeEach(async () => {
        amf = await AmfLoader.load(item[1]);
        element = await basicFixture();
        element.amf = amf;
        await nextFrame();
      });

      it('should return true if `selectedType` is `custom`', () => {
        element.selectedType = 'custom';
        assert.isTrue(element._isValueValid());
      });

      it('should return false if server is not found', () => {
        element.selectedType = 'server';
        assert.isFalse(element._isValueValid('https://www.google.com'));
      });

      it('should return true if value is found in servers', () => {
        element.selectedType = 'server';
        assert.isTrue(element._isValueValid('https://{customerId}.saas-app.com:{port}/v2'));
      });
    });

    describe('_getIndexForValue()', () => {
      let amf;
      let element;

      beforeEach(async () => {
        amf = await AmfLoader.load(item[1]);
        element = await extraOptionsFixture();
        element.amf = amf;
        await nextFrame();
      });

      it('should return custom value index', async () => {
        element.selectedType = 'custom';
        assert.equal(element._getIndexForValue(), 6);
      });

      it('should return slot value index', async () => {
        element.selectedType = 'slot';
        assert.equal(element._getIndexForValue(), 3);
      });
    });
  });
});
