'use strict';

var _get = require('babel-runtime/helpers/get')['default'];

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _lodash = require('lodash');

var _requestPromise = require('request-promise');

var _requestPromise2 = _interopRequireDefault(_requestPromise);

var _socketIoClient = require('socket.io-client');

var _socketIoClient2 = _interopRequireDefault(_socketIoClient);

var RP_SERVER = 'http://localhost:3001';
var SOCKET_SERVER = 'http://localhost:3000';
var socket = (0, _socketIoClient2['default'])(SOCKET_SERVER);

var log = console.log.bind(console, '[sdk]');
log('RP_SERVER: ' + RP_SERVER + ' | socketio-server: ' + SOCKET_SERVER);

var clientId = null; // socketId send by server on connect event
var connected = null; // whether the socket connection has been made or not
var subscriptionQueue = [];

var Phineas = (function (_EventEmitter) {
  _inherits(Phineas, _EventEmitter);

  function Phineas(tableName) {
    _classCallCheck(this, Phineas);

    _get(Object.getPrototypeOf(Phineas.prototype), 'constructor', this).call(this);
    this.tableName = tableName;
  }

  /**
   * make a subscription -
   * 1. http call to get initial data,
   * 2. websocet connection to get updates
   *
   * @param  {string} subName - subscription name
   * @param  {array} args - args to subscriptions
   * @return {Phineas} Phineas instance on which it is called
   */

  _createClass(Phineas, [{
    key: 'withTable',
    value: function withTable(tableName) {
      this.tableName = tableName;
      return this;
    }

    /**
     * subscribe to a query
     * @param  {string}    subName - subscription name
     * @param  {...[any]} args - args to pass to subscription, except the last one, which is a callback
     * @return {Phineas}          returns a new instance of Phineas
     */
  }, {
    key: 'subscribe',
    value: function subscribe(subName) {
      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      var instance = new Phineas(this.tableName);

      // queue messages until connection is made
      if (!connected) {
        subscriptionQueue.push({ instance: instance, subName: subName, args: args });
        return instance;
      }

      return subscribePhineasInstance.call(instance, subName, args);
    }
  }, {
    key: 'callOnce',
    value: function callOnce(subName) {
      for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }

      if (!((0, _lodash.last)(args) instanceof Function)) {
        console.warn('[WARN] no callback function specified. A function (err, result) { } should be provided ' + 'as last argument to callOnce.');
        args.push(dummyCallback);
      }

      var subArgs = (0, _lodash.initial)(args);
      var callback = (0, _lodash.last)(args);

      httpSubscribe.call(this, subName, subArgs, callback);
    }
  }]);

  return Phineas;
})(_events2['default']);

function subscribePhineasInstance(subName, args) {
  var self = this;

  if (!self.tableName) {
    console.error('table name not specified');
    return self;
  }

  if (!((0, _lodash.last)(args) instanceof Function)) {
    console.warn('[WARN] no callback function specified. A function (err, result) { } should be provided ' + 'as last argument to subscribe.');
    args.push(dummyCallback);
  }

  var callback = (0, _lodash.last)(args); // last arg as callback
  var subArgs = (0, _lodash.initial)(args); // args to pass to subscription request (all except last)
  log('subscribe request for ' + self.tableName + ' with args ' + JSON.stringify(subArgs));

  httpSubscribe.call(self, subName, subArgs, callback);
  wsSubscribe.call(self, subName, subArgs);

  return self;
}

function dummyCallback(err, response) {
  if (err) {
    console.error(err);
    console.trace();
  }
}

function httpSubscribe(subName, subArgs) {
  var callback = arguments.length <= 2 || arguments[2] === undefined ? dummyCallback : arguments[2];

  var reqOptions = {
    method: 'POST',
    uri: RP_SERVER + ('/fetch/' + subName),
    body: {
      args: subArgs,
      tableName: this.tableName
    },
    json: true
  };

  (0, _requestPromise2['default'])(reqOptions).then(function (res) {
    log('Got response:', res);
    callback(null, res);
  })['catch'](function (err) {
    console.error('Error executing subscribe request', err);
    callback(err);
  });
}

/**
 * web socket stuff below
 */
socket.on('connected', function (clientId) {
  log('connected');
  clientId = clientId;
  connected = true;

  // drain queue once subscription is made
  subscriptionQueue.forEach(function (subscriptionParams) {
    var instance = subscriptionParams.instance;
    var subName = subscriptionParams.subName;
    var args = subscriptionParams.args;

    subscribePhineasInstance.call(instance, subName, args);
  });

  subscriptionQueue = [];
});

// web-socket subscribe request
function wsSubscribe(subName, subArgs) {
  var self = this;
  var reqParams = {
    subscriptionName: subName,
    args: subArgs,
    tableName: self.tableName,
    clientId: clientId
  };
  socket.emit('subscribe', reqParams);
  socket.on('db:update', function (msg) {
    log('db:update', msg);
    var event = JSON.parse(msg.notification);
    self.emit(event.eventType, event);
  });
}

exports['default'] = Phineas;
module.exports = exports['default'];
//# sourceMappingURL=index.js.map
