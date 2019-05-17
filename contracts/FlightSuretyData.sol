pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract

    mapping(address => uint256) authorizedCallers;                      // Authorized Callers

    bool private operational = true;                                    // Blocks all state changes throughout the contract if false

    struct Airline {
        address id;
        string name;
        bool funded;
    }

    uint256 registeredAirlines = 0;

    mapping(address => Airline) airlines;

    mapping(address => uint256) tmpAirlines;

    uint256 funds = 0;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    event AirlineRegistered(string);
    event AirlineFunded(string);

    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor
                                (
                                    address firstAirline
                                )
                                public
    {
        contractOwner = msg.sender;
        Airline memory airline = Airline(firstAirline, "First Airline", false);
        airlines[firstAirline] = airline;
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational()
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier requireFundedAirline()
    {
        require(airlines[msg.sender].funded, "Airlines is not funded");
        _;
    }

    modifier requireAirlineFunds()
    {
        require(msg.value >= 10 ether, "Insuficient Ether");
        _;
    }

    modifier requireAuthorizedCaller() {
        require(authorizedCallers[msg.sender] == 1, "Must be an authorized caller");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */      
    function isOperational()
                            public
                            view
                            requireAuthorizedCaller
                            returns(bool)
    {
        return operational;
    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */    
    function setOperatingStatus
                            (
                                bool mode
                            )
                            external
                            requireAuthorizedCaller
    {
        operational = mode;
    }

    function authorizeCaller(address caller) public requireContractOwner {
        authorizedCallers[caller] = 1;
    }

    function deauthorizeCaller(address caller) public requireContractOwner {
        delete authorizedCallers[caller];
    }
    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    function registerAirline
                            (
                                address airlineId,
                                string name
                            )
                            requireFundedAirline
                            requireAuthorizedCaller
                            external
    {
        if ( registeredAirlines < 4 ) {
            require(msg.sender == airlines[0].id, "Must be the first Airline to add more");
            Airline memory airline = Airline(airlineId, name, false);
            airlines[airlineId] = airline;
            emit AirlineRegistered(name);
        } else {
            tmpAirlines[airlineId] = tmpAirlines[airlineId].add(1);
            if ( tmpAirlines[airlineId] >= registeredAirlines.div(2) ) {
                Airline memory airline2 = Airline(airlineId, name, false);
                airlines[airlineId] = airline2;
                emit AirlineRegistered(name);
            }
        }
    }


   /**
    * @dev Buy insurance for a flight
    *
    */   
    function buy
                            (
                            )
                            external
                            payable
    {

    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees
                                (
                                )
                                external
                                pure
    {
    }
    

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay
                            (
                            )
                            external
                            pure
    {
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */
    function fund
                            (
                            )
                            public
                            payable
                            requireAirlineFunds
    {
        funds += msg.value;
        Airline memory airline = airlines[msg.sender];
        airline.funded = true;
        registeredAirlines++;
        emit AirlineFunded(airline.name);
    }

    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32)
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() 
                            external
                            payable
    {
        fund();
    }


}

