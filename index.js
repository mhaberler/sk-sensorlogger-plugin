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

  const flatten = (obj, prefix = [], current = []) => {
    if (typeof (obj) === 'object' && obj !== null) {
      for (const key of Object.keys(obj)) {
        flatten(obj[key], prefix.concat(key), current)
      }
    } else {
      current.push({
        path: prefix.join('.'),
        value: obj
      })
      // current[prefix.join('.')] = obj
    }
    return current
  }


  function registerWithRouter(router) {
    app.post('/sensorlogger', (req, res) => {
      let u = []
      req.body.payload.map(v => flatten(v.values, ['self', 'sensorlogger', v.name], u));
      let updates = {
        updates: [{
          '$source': 'sensorlogger.' + req.body.deviceId,
          values: u
        }]
      }
      app.handleMessage('sensorlogger', updates)
      // app.debug('updates :', updates);
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
}