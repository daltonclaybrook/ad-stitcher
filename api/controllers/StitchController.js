/**
 * StitchController
 *
 * @description :: Server-side logic for managing stitches
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var Q = require('q');
var parseXML = require('xml2js').parseString;

var self = module.exports = {

	/**
	*	Routes
	*/

	// Used to generate the master playlist, which contains links to child media playlists
	stitchMaster: function(req, res) {

		var streamURL = new Buffer(req.query.streamURL, 'base64').toString("utf8");
		sails.log.verbose('streamURL: ' + streamURL + '\nvmapURL: ' + req.query.vmapURL);

		var context = {
			url: streamURL,
			vmapURL: req.query.vmapURL
		};

		Playlist.fetchPlaylist(context)
		.then(Playlist.insertNewURIs)
		.then(Playlist.exportString)
		.done(function success(context) {
			res.playlist(context.playlistString);
		}, function error(context) {
			Responder.sendResponse(res, context);
		});

	},

	// Used to generate a media playlist
	stitchMedia: function(req, res) {

		var master = new Buffer(req.query.master, 'base64').toString("utf8");
		var uri = new Buffer(req.query.uri, 'base64').toString("utf8");
		var vmapURL = new Buffer(req.query.vmap, 'base64').toString("utf8");

		sails.log.verbose('\n\nstich media with master: ' + master + '\nURI: ' + uri + '\nVMAP: ' + vmapURL + '\n\n');
		res.ok();

	},

	/**
	*	Helper methods
	*/

	fetchVASTURLs: function(streamData, vmapData) {
		var deferred = Q.defer();

		deferred.resolve(streamData);

		// parseXML(vmapData, function (err, result) {
    // 	if (err) {
		// 		deferred.reject(err);
		// 	} else {
		// 		deferred.resolve(result);
		// 	}
		// });

		return deferred.promise;
	}

};
