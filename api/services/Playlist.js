/**
* Playlist.js
*
* Convenience methods for manipulating m3u8 playlist data.
*/

var Q = require('q');
var SS = require('string-scanner');

/*
{

}
*/

var self = module.exports = {

  // Parses an m3u8 playist into an object
  parse: function(context) {
    return Q.fcall(function () {
      var scanner = SS(context.playlist)

      // validates that this is actually an m3u playlist
      if (!scanner.next('#EXTM3U')) {
        throw {
          errorCode: 400,
          error: "file is not an m3u8 playlist"
        };
      }



      sails.log.verbose('result of scan: ' + res);

    });
  }

};
