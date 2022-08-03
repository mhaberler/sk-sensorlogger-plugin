module.exports = function (app) {
  let plugin = {}

  plugin.id = 'sk-sensorlogger'
  plugin.name = 'Sensorlogger HTTP listener'
  plugin.description = 'reads Sensorlogger values into SignalK'
  plugin.schema = {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        title: 'SignalK Path',
        description: 'This is used to build the path in Signal K.',
        default: 'environment.sensorlogger'
      }
    }
  }
  plugin.devices = {
    "99dac4cb-d27e-4319-9e0e-5f9067ead1d7": "environment.ios",
    "1d6b3d72-643c-433c-b622-2a62cfbe7afe": "environment.android"
  }

  plugin.start = function (config) {
    plugin.config = config
    app.debug(plugin.id, 'start', new Date(), config)
  }

  plugin.stop = function () {
    app.debug(plugin.id, 'stop', new Date())
  }

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
    }
    return current
  }

  plugin.registerWithRouter = function (router) {
    app.post('/sensorlogger', (req, res) => {
      let updates = {
        context: 'vessels.' + app.selfId,
        updates: []
      }
      req.body.payload.map(v => {
        console.log(v.name)
        let u = {
          '$source': plugin.id,
          timestamp: Date(v.time / 1e6),
          values: []
        }
        let device = plugin.devices[req.body.deviceId] || 'sensorlogger';
        flatten(v.values, [device, v.name], u.values)
        updates.updates.push(u)
      });
      app.debug(plugin.id, updates)
      app.handleMessage(plugin.id, updates)
      res.sendStatus(200);
    })
  }

  return plugin
}