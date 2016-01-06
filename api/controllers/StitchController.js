/**
 * StitchController
 *
 * @description :: Server-side logic for managing stitches
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

// live stream: http://vevoplaylist-live.hls.adaptive.level3.net/vevo/ch1/appleman.m3u8
// ad playlist: http://walterebert.com/playground/video/hls/sintel-trailer.m3u8
// vast: http://localhost:1337/vast/vast1.xml

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
				playlistURL: playlistURL,
				playlist: playlistContext.playlist,
				ads: adContext.ads,
				bandwidth: Number(bandwidth)
			};
		})
		.then(Playlist.makeAbsoluteSegmentPaths)
		.then(Playlist.insertAds)
		.then(Playlist.exportString)
		.done(function success(context) {
			res.playlist(context.playlistString);
		}, function error(context) {
			Responder.sendResponse(res, context);
		});

	},

	// fetches the master playlist specified in the request and returns
	stitchLive: function(req, res) {

		var streamURL = new Buffer(req.query.streamURL, 'base64').toString("utf8");
		sails.log.verbose('streamURL: ' + streamURL);

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

	// called by the video player. fetches a media playlist and stitches ads if necessary.
	stitchLiveMedia: function(req, res) {

		var master = new Buffer(req.query.master, 'base64').toString("utf8");
		var uri = new Buffer(req.query.uri, 'base64').toString("utf8");
		var playlistURL = Playlist.generateAbsolueURI(master, uri);
		var bandwidth = req.query.bandwidth;

		sails.log.verbose(playlistURL + '\n' + uri + '\n' + bandwidth + '\n\n');
		var context = {
			master: master,
			playlistURL: playlistURL,
			bandwidth: Number(bandwidth),

			// used by fetchPlaylist
			url: playlistURL
		};

		Playlist.fetchPlaylist(context)
		.then(Playlist.makeAbsoluteSegmentPaths)
		.then(self.fetchAdSlot)
		.then(Playlist.insertLiveAd)
		.then(Playlist.exportString)
		.done(function success(context) {
			res.playlist(context.playlistString);
		}, function error(context) {
			Responder.sendResponse(res, context);
		});

	},

	/**
	*	Helper methods
	*/

	fetchAdSlot: function(context) {
		sails.log.verbose('fetching ad slot...');

		var deferred = Q.defer();

		AdSlot.findOne({
			streamURL: context.master
		})
		.populateAll()
		.exec(function(err, slot) {
			if (err) {
				context.errorCode = 500;
				context.error = 'an unknown error occurred';
				deferred.reject(context);
			} else {
				sails.log.verbose('slot: ' + JSON.stringify(slot, null, 2));
				context.slot = slot;
				deferred.resolve(context);
			}
		});

		return deferred.promise;
	}

};
