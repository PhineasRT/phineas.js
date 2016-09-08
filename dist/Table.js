'use strict';

var _get = require('babel-runtime/helpers/get')['default'];

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _toConsumableArray = require('babel-runtime/helpers/to-consumable-array')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _socketIoClient = require('socket.io-client');

var _socketIoClient2 = _interopRequireDefault(_socketIoClient);

var _lodash = require('lodash');

var _requestPromise = require('request-promise');

var _requestPromise2 = _interopRequireDefault(_requestPromise);

var hash = require('object-hash');
var once = require('once');

var log = console.log.bind(console, '[phineas-sdk/Table]');
var error = console.error.bind(console, '[phineas-sdk/Table]');

var Table = (function (_EventEmitter) {
  _inherits(Table, _EventEmitter);

  // endpoints - service endpoints (IPs)

  function Table(_ref) {
    var endpoints = _ref.endpoints;
    var table = _ref.table;

    _classCallCheck(this, Table);

    _get(Object.getPrototypeOf(Table.prototype), 'constructor', this).call(this);
    // console.log('constructor called')
    // log("endpoints:", endpoints, "table", table)

    this.endpoints = endpoints;
    this.table = table.name;

    this.socket;
    this.ws = false; // tells whether the websocet connection has been established
    this.connected = false;
    this.queue = []; // queue to hold subscriptions until connection is made
    this.subscriptions = {};
    this.lastEvent = [];

    var self = this;
    this.on('ep', function (endpoints) {
      log('[event] ep', endpoints);
      self.endpoints = endpoints;
      self.socket = (0, _socketIoClient2['default'])(endpoints.phineas);

      self.socket.on('connected', onConnection.bind(self));

      if (self.ws) {
        self.connected = true;
      }
    });
  }

  _createClass(Table, [{
    key: 'subscribe',
    value: function subscribe(query) {
      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      return _subscribe.call(this, query, args);
    }
  }, {
    key: 'callOnce',
    value: function callOnce(query) {
      for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }

      if (!((0, _lodash.last)(args) instanceof Function)) {
        console.warn('[WARN] no callback function specified. A function (err, result) { } should be provided ' + 'as last argument to callOnce.');
        args.push(dummyCallback);
      }

      var subArgs = (0, _lodash.initial)(args);
      var callback = (0, _lodash.last)(args);

      httpSubscribe.call(this, query, subArgs, callback);
    }
  }]);

  return Table;
})(_events2['default']);

exports['default'] = Table;

// web socket on 'connection'
function onConnection(clientId) {
  // log('connected', clientId)
  var self = this;

  self.ws = true;
  if (self.endpoints && self.endpoints.rp && self.endpoints.phineas) {
    self.connected = true;
  }

  // drain queue once subscription is made
  self.queue.forEach(function (params) {
    var query = params.query;
    var args = params.args;

    // log("args", args)
    self.subscribe.apply(self, [query].concat(_toConsumableArray(args)));
  });
}

function _subscribe(query, args) {
  var self = this;

  if (!self.table) {
    error('Table name not specified');
    return self;
  }

  var callback = (0, _lodash.last)(args);
  if (!(callback instanceof Function)) {
    console.warn('[WARN] no callback function specified. A function (err, result) { } should be provided ' + 'as last argument to subscribe.');
    args.push(dummyCallback);
  }

  callback = (0, _lodash.last)(args); // last arg as callback
  var subArgs = (0, _lodash.initial)(args); // args to pass to subscription request (all except last)
  var argsAsString = JSON.stringify(subArgs);
  // log(`subscribe request. Table: ${self.table} | Query : ${query} | Args: ${subArgs}`)

  var subName = query;

  var channel = self.table + '::' + subName + '::' + argsAsString;

  if (!self.subscriptions[channel]) {
    log('new event emiiter');
    self.subscriptions[channel] = new _events2['default']();
  }

  if (self.connected) {
    httpSubscribe.call(self, query, subArgs, callback);
    wsSubscribe.call(self, query, subArgs);
  } else {
    self.queue.push({ query: query, args: args });
  }

  return self.subscriptions[channel];
}

// first data load
function httpSubscribe(query, args, callback) {
  var options = {
    method: 'POST',
    uri: this.endpoints.rp + ('/fetch/' + query),
    body: {
      args: args,
      tableName: this.table
    },
    json: true
  };

  (0, _requestPromise2['default'])(options).then(function (res) {
    // log('First data load response:', res)
    callback(null, res);
  })['catch'](function (err) {
    console.error('Error executing subscribe request', err);
    callback(err);
  });
}

// make sure onUpdate called only once
var onUpdateFn = once(onUpdate);

// web-socket subscribe request
function wsSubscribe(query, args) {
  var self = this;

  var reqParams = {
    subscriptionName: query,
    args: args,
    tableName: self.table,
    clientId: 'test'
  };

  self.socket.emit('subscribe', reqParams);
  onUpdateFn.call(self);
}

function onUpdate() {
  var self = this;

  log('on:update');
  self.socket.on('db:update', function (msg) {
    // log('db:update', msg.channel)
    var channel = msg.channel;
    var event = JSON.parse(msg.notification);

    if (self.lastEvent[channel] === hash(event)) {
      return;
    }

    self.lastEvent[channel] = hash(event);
    if (self.subscriptions[channel]) {
      self.subscriptions[channel].emit(event.eventType, event);
    }
  });
}

function dummyCallback(err, data) {
  if (err) throw err;
}
module.exports = exports['default'];
//# sourceMappingURL=Table.js.map
