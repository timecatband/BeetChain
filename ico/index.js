const express = require("express");
const Blockchain = require("../blockchain/blockchain");
const bodyParser = require("body-parser");
const P2pserver = require("../app/p2p-server");
const Wallet = require("../wallet/wallet");
const TransactionPool = require("../wallet/transaction-pool");
const { TRANSACTION_THRESHOLD } = require("../config");

const HTTP_PORT = 3000;

const app = express();

app.use(bodyParser.json());

const blockchain = new Blockchain();
const wallet = new Wallet("i am the first leader");

const transactionPool = new TransactionPool();
const p2pserver = new P2pserver(blockchain, transactionPool, wallet);

app.get("/ico/transactions", (req, res) => {
  res.json(transactionPool.transactions);
});

app.get("/ico/blocks", (req, res) => {
  res.json(blockchain.chain);
});

function doTransaction(to, amount, type) {
  const transaction = wallet.createTransaction(
    to,
    amount,
    type,
    blockchain,
    transactionPool
  );
  p2pserver.broadcastTransaction(transaction);
  if (transactionPool.transactions.length >= TRANSACTION_THRESHOLD) {
    let block = blockchain.createBlock(transactionPool.transactions, wallet);
    p2pserver.broadcastBlock(block);
  }
}

function ico(dst) {
    doTransaction(dst, 100, "TRANSACTION");
    doTransaction(dst, 100, "TRANSACTION");
    doTransaction(dst, 100, "TRANSACTION");
    doTransaction(dst, 100, "TRANSACTION");
    doTransaction(dst, 100, "TRANSACTION");
}

app.get("/ico/public-key", (req, res) => {
  res.json({ publicKey: wallet.publicKey });
});

app.get("/ico/balance", (req, res) => {
  res.json({ balance: blockchain.getBalance(wallet.publicKey) });
});

app.post("/ico/balance-of", (req, res) => {
  res.json({ balance: blockchain.getBalance(req.body.publicKey) });
});

app.listen(HTTP_PORT, () => {
  console.log(`Listening on port ${HTTP_PORT}`);
});

const repl = require('repl');
r = repl.start('$');
r.context.doTransaction = doTransaction;
r.context.ico = ico;
r.context.balance = () => { blockchain.getBalance(wallet.publicKey); }

p2pserver.listen();
