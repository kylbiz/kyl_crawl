module.exports = {
  db: {
    db: 'precious',
    user: 'precious',
    password: 'mongodb_kyl_biz_precious',
    host: 'localhost',
    port: 27017,
    poolSize: 30000
  },
  server: {
    port: 3456
  },
  registration: {
    homeRefererUrl: 'http://www.sgs.gov.cn/lz/etpsInfo.do?method=index', // The referer url
    registrationResultsUrl: 'http://www.sgs.gov.cn/lz/etpsInfo.do?method=doSearch', // results for keywords url
    registrationDetailUrl: 'http://www.sgs.gov.cn/lz/etpsInfo.do?method=viewDetail' // url for keywords detail
  }
}