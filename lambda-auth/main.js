
exports.handler = async (event) => {
    console.log(`event >`, JSON.stringify(event, null, 2))
    const {
        authorizationToken,
        requestContext: { apiId, accountId },
    } = event
    const response = {
        isAuthorized: true,
        ttlOverride: 10,
    }
    console.log(`response >`, JSON.stringify(response, null, 2))
    return response
}