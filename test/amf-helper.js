export const AmfHelper = {};
AmfHelper.getEndpoint = function (element, amf, path) {
  const webApi = element._computeWebApi(amf);
  return element._computeEndpointByPath(webApi, path);
};

AmfHelper.getEncodes = function (element, amf) {
  const key = element._getAmfKey(element.ns.aml.vocabularies.document.encodes);
  if (Array.isArray(amf)) {
    amf = amf[0];
  }
  // console.log({ amf, key })
  return amf[key];
}

AmfHelper.getMethod = function (element, amf, path, method) {
  const endPoint = AmfHelper.getEndpoint(element, amf, path);
  const opKey = element._getAmfKey(element.ns.w3.hydra.supportedOperation);
  const ops = element._ensureArray(endPoint[opKey]);
  return ops.find((item) => element._getValue(item, element.ns.w3.hydra.core + 'method') === method);
};

AmfHelper.getServer = function (element, amf, serverUrl) {
  if (Array.isArray(amf)) {
    amf = amf[0];
  }
  const serverKey = element._getAmfKey(element.ns.aml.vocabularies.apiContract.server);
  const urlKey = element._getAmfKey(element.ns.aml.vocabularies.core.urlTemplate);
  console.log({ amf })
  return element._getValueArray(amf, serverKey).find(server => element._getValue(server, urlKey) === serverUrl);
}

AmfHelper.indexOfServer = function (element, amf, serverId) {
  if (Array.isArray(amf)) {
    amf = amf[0];
  }
  const serverKey = element._getAmfKey(element.ns.aml.vocabularies.apiContract.server);
  return element._getValueArray(amf, serverKey).indexOf(server => server['@id'] === serverId);
}