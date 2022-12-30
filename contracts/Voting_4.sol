// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

contract Voting_4
{
    // define variables: Owner, Number of votes, Maximum number of candidates, Commission
    address public Owner;
    uint public CandidateMaxCount;
    uint public CommissionPercent;

    // define the structure "Candidate"
    struct StructCandidate
    {
        bool IsExists;
        uint WeiVote;
    }

    // define the structure "Candidates"
    struct StructMapCandidates
    {
        uint CandidateCount;
        mapping(address=>StructCandidate) MC;
    }

    // define the structure "Voting"
    struct StructVoting
    {
        StructMapCandidates Candidates;
        uint StartVoting;
        uint EndVoting;
        uint LengthVoting;
        bool IsExists; 
        bool IsStarted; 
        uint Bank;
        uint WinnerBalance;
        address WinnerAddress;
        bool IsTakePrice;
        bool IsTakeCommition;
    }

    // define var "Votings"
    struct StructMapVotings
    {
        uint VoitingCount;
        mapping(uint=>StructVoting) MV;
    }

    StructMapVotings public Votings;


    // construct
    constructor()
    {
        Owner = msg.sender;
        Votings.VoitingCount = 0;
        CandidateMaxCount = 1000;
        CommissionPercent = 30;
    }
  
    
    modifier onlyOwner()
    {
        require(msg.sender==Owner, "Only Owner!");
        _;
    }

    modifier onlyVotingExists(uint _VoitingIndex)
    {
        require(Votings.MV[_VoitingIndex].IsExists==true, "Voiting NOT exists!");
        _;
    }

    modifier onlyDraft(uint _VoitingIndex)
    {
        require(Votings.MV[_VoitingIndex].IsStarted==false, "Already started!");
        _;
    }

   
    // Edit the global variable "maximum possible number of candidates in one vote"
    function CandidateMaxCountEdit(uint _CandidateMaxCount)
    public 
    onlyOwner
    {
        CandidateMaxCount = _CandidateMaxCount;
    }

   
    // Add new vote
    function VoitingAdd(address[] memory _CandidateAddressArray, uint _Period)
    public 
    onlyOwner
    {
        require(_Period>=1, "Period is to short!");
        Votings.MV[Votings.VoitingCount].LengthVoting = _Period;
        Votings.MV[Votings.VoitingCount].IsExists = true;
        uint n;
        for (n=0; n<_CandidateAddressArray.length; n++)
            Votings.MV[Votings.VoitingCount].Candidates.MC[_CandidateAddressArray[n]].IsExists = true;
        Votings.MV[Votings.VoitingCount].Candidates.CandidateCount = _CandidateAddressArray.length;
        emit EventVotingDraft( Votings.VoitingCount );
        Votings.VoitingCount++;
    }

    // Returns the number of votes
    function VoitingCountGet()
    public
    view
    returns (uint _VoitingCount)
    {
        _VoitingCount = Votings.VoitingCount;
    }


    function VoitingStart(uint _VoitingIndex)
    public 
    onlyOwner
    onlyVotingExists(_VoitingIndex)
    onlyDraft(_VoitingIndex)
    {
        Votings.MV[_VoitingIndex].IsStarted=true;
        Votings.MV[_VoitingIndex].StartVoting=block.timestamp;
        Votings.MV[_VoitingIndex].EndVoting=block.timestamp+Votings.MV[_VoitingIndex].LengthVoting;        

        emit EventVoting  ( _VoitingIndex
                          , Votings.MV[_VoitingIndex].StartVoting
                          , Votings.MV[_VoitingIndex].EndVoting
                          , Votings.MV[_VoitingIndex].LengthVoting
                          );
    }


    function VoitingLengthVoting(uint _VoitingIndex, uint _LengthVoting)
    public 
    onlyOwner
    onlyVotingExists(_VoitingIndex)
    onlyDraft(_VoitingIndex)
    {
        Votings.MV[_VoitingIndex].LengthVoting = _LengthVoting;        
    }


    function CandidateAdd(uint _VoitingIndex, address _CandidateAdr)
    public 
    onlyOwner 
    onlyVotingExists(_VoitingIndex)
    onlyDraft(_VoitingIndex)
    {
        require(Votings.MV[_VoitingIndex].Candidates.CandidateCount < CandidateMaxCount, "To many candidates");
        require(Votings.MV[_VoitingIndex].Candidates.MC[_CandidateAdr].IsExists == false, "This Candidate Already Exists");
        Votings.MV[_VoitingIndex].Candidates.MC[_CandidateAdr].IsExists = true;
        Votings.MV[_VoitingIndex].Candidates.CandidateCount++;
        emit EventCandidate( _VoitingIndex , _CandidateAdr  );
    }


    function CandidateDelete(uint _VoitingIndex, address _CandidateAdr)
    public 
    onlyOwner 
    onlyVotingExists(_VoitingIndex)
    onlyDraft(_VoitingIndex)
    {
        require(Votings.MV[_VoitingIndex].Candidates.MC[_CandidateAdr].IsExists == true, "This Candidate NOT Exists");
        Votings.MV[_VoitingIndex].Candidates.MC[_CandidateAdr].IsExists = false;
        Votings.MV[_VoitingIndex].Candidates.CandidateCount = Votings.MV[_VoitingIndex].Candidates.CandidateCount - 1;
    }


    // Function "Vote on such-and-such a vote for such-and-such a candidate"
    // Check if
    //   voting has been started
    //   voting has not ended
    //   candidate exists
    function Vote(uint _VoitingIndex, address _CandidateAdr)
    public
    payable
    onlyVotingExists(_VoitingIndex)
    {
        require(Votings.MV[_VoitingIndex].IsStarted, "This voting not started yet!");
        require(block.timestamp < Votings.MV[_VoitingIndex].EndVoting, "This voting is Finished!");
        require(Votings.MV[_VoitingIndex].Candidates.MC[_CandidateAdr].IsExists, "Candidate does not exists!");
        Votings.MV[_VoitingIndex].Candidates.MC[_CandidateAdr].WeiVote += msg.value;
        Votings.MV[_VoitingIndex].Bank = Votings.MV[_VoitingIndex].Bank + msg.value;
        if (Votings.MV[_VoitingIndex].Candidates.MC[_CandidateAdr].WeiVote > Votings.MV[_VoitingIndex].WinnerBalance)
        {
            Votings.MV[_VoitingIndex].WinnerAddress = _CandidateAdr;
            Votings.MV[_VoitingIndex].WinnerBalance = Votings.MV[_VoitingIndex].Candidates.MC[_CandidateAdr].WeiVote;
        }
    }


    // Take my winner's prize
    function GetMyPrice(uint _VoitingIndex)
    public
    onlyVotingExists(_VoitingIndex)
    {
        require(Votings.MV[_VoitingIndex].IsStarted, "This voting not started yet!");
        require(block.timestamp > Votings.MV[_VoitingIndex].EndVoting, "This voting is NOT finished!");
        require(msg.sender==Votings.MV[_VoitingIndex].WinnerAddress, "You are not the Winner!");
        require(Votings.MV[_VoitingIndex].IsTakePrice==false, "Price already taken!");        
        uint myPrice = Votings.MV[_VoitingIndex].Bank 
                    - (Votings.MV[_VoitingIndex].Bank * CommissionPercent / 100);
        Votings.MV[_VoitingIndex].IsTakePrice = true;
        payable(msg.sender).transfer(myPrice);
    }


    // Take my commission
    function GetMyCommission(uint _VoitingIndex)
    public
    onlyOwner
    onlyVotingExists(_VoitingIndex)
    {
        require(Votings.MV[_VoitingIndex].IsStarted, "This voting not started yet!");
        require(block.timestamp > Votings.MV[_VoitingIndex].EndVoting, "This voting is NOT finished!");
        require(Votings.MV[_VoitingIndex].IsTakeCommition==false, "Commission already taken!");        
        uint myCommission = (Votings.MV[_VoitingIndex].Bank * CommissionPercent / 100);
        Votings.MV[_VoitingIndex].IsTakeCommition = true;
        payable(msg.sender).transfer(myCommission);
    }


    function GetVoteInfo(uint _VoitingIndex)
    public
    view    
    onlyVotingExists(_VoitingIndex)
    returns (
            bool    _IsStarted,
            uint256 _CandidateCount,
            uint256 _StartVoting,
            uint256 _CurrentTimeStamp,
            uint256 _EndVoting,
            uint256 _LengthVoting,
            uint256 _Bank,
            uint256 _WinnerBalance,
            address _WinnerAddress
        )    
    {
        _IsStarted = Votings.MV[_VoitingIndex].IsStarted;
        _CandidateCount = Votings.MV[_VoitingIndex].Candidates.CandidateCount;
        _StartVoting = Votings.MV[_VoitingIndex].StartVoting;
        _CurrentTimeStamp = block.timestamp;
        _EndVoting = Votings.MV[_VoitingIndex].EndVoting;
        _LengthVoting = Votings.MV[_VoitingIndex].LengthVoting;
        _Bank = Votings.MV[_VoitingIndex].Bank;
        _WinnerBalance = Votings.MV[_VoitingIndex].WinnerBalance;
        _WinnerAddress = Votings.MV[_VoitingIndex].WinnerAddress;
    }
    

    event EventCandidate  ( uint    indexed Vote
                          , address indexed Candidate
                          );
    event EventVotingDraft( uint indexed Vote );
    event EventVoting     ( uint indexed Vote
                          , uint indexed StartVoting
                          , uint indexed EndVoting
                          , uint LengthVoting
                          );

}