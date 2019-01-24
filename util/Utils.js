/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
******************************************************************************/
var _ = require('lodash');
/*****************************************************************************
******************************* PRIVATE **************************************
/*****************************************************************************/
var _unauthorizedErrorName = "UnauthorizedError";
var _unauthorizedErrorMessage = "You don't have permission to access the resource";

/*****************************************************************************
******************************* PUBLIC ***************************************
*****************************************************************************/

//Error handler for functions that are to be used in async.series method.
//This should be done in order to improve error reporting,
//if a function is not surronded by this handler in the async.series method,
//the async will not be able to catch an error thrown by the function
module.exports.handleErrorForAsync = function(fn, resultOnError) {
   if(resultOnError == undefined){
      resultOnError = false;
   }
   return function(done) {
      try {
         fn(done);
      } catch(err) {
         done(err, resultOnError);
      }
   }
};

//send a HTTP response like a JSON object
module.exports.sendJSONresponse = function(res, status, content) {
  res.status(status);
  res.json(content);
};

//send a HTTP response like a JSON object for an error
module.exports.sendJSONErrorResponse = function(res, status, err) {
  res.status(status);
  var errObject = { 'message': err.message };
  if(err.code){
     errObject['mysqlCodeError'] = err.code;
  }
  if (res.app.get('env') === 'development') {
     errObject['error'] = err.toString();
  }
  res.json(errObject);
};

module.exports.next = function(httpStatus, err, next){
   err.status = httpStatus;
   next(err);
}
