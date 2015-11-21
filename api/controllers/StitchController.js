/**
 * StitchController
 *
 * @description :: Server-side logic for managing stitches
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var Q = require('q');
var parseString = require('xml2js').parseString;

var self = module.exports = {

	/**
	*	Routes
	*/

	// Used to generate the master playlist, which contains links to child media playlists
	stitchMaster: function(req, res) {

		var streamURL = new Buffer(req.query.streamURL, 'base64').toString("utf8");
		var vmapURL = new Buffer(req.query.vmapURL, 'base64').toString("utf8");
		sails.log.verbose('streamURL: ' + streamURL + '\nvmapURL: ' + vmapURL);

		var context = {
			url: streamURL,
			vmapURL: vmapURL
		};

		URLLoader.get(context)
		.then(self.generatePlaylist)
		.done(function success(obj) {
			res.playlist(obj.urlData);
		}, function error(err) {
			Responder.sendResponse(res, err);
		});

		// Q.all([
		// 	self.fetchURL(streamURL),
		// 	self.fetchURL(vmapURL)
		// ])
		// .spread(self.fetchVASTURLs)
		// .done(function success(obj) {
		// 	res.playlist(obj);
		// }, function error(err) {
		// 	sails.log.verbose('an error occurred:\n' + JSON.stringify(err, null, 2));
		// 	res.serverError(err);
		// });

	},

	// Used to generate a media playlist
	stitchMedia: function(req, res) {



	},

	/**
	*	Helper methods
	*/

	generatePlaylist: function(context) {

		// url: the stream URL
		// urlData: the m3u8 master playlist
		// vmapURL: the VMAP URL

		var ctx = {
			playlist: context.urlData
		};
		Playlist.parse(ctx);

		return context;

	},

	fetchVASTURLs: function(streamData, vmapData) {
		var deferred = Q.defer();

		deferred.resolve(streamData);

		// parseString(vmapData, function (err, result) {
    // 	if (err) {
		// 		deferred.reject(err);
		// 	} else {
		// 		deferred.resolve(result);
		// 	}
		// });

		return deferred.promise;
	}

};
