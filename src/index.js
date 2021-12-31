const Koa = require("koa");
const { KoaSSO } = require("@mtfe/sso-client");
const k2c = require('koa2-connect');
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require('@koa/cors');

const app = new Koa();



console.log("当前环境为：", process.env.ENV);
const env = process.env.ENV || "test";
const testSsoConfig = {
  clientId: "4b3c2b7e08",
  secret: "e33b392c3a8e4ff9b425c4892c971438",
  logoutUri: "/api/tangram/manage/sso/logout",
  callbackUri: "/api/tangram/manage/sso/callback",
  robotUri: "/api/tangram/manage/sso/robot",
};
const prodSsoConfig = {
  clientId: "08bc9e1ee0",
  secret: "a51becf13e8b4fa88510e7422df7d7c8",
  logoutUri: "/api/tangram/manage/sso/logout",
  callbackUri: "/api/tangram/manage/sso/callback",
  robotUri: "/api/tangram/manage/sso/robot",
};
let ssoConfig = testSsoConfig;
if (env === "prod" || env === "staging") {
  ssoConfig = prodSsoConfig;
}

// 处理登入与登出  (默认配置下访问 `${你的域名}/${API前缀}/sso/logout`可以登出)
// test环境id
// const ssoFn = KoaSSO(ssoConfig);

app.use(KoaSSO(testSsoConfig));
// app.use(async (ctx, next) => {
//   await ssoFn(ctx, next);
// });

app.use(cors({
  'Access-Control-Allow-Origin': '*'
}));

app.use(async (ctx, next) => {
  if (ctx.url.startsWith("/flowable")) {
    //匹配有api字段的请求url
    ctx.respond = false; // 绕过koa内置对象response ，写入原始res对象，而不是koa处理过的response
    await k2c(
      createProxyMiddleware({
        target: "https://flowable.tsp.test.sankuai.com/",
        changeOrigin: true,
        secure: false,
        pathRewrite: { "^/flowable": "" },
        onProxyRes: function (proxyRes, req, res) {
          proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        }
      })
    )(ctx, next);
  } else {
    ctx.respond = false; // 绕过koa内置对象response ，写入原始res对象，而不是koa处理过的response
    await k2c(
      createProxyMiddleware({
        target: "http://localhost:8081/",
        changeOrigin: true,
        secure: false,
        onProxyRes: function (proxyRes, req, res) {
          proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        }
      })
    )(ctx, next);
  }
  await next();
});


app.listen(8080);



// module.exports = app;
