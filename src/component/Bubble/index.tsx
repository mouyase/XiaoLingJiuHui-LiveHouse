import {useState, useEffect, RefObject} from 'react'
import styles from "./index.module.css"

interface Props {
    username?: string,
    text?: string,
    x?: number,
    y?: number,
}

const Bubble = (props: Props) => {
    const [username, setUsername] = useState<string>();
    const [text, setText] = useState<string>();
    const [dom, setDom] = useState<any>();
    const [width, setWidth] = useState<number>();
    const [height, setHeight] = useState<number>();
    const [x, setX] = useState<number>();
    const [y, setY] = useState<number>();
    useEffect(() => {
        setUsername(props.username)
        setText(props.text)
        setX(props.x)
        setY(props.y)
    }, []);
    useEffect(() => {
        if (dom) {
            setWidth(dom.offsetWidth / 2)
            setHeight(dom.offsetHeight + 16)
            // console.log(dom.offsetWidth)
            // console.log(dom.offsetHeight)
        }
    }, [dom]);
    return (
        <div className={styles.Bubble} ref={e => {
            setDom(e)
        }} style={{transform: `translate(-${width}px, -${height}px)`, top: y, left: x}}>
            <div className={styles.tag}>
                <div className={styles.arrow}>
                    <em /><span />
                </div>
                <div className={styles.content}>
                    <span style={{
                        fontWeight: "bolder",
                        marginRight: "8px"
                    }}>{username ? username + ":" : ""}</span>{text}
                </div>
            </div>
        </div>
    )
}
export default Bubble;
