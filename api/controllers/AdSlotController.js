/**
 * AdSlotController
 *
 * @description :: Server-side logic for managing adslots
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var Q = require('q');

var self = module.exports = {

	insertAd: function(req, res) {

		var vastURL = req.body.vastURL;
		var streamURL = req.body.streamURL;
		var context = {
			url: streamURL
		};

		Q.all([
			Playlist.fetchPlaylist({ url: streamURL }),
			AdService.loadAdsFromVAST({ url: vastURL })
		])
		.spread(function(playlistContext, adContext) {
			return {
				streamURL: streamURL,
				playlist: playlistContext.playlist
				pod: adContext.pod
			};
		})
		.then(self.createAdSlotRecord)
		.done(finish, finish);

		function finish(context) {
			Responder.sendResponse(res, context);
		}

	},

	/*
		Helpers
	*/

	createAdSlotRecord: function(context) {

	}

};
