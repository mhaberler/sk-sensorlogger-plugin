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
          '$source': plugin.id + '.' + req.body.deviceId,
          timestamp: Date(v.time / 1e6),
          values: []
        }
        flatten(v.values, ['sensorlogger', v.name], u.values)
        updates.updates.push(u)
      });
      app.debug(plugin.id, updates)
      app.handleMessage(plugin.id, updates)
      res.sendStatus(200);
    })
  }

  return plugin
}