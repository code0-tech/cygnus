import React from "react";
import {Col, Container, Row, Text} from "@code0-tech/pictor";
import {FlowCard} from "@/components/FlowCard/FlowCard";
import {ChildFlowSplitter, ParentFlowSplitter} from "@/components/FlowLines/FlowLines";

export const FlowSection: React.FC = () => {

    return (
        <Container my={5}>
            <Row>
                <Col xs={12} lg={6}>
                    <h1 style={{color: "white", fontSize: "3rem"}}>Create flows in <br/>
                        <span style={{color: "#70ffb2"}}>no-time</span></h1>
                    <Text size={"md"} display={"block"} mt={1}>
                        With our easy to use flow builder you can create complex endpoints in no-time.
                        {/* eslint-disable-next-line react/no-unescaped-entities */}
                        We support every operation you can imagine or do in a "normal" programming language.
                    </Text>
                    <ul>
                        <li>
                            <Text size={"lg"}>
                                Suggestions based on flow
                            </Text>
                        </li>
                        <li>
                            <Text size={"lg"}>
                                Unlimited extensions through our open-source marketplace
                            </Text>
                        </li>
                        <li>
                            <Text size={"lg"}>
                                Test your flows directly with dynamic runtime
                            </Text>
                        </li>
                    </ul>
                </Col>
                <Col xs={12} lg={6}>
                    <div style={{opacity: ".5"}}>
                        <FlowCard badge={"BRANCH"} color={"info"} title={"If-Then branch with condition"} parameters
                                  description={"With this branch its possible to compare or check content for a specific condition and execute a sub flow based on the result."}/>
                        <ParentFlowSplitter/>

                        <Row>
                            <Col xs={6}>
                                <ChildFlowSplitter pos={"left"}/>
                                <FlowCard badge={"ACTION"} parameters color={"success"} title={"Send mail with template"}
                                          description={"Send mail to given mail address and select a created template and payload you want to parse in."}/>
                            </Col>
                            <Col xs={6}>
                                <ChildFlowSplitter pos={"right"}/>
                                <FlowCard badge={"ACTION"} parameters color={"success"}
                                          title={"Send message over phone number"}
                                          description={"Send a text message to a given phone number."}/>
                            </Col>
                        </Row>
                    </div>
                </Col>
            </Row>
        </Container>
    )
}