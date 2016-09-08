'use strict';

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _App = require('./App');

var _App2 = _interopRequireDefault(_App);

var _objectHash = require('object-hash');

var _objectHash2 = _interopRequireDefault(_objectHash);

console.log('PHIENAS');

var Phineas = {
  apps: {},

  initialize: function initialize(_ref, opts) {
    var appID = _ref.appID;
    var secret = _ref.secret;

    var h = (0, _objectHash2['default'])({ appID: appID, secret: secret });
    if (this.apps[h]) {
      console.log('returning instance');
      return this.apps[h];
    } else {
      console.log('new instance');

      var app = new _App2['default'](appID, secret, opts);
      this.apps[h] = app;
      return app;
    }
  }
};

exports['default'] = Phineas;
module.exports = exports['default'];
//# sourceMappingURL=Phineas.js.map
