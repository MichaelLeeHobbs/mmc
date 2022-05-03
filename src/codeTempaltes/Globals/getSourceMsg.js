/**
 * Get the source msg as a string
 * @param type=(raw|processedRaw|transformed|encoded|response|responseTransformed|processedResponse)
 * @return {string}
 */
function getSourceMsg(type) {
    const MessageController = Packages.com.mirth.connect.server.controllers.ControllerFactory.getFactory().createMessageController()
    const messageController = MessageController.getMessageContent(channelId, connectorMessage.getMessageId(), [0])
    const immutableMessage = Packages.com.mirth.connect.userutil.ImmutableMessage(messageController)
    const source = immutableMessage.getConnectorMessages().get(0)

    const types = {
        raw: ()=> source.getRawData(),
        processedRaw: ()=> source.getProcessedRawData(),
        transformed: ()=> source.getTransformedData(),
        encoded: ()=> source.getEncodedData(),
        response: ()=> source.getResponseData(),
        responseTransformed: ()=> source.getResponseTransformedData(),
        processedResponse: ()=> source.getProcessedResponseData(),
    }

    return types[type]()
}

/* global Packages, channelId, connectorMessage */
