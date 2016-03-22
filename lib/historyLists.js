
var HistoryClient = require("./historyClient");
var historyClient = new HistoryClient();
var Util = require("../utils/util");
var util = new Util();

var HistoryDb = require("../collection/history");
var historyDb = new HistoryDb();



// -----------------------------------------------------------------
function log(info) {
  console.log("-----------------------------------");
  var length = arguments.length;
  for (var i = 0; i < length; i++) {
    console.log(arguments[i]);
  }
}
// -----------------------------------------------------------------

function HistoryLists() {

};
module.exports = HistoryLists;

// -----------------------------------------------------------------
/**
 * 获取 工商企业登记信息列表中的公司条数和公司页数
 * @param  {httpRequest}   req  http request
 * @param  {httpResponse}   res  http response
 * @param  {function} next callback
 */
HistoryLists.prototype.getListsNum = function(req, res, next) {
  var options = req.body;
  if (!options) {
    log("getListsNum: options illegal , will not execute", options);
    res.send({success: false})
  } else {
    res.send({success: true})
    historyClient.recentLists(options, function(err, html) {
      if (err) {
        log("getListsNum: get lists error", err);
      } else if (!html) {
        log("getListsNum: get lists no results");
      } else {
        util.listsInfo(html, function(err, results) {
          if (err) {
            log("getListsNum: handle lists info error", err);
          } else {
            log("getListsNum: handle lists info succeed");
            log(results)
            historyDb.saveListInfo(results, function(err) {
              if(err) {
                log("getListsNum: save results to db error", err);
              } else {
                log("getListsNum: save results to db succeed.");
              }
            })
          }
        })
      }
    })
  }
  next();
};
// -----------------------------------------------------------------
/**
 * 获取工商企业信息列表，并存入数据库
 * @param  {httpRequest}   req  http request
 * @param  {httpReponse}   res  http response
 * @param  {function} next callback
 */
HistoryLists.prototype.getListsInfo = function(req, res, next) {
  log("getListsInfo: this function called");
  var options = req.body;
  if (!options) {
    log("getListsInfo: options illegal , will not execute", options);
    res.send({success: false})
  } else {
    res.send({success: true});
    log("getListsInfo: start get lists info");
    // 获取最新的企业信息数目
    historyDb.getListsNum(function(err, lists) {
      if(err) {
        log("getListsInfo: get lists db error", err);
      } else {
        log("getListsInfo: get lists db succeed");
        if(!lists || !lists.hasOwnProperty("allpageNum")) {
          log("getListsInfo: get lists from db failed for do not cantains allpageNum");
        } else {
          var allpageNum = lists.allpageNum;
          // allpageNum = 3;
          var startTime = Date.now();
          // 分页抓取，同时防止工商服务器封锁ip
          for(var i = 1; i <= allpageNum; i++) {
           var str =  'setTimeout(function() {'  
              + 'var tmp_options = options;'
              + 'tmp_options.p = ' + i + ';'  
              + ' historyClient.recentLists(tmp_options, function(err, html) {'
              +    'if(err) {'
              +      'log("getListsInfo: get lists info from gov error", err);'
              +    '} else {'
              +      'log("getListsInfo: get lists info from gov succeed");'              
              +    'util.lists(html, function(err, results) {'
              +      'if(err) {'
              +        'log("handle html lists error", err);'
              +      '} else {'
              +       ' historyDb.saveLists(results);'
              +      '}'
              +    '})'
              +   ' }'
              +  '})    '            
              + '}, 10000 + ' + i + ' * 10 * 1000 + Math.random() * 5 * 1000 );'
            eval(str)
          }
        }
      }
    })
  }
  next();
}
// -----------------------------------------------------------------
/**
 * 获取当前未查询公司的基本信息，并存入数据库
 * @param  {httpRequest}   req  http request
 * @param  {httpResponse}   res  http response
 * @param  {Function} next callback
 */
HistoryLists.prototype.getListsBasic = function(req, res, next) {
  var options = req.body;
  log("getListsBasic: get lists detail called");
  if(!options) {
    log("getListsBasic: options illegal", options);
    res.send({success: false})
  } else {
    log("getListsBasic: options legal, then handle details");
    res.send({success: true});
    historyDb.getAllLists(function(err, companylists) {
      if(err) {
        log("getListsBasic: get all lists error", err);
      } else {
        log("getListsBasic: get all lists succeed");
        var listsLength = companylists.length;
        if(listsLength > 20000) {
          listsLength = 20000;
        }
        for(var i = 0; i < listsLength; i++) {
          var company = companylists[i];
          var companyName = company.companyName;
          var applyStatus = company.applyStatus;
          log(companyName + " need to get")
          log("now start get companyName details")
          var str = 'setTimeout(function() {'
          + 'historyClient.registrationBasic({keywords: "' + companyName + '" }, function(err, html) {'
          +   'if(err) {'
          +     'log("getListsBasic: get company: ' + companyName +  ' error", err);'
          +   '} else {'
          +     'log("getListsBasic: get company: ' + companyName +  ' succeed");'
            
          +  'util.handleBasic(html, function(err, lists) {'
          +    'if(err) {'
          +      'log("getListsBasic: handle basic about company: ' + companyName + ' error", err);'
          +    '} else {'
          +      'log("getListsBasic: hande basic about company: ' + companyName + ' succeed");'
          +     ' historyDb.saveCompanyBasic(lists)'
          +    '}'
          +  '})'
          +   '}'
          + '})'
          + '}, 10000 + ' + i + ' * 10 * 1000 + Math.random() * 5 * 1000);'
          eval(str);
        }
      }
    }) 
  }
}

// -----------------------------------------------------------------
/**
 * 获取所有未获取详细信息的企业详细信息，并存入数据库
 * @param  {httpRequest}   req  
 * @param  {httpResponse}   res  http response
 * @param  {Function} next callback
 */
HistoryLists.prototype.getListsDetail = function(req, res, next) {
  log("getListsDetail: this function called");
  var options = req.body;
  if (!options) {
    log("getListsDetail: options illegal , will not execute", options);
    res.send({success: false})
  } else {
    res.send({success: true});
    // 获取所有未处理的基本企业列表
    historyDb.getAllCompanyLists(function(err, results) {
      if(err) {
        log("getListsDetail: get lists detail from db error", err);
      } else {
        log("getListsDetail: get lists detail from db succeed", results);
        var resultsLength = results.length;
        for(var i = 0; i < resultsLength; i++) {
          var result = results[i];
          var companyQueryId = result.companyQueryId || "";
          var companyName = result.companyName || "";
          // 获取企业基本信息
          var str = 'setTimeout(function() {'
            + 'log('+ i + ');'
            + 'historyClient.registrationDetail({'
            + 'companyQueryId: "' + companyQueryId + '" '
            + '}, function(err, html) {'
            + 'if (err) {'
            +  'log("getListsDetail: get detail page for company: ' + companyName + ' error", err);'
            + '} else {'
            +  'log("getListsDetail: get detail page for company: ' + companyName + ' succeed");'
            //   // 处理获取到的基本信息页
            +  'util.handleDetail(html, function(err, detail) {'
            +   ' if (err) {'
            +      'log("getListsDetail: handle ' + companyName + ' detail page error", err);'
            +    '} else {'
            +      'log("getListsDetail: handle '+ companyName + ' detail page succeed");'
                  // 存储企业基本信息
            +      'detail.companyQueryId = "' + companyQueryId + '";'
            +     ' historyDb.saveBasicDetail(detail);'
            +    '}'
            +  '})'
            + '}'
            + '});'
            + '}, 10000 + ' + i + ' * 10 * 1000 + Math.random() * 5 * 1000)'
          eval(str);
        }
      }
    })    
  }
}
// -----------------------------------------------------------------
/**
 * 获取当前所有没有获取基本信息的公司的基本信息和详细信息，同时存入数据库
 * @param  {httpRequest}   req  http request
 * @param  {httpResponse}   res  http response
 * @param  {Function} next 转入下一个handler
 */
HistoryLists.prototype.getBasicDetail = function(req, res, next) {
  log("getBasicDetail: this function called");
  var options = req.body;
  if (!options) {
    log("getBasicDetail: options illegal , will not execute", options);
    res.send({success: false})
  } else {
    res.send({success: true});
    // 获取所有未处理的基本企业列表  
    log("getBasicDetail: options legal, then handle details");
    historyDb.getAllLists(function(err, companylists) {
      if(err) {
        log("getBasicDetail: get all lists error", err);
      } else {
        log("getBasicDetail: get all lists succeed");
        var listsLength = companylists.length;
        // listsLength = 4;
        if(listsLength >= 10000) {
          listsLength = 10000;
        }
        for(var i = 0; i < listsLength; i++) {
          var company = companylists[i];
          var companyName = company.companyName;
          var applyStatus = company.applyStatus;

          var str = 'setTimeout(function() {'
          + 'log("handling item: ' + i + '/' + listsLength + '  with company: '  + companyName + '");'
          + 'historyClient.registrationBasic({keywords: "' + companyName + '" }, function(err, html) {'
          +   'if(err) {'
          +     'log("getListsBasic: get company: ' + companyName +  ' error", err);'
          +   '} else {'
          +     'log("getListsBasic: get company: ' + companyName +  ' succeed");'
            
          +  'util.handleBasic(html, function(err, lists) {'
          +    'if(err) {'
          +      'log("getListsBasic: handle basic about company: ' + companyName + ' error", err);'
          +    '} else {'
          +      'log("getListsBasic: handle basic about company: ' + companyName + ' succeed");'
          +  'var list_tmp = lists[0];'
          +  'var companyQueryId = list_tmp.companyQueryId;'

          + 'historyClient.registrationDetail({'
          + 'companyQueryId: companyQueryId '
          + '}, function(err, html) {'
          + 'if (err) {'
          +  'log("getListsBasic: get detail page for company: ' + companyName + ' error", err);'
          + '} else {'
          +  'log("getListsBasic: get detail page for company: ' + companyName + ' succeed");'
          //   // 处理获取到的基本信息页
          +  'util.handleDetail(html, function(err, detail) {'
          +   ' if (err) {'
          +      'log("getListsBasic: handle ' + companyName + ' detail page error", err);'
          +    '} else {'
          +      'log("getListsBasic: handle '+ companyName + ' detail page succeed");'
                // 存储企业基本信息
          +      'detail.companyQueryId = companyQueryId;'
          +        'detail.companyName = list_tmp.companyName;'
          +        'detail.address = list_tmp.address;'
          +     ' historyDb.saveBasicAll(detail);'
          +    '}'
          +  '})'
          + '}'
          + '});'              
          +   '}'
          +  '})'
          +   '}'
          + '})'
          + '}, 10000 + ' + i + ' * 10 * 1000 + Math.random() * 5 * 1000);'
          eval(str);
        }
      }
    })  
  }
}

// -----------------------------------------------------------------

