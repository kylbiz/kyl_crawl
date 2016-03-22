var request = require("request");
var targetUrl = 'http://www.sgs.gov.cn/shaic/workonline/appStat!toEtpsAppList.action'

// -----------------------------------------------------------------
function log(info) {
  console.log("-----------------------------------");
  var length = arguments.length;
  for (var i = 0; i < length; i++) {
    console.log(arguments[i]);
  }
}

// -----------------------------------------------------------------
function HistoryReg() {

};
module.exports = HistoryReg;

// -----------------------------------------------------------------
/**
 * 获取最新工商可领照公司列表，包含审查中的和可领照的公司，
 * 本处不做区别，返回工商页面的html页
 * @param  {json}   options  包含参数 p, acceptOrgan, etpsName, startDate, endDate
 * p {string} 页码
 * acceptOrgan {string} 工商局代码
 * etpsName {string} 查询的关键字
 * startDate 开始日期
 * endDate 结束日期
 * @param  {function} callback 回调函数，包含 err 和 html 代码
 */
HistoryReg.prototype.recentLists = function(options, callback) {
  var p = ""; //页码
  var acceptOrgan = ""; // 工商局代码
  var etpsName = ""; // 查询的关键字
  var startDate = ""; //开始日期
  var endDate = ""; // 结束日期
  // 参数赋值
  if (options && options.hasOwnProperty("p")) {
    p = options.p;
  }
  if (options && options.hasOwnProperty("acceptOrgan") && typeof(options.acceptOrgan) === 'string') {
    acceptOrgan = options.acceptOrgan;
  }
  if (options && options.hasOwnProperty("etpsName") && typeof(options.etpsName) === "string") {
    etpsName = options.etpsName;
  } 
  if (options && options.hasOwnProperty("startDate") && options.hasOwnProperty("endDate")) {
    startDate = options.startDate;
    endDate = options.endDate;
  }

  var formData = {
    'p': p,
    'appTotalSearchCondition.acceptOrgan': acceptOrgan,
    'appTotalSearchCondition.etpsName': etpsName,
    'appTotalSearchCondition.startDate': startDate,
    'appTotalSearchCondition.endDate': endDate
  }

  var requestOptions = {
    url: targetUrl,
    formData: formData
  }
  log(requestOptions)
  // 请求数据
  request.post(requestOptions, function(err, httpReponse, body) {
    if (err) {
      log('recentLists" Get company ' + etpsName + ' at page ' + p + ' error', err);
      callback(err, null);
    } else {
      log('recentLists: Get company ' + etpsName + ' at page ' + p + ' succeed');
      callback(null, body);
    }
  });
}

// -----------------------------------------------------------------
/**
 * 获取当前公司的基本信息
 * @param  {json}   options  包含 keyWords
 * @param  {Function} callback 返回当前公司的基本信息
 */
HistoryReg.prototype.registrationBasic = function(options, callback) {
  log("registrationBasic: registration basic called")
  if (!options || !options.hasOwnProperty("keywords")) {
    log("registrationBasic: options illegal", options);
    var err = "registrationBasic: options illegal";
    callback(err, null);
  } else {
    log("registrationBasic: start get company basic information");
    var formData = {
      keyWords: options.keywords,
      searchType: '1'
    };
    var requestOptions = {
      url: 'http://www.sgs.gov.cn/lz/etpsInfo.do?method=doSearch',
      formData: formData
    }
    request.post(requestOptions, function(err, httpReponse, body) {
      if (err) {
        log('registrationBasic: Get keywords ' + options.keywords + ' error', err);
        callback(err, null);
      } else {
        log('registrationBasic: Get keywords ' + options.keywords + ' succeed');
        callback(null, body);
      }
    })
  }
}

// -----------------------------------------------------------------

HistoryReg.prototype.registrationDetail = function(options, callback) {
  log("registrationDetail: registration detail called")
  if (!options || !options.hasOwnProperty("companyQueryId")) {
    log("registrationDetail: options illegal", options);
    var err = "registrationDetail: options illegal";
    callback(err, null);
  } else {
    log("registrationDetail: start get company detail information");
    var requestOptions = {
      url: 'http://www.sgs.gov.cn/lz/etpsInfo.do?method=viewDetail',
      headers: {
        Referer: 'http://www.sgs.gov.cn/lz/etpsInfo.do?method=doSearch'
      },
      formData: {
        etpsId: options.companyQueryId
      }
    };
    // 抓取详细信息页
    request.post(requestOptions, function(err, httpReponse, body) {
      if (err) {
        log('registrationDetail: Get companyQueryId ' + options.companyQueryId + ' error', err);
        callback(err, null);
      } else {
        log('registrationBasic: Get companyQueryId ' + options.companyQueryId + ' succeed');
        callback(null, body);
      }
    })
  }
}


// -----------------------------------------------------------------
