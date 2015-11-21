/**
* Confirms that the request contains a stream URL, and a VMAP url.
*/

module.exports = function(req, res, next) {

  sails.log.verbose('*** confirm stitch query policy start');

  if (req.query.streamURL && req.query.vmapURL) {
    return next();
  } else {
    return res.badRequest();
  }

};
