import { fixture, assert, nextFrame } from '@open-wc/testing';
import { AmfLoader } from './amf-loader.js';
import { AmfHelper } from './amf-helper.js';
import '../api-server-selector.js';

describe('<api-server-selector>', () => {
    async function basicFixture() {
        return (await fixture(`<api-server-selector></api-server-selector>`));
    }

    async function extraOptionsFixture() {
        return (await fixture(`<api-server-selector extraOptions></api-server-selector>`));
    }

    async function baseUriFixture() {
        return (await fixture(`<api-server-selector baseUri="https://www.google.com"></api-server-selector>`));
    }

    function simulateSelection(element, index, value) {
        const target = { selectedItem: { getAttribute: () => value } };
        const detail = {
            value: index,
        };
        element.handleSelectionChanged({ detail, target });
    }

    describe('Basic - No model', () => {
        let element;

        before(async () => {
            element = await basicFixture();
            await nextFrame();
        });

        it('should render dropdown', () => {
            assert.exists(element.shadowRoot.querySelector('.api-server-dropdown'));
        });

        it('should not render url input field', () => {
            assert.notExists(element.shadowRoot.querySelector('.url-input'));
        });

        it('should render url input field when any value is selected', () => {
            simulateSelection(element, 0, 'custom');
            assert.exists(element.shadowRoot.querySelector('.url-input'));
        });

        it('should have empty URL', () => {
            assert.equal(element.url, '');
        });

        it('should have empty URL field', () => {
            assert.isEmpty(element.shadowRoot.querySelector('.url-input').value);
        });

        it('should not render extra slot', () => {
            assert.notExists(element.shadowRoot.querySelector('slot [name="api-server-extra-slot"]'));
        });

        it('should return url after setting it', () => {
            element.url = 'test url';
            assert.equal(element.url, 'test url');
        });

        it('should select custom url', () => {
            const target = { selectedItem: { getAttribute: () => 'custom' } };
            const detail = {
                value: 0,
            };
            element.handleSelectionChanged({ detail, target });
            assert.equal(element._selectedIndex, 0);
            assert.equal(element._selectedValue, 'custom');
        });
    });

    describe('With fixed baseUri', () => {
        let element;

        before(async () => {
            element = await baseUriFixture();
            await nextFrame();
        });

        it('should have baseUri as url', () => {
            assert.equal(element.url, 'https://www.google.com');
        })

        it('should return baseUri as url after setting url', () => {
            element.url = 'test url';
            assert.equal(element.url, 'https://www.google.com');
        })
    });

    describe('With extra options', () => {
        let element;

        before(async () => {
            element = await extraOptionsFixture();
            await nextFrame();
        });

        it('should render extra slot when extraOptions is set', () => {
            assert.notExists(element.shadowRoot.querySelector('slot [name="api-server-extra-slot"]'));
        });
    });

    [
        ['Compact model', true],
        ['Regular model', false]
    ].forEach((item) => {
        describe('renderServerOptions()', () => {
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
                assert.lengthOf(element.renderServerOptions(), 0);
            });

            it('Returns servers for document', () => {
                assert.lengthOf(element.renderServerOptions(), 4);
            });

            it('Returns servers for endpoint', () => {
                const endpoint = AmfHelper.getEndpoint(element, amf, '/ping');
                const endpointId = endpoint['@id'];
                const detail = {
                    selected: endpointId,
                    type: 'endpoint',
                };
                element.handleNavigationChange({ detail });
                assert.lengthOf(element.renderServerOptions(), 1);
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
                element.handleNavigationChange({ detail });
                assert.lengthOf(element.renderServerOptions(), 2);
            });
        });

        describe('handleSelectionChanged()', () => {
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
                assert.equal(element._selectedValue, id);
                assert.equal(element._selectedIndex, index);
            });

            it('should select custom url', () => {
                const index = element.servers.length;
                simulateSelection(element, index, 'custom');
                assert.equal(element._selectedValue, 'custom');
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

            it('should update index if custom url is selected and servers change', async () => {
                element = await basicFixture();
                simulateSelection(element, 0, 'custom');
                element.amf = amf;
                assert.equal(element._selectedIndex, element.servers.length);
                assert.equal(element._selectedValue, 'custom');
            });

            it('should update index if servers change and selected is in new servers', () => {
                const encodes = AmfHelper.getEncodes(element, amf)
                const server = AmfHelper.getServer(element, encodes, 'https://{customerId}.saas-app.com:{port}/v2');
                const id = server['@id'];
                const index = AmfHelper.indexOfServer(element, encodes, id)
                simulateSelection(element, index, id);
                element.servers = [...element.servers];
                assert.isDefined(element._selectedIndex);
                assert.isDefined(element._selectedValue);
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
                assert.isUndefined(element._getServerValue(undefined));
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
    });
});
