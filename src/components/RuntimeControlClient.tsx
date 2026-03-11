"use client"

import { SegmentedControl, SegmentedControlItem, Text } from "@code0-tech/pictor"

export function RuntimeControlClient() {
    return (
        <div className="flex flex-col items-center gap-2">

            <SegmentedControl type="single" defaultValue="dynamic" className="w-max!">
                <SegmentedControlItem value="dynamic">
                    <Text>Dynamic Runtime</Text>
                </SegmentedControlItem>
                <SegmentedControlItem value="static">
                    <Text>Static Runtime</Text>
                </SegmentedControlItem>
            </SegmentedControl>

            <SegmentedControl type="single" defaultValue="interpreted" className="w-max!">
                <SegmentedControlItem value="compiled">
                    <Text>Compiled Runtime</Text>
                </SegmentedControlItem>
                <SegmentedControlItem value="interpreted">
                    <Text>Interpreted Runtime</Text>
                </SegmentedControlItem>
            </SegmentedControl>

        </div>

    )
}
