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
        var bandwidth = item.attributes.attributes.bandwidth;

        var newURI = self.createURI(masterURL, uri, context.vmapURL, bandwidth);
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

  insertAds: function(context) {
    return Q.fcall(function() {

      var playlist = context.playlist;
      var bandwidth = context.bandwidth;
      var ads = context.ads;

      var midrolls = ads.midrolls;
      var midrollIdx = 0;

      var items = playlist.items.PlaylistItem;
      var counter = 0.0;

      // insert midrolls
      for (var i = 0; i < items.length; i++) {
        if (midrolls.length > midrollIdx) {
          var item = items[i];
          var midroll = midrolls[midrollIdx];
          if (midroll.time <= counter) {
            var j=i;
            midroll.pod.forEach(function(slot) {
              var media = self.mediaFromSlot(slot, bandwidth);
              items[j] = self.createPlaylistItem(slot.duration, media.source);
              j++;
            });

            // increment the counter minus 1 since the next loop will add 1 more.
            i += (midroll.pod.length-1)
            midrollIdx++;
          }
          counter += item.get('duration');
        } else {
          break;
        }
      }

      // preroll
      if (ads.preroll) {
        var j = 0;
        ads.preroll.pod.forEach(function(slot) {
          var media = self.mediaFromSlot(slot, bandwidth);
          items[j] = self.createPlaylistItem(slot.duration, media.source);
          j++;
        });
      }

      // postroll
      if (ads.postroll) {
        var j = items.length;
        ads.postroll.pod.forEach(function(slot) {
          var media = self.mediaFromSlot(slot, bandwidth);
          items[j] = self.createPlaylistItem(slot.duration, media.source);
          j++;
        });
      }

      return context;
    });
  },

  /**
  * Helpers
  */

  createURI: function(masterURL, uri, vmap, bandwidth) {
    var base64Master = new Buffer(masterURL, 'utf8').toString('base64');
    var base64URI = new Buffer(uri, 'utf8').toString('base64');

    var urlEncodedMaster = encodeURIComponent(base64Master);
    var urlEncodedURI = encodeURIComponent(base64URI);
    var urlEncodedVMAP = encodeURIComponent(vmap);
    var urlEncodedBandwidth = encodeURIComponent(bandwidth);

    return 'media?master=' + urlEncodedMaster + '&uri=' + urlEncodedURI + '&vmap=' + urlEncodedVMAP + '&bandwidth=' + urlEncodedBandwidth;
  },

  mediaFromSlot: function(slot, bandwidth) {

    var media = null;
    slot.media.forEach(function(file) {
      if (!media) {
        // if media is null
        media = file;
      } else if ((media.bitrate > bandwidth) && (file.bitrate < media.bitrate)) {
        // if the current media has a higher bitrate than the bandwidth and the new media has a lower bitrate than the current media, even if it is still higher than bandwidth
        media = file;
      } else if ((file.bitrate > media.bitrate) && (file.bitrate < bandwidth)) {
        // if the new media has a higher bitrate than the current media, but is still less than bandwidth
        media = file;
      }
    });
    return media;

  },

  createPlaylistItem: function(duration, uri) {

    return m3u8.M3U.PlaylistItem.create({
      discontinuity: true,
      duration: duration,
      uri: uri
    });
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
