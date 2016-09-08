import App from './App'
import hash from 'object-hash'

console.log('PHIENAS')

var Phineas = {
  apps: {},

  initialize: function ({appID, secret}, opts) {
    const h = hash({appID, secret})
    if (this.apps[h]) {
      return this.apps[h]
    } else {
      var app = new App(appID, secret, opts)
      this.apps[h] = app
      return app
    }
  }
}

export default Phineas
