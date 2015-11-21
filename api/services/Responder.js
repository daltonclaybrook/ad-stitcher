
var self = module.exports = {
  sendResponse: function(res, context) {

    if (context.error) {
      sails.log.info('sending response code: ' + (context.errorCode || 500) + '\nerror: ' + context.error);

      var obj = self.responseObjectFromObject(context.error);

      if (context.errorCode == 400) {
        res.badRequest(obj);
      } else if (context.errorCode == 401) {
        res.unauthorized(obj);
      } else if (context.errorCode == 403) {
        res.forbidden(obj);
      } else if (context.errorCode == 404) {
        res.notFound(obj);
      } else {
        res.serverError(obj);
      }
    } else if (context.payload) {
      if (context.created) {
        sails.log.info('sending 201 created');
        res.created(context.payload);
      } else {
        sails.log.info('sending 200 ok');
        res.ok(context.payload);
      }
    } else {
      // response must have a error or a payload.
      var stack = new Error().stack;
      sails.log.info('unexpected error: \n' + stack);
      res.serverError({
        reason:'an unexpected error occurred'
      });
    }
  },

  responseObjectFromObject: function(obj) {
    var retVal = obj;
    if (typeof obj === 'string') {
      retVal = {reason:obj};
    } else if (typeof obj !== 'object') {
      sails.log.verbose('unsuported response type: ' + typeof obj);
    }
    return retVal;
  }

};
