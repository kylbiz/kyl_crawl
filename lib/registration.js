var RegDBServer = require("../collection/registration");
var RegDBClient = new RegDBServer();
var SETTINGS = require("../settings");
var REGSETTINGS = SETTINGS.registration;
var Crawler = require('mycrawl').Crawler;
var crawler = new Crawler();
//-------------------------------------------------
var fileflag = false;

function log(info) {
  console.log("-----------------------------------");
  var length = arguments.length;
  for (var i = 0; i < length; i++) {
    if (fileflag) {
      console.log("registration: ", arguments[i]);
    } else {
      console.log(arguments[i]);
    }
  }
}

function verifyKeywords(keywords) {
  var flag = true;
  if(!keywords
    || typeof(keywords) !== "string"
    || keywords.length < 2) {
    flag = false;
  } 
  return flag;
} 

function validAppId(app_id, uuid) {
  var flag = true;
  var key_pre = "kyl_app_id_";
  
  if(!app_id
    || !uuid
    || typeof("app_id") !== "string"
    || (key_pre + uuid) !== app_id) {
    flag = false;
  }
  return flag;
}

function validAppSecret(app_secret, uuid) {
  var flag = true;
  var key_pre = "kyl_app_secret_";

  if(!app_secret
    || !uuid
    || typeof("app_secret") !== "string"
    || (key_pre + uuid) !== app_secret) {
    flag = false;
  }
  return flag;
}



//-------------------------------------------------
function Registration() {};
module.exports = Registration;
//-------------------------------------------------
/**
 * 获取查询字号基本信息，并存入数据库
 * @param  {json}   req  http req obj
 * @param  {json}   res  http res obj
 * @param  {callback} next 转入下一个组件
 */
Registration.prototype.getRegistration = function(req, res, next) {
  var options = req.body;

  if (!options
    || !options.hasOwnProperty("uuid") 
    || !options.hasOwnProperty("keywords")
    || !verifyKeywords(options.keywords)
    || !options.hasOwnProperty("app_id")
    || !options.hasOwnProperty("app_secret")
    || !validAppId(options.app_id, options.uuid)
    || !validAppSecret(options.app_secret, options.uuid)
    ) {
    log("getRegistration: options illegal.", options);
    res.send({success: false});
  } else {
    log("getRegistration: options leggal.")
    var uuid = options.uuid;
    var keywords = options.keywords;
    // 初始化查询日志
    // RegDBClient.InitRecord({keywords: keywords, uuid: uuid});
    // 抓取企业基本信息
    crawler.searchCompanyInformation(REGSETTINGS, keywords, function(err, results) {
      if (err) {
        log("getRegistration: search registration: " + keywords + " error");
        next();
      } else {
        log("getRegistration: search registration: " + keywords + " succeed. save to database.");
        RegDBClient.saveBasic(results);
        var numberOfResults = results.numberOfResults;
        var allpageNo = results.allpageNo;
        // 更新查询日志结果
        var recordsoptions = {
          numberOfResults: numberOfResults, 
          allpageNo: allpageNo,
           keywords: keywords,
           uuid: uuid
         }
        RegDBClient.UpdateRecords(recordsoptions);
      }
    });
    // RegDBClient.updateTimes();
    res.send({
      success: true
    });
  }
  next();
}
//-------------------------------------------------
/**
 * 获取企业信用信息，必须提供企业名称 companyName 和企业的注册代码companyId
 * @param  {json}   req  http request object
 * @param  {json}   res  http response object
 * @param  {callback} next 转入下一个组件
 */
Registration.prototype.getCredit = function(req, res, next) {
  var options = req.body;
  if(options && options.hasOwnProperty("companyName")) {
    var companyName = options.companyName;
    // 获取企业信用信息
    crawler.getRegistrationDisclosure({keyword: companyName}, function(err, result) {
      if (err || !result) {
        log("get credit information failed", err);
      } else {
        var companyId = result.companyId;
        var creditoptions = {
          companyId: companyId,
          companyName: companyName,
          result: result
        }
        // 存储企业信用信息
        RegDBClient.saveCredit(creditoptions);
      }
    });
    res.send({success: true});
  } else {
    log("get credit information failed, for options illegal", options);
    res.send({success: false});
  }
  next();
}

//-------------------------------------------------
/**
 * 获取更多的Registration, 并存储在Credit中
 * @param  {json} options contains keywords allpageNo pageNo
 */
Registration.prototype.moreRegistration = function(req, res, next) {
  log("Registration.moreRegistration called", req.body)
  var options = req.body;
  if(!options.hasOwnProperty("keywords") 
    || !options.keywords.length >=2
    || !options.hasOwnProperty("allpageNo") 
    || !options.hasOwnProperty("pageNo")
    || !(options.allpageNo >= options.pageNo)) {
    res.send({success: false});
  } else {
    res.send({success: true});
    var options = req.body;
    var keywords = options.keywords;
    var allpageNo = options.allpageNo;
    var pageNo = options.pageNo;
    crawler.getMoreRegistrations(REGSETTINGS, keywords, allpageNo, pageNo, function(err, results) {
      if(err) {
        log("moreRegistration: crawl more registration error", err);
      } else {
        log("moreRegistration: crawler more registration succeed.");

        RegDBClient.saveMoreRegistration(results, function(err) {
          if(err) {
            log("moreRegistration: save more registration error", err);
          } else {
            log("moreRegistration: save more registration succeed");
          }
        });
      }
    })
    RegDBClient.updateTimes();
  }
  next();
}

//-------------------------------------------------