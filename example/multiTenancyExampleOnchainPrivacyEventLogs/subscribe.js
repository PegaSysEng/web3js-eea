const fs = require("fs");
const path = require("path");
const Web3 = require("web3");
const EEAClient = require("../../src");

const { besu, orion } = require("../keys");
const { createHttpProvider } = require("../helpers.js");

// use an orion key that is not a member of the group (eg orion.node11.jwt)
// to demonstrate that they can't create a filter
const node = new EEAClient(
  new Web3(createHttpProvider(orion.node1.jwt, besu.node1.url)),
  2018
);
const params = JSON.parse(fs.readFileSync(path.join(__dirname, "params.json")));

async function run() {
  const { privacyGroupId, contractAddress: address, blockNumber } = params;

  const filter = {
    address,
    fromBlock: blockNumber
  };

  // Set the polling interval to something fairly high
  node.priv.subscriptionPollingInterval = 5000;

  console.log("Installing filter", filter);

  // Create subscription
  return node.priv
    .subscribe(privacyGroupId, filter, (error, result) => {
      if (!error) {
        console.log("Installed filter", result);
      } else {
        console.error("Problem installing filter", error);
        throw error;
      }
    })
    .then(subscription => {
      // Add handler for each log received
      subscription
        .on("data", log => {
          console.log("LOG =>", log);
        })
        .on("error", console.error);

      // Unsubscribe on interrupt
      process.on("SIGINT", async () => {
        console.log("unsubscribing");
        await subscription.unsubscribe((error, success) => {
          if (!error) {
            console.log("Unsubscribed:", success);
          } else {
            console.log("Failed to unsubscribe:", error);
          }
        });
      });

      return subscription;
    });
}

run();
