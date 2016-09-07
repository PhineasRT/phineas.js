'use strict';

var _Promise = require('babel-runtime/core-js/promise')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

var _requestPromise = require('request-promise');

var _requestPromise2 = _interopRequireDefault(_requestPromise);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var backend = _config2['default'].backend["prod"];
// const log = console.log.bind(console, '[sdk/services]')

// log("[env]", process.env.BUILD_ENV)

function initialize(_ref) {
  var appID = _ref.appID;
  var secret = _ref.secret;

  var project = { appID: appID, secret: secret };
  var options = {
    method: 'POST',
    uri: backend + '/project/status',
    body: { project: project },
    json: true
  };

  return (0, _requestPromise2['default'])(options).then(function (res) {
    // log(res)
    if (!res.ok) throw new Error('could not get services');

    if (res.status === 'creating') {
      // log(`Application ${appID} not created yet`)
      return _Promise.resolve({ services: [] });
    }

    return _Promise.resolve({ services: res.services });
  });
}

exports.initialize = initialize;
//# sourceMappingURL=services.js.map
