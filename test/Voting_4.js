const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { abs } = require("mathjs");

describe("Voting_4", function()
{
    var contract_my;

    async function getCurrentTimestamp(bn) {
      return (
        await ethers.provider.getBlock(bn)
      ).timestamp;
    }

    beforeEach( async function() {
        // We can use this section 
        // to run some code before each test
    });

    async function FixtureVoitingFinished1() {
      await contract_my.VoitingAdd([acc1.address,acc2.address],200);
      voiting_index_last = await contract_my.VoitingCountGet()-1;
      await contract_my.VoitingStart(voiting_index_last);
      await contract_my.Vote(voiting_index_last, acc1.address, { value: 3000000000000 });
      await contract_my.Vote(voiting_index_last, acc2.address, { value: 9000000000000 });
      await contract_my.Vote(voiting_index_last, acc1.address, { value: 8000000000000 });
      await network.provider.send("evm_increaseTime", [60*25]);  // Wait 10 second     
      await network.provider.send("evm_mine"); // mining next block
      return { voiting_index_last };
    }

    it("Contract deployed", async function() {
      [acc0, acc1, acc2, acc3, acc4, acc5] = (await ethers.getSigners());   
      var contract_Struct = (await ethers.getContractFactory("Voting_4"));
      contract_my = await contract_Struct.deploy();
      await contract_my.deployed();
      expect(1, "Contract not found").to.eq(1);
      console.log("    Contract Address: ", contract_my.address);
    });


    it("Contract owner is correct?", async function() {
      var contract_Owner = await contract_my.Owner();
      expect(contract_Owner, "Owner is not correct!").to.equal(acc0.address);
    });
 
    it("modifier onlyOwner: Negative test", async function() {
      await expect(  contract_my.connect(acc1).CandidateMaxCountEdit(3) ).to.be.revertedWith('Only Owner!');
    });
    
    it("modifier onlyOwner: Positive test", async function() {
      new_CandidateMaxCountEdit = 3;
      await contract_my.CandidateMaxCountEdit(3);
      expect( await contract_my.connect(acc1).CandidateMaxCount() ).to.eq(new_CandidateMaxCountEdit);
    });
   
    it("modifier onlyVotingExists: Negative test", async function() {
      await expect(  contract_my.VoitingStart(1)  ).to.be.revertedWith('Voiting NOT exists!');
    });
   
    it("modifier onlyVotingExists: Positive test", async function() {
      await contract_my.VoitingAdd([acc5.address],120);
      await contract_my.VoitingAdd([acc1.address],120);
      await contract_my.VoitingStart(1);
    });

    it("function VoitingCountGet", async function() {
      var mmm = await contract_my.connect(acc1).VoitingCountGet();
      expect( mmm ).to.greaterThan(0);    
    });

    
    it("function VoitingAdd: Period is to short", async function() {
      await expect( contract_my.VoitingAdd([acc1.address],0), "Period is to short: Negative test is Wrone" )
        .to.be.revertedWith('Period is to short!');
    });

    it("function VoitingAdd: Only Owner", async function() {
      await expect( contract_my.connect(acc2).VoitingAdd([acc1.address],120) )
        .to.be.revertedWith('Only Owner!');
    });

    it("function VoitingAdd: Normal work", async function() {
      voiting_index_last = await contract_my.VoitingCountGet();
      transact = await contract_my.VoitingAdd([acc1.address, acc2.address], 230);
    });

    it("function VoitingAdd: EventVotingDraft", async function() {
      voiting_index_last = await contract_my.VoitingCountGet();
      last_voiting_length = 345;
      transact = await contract_my.VoitingAdd([acc1.address, acc2.address], last_voiting_length);
      await expect( transact , "EventVotingDraft: Emit absent!")
           .to.emit(contract_my, 'EventVotingDraft')
           .withArgs(voiting_index_last);
    });


    it("function VoitingStart: onlyOwner", async function() {
      voiting_index_last = await contract_my.VoitingCountGet()-1;
      await expect(  contract_my.connect(acc1).VoitingStart(voiting_index_last) ).to.be.revertedWith('Only Owner!');
    });

    it("function VoitingStart: onlyVotingExists", async function() {
      voiting_index_last = await contract_my.VoitingCountGet()-1;
      await expect(  contract_my.VoitingStart(voiting_index_last+1) ).to.be.revertedWith('Voiting NOT exists!');
    });

    it("function VoitingStart: normal work", async function() {
      tVS = await contract_my.VoitingStart(voiting_index_last);
    });

    it("function VoitingStart: EventVoting", async function() {
      last_voiting_length = 1500;
      await contract_my.VoitingAdd([acc1.address, acc2.address], last_voiting_length);
      voiting_index_last = await contract_my.VoitingCountGet()-1;
      tVS = await contract_my.VoitingStart(voiting_index_last);
      var ts_current = await getCurrentTimestamp(tVS.blockNumber);
      await expect( tVS , "EventVoting: Emit absent!")
           .to.emit(contract_my, 'EventVoting')
           .withArgs(voiting_index_last, ts_current, ts_current+last_voiting_length, last_voiting_length);  
    });

    it("function VoitingStart: onlyDraft", async function() {
      await expect(  contract_my.VoitingStart(voiting_index_last), "VoitingStart: onlyDraft: Negative test is Wrone" ).to.be.revertedWith('Already started!');
    });


    it("function VoitingLengthVoting: onlyVotingExists", async function() {  
      voiting_index_last = await contract_my.VoitingCountGet()-1;
      last_voiting_length = 125;
      await expect(  contract_my.VoitingLengthVoting(voiting_index_last+5, last_voiting_length) )
         .to.be.revertedWith('Voiting NOT exists!');  
    });

    it("function VoitingLengthVoting: onlyDraft", async function() {   
      await expect(  contract_my.VoitingLengthVoting(voiting_index_last, last_voiting_length) )
        .to.be.revertedWith('Already started!'); 
    });

    it("function VoitingLengthVoting: onlyOwner", async function() {    
      await expect(  contract_my.connect(acc2).VoitingLengthVoting(voiting_index_last, last_voiting_length), "VoitingLengthVoting: onlyOwner: Negative test is Wrone" ).to.be.revertedWith('Only Owner!');
    });

    it("function VoitingLengthVoting: Normal work", async function() {    
      contract_my.VoitingAdd([acc1.address],last_voiting_length+1);
      voiting_index_last = await contract_my.VoitingCountGet()-1;
      await contract_my.VoitingLengthVoting(voiting_index_last, last_voiting_length);
      tVS = await contract_my.VoitingStart(voiting_index_last);
      var ts_current = await getCurrentTimestamp(tVS.blockNumber);
      await expect( tVS , "EventVoting: Emit absent!")
           .to.emit(contract_my, 'EventVoting')
           .withArgs(voiting_index_last, ts_current, ts_current+last_voiting_length, last_voiting_length);  
    });


    it("function CandidateAdd: onlyDraft", async function() {   
      await expect( contract_my.CandidateAdd( voiting_index_last, acc1.address ) )
        .to.be.revertedWith('Already started!');
    });
    it("function CandidateAdd: onlyOwner", async function() {   
      await expect( contract_my.connect(acc2).CandidateAdd( voiting_index_last, acc1.address ) )
        .to.be.revertedWith('Only Owner!');
    });
    it("function CandidateAdd: Candidate Already Exists", async function() {   
      await contract_my.VoitingAdd([acc0.address,acc1.address],123);
      voiting_index_last = await contract_my.VoitingCountGet()-1;
      await expect( contract_my.CandidateAdd( voiting_index_last, acc0.address ), "This Candidate Already Exists: Negative test is Wrone").to.be.revertedWith('This Candidate Already Exists');
    });
    it("function CandidateAdd: Normal work", async function() {   
      await contract_my.CandidateAdd( voiting_index_last, acc2.address );
    });
    it("function CandidateAdd: To many candidates", async function() {   
      await expect( contract_my.CandidateAdd( voiting_index_last, acc5.address ), "To many candidates: Negative test is Wrone").to.be.revertedWith('To many candidates');
    });


    it("function GetVoteInfo", async function() {
      await contract_my.VoitingAdd([acc1.address,acc2.address],123);
      voiting_index_last = await contract_my.VoitingCountGet()-1;
      tVS = await contract_my.VoitingStart(voiting_index_last);
      ts_current = await getCurrentTimestamp(tVS.blockNumber);
      _VoteInfo = await contract_my.GetVoteInfo(voiting_index_last);  
      await expect( _VoteInfo._IsStarted, "GetVoteInfo: _IsStarted" ).to.equal(true); 
      await expect( _VoteInfo._CandidateCount, "GetVoteInfo: _CandidateCount" ).eq(2); 
      await expect( _VoteInfo._StartVoting, "GetVoteInfo: _StartVoting" ).eq(ts_current); 
      await expect( _VoteInfo._EndVoting, "GetVoteInfo: _EndVoting" ).eq(ts_current+123); 
      await expect( _VoteInfo._Bank, "GetVoteInfo: _Bank" ).eq(0); 
      await expect( _VoteInfo._WinnerBalance, "GetVoteInfo: _WinnerBalance" ).eq(0); 
      await expect( ethers.BigNumber.from(_VoteInfo._WinnerAddress), "GetVoteInfo: _WinnerAddress" ).eq(0);
    });


    it("function CandidateDelete: onlyDraft", async function() {
      await contract_my.VoitingAdd([acc1.address,acc2.address],123);
      voiting_index_last = await contract_my.VoitingCountGet()-1;
      await contract_my.VoitingStart(voiting_index_last);
      await expect( contract_my.CandidateDelete( voiting_index_last, acc1.address ), "onlyDraft: Negative test is Wrone").to.be.revertedWith('Already started!');
    });

    it("function CandidateDelete: This Candidate NOT Exists", async function() {
      await contract_my.VoitingAdd([acc1.address,acc2.address],123);
      voiting_index_last = await contract_my.VoitingCountGet()-1;
      await expect( contract_my.CandidateDelete( voiting_index_last, acc4.address ), "This Candidate NOT Exists: Negative test is Wrone").to.be.revertedWith('This Candidate NOT Exists');
    });

    it("function CandidateDelete: Only Owner!", async function() {
      await expect( contract_my.connect(acc2).CandidateDelete( voiting_index_last, acc1.address ), "Err").to.be.revertedWith('Only Owner!');
    });

    it("function CandidateDelete: normal work", async function() {
      _VoteInfo = await contract_my.GetVoteInfo(voiting_index_last); 
      var candidate_count_before = _VoteInfo._CandidateCount;
      await contract_my.CandidateDelete( voiting_index_last, acc1.address );
      _VoteInfo = await contract_my.GetVoteInfo(voiting_index_last); 
      var candidate_count_after = _VoteInfo._CandidateCount;           
      await expect( candidate_count_after, "CandidateDelete don't work" ).eq(candidate_count_before-1);
    });
  
    
    it("function Vote: Voiting don't exists", async function() {
      voiting_index_last = await contract_my.VoitingCountGet()-1;
      money_summa = 100 *1000 *1000;
      await expect( contract_my.connect(acc3)
        .Vote(voiting_index_last+1, acc4.address, { value: money_summa }), "Voiting don't exists: Negative test is Wrone")
        .to.be.revertedWith('Voiting NOT exists!');
    });

    it("function Vote: This voting not started yet!", async function() {
      await contract_my.VoitingAdd([acc1.address,acc2.address],123);
      await expect( contract_my.connect(acc3)
        .Vote(voiting_index_last, acc4.address, { value: money_summa }), "This voting not started yet!: Negative test is Wrone")
        .to.be.revertedWith('This voting not started yet!');
    });

    it("function Vote: Candidate does not exists!", async function() {
      await contract_my.VoitingAdd([acc1.address,acc2.address],100);
      voiting_index_last = await contract_my.VoitingCountGet()-1;
      await contract_my.VoitingStart(voiting_index_last);
      await expect( contract_my.connect(acc3)
        .Vote(voiting_index_last, acc4.address, { value: money_summa }), "Candidate does not exists!: Negative test is Wrone")
        .to.be.revertedWith('Candidate does not exists!');
    });

    it("function Vote: This voting is Finished!", async function() {
      await contract_my.VoitingAdd([acc1.address,acc2.address],10);
      voiting_index_last = await contract_my.VoitingCountGet()-1;
      await contract_my.VoitingStart(voiting_index_last);
	    // Wait 10 second
      await network.provider.send("evm_increaseTime", [100]);
      // mining next block
      await network.provider.send("evm_mine");
      // expect
      await expect( contract_my.connect(acc3)
        .Vote(voiting_index_last, acc2.address, { value: money_summa }), "This voting is Finished!: Negative test is Wrone")
        .to.be.revertedWith('This voting is Finished!');
    });

    it("function Vote: Normal work #1", async function() {
      await contract_my.VoitingAdd([acc1.address,acc2.address],20);
      voiting_index_last = await contract_my.VoitingCountGet()-1;
      await contract_my.VoitingStart(voiting_index_last);
      money_summa = 100 *1000 *1000;
      balance_acc4_Before     = await ethers.provider.getBalance(acc4.address);
      balance_contract_Before = await ethers.provider.getBalance(contract_my.address);    
      await contract_my.connect(acc4)
        .Vote(voiting_index_last, acc2.address, { value: money_summa });
      balance_acc4_After     = await ethers.provider.getBalance(acc4.address);
      balance_contract_After = await ethers.provider.getBalance(contract_my.address);   
      diff_acc4 = balance_acc4_Before - balance_acc4_After;
      diff_contract = balance_contract_After - balance_contract_Before;
      await expect(abs(diff_acc4-money_summa), "diff_acc4").lessThan(2000000);
      await expect(diff_contract, "diff_contract").equal(money_summa);
    });

    it("function Vote: Normal work #2", async function() {
      money_summa = 90 *1000 *1000;
      await contract_my.connect(acc3)
        .Vote(voiting_index_last, acc1.address, { value: money_summa });
    });

    it("function Vote: Normal work #3", async function() {
      money_summa = 30 *1000 *1000;
      await contract_my.connect(acc3)
        .Vote(voiting_index_last, acc1.address, { value: money_summa });
    });


    it("function GetMyPrice: This voting is NOT finished!", async function() {
      await contract_my.VoitingAdd([acc1.address,acc2.address],200);
      voiting_index_last = await contract_my.VoitingCountGet()-1;
      await contract_my.VoitingStart(voiting_index_last);
      money_summa = 30 *1000 *1000;
      await contract_my.Vote(voiting_index_last, acc1.address, { value: money_summa });
      await expect( contract_my.connect(acc2).GetMyPrice(voiting_index_last) )
        .to.be.revertedWith('This voting is NOT finished!');
    });

    it("function GetMyPrice: You are not the Winner!", async function() {
      await contract_my.VoitingAdd([acc1.address,acc2.address],200);
      voiting_index_last = await contract_my.VoitingCountGet()-1;
      await contract_my.VoitingStart(voiting_index_last);
      await contract_my.connect(acc4).Vote(voiting_index_last, acc1.address, { value: 4000000 });
      await contract_my.connect(acc3).Vote(voiting_index_last, acc2.address, { value: 9000000 });
      await contract_my.connect(acc4).Vote(voiting_index_last, acc1.address, { value: 7000000 });
      // Wait 10 second
      await network.provider.send("evm_increaseTime", [60*25]);
      // mining next block
      await network.provider.send("evm_mine");
      // try to get money
      await expect( contract_my.connect(acc2).GetMyPrice(voiting_index_last) )
        .to.be.revertedWith("You are not the Winner!");
    });

    it("function GetMyPrice: This voting not started yet!", async function() {
      await contract_my.VoitingAdd([acc3.address,acc4.address],100500);
      voiting_index_last = await contract_my.VoitingCountGet()-1;
      await expect( contract_my.connect(acc3).GetMyPrice(voiting_index_last) )
        .to.be.revertedWith('This voting not started yet!');
    });
    
    it("function GetMyPrice: Normal Call", async function() {
      var { voiting_index_last } = await loadFixture( FixtureVoitingFinished1 );
      await contract_my.connect(acc1).GetMyPrice(voiting_index_last);  
    });

    it("function GetMyPrice: Price already taken!", async function() {
      var { voiting_index_last } = await loadFixture( FixtureVoitingFinished1 );
      await contract_my.connect(acc1).GetMyPrice(voiting_index_last);  
      await expect (contract_my.connect(acc1).GetMyPrice(voiting_index_last))
        .to.be.revertedWith("Price already taken!");
    });

    it("function GetMyPrice: Normal GetMoney", async function() {
      var { voiting_index_last } = await loadFixture( FixtureVoitingFinished1 );      
      balance_acc1_Before = await ethers.provider.getBalance(acc1.address);
      contract_balance_Before = await ethers.provider.getBalance(contract_my.address);      
      trans = (await contract_my.connect(acc1).GetMyPrice(voiting_index_last));
      balance_acc1_After = await ethers.provider.getBalance(acc1.address);
      contract_balance_After = await ethers.provider.getBalance(contract_my.address);
      balance_acc1_Diff = balance_acc1_After - balance_acc1_Before;
      price = 20000000000000 - (20000000000000*30/100);
      expect(abs(price-balance_acc1_Diff)).lessThan(1000000);
      expect(contract_balance_Before-contract_balance_After).equal(price);
    });


    it("function GetMyCommission: Only Owner!", async function() {
      voiting_index_last = await contract_my.VoitingCountGet()-1;
      await expect(contract_my.connect(acc4).GetMyCommission(voiting_index_last)).to.be.revertedWith("Only Owner!");
    });

    it("function GetMyCommission: Voiting NOT exists!", async function() {
      await expect(contract_my.GetMyCommission(100500)).to.be.revertedWith("Voiting NOT exists!");
    });
    
    it("function GetMyCommission: This voting not started yet!", async function() {
      await contract_my.VoitingAdd([acc0.address],200);      
      voiting_index_last = await contract_my.VoitingCountGet()-1;
      await expect(contract_my.GetMyCommission(voiting_index_last)).to.be.revertedWith("This voting not started yet!");      
    });
    
    it("function GetMyCommission: This voting is NOT finished!", async function() {
      await contract_my.VoitingAdd([acc1.address, acc2.address],200);      
      voiting_index_last = await contract_my.VoitingCountGet()-1;
      await contract_my.VoitingStart(voiting_index_last);
      await contract_my.Vote(voiting_index_last, acc1.address, { value: 3000000 });
      await expect(contract_my.GetMyCommission(voiting_index_last)).to.be.revertedWith("This voting is NOT finished!");      
    });

    it("function GetMyCommission: Normal GetMoney", async function() {
      var { voiting_index_last } = await loadFixture( FixtureVoitingFinished1 );
      balance_acc0_Before = await ethers.provider.getBalance(acc0.address);
      contract_balance_Before = await ethers.provider.getBalance(contract_my.address);      
      await contract_my.GetMyCommission(voiting_index_last);
      balance_acc0_After = await ethers.provider.getBalance(acc0.address);
      contract_balance_After = await ethers.provider.getBalance(contract_my.address);
      balance_acc0_Diff = balance_acc0_After - balance_acc0_Before;
      commission = (20000000000000*30/100);
      expect(abs(commission-balance_acc0_Diff)).lessThan(1000000);
      expect(contract_balance_Before-contract_balance_After).equal(commission);
    });
        
    it("function GetMyCommission: Commission already taken!", async function() {
      var { voiting_index_last } = await loadFixture( FixtureVoitingFinished1 );      
      await contract_my.GetMyCommission(voiting_index_last);
      await expect(contract_my.GetMyCommission(voiting_index_last)).to.be.revertedWith("Commission already taken!");
    });


    it("logic: if win acc2", async function() {
      await contract_my.VoitingAdd([acc1.address,acc2.address],200);
      voiting_index_last = await contract_my.VoitingCountGet()-1;
      await contract_my.VoitingStart(voiting_index_last);
      await contract_my.Vote(voiting_index_last, acc1.address, { value:  3000000000000 });
      await contract_my.Vote(voiting_index_last, acc2.address, { value: 32000000000000 });
      await contract_my.Vote(voiting_index_last, acc1.address, { value:  5000000000000 });
      await network.provider.send("evm_increaseTime", [60*25]);  // Wait 10 second     
      await network.provider.send("evm_mine"); // mining next block
      // balance_...._Before
      balance_acc1_Before = await ethers.provider.getBalance(acc1.address);
      balance_acc2_Before = await ethers.provider.getBalance(acc2.address);
      balance_cont_Before = await ethers.provider.getBalance(contract_my.address); 
      // Try to get win money
      await expect( contract_my.connect(acc1).GetMyPrice(voiting_index_last) )
        .to.be.revertedWith("You are not the Winner!");
      await contract_my.connect(acc2).GetMyPrice(voiting_index_last);
      // balance_...._After
      balance_acc1_After = await ethers.provider.getBalance(acc1.address);
      balance_acc2_After = await ethers.provider.getBalance(acc2.address);
      balance_cont_After = await ethers.provider.getBalance(contract_my.address);
      // Diff
      balance_acc1_Diff = balance_acc1_After - balance_acc1_Before;
      balance_acc2_Diff = balance_acc2_After - balance_acc2_Before;
      balance_cont_Diff = balance_cont_After - balance_cont_Before;
      // Check balance chenges
      price = 40000000000000 - (40000000000000*30/100);
      expect(balance_acc1_Diff).equal(0);
      expect(balance_cont_Diff).equal(-price);
      expect(abs(price-balance_acc2_Diff)).lessThan(1000000);
    });

})