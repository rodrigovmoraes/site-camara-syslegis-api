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
var _beginNewLegislatura = function(row) {
   return {
      'idLegislatura': row.idLegislatura,
      'legislaturaDescricao': row.legislaturaDescricao,
      'sessoes' : []
   }
}

var _beginNewSessao = function(row) {
   return {
      'idSessaoLegislativa': row.idSessaoLegislativa,
      'sessaoLegislativaDescricao': row.sessaoLegislativaDescricao,
      'mesaDiretora' : {
         'idMesaDiretora': row.idComissao,
         'membros': []
      }
   }
}

var _addMesaDiretoraMembro = function(currentMesaDiretoraObj, row) {
   currentMesaDiretoraObj.membros.push({
      'cargoMesa': row.cargoMesa,
      'vereadorDescricao': row.vereadorDescricao
   })
}

/*****************************************************************************
**************************  Module functions *********************************
/*****************************************************************************/
module.exports.getMesaDiretora = function(filter) {
   var syslegisDataBase = MySQLDatabase.newMySQLDatabase();
   var mesaDiretoraRows = null;

   var queryMesaDiretora = "SELECT   vereador.descricao as vereadorDescricao, " +
                           "         cargo.descricao as cargoMesa, " +
                           "         cargo.ordem_para_exibicao as ordem, " +
                           "         mesa_diretora.id as idMesaDiretora, " +
                           "         sl.id as idSessaoLegislativa, " +
                           "         sl.descricao as sessaoLegislativaDescricao, " +
                           "         legis.id as idLegislatura, " +
                           "         legis.descricao as legislaturaDescricao " +
                           "FROM     legislatura legis, " +
                           "         sessao_legislativa sl, " +
                           "         composicao_mesa_diretora mesa_diretora, " +
                           "         nomeado, " +
                           "         cargo_mesa_diretora cargo, " +
                           "         autor vereador " +
                           "WHERE    legis.id = sl.legislatura_id " +
                           "AND      sl.id = mesa_diretora.sessao_legislativa_id " +
                           "AND      mesa_diretora.id = nomeado.composicao_mesa_diretora_id " +
                           "AND      cargo.id = nomeado.cargo_mesa_diretora_id " +
                           "AND      vereador.id = nomeado.vereador_id ";

   var queryMesaDiretoraParams = [];


   //build the query based on filter
   if(filter.sessaoAtual) {
      queryMesaDiretora += "AND       sl.atual = true ";
   } else if (filter.sessaoId) {
      queryMesaDiretora += "AND       mesa_diretora.sessao_legislativa_id = ? ";
      queryMesaDiretoraParams.push(filter.sessaoId);
   } else if (filter.legislaturaId) {
      queryMesaDiretora += "AND       legis.id = ? ";
      queryMesaDiretoraParams.push(filter.legislaturaId);
   }
   //add order by
   queryMesaDiretora += "ORDER BY legis.id DESC, sl.id DESC, cargo.ordem_para_exibicao ASC;"

   return syslegisDataBase
      .openConnection()
      .then(function(connection) {
         return syslegisDataBase.query(queryMesaDiretora, queryMesaDiretoraParams);
      }).then(function(rows) {
         mesaDiretoraRows = rows;
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
         //denormalize
         var i;
         var result = [];
         var currentSessaoObj = null;
         var currentLesgislaturaObj = null;
         if(mesaDiretoraRows) {
            for(i = 0; i < mesaDiretoraRows.length; i++) {
               var mesaDiretoraRow = mesaDiretoraRows[i];
               //legislatura changes
               if( currentLesgislaturaObj && currentLesgislaturaObj.idLegislatura !== mesaDiretoraRow.idLegislatura ||
                   !currentLesgislaturaObj) {
                  //begin new legislatura
                  currentLesgislaturaObj = _beginNewLegislatura(mesaDiretoraRow);
                  result.push(currentLesgislaturaObj);
                  //begin new sessao
                  currentSessaoObj = _beginNewSessao(mesaDiretoraRow);
                  //add new sessao to current legislatura
                  if(currentLesgislaturaObj) {
                     currentLesgislaturaObj.sessoes.push(currentSessaoObj);
                  }
                  //add membro to current mesa diretora
                  _addMesaDiretoraMembro(currentSessaoObj.mesaDiretora, mesaDiretoraRow);
               } else if( currentSessaoObj && currentSessaoObj.idSessaoLegislativa !== mesaDiretoraRow.idSessaoLegislativa ||
                          !currentLesgislaturaObj) {
                  //begin new sessao
                  currentSessaoObj = _beginNewSessao(mesaDiretoraRow);
                  //add new sessao to current legislatura
                  if(currentLesgislaturaObj) {
                   currentLesgislaturaObj.sessoes.push(currentSessaoObj);
                  }
                  //add membro to current mesa diretora
                  _addMesaDiretoraMembro(currentSessaoObj.mesaDiretora, mesaDiretoraRow);
               } else {
                  //add membro to current mesa diretora
                  _addMesaDiretoraMembro(currentSessaoObj.mesaDiretora, mesaDiretoraRow);
               }
            }
         }
         return {
            'legislaturas': result
         };
      });
}
