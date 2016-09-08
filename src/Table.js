import EventEmitter from 'events'
import io from 'socket.io-client'
import { last, initial } from 'lodash'
import request from 'request-promise'
var hash = require('object-hash')
var once = require('once')

// var log = console.log.bind(console, '[phineas-sdk/Table]')
var error = console.error.bind(console, '[phineas-sdk/Table]')

class Table extends EventEmitter {
  // endpoints - service endpoints (IPs)
  constructor ({endpoints, table}) {
    super()
    // log("endpoints:", endpoints, "table", table)

    this.endpoints = endpoints
    this.table = table.name

    this.socket
    this.ws = false // tells whether the websocet connection has been established
    this.connected = false
    this.queue = [] // queue to hold subscriptions until connection is made
    this.subscriptions = {}
    this.lastEvent = []

    var self = this
    this.on('ep', function (endpoints) {
      // log('[event] ep', endpoints)
      self.endpoints = endpoints
      self.socket = io(endpoints.phineas)

      self.socket.on('connected', onConnection.bind(self))

      if (self.ws) {
        self.connected = true
      }
    })
  }

  subscribe (query, ...args) {
    return subscribe.call(this, query, args)
  }

  callOnce (query, ...args) {
    if (!(last(args) instanceof Function)) {
      console.warn('[WARN] no callback function specified. A function (err, result) { } should be provided ' +
        'as last argument to callOnce.')
      args.push(dummyCallback)
    }

    let subArgs = initial(args)
    let callback = last(args)

    httpSubscribe
      .call(this, query, subArgs, callback)
  }
}

export default Table

// web socket on 'connection'
function onConnection (clientId) {
  // log('connected', clientId)
  var self = this

  self.ws = true
  if (self.endpoints && self.endpoints.rp && self.endpoints.phineas) {
    self.connected = true
  }

  // drain queue once subscription is made
  self.queue.forEach(function (params) {
    let {query, args} = params
    // log("args", args)
    self.subscribe(query, ...args)
  })
}

function subscribe (query, args) {
  let self = this

  if (!self.table) {
    error('Table name not specified')
    return self
  }

  let callback = last(args)
  if (!(callback instanceof Function)) {
    console.warn('[WARN] no callback function specified. A function (err, result) { } should be provided ' +
      'as last argument to subscribe.')
    args.push(dummyCallback)
  }

  callback = last(args) // last arg as callback
  let subArgs = initial(args) // args to pass to subscription request (all except last)
  const argsAsString = JSON.stringify(subArgs)
  // log(`subscribe request. Table: ${self.table} | Query : ${query} | Args: ${subArgs}`)

  const subName = query

  const channel = `${self.table}::${subName}::${argsAsString}`

  if (!self.subscriptions[channel]) {
    self.subscriptions[channel] = new EventEmitter()
  }

  if (self.connected) {
    httpSubscribe.call(self, query, subArgs, callback)
    wsSubscribe.call(self, query, subArgs)
  } else {
    self.queue.push({query, args})
  }

  return self.subscriptions[channel]
}

// first data load
function httpSubscribe (query, args, callback) {
  let options = {
    method: 'POST',
    uri: this.endpoints.rp + `/fetch/${query}`,
    body: {
      args: args,
      tableName: this.table
    },
    json: true
  }

  request(options)
    .then(function (res) {
      // log('First data load response:', res)
      callback(null, res)
    })
    .catch(function (err) {
      console.error('Error executing subscribe request', err)
      callback(err)
    })
}

// make sure onUpdate called only once
const onUpdateFn = once(onUpdate)

// web-socket subscribe request
function wsSubscribe (query, args) {
  let self = this

  let reqParams = {
    subscriptionName: query,
    args: args,
    tableName: self.table,
    clientId: 'test'
  }

  self.socket.emit('subscribe', reqParams)
  onUpdateFn.call(self)
}

function onUpdate () {
  var self = this

  // log('on:update')
  self.socket.on('db:update', function (msg) {
    // log('db:update', msg.channel)
    var channel = msg.channel
    var event = JSON.parse(msg.notification)

    if (self.lastEvent[channel] === hash(event)) {
      return
    }

    self.lastEvent[channel] = hash(event)
    if (self.subscriptions[channel]) {
      self.subscriptions[channel].emit(event.eventType, event)
    }
  })
}

function dummyCallback (err, data) {
  if (err) throw err
}
