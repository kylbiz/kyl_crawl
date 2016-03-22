crawlkyl 开业啦一企查服务
-------
这是开业啦一企查抓取REST服务。欢迎提供任何建议: `zunkun.liu@kyl.biz`

#### API

#### 抓取字号信息
methods: POST

```
POST : /post/registration

data: {
        keywords: keywords ,
        uuid: uuid
      }

Response: {success: true}
```

#### 抓取企业信用信息
methods: POST

```
POST: /post/credit
data: {
        "companyId": "310108000455333",
        "companyName": "上海仁爱电子仪表设备有限公司第一分公司"
      }

Response: {success: false}
```


