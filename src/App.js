import Table from './Table'
import services from './services'
import _ from 'lodash'

// var log = console.log.bind(console, '[App]')
var error = console.error.bind(console, '[sdk/App]')

class App {
  constructor (appID, secret, opts) {
    // properties
    this.endpoints = {}
    this.tables = []
    this.tablesCache = {}

    if (opts && opts.dev) {
      this.endpoints.rp = 'http://localhost:3001'
      this.endpoints.phineas = 'http://localhost:3000'
      this.tables.forEach(function (t) {
        t.emit('ep', this.endpoints)
      })

      // log('[dev:true] endpoints', this.endpoints)
      return
    }

    var self = this
    services.initialize({appID, secret})
      .then(function (res) {
        self.endpoints = _.mapValues(res.services, ep => 'http://' + ep)
        self.endpoints.rp = self.endpoints.rp + ':3001'

        self.tables.forEach(function (t) {
          t.emit('ep', self.endpoints)
        })
      })
      .catch(function (err) {
        error('Error trying to initialize services', err)
      })
  }

  table (tableName) {
    if (this.tablesCache[tableName]) {
      return this.tablesCache[tableName]
    }

    var table = new Table({
      endpoints: this.endpoints,
      table: {name: tableName}
    })

    if (Object.keys(this.endpoints).length > 0) {
      table.emit('ep', this.endpoints)
    }

    this.tablesCache[tableName] = table
    this.tables.push(table)
    return table
  }

}

export default App
