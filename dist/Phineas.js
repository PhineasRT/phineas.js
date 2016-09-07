'use strict';

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _App = require('./App');

var _App2 = _interopRequireDefault(_App);

var Phineas = (function () {
  function Phineas() {
    _classCallCheck(this, Phineas);
  }

  _createClass(Phineas, null, [{
    key: 'initialize',
    value: function initialize(_ref, opts) {
      var appID = _ref.appID;
      var secret = _ref.secret;

      var app = new _App2['default'](appID, secret, opts);
      return app;
    }
  }]);

  return Phineas;
})();

exports['default'] = Phineas;
module.exports = exports['default'];
//# sourceMappingURL=Phineas.js.map
