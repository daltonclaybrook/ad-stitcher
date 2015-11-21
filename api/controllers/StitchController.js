/**
 * StitchController
 *
 * @description :: Server-side logic for managing stitches
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var Q = require('q');
var parseString = require('xml2js').parseString;
var https = require('https');

var self = module.exports = {

	/**
	*	Routes
	*/

	// Used to generate the master playlist, which contains links to child media playlists
	stitchMaster: function(req, res) {

		new Buffer(req.query.streamURL, 'base64').toString("utf8");
		new Buffer(req.query.vmapURL, 'base64').toString("utf8");

		var streamURL = new Buffer(req.query.streamURL, 'base64').toString("utf8");
		var vmapURL = new Buffer(req.query.vmapURL, 'base64').toString("utf8");
		sails.log.verbose('streamURL: ' + streamURL + '\nvmapURL: ' + vmapURL);

		Q.all([
			self.fetchURL(streamURL),
			self.fetchURL(vmapURL)
		])
		.spread(self.fetchVASTURLs)
		.done(function success(obj) {
			res.ok(obj);
		}, function error(err) {
			sails.log.verbose('an error occurred:\n' + JSON.stringify(err, null, 2));
			res.serverError(err);
		});

	},

	// Used to generate a media playlist
	stitchMedia: function(req, res) {



	},

	/**
	*	Helper methods
	*/

	fetchURL: function(url) {
		var deferred = Q.defer();

		https.get(url, function(res) {
  		if (res.statusCode == 200) {
				var data = '';
				res.on('data', function (chunk) {
    			data += chunk;
  			});

  			res.on('end', function () {
    			deferred.resolve(data);
  			});

				res.on('error', function(err) {
					deferred.reject(err);
				});
			} else {
				deferred.reject({
					reason: 'url (' + url + ') returned status code: ' + res.statusCode
				});
			}
		}).on('error', function(e) {
  		console.log("Got error: " + e.message);
		});

		return deferred.promise;
	},

	fetchVASTURLs: function(streamData, vmapData) {
		var deferred = Q.defer();

		parseString(vmapData, function (err, result) {
    	if (err) {
				deferred.reject(err);
			} else {
				deferred.resolve(result);
			}
		});

		return deferred.promise;
	}

};
