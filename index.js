module.exports = function (app) {
  let plugin = {}

  plugin.id = 'sk-sensorlogger'
  plugin.name = 'Sensorlogger HTTP listener'
  plugin.description = 'reads Sensorlogger values into SignalK'
  plugin.schema = {
    type: 'object',
    properties: {
        uuidParams: {
        type: "array",
        title: "Phone UUID to path map",
        items: {
          type: "object",
          required: [
            "uuid",
            "path"
          ],
          properties: {
            uuid: {
              type: "string",
              title: "phone uuid",
              default: ""
            },
            path: {
              type: "string",
              title: "path",
              default: "myPhone"
            }
          }
        }
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

      if (req.body.payload[0].name === 'test') {
        app.debug("test push from device with the following uuid detected: ", req.body.deviceId)
        res.sendStatus(200);
        return
      }
      req.body.payload.map(v => {
        let u = {
          '$source': plugin.id,
          timestamp: Date(v.time / 1e6),
          values: []
        }
        let cfg = plugin.config.uuidParams.find(e => e.uuid === req.body.deviceId)
        let device = cfg.path || 'environment.sensorlogger';
        flatten(v.values, [device, v.name], u.values)
        updates.updates.push(u)
      });
      app.handleMessage(plugin.id, updates)
      res.sendStatus(200);
    })
  }

  return plugin
}