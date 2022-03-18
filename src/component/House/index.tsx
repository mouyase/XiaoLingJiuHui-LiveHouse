import {useState, useEffect, useRef} from 'react'
import danmaku from './danmaku'
import {DataType} from './danmaku'
import styles from "./index.module.css"
import Bubble from "../Bubble"
import shehuiren from "../../image/shehuiren.png"

interface Danmaku {
    name: string,
    text: string,
    isShow: boolean,
    x: number,
    y: number
}

const getRandom = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min)) + min;
}

const House = () => {
    const danmakuPoolRef = useRef<Danmaku[]>([])
    const [danmakuPool, setDanmakuPool] = useState<Danmaku[]>([])

    useEffect(() => {
        let ws = danmaku.connect(22754458, (type, data) => {
            switch (type) {
                case DataType.CertifySuccess:
                    console.log(data)
                    break;
                case DataType.Danmaku:
                    console.log(data)
                    danmakuPoolRef.current.push({
                        name: data.username,
                        text: data.text,
                        isShow: true,
                        x: getRandom(128, 1600 - 128),
                        y: getRandom(96, 540 - 48)
                    })
                    setDanmakuPool([...danmakuPoolRef.current])
                    break;
                case DataType.InRoom:
                    // console.log(data)
                    break;
                case DataType.Gift:
                    // console.log(data)
                    break;
            }
        })
        return () => {
            danmaku.disconnect(ws as WebSocket)
        }
    }, []);

    useEffect(() => {
        danmakuPoolRef.current.forEach((item, index) => {
            if (item.isShow) {
                new Promise<void>(resolve => {
                    setTimeout(() => {
                        resolve()
                    }, 5000)
                }).then(() => {
                    item.isShow = false
                    setDanmakuPool([...danmakuPoolRef.current])
                })
            }
        })
    }, [danmakuPool])
    const addSheHuiRen = () => {
        let array: any[] = []
        for (let i = 0; i < 10; i++) {
            array.push(<img className={styles.SheHuiRen} src={shehuiren} key={i} />)
        }
        return array
    };
    const addDanmaku = () => {
        return danmakuPool.map((item, index) => {
            if (item.isShow) {
                return <Bubble username={item.name} text={item.text} x={item.x} y={item.y} key={index} />
            } else {
                return ""
            }
        })
    }
    return (
        <div className={styles.House}>
            {addSheHuiRen()}
            {addDanmaku()}
        </div>
    )
}
export default House;
