import {useState, useEffect} from 'react'
import styles from "./index.module.css"
import huihui from "../../image/huihui.png"
import shadow from "../../image/shadow.png"

const Stage = () => {
    // let [title, setTitle] = useState<string>()
    useEffect(() => {
        // fetch('https://api-live-bilibili.yojigen.tech/room/v1/Room/get_info_by_id?ids[]=22754458', {
        //     method: 'GET',
        //     mode: 'cors',
        // }).then(res => res.json()).then(res => {
        //     setTitle(res?.data[Object.keys(res?.data)[0]]?.title)
        // })
    }, []);
    return (
        <div className={styles.Stage}>
            <img className={styles.huihui} src={huihui} alt={""} />
            <img className={styles.shadow} src={shadow} alt={""} />
        </div>
    )
}
export default Stage;
