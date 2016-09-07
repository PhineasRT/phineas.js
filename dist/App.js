'use strict';

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _Table = require('./Table');

var _Table2 = _interopRequireDefault(_Table);

var _services = require('./services');

var _services2 = _interopRequireDefault(_services);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

// var log = console.log.bind(console, '[App]')
var error = console.error.bind(console, '[sdk/App]');

var App = (function () {
  function App(appID, secret, opts) {
    _classCallCheck(this, App);

    // properties
    this.endpoints = {};
    this.tables = [];

    if (opts && opts.dev) {
      this.endpoints.rp = 'http://localhost:3001';
      this.endpoints.phineas = 'http://localhost:3000';
      this.tables.forEach(function (t) {
        t.emit('ep', this.endpoints);
      });

      // log('[dev:true] endpoints', this.endpoints)
      return;
    }

    var self = this;
    _services2['default'].initialize({ appID: appID, secret: secret }).then(function (res) {
      self.endpoints = _lodash2['default'].mapValues(res.services, function (ep) {
        return 'http://' + ep;
      });
      self.endpoints.rp = self.endpoints.rp + ':3001';

      self.tables.forEach(function (t) {
        t.emit('ep', self.endpoints);
      });
    })['catch'](function (err) {
      error('Error trying to initialize services', err);
    });
  }

  _createClass(App, [{
    key: 'table',
    value: function table(tableName) {
      var table = new _Table2['default']({
        endpoints: this.endpoints,
        table: { name: tableName }
      });

      if (_Object$keys(this.endpoints).length > 0) {
        table.emit('ep', this.endpoints);
      }

      this.tables.push(table);
      return table;
    }
  }]);

  return App;
})();

exports['default'] = App;
module.exports = exports['default'];
//# sourceMappingURL=App.js.map
