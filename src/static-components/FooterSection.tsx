"use client"

import React from "react";
import {Col, Row, Text} from "@code0-tech/pictor";
import Image from "next/image";
import Link from "next/link";

export const FooterSection: React.FC = () => {
    return (
        <div className={"bg-primary pt-20 px-20 overflow-hidden"}>

        <div className="relative bg-black/20 p-20 border border-white/10 rounded-t-xl shadow-xl">
            <Image src={"/code0_logo.png"} alt={"Code0 Logo"} width={400} height={400} className={"absolute top-0 left-3/4 -translate-x-1/2 opacity-10"}/>
            <Text size={"md"} display={"block"} hierarchy={"primary"} mt={1}>
                2024-present Code0 Technology
            </Text>
            <Row>
                <Col xs={12} lg={6} mt={1}>
                    <Text size={"md"} display={"block"}>
                        The backend world gets to the next era with the code0 no-code platform.
                        From database modelling to scalable backend endpoints in no-time all within our sleek and easy
                        to use
                        dashboard made for everyone.
                        Everything is open source and with out Community Edition you can tryout our software locally.
                    </Text>
                </Col>
                <Col xs={12} lg={2} mt={1}>
                    <Text size={"md"} hierarchy={"primary"}>
                        General
                    </Text>
                    <Link href={"/legal-notice"} style={{textDecoration: "none"}}>
                        <Text size={"md"} display={"block"} mt={1}>
                            Legal Notice
                        </Text>
                    </Link>
                </Col>
                <Col xs={12} lg={2} mt={1}>
                    <Text size={"md"} hierarchy={"primary"}>
                        Social media
                    </Text>
                    <Link href={"https://instagram.com/code0.tech"} style={{textDecoration: "none"}}>
                        <Text size={"md"} display={"block"} mt={1}>
                            Instagram
                        </Text>
                    </Link>
                    <Link href={"https://discord.com/invite/vsMtqBBqC7"} style={{textDecoration: "none"}}>
                        <Text size={"md"} display={"block"} mt={1}>
                            Discord
                        </Text>
                    </Link>
                </Col>
                <Col xs={12} lg={2} mt={1}>
                    <Text size={"md"} hierarchy={"primary"}>
                        Others
                    </Text>
                    <Link href={"https://github.com/code0-tech"} style={{textDecoration: "none"}}>
                        <Text size={"md"} display={"block"} mt={1}>
                            Github
                        </Text>
                    </Link>
                </Col>
            </Row>
        </div>
        </div>
    )
}