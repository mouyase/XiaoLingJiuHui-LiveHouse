import React, {useState, useEffect} from 'react'
import styles from './StagePage.module.css';
import Stage from "../component/Stage";
import House from "../component/House";

const StagePage = () => {
    return (
        <div className={styles.StagePage}>
            <Stage />
            <House />
        </div>
    )
}
export default StagePage;
