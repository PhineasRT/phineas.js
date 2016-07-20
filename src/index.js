import EventEmitter from 'events'
import { last, initial } from 'lodash'
import rp from 'request-promise'
import io from 'socket.io-client'

const RP_SERVER = 'http://localhost:3001'
const SOCKET_SERVER = 'http://localhost:3000';
let socket = io(SOCKET_SERVER)

let log = console.log.bind(console, '[sdk]')
log(`RP_SERVER: ${RP_SERVER} | socketio-server: ${SOCKET_SERVER}`)

let clientId = null   // socketId send by server on connect event
let connected = null  // whether the socket connection has been made or not
let subscriptionQueue = []

class Phineas extends EventEmitter {

  constructor (tableName) {
    super()
    this.tableName = tableName
  }

  withTable (tableName) {
    this.tableName = tableName
    return this
  }

  /**
   * subscribe to a query
   * @param  {string}    subName - subscription name
   * @param  {...[any]} args - args to pass to subscription, except the last one, which is a callback
   * @return {Phineas}          returns a new instance of Phineas
   */
  subscribe (subName, ...args) {
    let instance = new Phineas(this.tableName)

    // queue messages until connection is made
    if (!connected) {
      subscriptionQueue.push({instance: instance, subName: subName, args: args})
      return instance
    }

    return subscribePhineasInstance.call(instance, subName, args)
  }

  callOnce (subName, ...args) {
    if (!(last(args) instanceof Function)) {
      console.warn('[WARN] no callback function specified. A function (err, result) { } should be provided ' +
        'as last argument to callOnce.')
      args.push(dummyCallback)
    }

    let subArgs = initial(args)
    let callback = last(args)

    httpSubscribe.call(this, subName, subArgs, callback)
  }
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
function subscribePhineasInstance (subName, args) {
  let self = this

  if (!self.tableName) {
    console.error('table name not specified')
    return self
  }

  if (!(last(args) instanceof Function)) {
    console.warn('[WARN] no callback function specified. A function (err, result) { } should be provided ' +
      'as last argument to subscribe.')
    args.push(dummyCallback)
  }

  let callback = last(args)    // last arg as callback
  let subArgs = initial(args)  // args to pass to subscription request (all except last)
  log(`subscribe request for ${self.tableName} with args ${JSON.stringify(subArgs)}`)

  httpSubscribe.call(self, subName, subArgs, callback)
  wsSubscribe.call(self, subName, subArgs)

  return self
}

function dummyCallback (err, response) {
  if (err) {
    console.error(err)
    console.trace()
  }
}

function httpSubscribe (subName, subArgs, callback = dummyCallback) {
  let reqOptions = {
    method: 'POST',
    uri: RP_SERVER + `/fetch/${subName}`,
    body: {
      args: subArgs,
      tableName: this.tableName
    },
    json: true
  }

  rp(reqOptions)
    .then(function (res) {
      log('Got response:', res)
      callback(null, res)
    })
    .catch(function (err) {
      console.error('Error executing subscribe request', err)
      callback(err)
    })
}

/**
 * web socket stuff below
 */
socket.on('connected', function (clientId) {
  log('connected')
  clientId = clientId
  connected = true

  // drain queue once subscription is made
  subscriptionQueue.forEach(function (subscriptionParams) {
    let {instance, subName, args} = subscriptionParams
    subscribePhineasInstance.call(instance, subName, args)
  })

  subscriptionQueue = []
})

// web-socket subscribe request
function wsSubscribe (subName, subArgs) {
  let self = this
  let reqParams = {
    subscriptionName: subName,
    args: subArgs,
    tableName: self.tableName,
    clientId: clientId
  }
  socket.emit('subscribe', reqParams)
  socket.on('db:update', function (msg) {
    log('db:update', msg)
    var event = JSON.parse(msg.notification)
    self.emit(event.eventType, event);
  })
}

export default Phineas
