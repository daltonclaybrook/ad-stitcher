/**
* URLLoader.js
*
* Loads urls
*/

var https = require('https');
var Q = require('q');

var self = module.exports = {

  get: function(context) {
    var deferred = Q.defer();

		https.get(context.url, function(res) {
  		if (res.statusCode == 200) {
				var data = '';
				res.on('data', function (chunk) {
    			data += chunk;
  			});

  			res.on('end', function () {
					context.urlData = data;
    			deferred.resolve(context);
  			});

				res.on('error', function(err) {
					deferred.reject(err);
				});
			} else {
				deferred.reject({
					reason: 'url (' + url + ') returned status code: ' + res.statusCode
				});
			}
		}).on('error', function(err) {
  		deferred.reject(err);
		});

		return deferred.promise;
  }

};
