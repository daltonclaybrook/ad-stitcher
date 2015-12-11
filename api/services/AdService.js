/**
* AdService.js
*
* Fetch/parse VMAP/VAST files
*/

/*
{
  preroll: {
    pod: [...]
  },
  midrolls: [{
    time: 10, // time when the midroll is inserted (in seconds),
    pod: [{
      duration: 10, // duration of ad in seconds
      media: [{
        bitrate: 123000, // specified in bps
        source: "http://ad.com/ad_123.mp4"
      },{
        bitrate: 537000,
        source: "http://ad.com/ad_537.mp4"
      }]
    }]
  }],
  postroll: {
    pod: [...]
  }
}
*/

var Q = require('q');
var parseXML = require('xml2js').parseString;

var self = module.exports = {

  loadAdsFromVMAP: function(context) {
    var deferred = Q.defer();

    sails.log.verbose('loading ads');

    self.fetchXML({ url: context.url })
    .then(self.fetchVASTURLs)
    .done(function success(context) {
      deferred.resolve(context);
    }, function error(context) {
      deferred.reject(context);
    });

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
      var doc = self.createAdDocument(adBreaks, contexts);
      context.ads = doc;
      sails.log.verbose('finished parsing document!');
      return context;
		})
    .done(function success(context) {
      deferred.resolve(context);
    }, function error(context) {
      deferred.reject(context);
    });

		return deferred.promise;
	},

  createAdDocument: function(adBreaks, vastContexts) {

    var doc = {};
    adBreaks.forEach(function(adBreak, idx) {
      var adBreakData = vastContexts[idx].xmlData;

      var offset = adBreak['$']['timeOffset'];
      if (offset == 'start') {
        // preroll
        doc.preroll = {
          pod: self.createAdPod(adBreak, adBreakData)
        };
      } else if (offset == 'end') {
        // postroll
        doc.postroll = {
          pod: self.createAdPod(adBreak, adBreakData)
        };
      } else {
        // midroll
        // 00:05:15.120
        var time = self.secondsFromTimestamp(offset);
        if (time) {
          if (!doc.midrolls) {
            doc.midrolls = [];
          }

          doc.midrolls.push({
            time: time,
            pod: self.createAdPod(adBreak, adBreakData)
          });
        }
      }
    });

    return doc;

  },

  createAdPod: function(adBreak, adBreakData) {

    var ads = adBreakData['VAST']['Ad'];
    var pod = [];
    ads.forEach(function(adData) {
      var creatives = adData['InLine'][0]['Creatives'][0]['Creative'];
      var linear = null;
      creatives.forEach(function(creative) {
        if (creative['Linear']) {
          linear = creative['Linear'][0];
        }
      });

      if (linear) {
        var duration = self.secondsFromTimestamp(linear['Duration'][0]);
        var media = [];

        var mediaFiles = linear['MediaFiles'][0]['MediaFile'];
        mediaFiles.forEach(function(file) {
          if (file['$']['type'] == 'video/mp4') {
            // only supported format
            media.push({
              bitrate: Number(file['$']['bitrate']) * 1000, // convert kbs to bps
              source: file['_']
            });
          }
        });

        pod.push({
          duration: duration,
          media: media
        });
      }
    });

    return pod;

  },

  secondsFromTimestamp: function(timestamp) {
    var components = timestamp.split(':');
    if (components.length == 3) { // must have exactly 3 components
      return (Number(components[0]) * 3600) + (Number(components[1]) * 60) + Number(components[2]);
    }
    return null;
  }

};
