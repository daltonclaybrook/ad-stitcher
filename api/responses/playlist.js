/**
 * Sends an m3u8 playlist
 */

module.exports = function sendOK (data, options) {

  // Get access to `req`, `res`, & `sails`
  var req = this.req;
  var res = this.res;
  var sails = req._sails;

  sails.log.silly('res.ok() :: Sending 200 ("OK") response');

  // Set status code
  res.status(200);
  res.set('Content-Type', 'application/x-mpegURL');
  res.send(data)

};
