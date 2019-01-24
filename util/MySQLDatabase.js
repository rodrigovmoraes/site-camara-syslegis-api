/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
******************************************************************************/
var winston = require('winston');
var config = require('config');
var Utils = require('../util/Utils.js');
mysql = require( 'mysql' );

/*****************************************************************************
********************************** CONFIG ************************************
******************************************************************************/
var _connectionPool;

module.exports.configConnectionPool = function(config) {
   _connectionPool = mysql.createPool(config);
}

/*****************************************************************************
*************************** MySQLDatabase Class*******************************
******************************************************************************/
//This class enables the execution of the
//queries in serie. Before the execution of the queries
//the connection must be opened and after the execution the
//connection must be closed
class MySQLDatabase {
    constructor() {
        this.connection = null;
    }
    /*****************************************************************************
    * Open a connection to database in async way (returns a promise)
    ********************************/
    openConnection() {
      var mySQLDatabaseObj = this;
      return new Promise( ( resolve, reject ) => {
          _connectionPool.getConnection(function(err,connection) {
             if (err) { //connection error
                winston.error("Error while connecting to database, err = [%s]", err);
                reject(err);
             } else if(connection) { //connection ok
                mySQLDatabaseObj.connection = connection;
                resolve(connection);
             } else { //connection error, but the api didn't throw anything
                winston.error("Error while connecting to database, but the api didn't throw anything!");
                reject(new Error("Error while connecting to database, but the api didn't throw anything!"));
             }
          });
      });
    }
    /*****************************************************************************
    * execute a query to database in async way (returns a promise)
    ********************************/
    query( sql, args ) {
        var mySQLDatabaseObj = this;
        return new Promise( (resolve, reject) => {
           if (mySQLDatabaseObj.connection) {
                mySQLDatabaseObj.connection.query(sql, args, (err, rows) => {
                    if (err) { //query processing error
                       winston.error("Error while query execution, err = [%s]", err);
                       return reject(err);
                    } else { //query processing ok
                       resolve(rows);
                    }
                });
           } else {
              //the connection is not set
              winston.error("Error while query execution, the connection is not set!");
              reject(new Error("Error while query execution, the connection is not set!"));
           }
        });
    }
    /*****************************************************************************
    * close the connection to database in async way (returns a promise)
    ********************************/
    close() {
        var mySQLDatabaseObj = this;
        return new Promise( ( resolve, reject ) => {
           if (mySQLDatabaseObj.connection) {
             mySQLDatabaseObj.connection.release();
           }
           resolve();
        });
    }
}

module.exports.newMySQLDatabase = function() {
   return new MySQLDatabase();
}
