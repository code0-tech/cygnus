"use client"

import {NextPage} from "next";
import {BusinessCard} from "@/components/BusinessCard/BusinessCard";
import {Button, Col, Container, Row} from "@code0-tech/pictor";
import {Header} from "@/components/Header/Header";
import React from "react";
import {CommunitySection} from "@/sections/CommunitySection";
import {FlowSection} from "@/sections/FlowSection";
import {IconBrandAndroid, IconBrandApple} from "@tabler/icons-react";
import {BottomNavigation} from "@/components/BottomNavigation/BottomNavigation";

const NicoSammitoCard: NextPage = () => {
    return <>
        <BottomNavigation>
            <Button download href={"/code0_bc_raphael-goetz.vcf"} variant={"outlined"} mr={1} mb={0.001}
                    color={"secondary"}>
                <Button.Icon>
                    <IconBrandApple/>
                </Button.Icon>
                Download contact
            </Button>
            <Button download href={"/code0_bc_raphael-goetz.vcf"} variant={"outlined"} color={"info"} mb={0}>
                <Button.Icon>
                    <IconBrandAndroid/>
                </Button.Icon>
                Download contact
            </Button>
        </BottomNavigation>
        <Header fh>
            <Container>
                <Row>
                    <Col xs={12} lg={4}>
                        <></>
                    </Col>
                    <Col xs={12} lg={4}>
                        <h1 style={{color: "white", fontSize: "3rem", marginBottom: "1rem"}}>
                            Our <span style={{color: "#70ffb2"}}>business card </span><br/> in style
                        </h1>
                        <BusinessCard name={"Raphael Götz"} position={"Co-founder"} mail={"rgoetz"}
                                      phone={"+49 176 87887188"} linkedIn={"Raphael Arun Götz"}/>
                    </Col>
                    <Col xs={12} lg={4}>
                        <></>
                    </Col>
                </Row>
            </Container>
        </Header>
        <FlowSection/>
        <CommunitySection/>
    </>
}

export default NicoSammitoCard;