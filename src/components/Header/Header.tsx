import React from "react";
import {Container} from "@code0-tech/pictor";

import styles from './Header.module.scss';

interface HeaderType {
    children: React.ReactNode;
    //defaults to false
    fh?: boolean
}

export const Header: React.FC<HeaderType> = (props) => {
    const {fh = false, children} = props

    return (
        <div className={`${styles.header} ${fh ? styles["header--full-height"] : ""}`}>
            <Container>
                {children}
            </Container>
        </div>
    )
}