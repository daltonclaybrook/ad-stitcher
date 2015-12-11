/**
 * StitchController
 *
 * @description :: Server-side logic for managing stitches
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var Q = require('q');

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
		var bandwidth = req.query.bandwidth;

		var components = master.split('/');
		components[components.length-1] = uri;
		var playlistURL = components.join('/');

		sails.log.verbose(playlistURL + '\n' + uri + '\n' + vmapURL + '\n' + bandwidth + '\n\n');

		Q.all([
			Playlist.fetchPlaylist({ url: playlistURL }),
			AdService.loadAdsFromVMAP({ url: vmapURL })
		])
		.spread(function(playlistContext, adContext) {
			return {
				playlist: playlistContext.playlist,
				ads: adContext.ads,
				bandwidth: Number(bandwidth)
			};
		})
		.then(Playlist.insertAds)
		.done(function success(context) {

		}, function error(context) {

		});

	},

	/**
	*	Helper methods
	*/





};
