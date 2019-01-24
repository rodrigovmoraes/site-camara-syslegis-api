/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
******************************************************************************/
require('dotenv').load();
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');
var config = require('config');
var winston = require('winston');
var cors = require('cors');
var MySQLDatabase = require('./util/MySQLDatabase.js');

/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (APPS MODULES) *******************************
******************************************************************************/
var Util = require('./util/Utils.js');
var httpLog = require('./middlewares/httplog.js');

/*****************************************************************************
*********************************** BEGIN ************************************
******************************************************************************/
var app = express();

/*****************************************************************************
***************************** APP CONFIG SECTION *****************************
******************************************************************************/
var camaraSyslegisApiConfig = config.get("CamaraSyslegisApi")
//log configuration
winston.setLevels(camaraSyslegisApiConfig.Log.levels);
winston.addColors(camaraSyslegisApiConfig.Log.levelsColors);
winston.configure({
    transports: [
      new (winston.transports.Console)({ colorize: true })
    ]
 });
winston.level = camaraSyslegisApiConfig.Log.level;

//config database access
MySQLDatabase.configConnectionPool(camaraSyslegisApiConfig.SyslegisMySqlConnection);

/*****************************************************************************
********************* MIDDLEWARES CONFIG SECTION *****************************
******************************************************************************/
app.use(httpLog);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//set Cross Origin Resource Sharing (CORS)
//see: http://restlet.com/company/blog/2015/12/15/understanding-and-using-cors/
app.use(cors());
app.options('*', cors());
//routes config
// portal routes
var portalRoutes = require('./routes/index.js')
app.use('/', portalRoutes);

/*****************************************************************************
************************** ERROR HANDLING SECTION ****************************
/*****************************************************************************/
// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers
app.use(function(err, req, res, next) {
   Util.sendJSONErrorResponse( res,
                               err.status || 500,
                               err );
});

module.exports = app;
