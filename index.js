const packageJson = require('./package')
const id = packageJson.name.replace(/[-@/]/g, '_')
const {
  name,
  description
} = packageJson

const schema = {};
module.exports = function (app) {
  const onStop = []
  let state = 'initial state'

  function start(configuration) {
    state = `yes, I'm started`
    let interval = setInterval(() => {
      app.debug('Running ', new Date())
    }, 25000)
    onStop.push(() => clearInterval(interval))
  }

  function stop() {
    onStop.forEach((f) => {
      try {
        f()
      } catch (e) {
        app.error(e)
      }
    })
    state = `now I'm stopped`
  }

  const schema = {}

  const flatten = (obj, prefix = [], current = {}) => {
    if (typeof (obj) === 'object' && obj !== null) {
      for (const key of Object.keys(obj)) {
        flatten(obj[key], prefix.concat(key), current)
      }
    } else {
      current[prefix.join('.')] = obj
    }
    return current
  }

  // sk-sensorlogger Handling value : {
  //   'self.sensorlogger.magnetometer.z': 0,
  //   'self.sensorlogger.magnetometer.y': 0,
  //   'self.sensorlogger.magnetometer.x': 0
  // } +0ms

  function registerWithRouter(router) {
    app.post('/sensorlogger', (req, res) => {
      app.debug("body=", req.body)
      req.body.payload.forEach(
        function (v) {
          app.debug('Handling value :', flatten(v.values, ['self', 'sensorlogger', v.name], {}))
        })
      //app.handleMessage('sensorlogger', createDelta(req.body))
      res.sendStatus(200);
    })
  }

  return {
    id,
    name,
    description,
    start,
    stop,
    schema,
    registerWithRouter
  }



  // const createDelta = (data) => {
  //   var v = {
  //     updates: [{
  //       '$source': 'sensorlogger.' + data.deviceId,
  //       values: []
  //     }]
  //   }
  //   for
  // return {
  //   updates: [{
  //     '$source': 'sensorlogger.' + data.deviceId,
  //     values: [{
  //       path: `environment.${data.location}.${humidityKey}`,
  //       value: _.round(data.humidity, 2)
  //     }]
  //   }]
  // }
}