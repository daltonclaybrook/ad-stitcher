/**
* Confirms that the request contains a streamURL
*/

module.exports = function(req, res, next) {

  sails.log.verbose('*** validate live policy start');

  if (req.query.streamURL) {
    return next();
  } else {
    return res.badRequest();
  }

};
