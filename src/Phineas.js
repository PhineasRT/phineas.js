import App from './App'

class Phineas {
  static initialize ({appID, secret}, opts) {
    var app = new App(appID, secret, opts)
    return app
  }
}

export default Phineas
