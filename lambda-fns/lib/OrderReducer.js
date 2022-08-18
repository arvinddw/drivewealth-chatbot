const _ = require("lodash");
const numeral = require("numeral");
const moment = require('moment')

/*
  MESSAGE Example

  {
    mt: 9819,
    accountID: 'd7078149-4643-476c-b355-4a2ccb6bce4c.1654534016805',
    fromAccountID: 'd7078149-4643-476c-b355-4a2ccb6bce4c.1654534016805',
    toAccountID: 'd7078149-4643-476c-b355-4a2ccb6bce4c.1656083791699',
    symbol: 'AAPL',
    quantity: 3,
    execStrategy: 'FIFO',
    ibID: '80f9b672-120d-4b73-9cc9-42fb3262c4b9',
    id: '139ff1a6-17c5-4ac0-8ea6-24dddc5be2ce',
    instrumentID: 'a67422af-9e63-43df-8504-7361eb0bd99e',
    exchangeID: 'NSQ',
    cusip: '037833100',
    comment: 'This is a comment - 1660246614'
  }

  */


module.exports = (messages) => {
  return {
    // Group messages by Symbol to create orders.
    getOrders() {
      const orders = _.values(messages).reduce((orders, message) => {
        if (!orders[message.symbol]) {
          orders[message.symbol] = {
            mt: "4532",
            sessionKey: `${message.userID}.${moment().format("YYYY-MM-DDTHH:mm:ss.SSS[Z]")}`,
            userID: message.userID,
            accountNo: message.fromAccountNo,
            ordType: "1",
            symbol: message.symbol,
            quantity: 0,
            side: "B",
            limitPx: "0",
            stopPx: "0",
            comment: "Consolidated order",
            // memo,
            correlationID: Date.now(),
          };
        }   
        
        orders[message.symbol].quantity = numeral(
          orders[message.symbol].quantity
        ).add(message.quantity).value();
        
        return orders;
      }, {});

      return _.values(orders);
    },
  };
};
