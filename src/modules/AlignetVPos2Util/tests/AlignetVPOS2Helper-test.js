var chai = require('chai');
var expect = chai.expect;
var AlignetVPOS2Util = require('./../src/AlignetVPOS2Helper');

describe('AlignetVPOS2Util', function () {

  it('AuthorizationRequestDetails class should escape amounts', function () {

    var authorizationRequestDetails1 = new AlignetVPOS2Util.AuthorizationRequestDetails(0.75, "USD", "1");
    var authorizationRequestDetails2 = new AlignetVPOS2Util.AuthorizationRequestDetails(75, "USD", "1");
    var authorizationRequestDetails3 = new AlignetVPOS2Util.AuthorizationRequestDetails(24.75, "USD", "1");

    expect(authorizationRequestDetails1.Amount).to.equal("75");
    expect(authorizationRequestDetails2.Amount).to.equal("7500");
    expect(authorizationRequestDetails3.Amount).to.equal("2475");
  });

  it('CRC ISO CurrencyCode should return Alignet Costan Rican colones currency code', function () {

    var authorizationRequestDetails1 = new AlignetVPOS2Util.AuthorizationRequestDetails(0.75, "CRC", "1");

    expect(authorizationRequestDetails1.CurrencyCode).to.equal(AlignetVPOS2Util.AuthorizationRequestDetails.CRC_ALIGNET_CURRENCY_CODE);

  });

  it('USD ISO CurrencyCode should return Alignet USA colones currency code', function () {

    var authorizationRequestDetails1 = new AlignetVPOS2Util.AuthorizationRequestDetails(0.75, "USD", "1");

    expect(authorizationRequestDetails1.CurrencyCode).to.equal(AlignetVPOS2Util.AuthorizationRequestDetails.USD_ALIGNET_CURRENCY_CODE);
  });

  it('Invalid ISO CurrencyCode should throw an exception', function () {
    
    try {
      var authorizationRequestDetails1 = new AlignetVPOS2Util.AuthorizationRequestDetails(0.75, "188", "1");
      //An exception is expected for this case. 
      //if an exception was not thrown after executing the previous line of code this test didn't pass
      expect(1).to.equal(0);
    } catch (error) {
    }
  });
    

  it('AlignetVPOS2Helper.signOrder() should return valid signature', function () {

    var secretKey = "a secret key";
    var acquirerId = "9";
    var idCommerce = "9000";
    var vposHelper = new AlignetVPOS2Util.AlignetVPOS2Helper(secretKey, acquirerId, idCommerce);

    var authorizationRequestDetails = new AlignetVPOS2Util.AuthorizationRequestDetails(0.75, "CRC", "1");

    expect(vposHelper.sign(authorizationRequestDetails)).to.equal("a04a7ab81a0c29bbd7322a8f65f983231165c82303cf2771c4b1c3b2f068f851801adb229724b5197fc90eabb110056edc081f68f6deb483d6ef8983b40cfa0f");
  });

  it('AlignetVPOS2Helper.isAuhtorizationResponseValid() should return true', function () {

    var secretKey = "a secret key";
    var acquirerId = "9";
    var idCommerce = "9000";
    var vposHelper = new AlignetVPOS2Util.AlignetVPOS2Helper(secretKey, acquirerId, idCommerce);

    var auhtorizationResponseBody = {
      purchaseOperationNumber:"03241232",
      purchaseAmount:"2475",
      purchaseCurrencyCode:"188",
      authorizationResult:"05",
      purchaseVerification:"d408104efb59c0a9fd1a227e03b5ddc7bbe216771ecdc93419e5e3436cdddb1c10e84d9f62b9bef53022d72f7cfacf422875e1b25c1549f4c5da460409015b7b"
    }

    expect(vposHelper.isAuhtorizationResponseValid(auhtorizationResponseBody)).to.equal(true);
  });

});
