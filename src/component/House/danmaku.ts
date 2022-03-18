import {BrotliDecode} from "./decode";

const url = 'wss://broadcastlv.chat.bilibili.com/sub'

const getCertification = (json: object) => {
    let encoder = new TextEncoder()    //编码器
    let jsonView = encoder.encode(JSON.stringify(json))    //utf-8编码
    let buff = new ArrayBuffer(jsonView.byteLength + 16)    //数据包总长度：16位头部长度+bytes长度
    let view = new DataView(buff)    //新建操作视窗
    view.setUint32(0, jsonView.byteLength + 16)    //整个数据包长度
    view.setUint16(4, 16)    //头部长度
    view.setUint16(6, 1)    //协议版本
    view.setUint32(8, 7)    //类型,7为加入房间认证
    view.setUint32(12, 1)    //填1
    for (let r = 0; r < jsonView.byteLength; r++) {
        view.setUint8(16 + r, jsonView[r])    //填入数据
    }
    return buff
}

const handleMessage = (blob: Blob, call: any) => {
    let reader = new FileReader()
    reader.onload = function (e) {
        let buff = e.target?.result as ArrayBuffer  //ArrayBuffer对象
        let decoder = new TextDecoder()    //解码器
        let view = new DataView(buff)    //视图
        let offset = 0
        let packet: any = {}
        let result = []
        while (offset < buff.byteLength) {    //数据提取
            let packetLen = view.getUint32(offset + 0)
            let headLen = view.getUint16(offset + 4)
            let packetVer = view.getUint16(offset + 6)
            let packetType = view.getUint32(offset + 8)
            let num = view.getUint32(12)
            if (packetVer === 3) {    //解压数据
                let brArray = new Uint8Array(buff, offset + headLen, packetLen - headLen)
                let buffFromBr = BrotliDecode(Int8Array.from(brArray))  //返回Int8Array视图
                let view = new DataView(buffFromBr.buffer)
                let offset_Ver3 = 0
                while (offset_Ver3 < buffFromBr.byteLength) {    //解压后数据提取
                    let packetLen = view.getUint32(offset_Ver3 + 0)
                    let headLen = view.getUint16(offset_Ver3 + 4)
                    let packetVer = view.getUint16(offset_Ver3 + 6)
                    let packetType = view.getUint32(offset_Ver3 + 8)
                    let num = view.getUint32(12)
                    packet.Len = packetLen
                    packet.HeadLen = headLen
                    packet.Ver = packetVer
                    packet.Type = packetType
                    packet.Num = num
                    let dataArray = new Uint8Array(buffFromBr.buffer, offset_Ver3 + headLen, packetLen - headLen)
                    packet.body = decoder.decode(dataArray)    //utf-8格式数据解码，获得字符串
                    result.push(JSON.stringify(packet))    //数据打包后传入数组
                    offset_Ver3 += packetLen
                }
            } else {
                packet.Len = packetLen
                packet.HeadLen = headLen
                packet.Ver = packetVer
                packet.Type = packetType
                packet.Num = num
                let dataArray = new Uint8Array(buff, offset + headLen, packetLen - headLen)
                if (packetType === 3) {    //获取人气值
                    packet.body = (new DataView(buff, offset + headLen, packetLen - headLen)).getUint32(0)    //若入参为dataArray.buffer，会返回整段buff的视图，而不是截取后的视图
                } else {
                    packet.body = decoder.decode(dataArray)    //utf-8格式数据解码，获得字符串
                }
                result.push(JSON.stringify(packet))    //数据打包后传入数组
            }
            offset += packetLen
        }
        call(result)    //数据后续处理
    }
    reader.readAsArrayBuffer(blob)    //读取服务器传来的数据转换为ArrayBuffer
}


export enum DataType {
    Popularity,
    CertifySuccess,
    Follow,
    InRoom,
    Danmaku,
    Gift,
}

const Danmaku = {
    disconnect(ws: WebSocket) {
        ws.close()
    },
    connect(roomID: number, callback: (type: number, data: any) => (void)){
        if ('WebSocket' in window) {
            console.log('您的浏览器支持WebSocket')
            let timer: NodeJS.Timer    //心跳包定时器
            let ws: WebSocket = new WebSocket(url)
            //连接成功后发送认证信息和设置心跳包定时器
            ws.onopen = (e) => {
                ws.send(getCertification({
                    'uid': 0,
                    'roomid': roomID,
                    'protover': 3,
                    'platform': 'web',
                    'type': 2,
                }))
                //发送心跳包
                timer = setInterval(function () {
                    let buffer = new ArrayBuffer(16)
                    let i = new DataView(buffer)
                    i.setUint32(0, 0)    //整个封包
                    i.setUint16(4, 16)    //头部
                    i.setUint16(6, 1)    //协议版本
                    i.setUint32(8, 2)    //操作码,2为心跳包
                    i.setUint32(12, 1)    //填1
                    ws.send(buffer)
                }, 30000) //30秒
            }
            //连接关闭后停止心跳包定时器
            ws.onclose = (e) => {
                //当客户端收到服务端发送的关闭连接请求时，触发onclose事件
                if (timer != null) {
                    clearInterval(timer)    //停止发送心跳包
                }
            }
            //数据处理
            ws.onmessage = (e) => {
                //当客户端收到服务端发来的消息时，触发onmessage事件，参数e.data包含server传递过来的数据
                let blob = e.data
                handleMessage(blob, (allResult: any[]) => {
                    //触发事件
                    allResult.forEach(result => {
                        let json = JSON.parse(result)
                        if (json.Type === 3) {
                            callback(DataType.Popularity, {popularity: json.body})
                        }
                        if (json.Type === 8) {
                            json = JSON.parse(json.body)
                            if (json.code === 0) {
                                callback(DataType.CertifySuccess, {status: 'success'})
                            }
                        }
                        if (json.Type === 5) {
                            json = JSON.parse(json.body)
                            switch (json.cmd) {
                                case 'INTERACT_WORD': {
                                    let username = json.data.uname
                                    let timedata = new Date(json.data.timestamp * 1000)
                                    let time = timedata.toLocaleDateString() + ' ' + timedata.toTimeString().split(' ')[0]
                                    if (json.data.msg_type === 2) {
                                        callback(DataType.Follow, {username: username, time: time, type: "follow"})
                                    } else {
                                        callback(DataType.InRoom, {username: username, time: time, type: "inRoom"})
                                    }
                                    break
                                }
                                case "DANMU_MSG": {
                                    let username = json.info[2][1]
                                    let timedata = new Date(json.info[9].ts * 1000)
                                    let time = timedata.toLocaleDateString() + ' ' + timedata.toTimeString().split(' ')[0]
                                    let text = json.info[1]
                                    callback(DataType.Danmaku, {username: username, time: time, text: text})
                                    break
                                }
                                case "SEND_GIFT": {
                                    let username = json.data.uname
                                    let num = json.data.num
                                    let action = json.data.action
                                    let gift_name = json.data.giftName
                                    let timedata = new Date(json.data.timestamp * 1000)
                                    let time = timedata.toLocaleDateString() + ' ' + timedata.toTimeString().split(' ')[0]
                                    callback(DataType.Gift, {
                                        username: username,
                                        time: time,
                                        action: action,
                                        gift_name: gift_name,
                                        num: num
                                    })
                                    break
                                }
                            }
                        }
                    })
                })
            }
            ws.onerror = (e) => {
                //如果出现连接、处理、接收、发送数据失败的时候触发onerror事件
                console.log(e)
            }
            return ws
        } else {
            console.log('您的浏览器不支持WebSocket')
        }
    },
}
export default Danmaku
