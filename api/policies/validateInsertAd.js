/**
* Confirms that the request contains a vast URL and an streamURL
*/

module.exports = function(req, res, next) {

  sails.log.verbose('*** validate insert ad policy start');

  if (req.body.vastURL && req.body.streamURL) {
    return next();
  } else {
    return res.badRequest();
  }

};
