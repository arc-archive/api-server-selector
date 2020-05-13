/* eslint-disable import/no-extraneous-dependencies */
const merge = require('deepmerge');
const { slSettings } = require('@advanced-rest-client/testing-karma-sl');
const createBaseConfig = require('./karma.conf.js');

module.exports = (config) => {
  const slConfig = merge(slSettings(config), {
    sauceLabs: {
      testName: 'api-server-selector',
    },
    client: {
      mocha: {
        timeout: 15000
      }
    }
  });
  config.set(merge(createBaseConfig(config), slConfig));
  return config;
};
