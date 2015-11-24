/**
* Playlist.js
*
* Convenience methods for manipulating m3u8 playlist data.
*/

var https = require('https');
var Q = require('q');
var SS = require('string-scanner');
var m3u8 = require('m3u8');

/*
{

}
*/

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
          deferred.resolve(err);
        });

        parser.on('error', function(err) {
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

  },

  // Parses an m3u8 playist into an object
  parse: function(context) {
    return Q.fcall(function () {
      var playlist = context.playlist;
      var scanner = SS(playlist);

      // validates that this is actually an m3u playlist
      if (!scanner.next('#EXTM3U')) {
        throw {
          errorCode: 400,
          error: "file is not an m3u8 playlist"
        };
      }

      var streamInfTag = '#EXT-X-STREAM-INF';
      var parsed = {};
      while (scanner.next(streamInfTag)) {

        // +1 to advance past the colon.
        var cursor1 = scanner.cursor() + 1;
        scanner.next('\n');
        var cursor2 = scanner.cursor() - 1;
        var infString = playlist.slice(cursor1, cursor2);

        console.log(infString);
        // if (!scanner.next('BANDWIDTH=')) {
        //   throw {
        //     errorCode: 400,
        //     error: "each #EXT-X-STREAM-INF must have a BANDWIDTH tag"
        //   };
        // }
        //
        // // get cursors wrapping the bandwidth value. bandwidth can be terminated with a comma or newline
        // var cursor1 = scanner.cursor();
        // scanner.next('/,|\n/')
        // var cursor1 = scanner.cursor();
      }



      sails.log.verbose('result of scan: ' + res);

    });
  },

  /**
  * Helpers
  */

  parseStringToObject: function(string) {
    var scanner = SS(string);
    var cursor = 0;
    var components = [];
    while (scanner.next('/,|\"/')) {
      if (string.slice(scanner.cursor()-1, scanner.cursor()) == ',') {
        components.push(string.slice(cursor, scanner.cursor()-1));
      } else {
        scanner.next('\"');
        components.push(string.slice(cursor, scanner.cursor()));
        scanner.next(',');
      }
      cursor = scanner.cursor();
    }
    components.push(string.slice(cursor, string.length));



    return components;
  }

};

// var fs = require('fs');
// var path = require('path');
// var filePath = path.resolve(__dirname, '../../assets/master.m3u8');
// var file = fs.readFileSync(filePath, "utf8");
//
// var context = {
//   playlist: file
// };
// self.parse(context)
// .done(function(context) {
//   console.log('success');
// }, function(context) {
//   console.log('failure');
// });


var context = {
  // url: 'https://devimages.apple.com.edgekey.net/streaming/examples/bipbop_4x3/bipbop_4x3_variant.m3u8'
  url: 'https://www.google.com/'
};
self.fetchPlaylist(context)
.done(function(context) {
  console.log('success: ' + JSON.stringify(context, null, 2));
}, function(context) {
  console.log('failure: ' + JSON.stringify(context, null, 2));
});
