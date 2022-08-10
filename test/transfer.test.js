// const { Template } = require('@aws-cdk/assertions');
// const cdk = require('@aws-cdk/core');
// const Invest = require('../lib/invest-stack');
const axios = require('axios')

// example test. To run these tests, uncomment this file along with the
// example resource in lib/invest-stack.js

function getToken () {
    
}

test('SQS Queue Created', () => {
    const { data } = await axios.post(
        "https://w4m9ud7bs2.execute-api.us-east-1.amazonaws.com/prod/transfers",
        {
          accountNo: "DWBG000083", //  John Alphonse Acct No
          orderType: "MARKET",
          symbol,
          side: "BUY",
          quantity: grouped[symbol].amount,
        },
        {
          headers: {
            "dw-client-app-key": DW_CLIENT_APP_KEY,
            "dw-auth-token": DW_AUTH_TOKEN,
            "Content-Type": "application/json",
          },
        }
      );
  
//   const app = new cdk.App();
//   // WHEN
//   const stack = new Invest.InvestStack(app, 'MyTestStack');
//   // THEN
//   const template = Template.fromStack(stack);

//   template.hasResourceProperties('AWS::SQS::Queue', {
//     VisibilityTimeout: 300
//   });
});

