import React from "react"
import {Accordion, AccordionContent, AccordionItem} from "@/components/Accordion"

export const FaqSection: React.FC = () => {
    return (
        <div className={"flex flex-col gap-8 items-center justify-center py-40 px-[12%]"}>
            <p className={"text-xl text-white/75"}>Often asked questions</p>
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1" title={"Lorem ipsum dolor sit amet, consetetur sadipscing elitr?"}>
                    <AccordionContent>
                        At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2" title={"Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet?"}>
                    <AccordionContent>
                        Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi. Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3" title={"Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore?"}>
                    <AccordionContent>
                        At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum.
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    )
}
