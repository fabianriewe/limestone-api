const {run} = require("ar-gql");
const Arweave = require("arweave/node");

const VERSION = "0.005";

const client = Arweave.init({
    host: "arweave.net",
    port: 443,
    protocol: "https",
});

async function findGraphQL(parameters) {
    console.log("I am here")
    console.log(parameters)
    const res = (
        await run(
            `
    {
      transactions(
        tags: [
          { name: "app", values: "Limestone" }
          { name: "type", values: "${parameters.type}" }
          { name: "token", values: "${parameters.token}" }
          { name: "version", values: "${VERSION}" }
        ]
        block: { min: ${parameters.atBlock} }
        first: 1
      ) {
        edges {
          node {
            tags {
              name
              value
            }
          }
        }
      }
    }
    `
        )
    ).data.transactions.edges;
    
    if (res[0]) {
        let tags = res[0].node.tags;
        let result = {};
        tags.forEach((tag) => {
            if (tag.name === "value") {
                result.price = parseFloat(tag.value);
            }
            if (tag.name === "time") {
                result.updated = new Date(parseInt(tag.value));
            }
        });
        return result;
    } else {
        throw Error("Invalid data returned from Arweave.");
    }
}

module.exports = {
    getPrice: async function (token) {
        if (typeof token !== "string")
            throw new TypeError("Please provide a token symbol as string.");

        // get latest block
        const latestBlock = parseInt((await client.network.getInfo()).height) - 50

        return await findGraphQL({
            type: "data-latest",
            token: token,
            atBlock: latestBlock
        });
    },
    getPriceAtBlock: async function (token, block) {
        if (typeof token !== "string")
            throw new TypeError("Please provide a token symbol as string.");

        if (typeof block !== "number")
            throw new TypeError("Please provide a token symbol as number.");

        return await findGraphQL({
            type: "data-latest",
            token: token,
            atBlock: block
        });
    },
};
