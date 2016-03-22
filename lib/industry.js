var HistoryClient = require("./historyClient");
var historyClient = new HistoryClient();
var Util = require("../utils/util");
var util = new Util();
var moment = require("moment")
var fileflag = false;

var DBClient = require('../collection/db');
var dbClient = new DBClient();

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
//-------------------------------------------------

var industrylists = ["物业管理", "体育发展", "资产管理", "商业管理", "餐饮管理", 
"投资管理", "酒店管理", "供应链管理", "企业管理", "环保科技", "智能科技", "生物科技", 
"电子科技", "教育科技", "新材料科技", "网络科技", "信息科技", "印务科技", "生物科技", 
"化工科技", "医疗科技", "文化传播", "广告传媒", "广告设计制作", "广告", "广告制作", 
"图文设计制作", "广告设计", "文化发展", "文化传媒", "投资咨询", "旅游信息咨询", 
"健康管理咨询", "信息咨询", "财务咨询", "企业管理咨询", "商务咨询", "建筑工程咨询", 
"法律咨询", "投资管理咨询", "电子商务", "商贸", "石材装饰工程", "货运代理", 
"园林工程", "知识产权代理", "货物运输代理", "建筑安装工程", "机电工程", "建筑工程", 
"防水工程", "装饰设计工程", "景观工程", "装饰工程", "绿化工程", "国际货运代理", 
"金融信息服务", "投资管理服务", "会展服务", "汽车服务", "汽车租赁服务", "保洁服务", 
"展览展示服务", "装饰设计", "建筑装潢设计", "建筑设计", "建筑工程设计", "艺术设计", 
"创意设计", "景观设计", "图文设计", "空间设计", "货运代理", "货物运输代理", 
"国际货运代理", "知识产权代理"]

var date = new Date();

// var pre = moment(date).month(1);
// moment(date).duration().subtract(1, 'M');
// log(date, pre)

var options = {
	etpsName: '物业管理'
}

var industryLength = industrylists.length;

for(var i = 0; i < industryLength; i++) {
	var etpsName = industrylists[i];
	var options = {
		etpsName: etpsName
	};
var str = 'setTimeout(function() {'
	+ 'log("handling item: ' + i + '/' + industryLength + '");'

	+	'historyClient.recentLists(' + options + ', function(err, html) {'
	+'if (err) {'
	+ ' log("getListsNum: get lists error", err);'
	+' } else if (!html) {'
	+  'log("getListsNum: get lists no results");'
	+' } else {'
	+ ' util.listsInfo(html, function(err, results) {'
	+   ' if (err) {'
	+    '  log("getListsNum: handle lists info error", err);'
	+    '} else {'
	+     ' log("getListsNum: handle lists info succeed");'
	+      'results.industryType = options.etpsName;'
	+      'log(results)'
	+      'historyDb.saveTest(results, function(err) {'
	+        'if(err) {'
	+          'log("getListsNum: save results to db error", err);'
	+        '} else {'
	+         ' log("getListsNum: save results to db succeed.");'
	+        '}'
	+      '})'
	+    '}'
	+  '})'
	+'  }'
	+'})	'

	+ '}, 10000 + ' + i + ' * 10 * 1000 + Math.random() * 5 * 1000);'
	log(str)
	// eval(str)

}










