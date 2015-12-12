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
  // res.setHeader('content-type', 'application/x-mpegURL')
  res.type('application/x-mpegURL');
  res.send(new Buffer(data))

};
