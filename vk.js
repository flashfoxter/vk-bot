var url = require('url')
var request = require('request')
var _ = require('lodash')
var util = require('util')
var EventEmitter = require('events').EventEmitter


url.extend = function(url1, url2) {
  if (typeof url1 === 'string') url1 = url.parse(url1)
  if (typeof url2 === 'string') url2 = url.parse(url2)
  return url.format(_.extend(url1, url2));
}


var single_req_mode = true;
var last_req = {};

var VK = function(_options) {
  var self = this
  self.options = _options
  
  if (self.options.proxy) {
    request = request.defaults({ proxy: self.options.proxy }) 
  }


  self._authorizeUrl = 'https://oauth.vk.com/authorize'
  self._blankUrl = 'https://oauth.vk.com/blank.html'
  self._apiUrl = 'https://api.vk.com/method/'


  self.authUrl = function (scope) {
    return url.extend(self._authorizeUrl, { 
      query: { 
        client_id: self.options.appID, 
        scope: scope,
        redirect_uri: self._blankUrl, 
        response_type: 'token',
        display: 'mobile',
        v: '5.21' 
      }
    })
  }

  

  self.request = function(_method, _params) { 
    if (single_req_mode && last_req[_method]) {
      console.log('vk request REJECTED[single_req_mode]:', _method, _params)
      return
    }

    var url = self._apiUrl + _method  + '?' + 'access_token=' + self.token

    for (var key in _params) {
      url += ('&' + key + '=' + encodeURIComponent(_params[key]))
    }

    console.log('vk request:', _method, _params)

    if (single_req_mode) {
      last_req[_method] = true
    }

    request({ url: url, json: true }, function (error, response, body) {

      if (single_req_mode) {
        last_req[_method] = false
      }

      // if (error) {
        // console.log('vk error:', _method, body, error);
      // }


      console.log('vk:', _method, body, error)      
      self.emit('done:' + _method, body, error);
    });
  }


  self.setToken = function (_param) {
    self.token = _param.token 
  }

}


util.inherits(VK, EventEmitter);
module.exports = VK