const express = require("express");
const Blockchain = require("../blockchain/blockchain");
const bodyParser = require("body-parser");
const P2pserver = require("./p2p-server");
const Wallet = require("../wallet/wallet");
const TransactionPool = require("../wallet/transaction-pool");

const HTTP_PORT = process.env.HTTP_PORT || 3001;

const app = express();

app.use(bodyParser.json());

const blockchain = new Blockchain();
const wallet = new Wallet(Date.now().toString());

// blockchain.initialize(wallet.getPublicKey());

const transactionPool = new TransactionPool();
const p2pserver = new P2pserver(blockchain, transactionPool, wallet);

app.get("/blocks", (req, res) => {
  res.json(blockchain.chain);
});

// app.post("/create", (req, res) => {
//   const block = blockchain.addBlock(req.body.data);
//   console.log(`New block added: ${block.toString()}`);
//   p2pserver.syncChain();
//   res.redirect("/blocks");
// });

app.get("/transactions", (req, res) => {
  res.json(transactionPool.transactions);
});

app.post("/transact", (req, res) => {
  const { to, amount, type } = req.body;
  const transaction = wallet.createTransaction(
    to,
    amount,
    type,
    blockchain,
    transactionPool
  );
  p2pserver.broadcastTransaction(transaction);
  res.redirect("/transactions");
});

app.get("/bootstrap", (req, res) => {
  p2pserver.bootstrapSystem();
  res.json({ message: "System bootstraped" });
});

app.get("/public-key", (req, res) => {
  res.json({ publicKey: wallet.publicKey });
});

app.get("/balance", (req, res) => {
  res.json({ balance: blockchain.getBalance(wallet.publicKey) });
});

app.listen(HTTP_PORT, () => {
  console.log(`Listening on port ${HTTP_PORT}`);
});

function publicKey() {
    return wallet.publicKey;
}

function setName(oldName, newName) {
    const transaction = wallet.setName(oldName, newName, blockchain, transactionPool);
    p2pserver.broadcastTransaction(transaction);
}

function getBalance(key) {
    return blockchain.getBalance(key)
}

function getName(key) {
    return blockchain.getName(key)
}

const repl = require('repl');
r = repl.start('$');
r.context.publicKey = publicKey;
r.context.balance = getBalance;
r.context.setName = setName;
r.context.getName = getName;
p2pserver.listen();



