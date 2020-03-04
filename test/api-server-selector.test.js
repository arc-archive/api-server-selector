import { html, fixture, expect } from '@open-wc/testing';

import '../api-server-selector.js';

describe('ApiServerSelector', () => {
  it('has a default title "Hey there" and counter 5', async () => {
    const el = await fixture(html`
      <api-server-selector></api-server-selector>
    `);

    expect(el.title).to.equal('Hey there');
    expect(el.counter).to.equal(5);
  });

  it('increases the counter on button click', async () => {
    const el = await fixture(html`
      <api-server-selector></api-server-selector>
    `);
    el.shadowRoot.querySelector('button').click();

    expect(el.counter).to.equal(6);
  });

  it('can override the title via attribute', async () => {
    const el = await fixture(html`
      <api-server-selector title="attribute title"></api-server-selector>
    `);

    expect(el.title).to.equal('attribute title');
  });

  it('shows initially the text "hey there Nr. 5!" and an "increment" button', async () => {
    const el = await fixture(html`
      <api-server-selector></api-server-selector>
    `);

    expect(el).shadowDom.to.equalSnapshot();
  });

  it('passes the a11y audit', async () => {
    const el = await fixture(html`
      <api-server-selector></api-server-selector>
    `);

    await expect(el).shadowDom.to.be.accessible();
  });
});
