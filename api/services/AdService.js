/**
* AdService.js
*
* Fetch/parse VMAP/VAST files
*/

var Q = require('q');
var parseXML = require('xml2js').parseString;

var self = module.exports = {

  loadAdsFromVMAP: function(context) {
    var deferred = Q.defer();

    self.fetchXML({ url: context.vmapURL })
    .then(self.fetchVASTURLs)

    return deferred.promise;
  },

  /**
  * Helpers
  */

  fetchXML: function(context) {
		var deferred = Q.defer();

		URLLoader.get({ url: context.url })
		.then(function(context) {
			parseXML(context.urlData, function (err, result) {
	    	if (err) {
					deferred.reject({
						errorCode: 500,
						error: 'error parsing XML data'
					});
				} else {
					context.xmlData = result;
					deferred.resolve(context);
				}
			});
		})
		.done(function success(context) {
			deferred.resolve(context);
		}, function error(context) {
			deferred.reject(context);
		});

		return deferred.promise;
	},

  fetchVASTURLs: function(context) {
		var deferred = Q.defer();
		var vmapData = context.xmlData;
		var adBreaks = vmapData['vmap:VMAP']['vmap:AdBreak'];

		var vastPromises = [];
		adBreaks.forEach(function(adBreak) {
			var vastURL = adBreak['vmap:AdSource'][0]['vmap:AdTagURI'][0]['_'];
			vastPromises.push(self.fetchXML({ url: vastURL }));
		});

		Q.all(vastPromises)
		.then(function(contexts) {

		})

		return deferred.promise;
	}

};
