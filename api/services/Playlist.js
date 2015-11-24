/**
* Playlist.js
*
* Convenience methods for manipulating m3u8 playlist data.
*/

var https = require('https');
var Q = require('q');
var m3u8 = require('m3u8');

var self = module.exports = {

  fetchPlaylist: function(context) {
    var deferred = Q.defer();

    https.get(context.url, function(res) {
  		if (res.statusCode == 200) {
        var parser = m3u8.createStream();
        res.pipe(parser);

        parser.on('m3u', function(m3u) {
          // fully parsed m3u file
          context.playlist = m3u;
          deferred.resolve(context);
        });

        parser.on('error', function(err) {
      		deferred.reject({
            errorCode: 400,
            error: err
          });
    		});

			} else {
				deferred.reject({
          errorCode: 400,
					error: 'url (' + url + ') returned status code: ' + res.statusCode
				});
			}
		}).on('error', function(err) {
  		deferred.reject({
        errorCode: 500,
        error: err
      });
		});

		return deferred.promise;
  },

  insertNewURIs: function(context) {
    return Q.fcall(function() {

      var playlist = context.playlist;
      playlist.items.StreamItem.forEach(function(item) {
        var masterURL = context.url;
        var uri = item.properties.uri;
        var newURI = self.createURI(masterURL, uri, context.vmapURL);
        item.properties.uri = newURI;
      });

      return context;
    });
  },

  exportString: function(context) {
    return Q.fcall(function() {

      context.playlistString = context.playlist.toString();
      return context;
    });
  },

  /**
  * Helpers
  */

  createURI: function(masterURL, uri, vmap) {
    var base64Master = new Buffer(masterURL, 'utf8').toString('base64');
    var base64URI = new Buffer(uri, 'utf8').toString('base64');

    var urlEncodedMaster = encodeURIComponent(base64Master);
    var urlEncodedURI = encodeURIComponent(base64URI);
    var urlEncodedVMAP = encodeURIComponent(vmap);

    return 'media?master=' + urlEncodedMaster + '&uri=' + urlEncodedURI + '&vmap=' + urlEncodedVMAP;
  }

};

// var context = {
//   // url: 'https://devimages.apple.com.edgekey.net/streaming/examples/bipbop_4x3/bipbop_4x3_variant.m3u8'
//   url: 'https://www.google.com/'
// };
// self.fetchPlaylist(context)
// .done(function(context) {
//   console.log('success: ' + JSON.stringify(context, null, 2));
// }, function(context) {
//   console.log('failure: ' + JSON.stringify(context, null, 2));
// });
