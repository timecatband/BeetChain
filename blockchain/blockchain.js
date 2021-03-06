const Block = require("./block");
const Stake = require("./stake");
const Account = require("./account");
const Validators = require("./validators");
const Wallet = require("../wallet/wallet");
let secret = "i am the first leader";

const TRANSACTION_TYPE = {
  transaction: "TRANSACTION",
  stake: "STAKE",
  validator_fee: "VALIDATOR_FEE",
  name_change: "NAME"
};

class Blockchain {
  constructor() {
    this.chain = [Block.genesis()];
    this.stakes = new Stake();
    this.accounts = new Account();
    this.validators = new Validators();
  }

  getLastBlockHash() {
      if (this.chain.length == 0) return "genesis-hash";
      console.log("Last block hash");
      console.log(this.chain[this.chain.length-1].hash);
      return this.chain[this.chain.length-1].hash;
  }

  getPreviousBlockHash() {
      if (this.chain.length < 2) return "genesis-hash";
      return this.chain[this.chain.length-2].hash;
  }

  addBlock(data) {
    let block = Block.createBlock(
      this.chain[this.chain.length - 1],
      data,
      new Wallet(secret)
    );

    this.chain.push(block);
    return block;
  }

  createBlock(transactions, wallet) {
    const block = Block.createBlock(
      this.chain[this.chain.length - 1],
      transactions,
      wallet
    );
    return block;
  }

  isValidChain(chain) {
    if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis()))
      return false;

    for (let i = 1; i < chain.length; i++) {
      const block = chain[i];
      const lastBlock = chain[i - 1];

      if (
        block.lastHash !== lastBlock.hash ||
        block.hash !== Block.blockHash(block)
      )
        return false;
    }

    return true;
  }

  replaceChain(newChain) {
    if (newChain.length <= this.chain.length) {
      console.log("Recieved chain is not longer than the current chain");
      return;
    } else if (!this.isValidChain(newChain)) {
      console.log("Recieved chain is invalid");
      return;
    }

    console.log("Replacing the current chain with new chain");
    this.resetState();
    this.executeChain(newChain);
    this.chain = newChain;
  }

  getBalance(publicKey) {
    return this.accounts.getBalance(publicKey);
  }

  getName(publicKey) {
    return this.accounts.getName(publicKey);
  }

  getLeader() {
    return this.stakes.getMax(this.validators.list);
  }

  initialize(address) {
    this.accounts.initialize(address);
    this.stakes.initialize(address);
  }

  isValidBlock(block) {
    const lastBlock = this.chain[this.chain.length - 1];
    if (
      block.lastHash === lastBlock.hash &&
      block.hash === Block.blockHash(block) &&
      Block.verifyBlock(block) &&
      Block.verifyLeader(block, this.getLeader())
    ) {
      this.chain.push(block);
      this.executeTransactions(block);
      return true;
    } else {
	console.log(this);
	console.log(block);
 console.log(
         block.lastHash == lastBlock.hash,
         block.hash == Block.blockHash(block),
         Block.verifyBlock(block),
         Block.verifyLeader(block, this.getLeader())
       );

      return false;
    }
  }

  executeTransactions(block) {
      console.log("Accounts")
	  console.log(this.accounts);
    block.data[0].forEach(transaction => {
	    console.log(transaction);
      switch (transaction.type) {
        case TRANSACTION_TYPE.transaction:
          this.accounts.update(transaction);
          this.accounts.transferFee(block, transaction);
          break;
        case TRANSACTION_TYPE.name_change:
  	  this.accounts.setName(transaction);
  	  this.accounts.transferFee(block, transaction);
   	  break;
        case TRANSACTION_TYPE.stake:
          this.stakes.update(transaction);
          this.accounts.decrement(
            transaction.input.from,
            transaction.output.amount
          );
          this.accounts.transferFee(block, transaction);

          break;
        case TRANSACTION_TYPE.validator_fee:
          console.log("VALIDATOR_FEE")
          if (this.validators.update(transaction)) {
            this.accounts.decrement(
              transaction.input.from,
              transaction.output.amount
            );
            this.accounts.transferFee(block, transaction);
          }
          break;
      }
      console.log("Accounts 2")
      console.log(this.accounts);
    });
  }

  executeChain(chain) {
    chain.forEach(block => {
      this.executeTransactions(block);
    });
  }

  resetState() {
    this.chain = [Block.genesis()];
    this.stakes = new Stake();
    this.accounts = new Account();
    this.validators = new Validators();
  }
}

module.exports = Blockchain;
