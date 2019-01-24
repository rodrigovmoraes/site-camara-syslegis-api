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
      'comissoes' : []
   }
}

var _beginNewComissao = function(row) {
   return {
      'idComissao': row.idComissao,
      'comissaoDescricao': row.comissaoDescricao,
      'ativo': row.ativo === 1,
      'membros': []
   }
}

var _addComissaoMembro = function(currentComissaoObj, row) {
   currentComissaoObj.membros.push({
      'cargoComissao': row.cargoComissao,
      'vereadorDescricao': row.vereadorDescricao
   })
}

/*****************************************************************************
**************************  Module functions *********************************
/*****************************************************************************/
module.exports.getComissoes = function(filter) {
   var syslegisDataBase = MySQLDatabase.newMySQLDatabase();
   var comissoesRows = null;

   var queryComissoes = "SELECT    comissao.descricao as comissaoDescricao, " +
                        "          composicao_comissao.comissao_id as idComissao, " +
                        "          vereador.descricao as vereadorDescricao, " +
                        "          cargo_comissao.descricao as cargoComissao, " +
                        "          composicao_comissao.sessao_legislativa_id as idSessaoLegislativa, " +
                        "          sl.descricao as sessaoLegislativaDescricao, " +
                        "          leg.id as idLegislatura, " +
                        "          leg.descricao as legislaturaDescricao, " +
                        "          IF(comissao.ativo_na_casa, 1, 0) as ativo " +
                        "FROM      autor as comissao, " +
                        "          autor as vereador, " +
                        "          composicao_comissao, " +
                        "          nomeado, " +
                        "          cargo_comissao, " +
                        "          sessao_legislativa sl, " +
                        "          legislatura leg " +
                        "WHERE     comissao.tipo_comissao_id = 1 " +
                        "AND       composicao_comissao.sessao_legislativa_id = sl.id " +
                        "AND       composicao_comissao.comissao_id = comissao.id " +
                        "AND       nomeado.composicao_comissao_id = composicao_comissao.id " +
                        "AND       cargo_comissao.id = nomeado.cargo_comissao_id " +
                        "AND       vereador.id = nomeado.vereador_id " +
                        "AND       sl.legislatura_id = leg.id ";
   var queryComissoesParams = [];


   //build the query based on filter
   if(filter.sessaoAtual) {
      queryComissoes += "AND       sl.atual = true ";
   } else if (filter.sessaoId) {
      queryComissoes += "AND       composicao_comissao.sessao_legislativa_id = ? ";
      queryComissoesParams.push(filter.sessaoId);
   } else if (filter.legislaturaId) {
      queryComissoes += "AND       leg.id = ?  ";
      queryComissoesParams.push(filter.legislaturaId);
   }
   //add order by
   queryComissoes   += "ORDER BY  leg.id DESC, sl.id DESC, comissao.descricao, composicao_comissao.comissao_id, cargo_comissao.id, vereador.descricao ";

   return syslegisDataBase
      .openConnection()
      .then(function(connection) {
         return syslegisDataBase.query(queryComissoes, queryComissoesParams);
      }).then(function(rows) {
         comissoesRows = rows;
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
         var currentIdSessaoLegislativa = null;
         var currentComissaoObj = null;
         var currentSessaoObj = null;
         var currentLesgislaturaObj = null;
         if(comissoesRows) {
            for(i = 0; i < comissoesRows.length; i++) {
               var comissaoRow = comissoesRows[i];
               //legislatura changes
               if( currentLesgislaturaObj && currentLesgislaturaObj.idLegislatura !== comissaoRow.idLegislatura ||
                   !currentLesgislaturaObj) {
                  //begin new legislatura
                  currentLesgislaturaObj = _beginNewLegislatura(comissaoRow);
                  result.push(currentLesgislaturaObj);
                  //begin new sessao
                  currentSessaoObj = _beginNewSessao(comissaoRow);
                  //add new sessao to current legislatura
                  if(currentLesgislaturaObj) {
                     currentLesgislaturaObj.sessoes.push(currentSessaoObj);
                  }
                  //begin new comissao
                  currentComissaoObj = _beginNewComissao(comissaoRow);
                  //add new comissao to current sessao
                  if(currentSessaoObj) {
                     currentSessaoObj.comissoes.push(currentComissaoObj);
                  }
                  //add membro to current comissao
                  _addComissaoMembro(currentComissaoObj, comissaoRow);
               } else if( currentSessaoObj && currentSessaoObj.idSessaoLegislativa !== comissaoRow.idSessaoLegislativa ||
                          !currentSessaoObj) {
                  //begin new session
                  currentSessaoObj = _beginNewSessao(comissaoRow);
                  //add new sessao to current legislatura
                  if(currentLesgislaturaObj) {
                     currentLesgislaturaObj.sessoes.push(currentSessaoObj);
                  }
                  //begin new comissao
                  currentComissaoObj = _beginNewComissao(comissaoRow);
                  //add new comissao to current sessao
                  if(currentSessaoObj) {
                     currentSessaoObj.comissoes.push(currentComissaoObj);
                  }
                  //add membro to current comissao
                  _addComissaoMembro(currentComissaoObj, comissaoRow);
               } else if( currentComissaoObj && currentComissaoObj.idComissao !== comissaoRow.idComissao ||
                       !currentComissaoObj) {
                  //begin new comissao
                  currentComissaoObj = _beginNewComissao(comissaoRow);
                  //add new comissao to current sessao
                  if(currentSessaoObj) {
                     currentSessaoObj.comissoes.push(currentComissaoObj);
                  }
                  //add membro to current comissao
                  _addComissaoMembro(currentComissaoObj, comissaoRow);
               } else {
                  //add membro to current comissao
                  _addComissaoMembro(currentComissaoObj, comissaoRow);
               }
            }
         }
         return {
            'legislaturas': result
         };
      });
}

module.exports.getLegislaturas = function(filter) {
   var syslegisDataBase = MySQLDatabase.newMySQLDatabase();
   var legislaturasRows = null;

   var queryLegislaturas = "SELECT    leg.id as id, " +
                           "          leg.descricao as descricao " +
                           "FROM      legislatura leg " +
                           "ORDER BY  leg.id DESC; "

   return syslegisDataBase
      .openConnection()
      .then(function(connection) {
         return syslegisDataBase.query(queryLegislaturas, []);
      }).then(function(rows) {
         legislaturasRows = rows;
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
            'legislaturas': legislaturasRows
         };
      });
}

module.exports.getSessoes = function(filter) {
   var syslegisDataBase = MySQLDatabase.newMySQLDatabase();
   var sessoesRows = null;

   var querySessoes = "SELECT    sl.id as id, " +
                      "          sl.descricao as descricao " +
                      "FROM      sessao_legislativa sl, " +
                      "          legislatura leg " +
                      "WHERE     sl.legislatura_id = leg.id ";
   var querySessoesParams = [];
   if(filter.legislaturaId) {
      querySessoes += "AND       leg.id = ? ";

      querySessoesParams.push(filter.legislaturaId);
   } else {
      querySessoes += "AND       leg.id = ( SELECT MAX(leg2.id) " +
                      "                     FROM legislatura leg2 ) ";
   }
   querySessoes += "ORDER BY  sl.id DESC; "

   return syslegisDataBase
      .openConnection()
      .then(function(connection) {
         return syslegisDataBase.query(querySessoes, querySessoesParams);
      }).then(function(rows) {
         sessoesRows = rows;
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
            'sessoes': sessoesRows
         };
      });
}
