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
      'vereadores' : []
   }
}

var _beginNewVereador = function(row) {
   return {
      'vereadorId': row.vereadorId,
      'vereadorDescricao': row.vereadorDescricao,
      'vereadorNomePopular': row.vereadorNomePopular,
      'vereadorTelefone': row.vereadorTelefone,
      'vereadorGabineteId': row.vereadorGabineteId,
      'vereadorGabineteDescricao': row.vereadorGabineteDescricao,
      'vereadorSigla': row.vereadorSigla,
      'vereadorAtivo': row.ativo,
      'vereadorHistorico': row.vereadorHistorico ? row.vereadorHistorico : null,
      'comunicacoesVirtuais' : []
   }
}

var _addComunicacaoVirtual = function(currentVereador, row) {
   currentVereador.comunicacoesVirtuais.push({
      'vereadorEnderecoVirtual': row.enderecoVirtual,
      'vereadorComunicacaoVirtualTipo': row.vereadorComunicacaoVirtualTipo,
      'vereadorComunicacaoVirtualTipoId': row.comunicacaoVirtualTipoId
   })
}

/*****************************************************************************
**************************  Module functions *********************************
/*****************************************************************************/
module.exports.getVereadores = function(filter) {
   var syslegisDataBase = MySQLDatabase.newMySQLDatabase();
   var vereadoresRows = null;

   var queryVereadores = "SELECT      DISTINCT " +
                         "            legislatura.id as idLegislatura, " +
                         "            legislatura.descricao as legislaturaDescricao, " +
                         "            autor.id as vereadorId, " +
                         "            autor.descricao as vereadorDescricao, " +
                         "            autor.nome_popular as vereadorNomePopular, " +
                         "            autor.telefone as vereadorTelefone, " +
                         "            autor.gabinete_id as vereadorGabineteId, " +
                         "            gabinete.descricao as vereadorGabineteDescricao, " +
                         "            partido.sigla as vereadorSigla, " +
                         "            comunicacao_virtual.tipo_comunicacao_virtual_id as comunicacaoVirtualTipoId, " +
                         "            comunicacao_virtual.endereco_virtual as enderecoVirtual, " +
                         "            tipo_comunicacao_virtual.descricao as vereadorComunicacaoVirtualTipo, " +
                         "            IF(autor.ativo_na_casa, 1, 0) as ativo " +
                         "FROM        autor " +
                         "INNER JOIN  mandato ON autor.id = mandato.vereador_id " +
                         "INNER JOIN  legislatura ON mandato.legislatura_id = legislatura.id " +
                         "LEFT  JOIN  filiacao_partidaria ON ( filiacao_partidaria.vereador_id = autor.id) " +
                         "LEFT  JOIN  partido ON filiacao_partidaria.partido_id = partido.id " +
                         "LEFT  JOIN  gabinete ON autor.gabinete_id = gabinete.id " +
                         "LEFT  JOIN  comunicacao_virtual ON comunicacao_virtual.vereador_id = autor.id " +
                         "LEFT  JOIN  tipo_comunicacao_virtual ON comunicacao_virtual.tipo_comunicacao_virtual_id = tipo_comunicacao_virtual.id " +
                         "WHERE       autor.class = 'br.gov.sp.camarasorocaba.entities.Vereador' ";
                         "AND         ( filiacao_partidaria.mandato_id = ( SELECT MAX(filiacao_partidaria2.mandato_id) " +
                         "                                                 FROM   filiacao_partidaria as filiacao_partidaria2 " +
                         "                                                 WHERE  filiacao_partidaria2.vereador_id = autor.id " +
                         "                                               ) " +
                         "              OR " +
                         "              filiacao_partidaria.mandato_id IS NULL ) ";

   var queryVereadoresParams = [];

   //build the query based on filter
   if (filter.legislaturaAtual) {
      queryVereadores += "AND           autor.ativo_na_casa IS TRUE " +
                         "AND           filiacao_partidaria.filiacao_atual IS TRUE " +
                         "AND           mandato.mandato_atual IS TRUE " +
                         "AND           ( mandato.data_fim_do_mandato IS NULL " +
                         "OR              mandato.data_fim_do_mandato > NOW() ) " +
                         "AND           legislatura.atual IS TRUE ";
   } else if (filter.legislaturaId) {
      queryVereadores += "AND         legislatura.id = ? ";
      queryVereadoresParams.push(filter.legislaturaId);
   }

   //add order by
   queryVereadores += "ORDER BY    legislatura.id DESC, autor.descricao, autor.id, tipo_comunicacao_virtual.id; ";

   return syslegisDataBase
      .openConnection()
      .then(function(connection) {
         return syslegisDataBase.query(queryVereadores, queryVereadoresParams);
      }).then(function(rows) {
         vereadoresRows = rows;
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
         var currentVereadorObj = null;
         var currentLesgislaturaObj = null;
         if(vereadoresRows) {
            for(i = 0; i < vereadoresRows.length; i++) {
               var vereadorRow = vereadoresRows[i];
               //legislatura changes
               if( currentLesgislaturaObj && currentLesgislaturaObj.idLegislatura !== vereadorRow.idLegislatura ||
                   !currentLesgislaturaObj) {
                  //begin new legislatura
                  currentLesgislaturaObj = _beginNewLegislatura(vereadorRow);
                  result.push(currentLesgislaturaObj);
                  //begin new vereador
                  currentVereadorObj = _beginNewVereador(vereadorRow);
                  //add new vereador to current legislatura
                  if(currentLesgislaturaObj) {
                     currentLesgislaturaObj.vereadores.push(currentVereadorObj);
                  }
                  //add comunicacao virtual to vereador
                  _addComunicacaoVirtual(currentVereadorObj, vereadorRow);
               } else if( currentVereadorObj && currentVereadorObj.vereadorId !== vereadorRow.vereadorId ||
                         !currentVereadorObj) {
                  //begin new vereador
                  currentVereadorObj = _beginNewVereador(vereadorRow);
                  //add new vereador to current legislatura
                  if(currentLesgislaturaObj) {
                     currentLesgislaturaObj.vereadores.push(currentVereadorObj);
                  }
                  //add comunicacao virtual to vereador
                  _addComunicacaoVirtual(currentVereadorObj, vereadorRow);
               } else {
                  //add membro to current comissao
                  _addComunicacaoVirtual(currentVereadorObj, vereadorRow);
               }
            }
         }
         return {
            'legislaturas': result
         };
      });
}

module.exports.getVereador = function(idVereador) {
   //materia
   var queryVereador =  "SELECT      autor.id as vereadorId, " +
                        "            autor.descricao as vereadorDescricao, " +
                        "            autor.nome_popular as vereadorNomePopular, " +
                        "            autor.telefone as vereadorTelefone, " +
                        "            autor.gabinete_id as vereadorGabineteId, " +
                        "            gabinete.descricao as vereadorGabineteDescricao, " +
                        "            partido.sigla as vereadorSigla, " +
                        "            comunicacao_virtual.tipo_comunicacao_virtual_id as comunicacaoVirtualTipoId, " +
                        "            comunicacao_virtual.endereco_virtual as enderecoVirtual, " +
                        "            tipo_comunicacao_virtual.descricao as vereadorComunicacaoVirtualTipo, " +
                        "            IF(autor.ativo_na_casa, 1, 0) as ativo, " +
                        "            autor.historico as vereadorHistorico " +
                        "FROM        autor " +
                        "INNER JOIN  mandato ON autor.id = mandato.vereador_id " +
                        "INNER JOIN  legislatura ON mandato.legislatura_id = legislatura.id " +
                        "LEFT  JOIN  filiacao_partidaria ON ( filiacao_partidaria.vereador_id = autor.id) " +
                        "LEFT  JOIN  partido ON filiacao_partidaria.partido_id = partido.id " +
                        "LEFT  JOIN  gabinete ON autor.gabinete_id = gabinete.id " +
                        "LEFT  JOIN  comunicacao_virtual ON comunicacao_virtual.vereador_id = autor.id " +
                        "LEFT  JOIN  tipo_comunicacao_virtual ON comunicacao_virtual.tipo_comunicacao_virtual_id = tipo_comunicacao_virtual.id " +
                        "WHERE       autor.class = 'br.gov.sp.camarasorocaba.entities.Vereador' " +
                        "AND         ( filiacao_partidaria.mandato_id = ( SELECT MAX(filiacao_partidaria2.mandato_id) " +
                        "                                                 FROM   filiacao_partidaria as filiacao_partidaria2 " +
                        "                                                 WHERE  filiacao_partidaria2.vereador_id = autor.id " +
                        "                                                ) " +
                        "              OR " +
                        "              filiacao_partidaria.mandato_id IS NULL ) " +
                        "AND    legislatura.id = (  SELECT MAX(mandato2.legislatura_id) " +
                        "                           FROM   mandato as mandato2 " +
                        "                           WHERE  mandato2.vereador_id = autor.id " +
                        "                         ) " +
                        "AND         autor.id = ? " +
                        "ORDER BY    tipo_comunicacao_virtual.id; ";
   var queryVereadorParams = [];
   queryVereadorParams.push(idVereador);

   var syslegisDataBase = MySQLDatabase.newMySQLDatabase();
   var vereador = null;
   return syslegisDataBase
      .openConnection()
      .then(function(connection) {
         //query materia
         return syslegisDataBase.query(queryVereador, queryVereadorParams);
      }).then(function(vereadorRows) {
         //vereador result
         if(vereadorRows.length > 0) {
            var vereadorRow = vereadorRows[0];
            vereador = _beginNewVereador(vereadorRow);
            var i;
            for(i = 0; i < vereadorRows.length; i++) {
               _addComunicacaoVirtual(vereador, vereadorRows[i]);
            }
         } else {
            vereador = null;
         }
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
      }).then(function() {
         return {
            'vereador': vereador
         }
      });
}

module.exports.getResumoMaterias = function(idVereador) {
   //materia
   var queryResumoMaterias =  "SELECT      tipo_documento.descricao as descricao, " +
                              "            COUNT(1) as quantidade " +
                              "FROM        documento " +
                              "INNER  JOIN tipo_documento ON tipo_documento.id = documento.tipo_documento_id " +
                              "AND         cod_materia IS NOT NULL " +
                              "AND         documento.autor_id = ? " +
                              "GROUP  BY   tipo_documento.id " +
                              "ORDER  BY   tipo_documento.descricao DESC; "

   var queryResumoMateriasParams = [];
   queryResumoMateriasParams.push(idVereador);

   var syslegisDataBase = MySQLDatabase.newMySQLDatabase();
   var vereador = null;
   var resumoRows = null;
   return syslegisDataBase
      .openConnection()
      .then(function(connection) {
         //query materia
         return syslegisDataBase.query(queryResumoMaterias, queryResumoMateriasParams);
      }).then(function(presumoRows) {
         resumoRows = presumoRows;
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
      }).then(function() {
         return {
            'resumo': resumoRows
         }
      });
}
