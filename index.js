;(function (window) {

  function defaults (target, obj) {
    for (var prop in obj) target[prop] = target[prop] || obj[prop]
    return target
  }

  function getQuery (queryParams) {
    var arr = Object.keys(queryParams).map(function (k) {
      return [k, encodeURIComponent(queryParams[k])].join('=')
    })
    return '?' + arr.join('&')
  }

  var responseHandlers = {
    'json': function(response) { return response.json() },
    'text': function(response) { return response.text() },
    'response': true
  }

  function noop(v) { return v }
  var encodeHandlers = {
    'none': noop, false: noop, null: noop,
    'json': JSON.stringify }


  function _fetch (method, url, opts, data, queryParams) {
    // Use a shallow copy of opts parameter and opts.header subfield
    opts = defaults({}, opts)
    opts.method = method
    opts.headers = defaults({}, opts.headers || {})

    if (opts.responseAs !== true && typeof opts.responseAs !== 'function') {
      opts.responseAs = responseHandlers[opts.responseAs] || responseHandlers.json
    }

    defaults(opts.headers, {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    })

    if (queryParams) {
      url += getQuery(queryParams)
    }

    if (data) {
      if (typeof opts.encodeAs !== 'function') {
        opts.encodeAs = encodeHandlers[opts.encodeAs] || encodeHandlers.json
      }
      opts.body = opts.encodeAs(data)
    }

    if (opts.beforeFetch) {
      opts.beforeFetch(url, opts)
    }
    return fetchival.fetch(url, opts)
      .then(function (response) {
        if (opts.afterFetch) {
          opts.afterFetch(url, opts)
        }
        if (response.status >= 200 && response.status < 300) {
          if(opts.responseAs===true)
            return response
          if (response.status == 204)
            return null;
          return opts.responseAs(response);
        }
        if(typeof opts.errorAs !== 'function') {
          var err = new Error(response.statusText)
          err.response = response
          throw err
        } else {
          throw opts.errorAs(response)
        }
      })
  }

  function fetchival (url, opts) {
    if (! /https?:\/\//.test(url))
      throw new TypeError("Expected url to be a string starting with http:// or https://")

    opts = opts || {}

    var _ = function (u, o) {
      // Extend parameters with previous ones
      if (!u) u = url
      else u = url.replace(/\/$/, '')  // trim trailing slash from original
         + ('/'+u).replace(/^\/\//, '/') // join with url part, replacing leading // with a single /
      o = o || {}
      defaults(o, opts)
      return fetchival(u, o)
    }
    _.inspect = function() {
      return '<<fetchival '+url+'>>'
    }

    _.get = function (queryParams) {
      return _fetch('GET', url, opts, null, queryParams)
    }

    _.post = function (data, queryParams) {
      return _fetch('POST', url, opts, data, queryParams)
    }

    _.put = function (data, queryParams) {
      return _fetch('PUT', url, opts, data, queryParams)
    }

    _.patch = function (data, queryParams) {
      return _fetch('PATCH', url, opts, data, queryParams)
    }

    _.delete = function (queryParams) {
      return _fetch('DELETE', url, opts, null, queryParams)
    }

    return _
  }

  // Expose fetch so that other polyfills can be used
  // Bind fetch to window to avoid TypeError: Illegal invocation
  fetchival.fetch = typeof fetch !== 'undefined' ? fetch.bind(window) : null
  fetchival.responseHandlers = responseHandlers
  fetchival.encodeHandlers = encodeHandlers

  // Support CommonJS, AMD & browser
  if (typeof exports === 'object')
    module.exports = fetchival
  else if (typeof define === 'function' && define.amd)
    define(function() { return fetchival })
  else
    window.fetchival = fetchival

})(typeof window != 'undefined' ? window : undefined);
