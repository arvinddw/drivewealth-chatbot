const Stomp = require("stomp-client");
const defaultDestination = 'dw.order.request';

const Route = {
  accountIDToQueueName(
    accountID,
    accountNo,
    passedDefaultDestination,
    subAccountID
  ) {
    const me = "Route.accountIDToQueueName(): ";
    try {
      if (subAccountID != null) accountID = subAccountID;

      if (!accountID || accountID.length !== 50) {
        console.error(
          me + "EINVARG JOSHUA null or invalid [accountID=" + accountID + "]"
        );
        if (passedDefaultDestination != null) return passedDefaultDestination;
        else return defaultDestination;
      }

      if (!accountNo == null || accountNo.length != 10) {
        console.error(
          me + "EINVARG JOSHUA null or invalid [accountNo=" + accountNo + "]"
        );
      }

      console.log(me + "routing to joshua is turned off, sending to default.");
      //return defaultDestination;

      if (passedDefaultDestination != null) return passedDefaultDestination;
      else return defaultDestination; // this will warn me in uat before production (I hope).
    } catch (e) {
      console.error(`${accountID} ERROR Exception [ ${e.message} ]`);
      console.error(e);
      //   console.error(
      //     `ERROR do not know how to route this message. [accountID= ${accountID} ]`
      //   );
    }
    if (passedDefaultDestination != null) return passedDefaultDestination;
    else return defaultDestination;
  },
};

const defaultOptions = {
  host: "10.175.1.227",
  // host: "localhost",
  port: 61613,
};

const AMQClient = ({ host, port, username, password } = defaultOptions) => {


  var client = new Stomp(host, port, username, password);

  return {
    async connect() {
      await new Promise((res, rej) => {
        client.connect(
          function (sessionId) {
            console.log(`AMQ: Connected with session id ${sessionId} to ${host}`);
            return res(sessionId);
          },
          function (err) {
            console.error(`AMQ: Connection failed with error ${err}`);
            return rej(err);
          }
        );
      });
    },
    async sendMessageToQueue(
      messageStr,
      { accountID, accountNo, defaultQueueName }
    ) {
      const queueName = Route.accountIDToQueueName(
        accountID,
        accountNo,
        defaultQueueName
      );
      console.log(queueName, '<<<< queueName')
      client.publish(`/queue/${queueName}`, messageStr);
      console.log("AMQ: Message sent");
    },
    async sendMessageToBasketQueue(
      messageStr,
      basketID,
    ) {
      client.publish(`/queue/baskets/${basketID}`, messageStr);
      console.log(`AMQ: Message sent to known basket queue: ${basketID}`);
    },
    async readAllMessagesInBasketQueue(
      basketID,
    ) {
      const messages = [];
      client.subscribe(`/queue/baskets/${basketID}`, (body, headers) => {
        messages.push(JSON.parse(body))
      })
      // ASSUMPTION: Read messages for 3 seconds. Should be able to flush out the Queue by then.
      await new Promise((res) => setTimeout(res, 3000));
      console.log(`AMQ: ${messages.length} messages read from basket queue: ${basketID}`);
      return messages
    },
    async disconnect() {
      return new Promise((res) => {
        client.disconnect(res);
        console.log("AMQ: Disconnected");
      })
    },
  };
};

module.exports = AMQClient;
