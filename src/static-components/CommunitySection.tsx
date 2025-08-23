import React from "react";
import {Col, Container, Quote, Row} from "@code0-tech/pictor";

export const CommunitySection: React.FC = () => {
    return <Container my={0}>
        <h1 style={{color: "white", fontSize: "3rem"}}>What our <span
            style={{color: "#70ffb2"}}>Community</span> says</h1>
        <Row mt={1}>
            <Col xs={12} lg={3} mb={1}>
                <Quote name={"Nico Sammito"} position={"Co-Founder Code0"} logo={"/code0_logo.png"}>
                    The platform enables everyone to create complex backend infrastructure in no-time.
                    It completely replaces the need to learn any programming language and everyone can build flows.
                </Quote>
            </Col>
            <Col xs={12} lg={3} mb={1}>
                <Quote name={"Dario Pranjic"} position={"Ruby / Java backend developer"}>
                    Code0 is a game-changer, simplifying the creative process and letting me focus on the big picture
                    without any coding needed
                </Quote>
            </Col>
            <Col xs={12} lg={3} mb={1}>
                <Quote name={"Niklas van Schrick"} position={"Gitlab Core-Team"}>
                    Code0 allows me to quickly create my personal projects and host it without complex infrastructure
                    configuration or server maintenance.
                </Quote>
            </Col>
        </Row>
    </Container>
}