import { DFlowReactiveService } from "@code0-tech/pictor";
import { NamespacesProjectsFlowsCreateInput, NamespacesProjectsFlowsCreatePayload, NamespacesProjectsFlowsDeleteInput, NamespacesProjectsFlowsDeletePayload, NamespacesProjectsFlowsUpdateInput, NamespacesProjectsFlowsUpdatePayload } from "@code0-tech/sagittarius-graphql-types";

export class FlowService extends DFlowReactiveService {

    flowCreate(payload: NamespacesProjectsFlowsCreateInput): Promise<NamespacesProjectsFlowsCreatePayload | undefined> {
        throw new Error("Method not implemented.");
    }
    flowDelete(payload: NamespacesProjectsFlowsDeleteInput): Promise<NamespacesProjectsFlowsDeletePayload | undefined> {
        throw new Error("Method not implemented.");
    }
    flowUpdate(payload: NamespacesProjectsFlowsUpdateInput): Promise<NamespacesProjectsFlowsUpdatePayload | undefined> {
        throw new Error("Method not implemented.");
    }
}
