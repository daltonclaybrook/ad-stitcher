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
			var absoluteURL = Playlist.generateAbsoluteURI(streamURL, uri);
			var adPlaylistURL = adContext.pod[0].hls.trim();
			sails.log.verbose('absolute url: ' + absoluteURL + '\nad url: ' + adPlaylistURL);

			if (!adPlaylistURL) {
				throw {
					errorCode: 400,
					error: 'VAST url did not include a HLS rendition.'
				};
			}

			return Q.all([
				Playlist.fetchPlaylist({
					url: absoluteURL,
					streamURL: streamURL
				}),

				Playlist.fetchPlaylist({ url: adPlaylistURL })
			]);
		})
		.spread(function(streamContext, adContext) {
			streamContext.adPlaylist = adContext.playlist;
			streamContext.adMasterURL = adContext.url;

			sails.log.verbose('context: ' + JSON.stringify(streamContext, null, 2));
			return streamContext;
		})
		.then(self.createAdSlotRecord)
		.done(finish, finish);

		function finish(context) {
			Responder.sendResponse(res, context);
		}

	},

	clearAds: function(req, res) {
		AdSlot.destroy({})
		.exec(function(err) {
			if (err) {
				Responder.sendResponse(res, {
					error: err
				});
			} else {
				AdPlaylist.destroy({})
				.exec(function(err2) {
					if (err2) {
						Responder.sendResponse(res, {
							error: err2
						});
					} else {
						Responder.sendResponse(res, {
							payload: 'success'
						});
					}
				});
			}
		});
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

		sails.log.verbose('creating sequenceID: ' + sequenceID + ', streamURL: ' + context.streamURL);

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
				sails.log.verbose('adding AdPlaylists...');
				var adPlaylist = context.adPlaylist;
				var items = adPlaylist.items.StreamItem;
				var models = [];
				items.forEach(function(item) {
					models.push({
						slot: slot,
						streamURL: Playlist.generateAbsoluteURI(context.adMasterURL, item.get('uri')),
						bandwidth: item.attributes.attributes.bandwidth
					});
				});

				AdPlaylist.create(models)
				.exec(function(err, playlists) {
					if (err || !playlists) {
						context.errorCode = 500;
						context.error = 'an unknown error occurred';

						sails.log.verbose('error: ' + JSON.stringify(err, null, 2));
						deferred.reject(context);
					} else {
						context.payload = 'success';
						sails.log.verbose('created record: ' + JSON.stringify(slot, null, 2) + '\nrenditions: ' + JSON.stringify(playlists, null, 2));
						deferred.resolve(context);
					}
				})
			}
    });

		sails.log.verbose('\nsequence: ' + sequence + '\ntarget duration: ' + targetDuration + '\nitemCount: ' + itemCount + '\nsegments to add: ' + segmentsToAdd + '\nsequence ID: ' + sequenceID + '\n');
		return deferred.promise;
	}

};
