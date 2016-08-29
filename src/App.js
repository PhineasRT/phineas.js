import Table from './Table'
import services from './services'

var log = console.log.bind(console, '[App]')

class App {
	constructor(appID, secret, opts) {
    // properties
    this.endpoints = {}
    this.tables = []

    if(opts && opts.dev) {
      this.endpoints.rp = 'http://localhost:3001'
      this.endpoints.phineas = 'http://localhost:3000'
      this.tables.forEach(function (t) {
        t.emit('ep', this.endpoints)
      })

      log('[dev:true] endpoints', this.endpoints)
      return ;  
    }

    services.initialize({appID, secret})
      .then(function (res) {
        this.endpoints = res.services
        this.tables.forEach(function (t) {
          t.emit('ep', this.endpoints)
        })
      })
      .catch(function (err) {
        log(err)
      })
  }

  table(tableName) {
    var self = this

    var table = new Table({
      endpoints: this.endpoints,
      table: {name: tableName}
    })

    if(this.endpoints) {
      table.emit('ep', this.endpoints)
    }

    this.tables.push(table)
    return table;
  }

}

export default App