/*
    本作品用于QuantumultX和Surge之间js执行方法的转换
    您只需书写其中任一软件的js,然后在您的js最【前面】追加上此段js即可
    无需担心影响执行问题,具体原理是将QX和Surge的方法转换为互相可调用的方法
    尚未测试是否支持import的方式进行使用,因此暂未export
    如有问题或您有更好的改进方案,请前往 https://github.com/sazs34/TaskConfig/issues 提交内容,或直接进行pull request
*/
// #region 固定头部
let isQuantumultX = $task != undefined; //判断当前运行环境是否是qx
let isSurge = $httpClient != undefined; //判断当前运行环境是否是surge
// http请求
var $task = isQuantumultX ? $task : {};
var $httpClient = isSurge ? $httpClient : {};
// cookie读写
var $prefs = isQuantumultX ? $prefs : {};
var $persistentStore = isSurge ? $persistentStore : {};
// 消息通知
var $notify = isQuantumultX ? $notify : {};
var $notification = isSurge ? $notification : {};
// #endregion 固定头部

// #region 网络请求专用转换
if (isQuantumultX) {
    var errorInfo = {
        error: ''
    };
    $httpClient = {
        get: (url, cb) => {
            var urlObj;
            if (typeof (url) == 'string') {
                urlObj = {
                    url: url
                }
            } else {
                urlObj = url;
            }
            $task.fetch(urlObj).then(response => {
                cb(undefined, response, response.body)
            }, reason => {
                errorInfo.error = reason.error;
                cb(errorInfo, response, '')
            })
        },
        post: (url, cb) => {
            var urlObj;
            if (typeof (url) == 'string') {
                urlObj = {
                    url: url
                }
            } else {
                urlObj = url;
            }
            url.method = 'POST';
            $task.fetch(urlObj).then(response => {
                cb(undefined, response, response.body)
            }, reason => {
                errorInfo.error = reason.error;
                cb(errorInfo, response, '')
            })
        }
    }
}
if (isSurge) {
    $task = {
        fetch: url => {
            //为了兼容qx中fetch的写法,所以永不reject
            return new Promise((resolve, reject) => {
                if (url.method == 'POST') {
                    $httpClient.post(url, (error, response, data) => {
                        if (response) {
                            response.body = data;
                            resolve(response, {
                                error: error
                            });
                        } else {
                            resolve(null, {
                                error: error
                            })
                        }
                    })
                } else {
                    $httpClient.get(url, (error, response, data) => {
                        if (response) {
                            response.body = data;
                            resolve(response, {
                                error: error
                            });
                        } else {
                            resolve(null, {
                                error: error
                            })
                        }
                    })
                }
            })

        }
    }
}
// #endregion 网络请求专用转换

// #region cookie操作
if (isQuantumultX) {
    $persistentStore = {
        read: key => {
            return $prefs.valueForKey(key);
        },
        write: (val, key) => {
            return $prefs.setValueForKey(val, key);
        }
    }
}
if (isSurge) {
    $prefs = {
        valueForKey: key => {
            return $persistentStore.read(key);
        },
        setValueForKey: (val, key) => {
            return $persistentStore.write(val, key);
        }
    }
}
// #endregion

// #region 消息通知
if (isQuantumultX) {
    $notification = {
        post: (title, subTitle, detail) => {
            $notify(title, subTitle, detail);
        }
    }
}
if (isSurge) {
    $notify = function (title, subTitle, detail) {
        $notification.post(title, subTitle, detail);
    }
}
// #endregion

/**
 * 电信营业厅整点开宝箱。（预计每天可得 1300 金豆）
 * 作者：https://t.me/elecV2
 * 地址：https://raw.githubusercontent.com/elecV2/QuantumultX-Tools/master/dianx/dxbox.js
 * 
 * 活动地址：电信营业厅APP 我->整点开宝箱或者我->右上角消息->优惠->金豆省钱攻略
 * 活动时间：~ 2021.03.31 (具体以官方公告为准)
 * 
 * COOKIE 获取：
 * 添加重写订阅(QuanX)： https://raw.githubusercontent.com/elecV2/QuantumultX-Tools/master/dianx/dxbox.cookie.conf
 * 然后进入活动，正常会马上弹出获取 COOKIE 成功的通知。如果没有，检查设置后重试。
 *
 * 或者手动添加复写：
 * hostname = alipaymini.189.cn, alipaymini.189.cn:8043
 * 
 * https:\/\/alipaymini\.189\.cn:8043\/treasureBox\/queryUserActivityInfo url script-request-body https://raw.githubusercontent.com/elecV2/QuantumultX-Tools/master/dianx/dxbox.js
 * 
 * 定时任务： 36 0 8,12,13,14,18,19,20,21,22,23 * * * https://raw.githubusercontent.com/elecV2/QuantumultX-Tools/master/dianx/dxbox.js, tag=整点开宝箱, img-url=https://raw.githubusercontent.com/elecV2/QuantumultX-Tools/master/dianx/dxbox.png, enabled=true
 * 整点过后 5 分钟内都可以开启宝箱，稍微延迟一点，避免服务器短时间内无法处理大量请求开启失败。如失败，再手动运行一次脚本。（或者直接设置运行两次）
 */

const COOKIELIST = {
  'dxbox_cookie': ``,
  'dxbox_body': ``
}

const CONFIG = {
  name: '🎭 电信整点开宝箱',
  debug: false,        // 显示调试信息，是否打印 cookie 信息等。是：true , 否：false (默认)
  openurl: 'ctclient://startapp',      // 点击通知栏的跳转的链接
}

const boxNo = { 'h8':10, 'h12':20, 'h13':30, 'h14':40, 'h18':50, 'h19':60, 'h20':70, 'h21':80, 'h22':90, 'h23':100 }

const cookieMod = {
  get(key){
    if (COOKIELIST && COOKIELIST[key]) return COOKIELIST[key]
    if (typeof $store !== "undefined") return $store.get(key)
    if (typeof $prefs !== "undefined") return $prefs.valueForKey(key)
    if (typeof $persistentStore !== "undefined") return $persistentStore.read(key)
    if (typeof localStorage !== "undefined") return localStorage.getItem(key)
  },
  put(val, key){
    if (typeof $store !== "undefined") return $store.put(val, key)
    if (typeof $prefs !== "undefined") return $prefs.setValueForKey(val, key)
    if (typeof $persistentStore !== "undefined") return $persistentStore.write(val, key)
    if (typeof localStorage !== "undefined") {
      try { 
        localStorage.setItem(key, val)
        return true
      } catch(e) { return false }
    }
  }
}

const simpPost = function(req, type) {
  if (typeof $axios !== "undefined") return $axios(req)
  if (typeof $task !== "undefined") return $task.fetch(req)
  if (typeof $httpClient !== "undefined") {
    const post = type ? $httpClient[type] : $httpClient.post
    return new Promise((resolve, reject)=>{
      post(req, (error, response, body) => error ? reject(error) : resolve(body))
    })
  }
  if (typeof fetch !== "undefined") {
    return new Promise((resolve, reject)=>{
      fetch(req.url, req).then(res=>res.text()).then(res=>resolve(res)).catch(e=>reject(e))
    })
  }
}

const evNotify = function(title, message, url) {
  CONFIG.debug && console.log(`${title}\n${message}\n${url}`)
  if (!url) url = CONFIG.openurl
  if (typeof $feed !== "undefined") return $feed.push(title, message, url)
  if (typeof $notify !== "undefined") return $notify(title, '', message, {'open-url': url})
  if (typeof $notification !== "undefined") return $notification.post(title, '', message, { url })
}

/*********** 程序主要运行部分 ***************/
CONFIG.debug && showCookie()
if (typeof $request === "undefined") {
  const dcookie = cookieMod.get('dxbox_cookie')
  const dbody  = cookieMod.get('dxbox_body')
  const dtoken = dbody ? sJson(dbody).token : ''
  const hours = new Date().getHours()
  if (!dcookie || !dbody || !dtoken) {
    evNotify('🎭 电信整点开宝箱错误', '尚未设置相关 COOKIE.\n请先根据脚本内注释进行获取')
    $done()
  } else if (!boxNo['h' + hours]) {
    evNotify(`🎭 开启 ${ hours } 点宝箱错误`, '该时间段并没有宝箱可以开启')
    $done()
  } else {
    const req = {
      url: `https://alipaymini.189.cn:8043/treasureBox/open?boxNo=${boxNo['h' + hours]}&acCode=ct_zdbx_20201209&token=${dtoken}`,
      headers: oDianxHd(dcookie),
      timeout: 0
    }
    let message = ''
    simpPost(req, 'get').then(res=>{
      const body = res.body || res.data || res
      message += sJson(body).msg || body
      return simpPost({
        url: 'https://alipaymini.189.cn:8043/treasureBox/queryUserActivityInfo',
        headers: oDianxHd(dcookie),
        body: dbody
      })
    }).then(res=>{
      const body = sJson(res.body || res.data || res)
      if (body.data && body.data.accountInfo && body.data.boxDataList) {
        message += ' 当前总金豆：' + body.data.accountInfo.amountTotal
        let nextFlag = true
        body.data.boxDataList.forEach(box=>{
          if (box.boxStatus === 'over' && box.opened === false) message += `\n已错过 ${box.startTime} 点宝箱`
          else if (nextFlag && box.boxStatus === 'notStart') {
            message += `\n下一场：${box.startTime}`
            nextFlag = false
          }
        })
      } else {
        message += '\n查询总金豆有误，' + body.msg + '\n点击通知打开电信营业厅'
        console.log(JSON.stringify(body))
      }
    }).catch(e=>{
      message += '\n' + (e.message || e)
      console.log(message)
    }).finally(()=>{
      evNotify(`🎭 开启 ${ hours } 点宝箱`, message)
      $done()
    })
  }
} else {
  saveCookie()
}
/******* end 程序主要运行部分 end ***********/

function saveCookie() {
  let fail = false
  if ($request.headers && $request.url.match(/treasureBox\/queryUserActivityInfo/) && $request.body) {
    // console.log($request)
    if (cookieMod.put($request.headers.Cookie, 'dxbox_cookie') && cookieMod.put($request.body, 'dxbox_body')) {
      console.log('电信整点开宝箱相关 COOKIE 获取成功')
      evNotify('🎭 电信整点开宝箱 COOKIE 获取成功！', '请注释掉相关复写规则\n然后设置好定时任务即可')
    } else fail = true
  } else fail = true
  if (fail) {
    evNotify('🎭 电信整点开宝箱相关 COOKIE 获取失败', '可能是复写匹配 URL 设置不正确。请仔细检查后再次尝试')
    console.log('电信整点开宝箱相关 COOKIE 获取失败。\n' + $request.url + ' 并不匹配 /treasureBox\/queryUserActivityInfo')
  }
  $done({})
}

function showCookie(title) {
  console.log((title || CONFIG.name) + ' 相关 COOKIE：')
  Object.keys(COOKIELIST).forEach(c=>console.log('\nKEY: ' + c + '\nVAULE: ' + cookieMod.get(c)))
}

function oDianxHd(str) {
  if (typeof str === 'object') return str
  try {
    return JSON.parse(str)
  } catch(e) {
    return {
      "Cookie": str,
      "Content-Type": "application/json;charset=utf-8",
      'User-Agent' : `Mozilla/5.0 (iPhone; CPU iPhone OS 14_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;CtClient;8.3.0;iOS;14.1;`,
    }
  }
}

function sJson(str) {
  if (typeof str === 'object') return str
  try {
    return JSON.parse(str)
  } catch(e) {
    return str
  }
}
