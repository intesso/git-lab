function Router() {
  if (!(this instanceof Router)) return new Router()
  this.routes = [];
}

Router.prototype.use = function (endpoint, fn) {
  this.routes.push([parseRoute(endpoint), fn])
}

Router.prototype.match = function (args) {
  let parsed = Object.assign([], args)
  if (!/(get|post|put|patch|delete|head|options|trace)/.test(args[0].toLowerCase())) parsed.unshift('get')
  let found = this.routes.findIndex(route => {
    let { endpoint, fn } = route
    let matches = endpoint.segments.reduce((result, segment, i) => {
      return result && (segment.name == parsed[i] || segment.param && parsed[i])
    }, true)
    return matches
  })
  return this.routes[found]
}

function parseArgs(args) {
  args = Object.assign([], args)
  let method = /(get|post|put|patch|delete|head|options)/i.test(args[0]) ? args.shift().toLowerCase() : 'get'
  let query = args[args.length - 1].includes('=') ? args.pop() : null
  return { method, segments: args, query }
}

function parseRoute(route) {
  let endpoint = route.split(' ')
  let method = endpoint[0].toLowerCase()
  let path = endpoint[1].split('?')
  let pathname = path[0]
  let query = path[1]
  query = qs.parse(query || '')
  let segments = pathname.split('/')
  segments = segments.map(segment => ({
    name: segment,
    param: /^[:${].*/.test(segment) ? segment.replace(/[:${}]/g, '') : false,
  }))
  return { method, segments, query }
}