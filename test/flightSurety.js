
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
            
  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
      
  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

      await config.flightSuretyData.setOperatingStatus(false);

      let reverted = false;
      try 
      {
          await config.flightSurety.setTestingMode(true);
      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });

  it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
    
    // ARRANGE
    let newAirline = accounts[2];
    let ether = 10 * config.weiMultiple;
    try {
        await config.flightSuretyApp.registerAirline(newAirline, "Test", {from: config.firstAirline});    
    } catch (e) {

    }
    let result = await config.flightSuretyData.isAirline.call(newAirline); 

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

  });
 
  it('(airline) fund first airline', async () => {
    
    let ether = 10 * config.weiMultiple;
    await config.flightSuretyData.fund({from: config.firstAirline, value: ether});
    let result = await config.flightSuretyData.isAirlineFunded(config.firstAirline); 

    // ASSERT
    assert.equal(result, true, "Airline should be funded");

  });

  it('(airline) register 3 airlines', async () => {
    
    // ARRANGE
    let newAirline2 = accounts[2];
    let newAirline3 = accounts[3];
    let newAirline4 = accounts[4];
    await config.flightSuretyApp.registerAirline(newAirline2, "Test 2", {from: config.firstAirline});    
    await config.flightSuretyApp.registerAirline(newAirline3, "Test 3", {from: config.firstAirline});    
    await config.flightSuretyApp.registerAirline(newAirline4, "Test 4", {from: config.firstAirline});    

    let ether = 10 * config.weiMultiple;
    await config.flightSuretyData.fund({from: newAirline2, value: ether});
    await config.flightSuretyData.fund({from: newAirline3, value: ether});
    await config.flightSuretyData.fund({from: newAirline4, value: ether});

    let result1 = await config.flightSuretyData.isAirlineFunded.call(newAirline2); 
    let result2 = await config.flightSuretyData.isAirlineFunded.call(newAirline3); 
    let result3 = await config.flightSuretyData.isAirlineFunded.call(newAirline4); 

    // ASSERT
    assert.equal(result1, true, "Airline 2 should be funded");
    assert.equal(result2, true, "Airline 3 should be funded");
    assert.equal(result3, true, "Airline 4 should be funded");

  });

  it('(airline) register fifth airline must fail', async () => {
    
    // ARRANGE
    let newAirline5 = accounts[5];
    const result = await config.flightSuretyApp.registerAirline.call(newAirline5, "Test 5", {from: config.firstAirline});    
    // ASSERT
    assert.equal(result[0], false, "Airline should not be able to register another airline");
    assert.equal(new BigNumber(result[1]).toNumber(), 1, "Vote must be 1");

  });

  it('(airline) registered Airlines', async () => {
    
    // ARRANGE
    const result = await config.flightSuretyData.getRegisteredAirlines.call();    

    // ASSERT
    assert.equal(new BigNumber(result).toNumber(), 4, "Must be 4 registered airlines");

  });


  it('(airline) cannot vote more than once', async () => {
    
    // ARRANGE
    let newAirline5 = accounts[5];
    const result = await config.flightSuretyApp.registerAirline.call(newAirline5, "Test 5", {from: config.firstAirline});    
    // ASSERT
    assert.equal(new BigNumber(result[1]).toNumber(), 1, "Airline should not be able to vote more than once");

  });

  // it('(airline) test add function', async () => {    
    
  //   var result = await config.flightSuretyApp.updateAirline.call(accounts[6], "Test 6", {from: config.firstAirline});
  //   console.log(result);
  //   result = await config.flightSuretyApp.updateAirline.call(accounts[6], "Test 6", {from: accounts[2]});
  //   console.log(result);
  //   // ASSERT
  //   assert.equal(result[1], 2, "Votes must be 2");

  // });

  it('(airline) register airline 5', async () => {
    
    // ARRANGE
    let airline2 = accounts[2];
    let newAirline5 = accounts[5];
    var result = await config.flightSuretyApp.registerAirline.call(newAirline5, "Test 6", {from: airline2});    
    result = await config.flightSuretyApp.registerAirline.call(newAirline5, "Test 6", {from: accounts[3]});    
    // ASSERT
    assert.equal(result[0], true, "Airline must be added");
    assert.equal(new BigNumber(result[1]).toNumber(), 2, "Airline votes must be 2");

  });


});
