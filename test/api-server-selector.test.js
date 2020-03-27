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

    describe('Basic - No model', () => {
        let element;

        before(async () => {
            element = await basicFixture();
            await nextFrame();
        });

        it('should render dropdown', () => {
            assert.exists(element.shadowRoot.querySelector('.api-server-dropdown'))
        });

        it('should render url input field', () => {
            assert.exists(element.shadowRoot.querySelector('.url-input'))
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
        })
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
                const encodes = AmfHelper.getEncodes(element, amf)
                const server = AmfHelper.getServer(element, encodes, 'https://{customerId}.saas-app.com:{port}/v2');
                const id = server['@id'];
                const index = AmfHelper.indexOfServer(element, encodes, id)
                const target = { selectedItem: { getAttribute: () => id } };
                const detail = {
                    value: index,
                };
                element.handleSelectionChanged({ detail, target });
                assert.equal(element._selectedValue, id);
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
                const target = { selectedItem: { getAttribute: () => id } };
                const detail = {
                    value: index,
                };
                element.handleSelectionChanged({ detail, target });
                element.servers = [];
            });
        });
    })
});
// TODO add tests
