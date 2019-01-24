/*****************************************************************************
*************************** DEPENDENCIES SECTION *****************************
******************************* (LIBS MODULES) *******************************
******************************************************************************/
var winston = require('winston');
var config = require('config');
var MySQLDatabase = require('../util/MySQLDatabase.js');

/*****************************************************************************
********************************** CONFIG ************************************
******************************************************************************/
//...
//..
//.

/*****************************************************************************
*********************************** PRIVATE ***********************************
******************************************************************************/
var _camaraSyslegisApiConfig = config.get("CamaraSyslegisApi")

/*****************************************************************************
**************************  Module functions *********************************
/*****************************************************************************/
module.exports.getOrdensDoDia = function(filter) {
   var syslegisDataBase = MySQLDatabase.newMySQLDatabase();
   var total = null;
   var ordensDoDia = null;
   var ordensDoDiaFileSystemPath = _camaraSyslegisApiConfig.Syslegis.ordensDoDiaFileSystemPath;
   var ordensDoDiaFileWebUrl = _camaraSyslegisApiConfig.Syslegis.ordensDoDiaFileWebUrl;

   var queryOrdensDoDiaSelectPart = "SELECT  ordem_do_dia.id as id, " +
                                    "        tipo_ordem_do_dia.descricao as descricao, "  +
                                    "        ordem_do_dia.numero as numero, "  +
                                    "        ordem_do_dia.data as data, "  +
                                    "        REPLACE(ordem_do_dia.caminho_texto_completo, ?, ?) as urlTextoCompleto, "  +
                                    "        REPLACE(ordem_do_dia.caminho_primeiro_expediente, ?, ?) as urlPrimeiroExpediente, "  +
                                    "        ordem_do_dia.texto_resumido as textoResumido, "  +
                                    "        ordem_do_dia.data_postagem as dataPostagem ";
   var queryOrdensDoDiaTail      =  "FROM    ordem_do_dia, "  +
                                    "        tipo_ordem_do_dia "  +
                                    "WHERE   tipo_ordem_do_dia.id = ordem_do_dia.tipo_ordem_do_dia_id ";
   var queryOrdensDoDiaParams = [];

   //build the query based on filter
   if (filter.ano) {
      queryOrdensDoDiaTail +=       "AND YEAR(ordem_do_dia.data) = ? ";
      queryOrdensDoDiaParams.push(filter.ano);
   }
   if (filter.mes) {
      queryOrdensDoDiaTail +=       "AND MONTH(data) = ? ";
      queryOrdensDoDiaParams.push(filter.mes);
   }
   if (filter.dia) {
      queryOrdensDoDiaTail +=       "AND DAY(data) =  ? ";
      queryOrdensDoDiaParams.push(filter.dia);
   }
   //query para contar o total de registros (sem paginação)
   var queryOrdensDoDiaCount = "SELECT COUNT(1) as total " + queryOrdensDoDiaTail;
   //adiciona o order by
   queryOrdensDoDiaTail +=          "ORDER BY ordem_do_dia.data DESC, ordem_do_dia.numero DESC, tipo_ordem_do_dia.descricao ASC ";

   return syslegisDataBase
      .openConnection()
      .then(function(connection) {
         return syslegisDataBase.query(queryOrdensDoDiaCount, queryOrdensDoDiaParams);
      }).then(function(rows) {
         //limit e offset
         total = rows[0].total;
         var limit = filter.limit ? filter.limit : 10;
         var offset = filter.offset ? Math.max(Math.min(filter.offset, total - 1), 0) : 0;
         if (filter.offset) {
            if(filter.offset > total - 1 && total > 0) {
               //get the last page if offset is out bound the rows
               //assume limit = pageSize
               var pageCount = Math.ceil(total / limit) ;
               offset = (pageCount - 1) * limit;
            } else {
               offset = filter.offset;
            }
         }
         queryOrdensDoDiaTail += "LIMIT ? OFFSET ? ";
         queryOrdensDoDiaParams.push(limit);
         queryOrdensDoDiaParams.push(offset);
         //add two parameters to begin of select,
         //first and third are the File System Path of ordensDoDia files
         //second and fourth are the Web Url of ordensDoDia files
         //these two parameters are used in the select part of the query but is
         //not used in the count query
         queryOrdensDoDiaParams.splice(0, 0, ordensDoDiaFileSystemPath, ordensDoDiaFileWebUrl, ordensDoDiaFileSystemPath, ordensDoDiaFileWebUrl);
         var queryOrdensDoDia = queryOrdensDoDiaSelectPart + queryOrdensDoDiaTail;
         return syslegisDataBase.query(queryOrdensDoDia, queryOrdensDoDiaParams);
      }).then(function(rows) {
         ordensDoDia = rows;
         return syslegisDataBase.close();
      },
         //error in any previous then
         function (err) {
              //close the connection and rethrow the error
              //to an promise catch it
              return syslegisDataBase.close()
                                     .then(function() {
                                        throw err;
                                     });
         }
      ).then(function() {
         return {
            'total': total,
            'ordensDoDia': ordensDoDia
         };
      });
}

module.exports.getListaAnos = function() {
   var query = "SELECT DISTINCT EXTRACT(YEAR FROM ordem_do_dia.data) as ano " +
               "FROM ordem_do_dia " +
               "ORDER BY EXTRACT(YEAR FROM data) DESC ";
   var syslegisDataBase = MySQLDatabase.newMySQLDatabase();
   var anos = null;
   return syslegisDataBase
      .openConnection()
      .then(function(connection) {
         return syslegisDataBase.query(query);
      }).then(function(rows) {
         anos = rows;
         return syslegisDataBase.close();
      },
         //error in any previous then
         function (err) {
           //close the connection and rethrow the error
           //to an promise catch it
           return syslegisDataBase.close()
                                  .then(function() {
                                     throw err;
                                  });
         }
      ).then(function() {
         return {
            'anos': anos
         }
      });
}
