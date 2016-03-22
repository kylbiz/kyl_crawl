var cheerio = require("cheerio");

function log(info) {
  console.log("-----------------------------------");
  var length = arguments.length;
  for (var i = 0; i < length; i++) {
    console.log(arguments[i]);
  }
}

// -----------------------------------------------------------------
function Util() {

};

module.exports = Util;

// -----------------------------------------------------------------
/**
 * 获取工商登记状态列表信息，包含总页数和总公司数
 * @param  {string}   html     html about page info 
 * @param  {function} callback return page info
 */
Util.prototype.listsInfo = function(html, callback) {
  if (!html) {
    log("listsInfo: options illegal, not excute.", html);
    callback(null, null);
  } else {
    var $ = cheerio.load(html);
    var pageTable = $(".page_table")

    var tdLength = pageTable.find("td").length;
    if (tdLength <= 1) {
      log("listsInfo: current page do not has data");
      callback(null, {
        companyNum: 0,
        allpageNum: 0
      })
    } else {
      var tds = pageTable.find("td");
      var companyNum = $(tds[0]).text().replace(/[^0-9]/ig, "").trim()
      var allpageNum = $(tds[2]).text().replace(/[^0-9]/ig, "").trim()

      callback(null, {
        companyNum: companyNum,
        allpageNum: allpageNum
      })
    }
  }
};

// -----------------------------------------------------------------
/**
 * 获取工商登记状态当前页中所有的公司信息列表
 * @param  {string}   html     
 * @param  {function} callback return 工商登记公司列表
 */
Util.prototype.lists = function(html, callback) {
  log("lists: start excute")
  if (!html) {
    log("lists: options illegal, not excute", html);
    var err = 'lists: options illegal, not excute';
    callback(err, null);
  } else {
    log("lists: html not null, then start excute html")
    var $ = cheerio.load(html);
    var tb = $('table[class="tgList"]');
    var trs = tb.find('tr');

    var results = [];
    var trsLength = trs.length;
    log(trsLength)
    for (var i = 1; i < trsLength; i++) {
      var tds = $(trs[i]).find('td');
      var tdsLength = tds.length;
      var acceptedDate = $(tds[0]).text();
      log(tds.length, tds.text())
      var applyInfo = {
        acceptedDate: $(tds[0]).text().replace(/\n|\r|\t/g, "").trim(),
        companyName: $(tds[1]).text().replace(/\n|\r|\t/g, "").trim(),
        applyStatus: $(tds[2]).text().replace(/\n|\r|\t/g, "").trim()
      }

      // log(applyInfo)

      results.push(applyInfo);
    }
    callback(null, results);
  }
}


// -----------------------------------------------------------------
Util.prototype.handleBasic = function(html, callback) {
  log("handleBasic: this function called");
  if (!html) {
    log("handleBasic: options illegal", html);
    callback(err, null);
  } else {
    var $ = cheerio.load(html);
    var companyLists = [];
    $('table[class="con"]').each(function(i, e) {
      var info = $(this).text();
      var first = $(this).find('td').first().find('a').attr('onclick')

      var detailTitle = '详细信息';
      var addressTitle = '住所';
      var companyStatusTitle = '企业状态';

      var detailIndex = info.indexOf(detailTitle);
      var addressIndex = info.indexOf(addressTitle);
      var companyStatusIndex = info.indexOf(companyStatusTitle);
      var companyName = info.substring(0, detailIndex).trim();

      var addressTempStr = info.substring(detailIndex, companyStatusIndex)
      var address = addressTempStr.substring(addressTempStr.lastIndexOf('：') + 1).trim();

      var companyStatus = info.substring(companyStatusIndex + companyStatusTitle.length + 1).trim();

      var start = "('";
      var end = "')";
      var companyQueryId = first.substring(first.indexOf(start) + start.length, first.indexOf(end))

      var company = {
        companyName: companyName,
        address: address,
        companyStatus: companyStatus,
        companyQueryId: companyQueryId
      };

      companyLists.push(company);
    });

    callback(null, companyLists);
  }
}

// -----------------------------------------------------------------
/**
 * 获取当前企业的基本信息，包括基本企业信息，和工商年检信息
 * 具体可以参考： http://www.sgs.gov.cn/lz/etpsInfo.do?method=index
 * @param  {json}   html     工商详细信息页面html
 * @param  {Function} callback 返回基本信息和年检信息，企业注册号
 */
Util.prototype.handleDetail = function(html, callback) {
  log("handleDetail: this function called");
  if (!html) {
    log("handleDetail: options illegal", html);
    callback(err, null);
  } else {
    var $ = cheerio.load(html);

    var companyId = ""; //企业注册号
    var detailInfo = $('table[id="resultTbInfo"]');
    var detailAnnual = $('table[id="resultTbAnnl"]');

    var tds = detailInfo.find('.list_boder td');
    var basicDetail = [];
    // 查找基本信息列表
    for (var i = 0; i < tds.length / 2; i++) {
      var key = $(tds[2 * i]).text().replace(/\n|\r|\t|\:|\：/g, "").trim();
      var value = $(tds[2 * i + 1]).text().replace(/\n|\r|\t|\:|\：/g, "").trim();
      // 判断当前字段是否为企业注册号
      if (key.search(/注册号|字号/) > -1) {
        companyId = value;
      }
      basicDetail.push({
        key: key,
        value: value
      });
    }

    var annu = detailAnnual.find('.list_td_1');
    var checkDetail = [];
    // 工商年检信息
    for (var i = 0; i < annu.length / 2; i++) {
      var key = $(annu[2 * i]).text().replace(/\n|\r|\t/g, "").trim();
      var value = $(annu[2 * i + 1]).text().replace(/\n|\r|\t/g, "").trim();
      checkDetail.push({
        key: key,
        value: value
      });
    }
    callback(null, {
      companyId: companyId,
      basicDetail: basicDetail,
      checkDetail: checkDetail
    })
  }
}

// -----------------------------------------------------------------