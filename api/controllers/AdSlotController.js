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

			var playlist = playlistContext.playlist;
			var item = playlist.items.StreamItem[0];
			var uri = item.get('uri');
			var absoluteURL = Playlist.generateAbsolueURI(streamURL, uri);

			sails.log.verbose('absolute url: ' + absoluteURL);

			return {
				streamURL: streamURL,
				vastURL: vastURL,
				masterPlaylist: playlist,
				pod: adContext.pod,

				// for next action
				url: absoluteURL
			};
		})
		.then(Playlist.fetchPlaylist)
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
		var deferred = Q.defer();

		var playlist = context.playlist;
		var sequence = playlist.get('mediaSequence');
		var targetDuration = playlist.get('targetDuration');
		var itemCount = playlist.items.PlaylistItem.length;

		// choose seguence ID that is > 20 seconds after the last item
		var segmentsToAdd = Math.ceil(20.0 / targetDuration);
		var sequenceID = sequence + itemCount + segmentsToAdd;

		AdSlot.create({
    	sequenceID: sequenceID,
      streamURL: context.streamURL
    }).exec(function(err, slot) {
			if (err || !slot) {
				context.errorCode = 500;
				context.error = 'an unknown error occurred';

				sails.log.verbose('error: ' + JSON.stringify(err, null, 2));
				deferred.reject(context);
			} else {
				context.payload = 'success';
				sails.log.verbose('created record: ' + JSON.stringify(slot, null, 2));
				deferred.resolve(context);
			}
    });

		sails.log.verbose('\nsequence: ' + sequence + '\ntarget duration: ' + targetDuration + '\nitemCount: ' + itemCount + '\nsegments to add: ' + segmentsToAdd + '\nsequence ID: ' + sequenceID + '\n');
		return deferred.promise;
	}

};
