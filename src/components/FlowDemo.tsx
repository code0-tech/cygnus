"use client"

import {} from "@code0-tech/pictor"

export function FlowDemo() {
    const [fileTabsStore, fileTabsService] = useReactiveArrayService<FileTabsView, FileTabsService>(FileTabsService)
    const [dataTypeStore, dataTypeService] = useReactiveArrayService<DataTypeView, DFlowDataTypeReactiveService>(DFlowDataTypeReactiveService)
    const [functionStore, functionService] = useReactiveArrayService<FunctionDefinitionView, DFlowFunctionReactiveService>(DFlowFunctionReactiveService);
    const [flowStore, flowService] = useReactiveArrayService<FlowView, DFlowReactiveService>(DFlowReactiveService);
    const [suggestionStore, suggestionService] = useReactiveArrayService<DFlowSuggestion, DFlowReactiveSuggestionService>(DFlowReactiveSuggestionService);
    const [flowTypeStore, flowTypeService] = useReactiveArrayService<FlowTypeView, DFlowTypeReactiveService>(DFlowTypeReactiveService);
}