import request from 'request-promise'
import config from './config'

const backend = config.backend[process.env.BUILD_ENV]
const log = console.log.bind(console, '[sdk/services]')

log("[env]", process.env.BUILD_ENV)

function initialize ({appID, secret}) {
  var project = {appID, secret}
  let options = {
    method: 'POST',
    uri: backend + '/project/status',
    body: {
      project
    },
    json: true
  }

  return request(options)
    .then(function (res) {
      log(res)
      if(!res.ok) throw new Error("could not get services")

      if(res.status === 'creating') {
        log(`Application ${appID} not created yet`)
        return Promise.resolve({services: []})
      }

      return Promise.resolve({services: res.services})
    })
}

exports.initialize = initialize