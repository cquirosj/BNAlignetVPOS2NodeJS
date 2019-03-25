const SHA2 = require("sha2");
const CRC_ALIGNET_CURRENCY_CODE = "188";
const USD_ALIGNET_CURRENCY_CODE = "840";
const CRC_ISO_CURRENCY_CODE = "CRC";
const USD_ISO_CURRENCY_CODE = "USD";

class AlignetVPOS2Helper {
    constructor(secretKey, acquirerId, idCommerce) {
        this._secretKey = secretKey;
        this._acquirerId = acquirerId;
        this._idCommerce = idCommerce;
    }

    sign(authorizationRequestDetails) {

        var input =
            this._acquirerId
            + this._idCommerce
            + authorizationRequestDetails.PurchaseOperationNumber
            + authorizationRequestDetails.Amount
            + authorizationRequestDetails.CurrencyCode
            + this._secretKey;

        return SHA2.sha512(input).toString("hex");
    }

    isAuhtorizationResponseValid(auhtorizationResponseBody) {
        var input =
            this._acquirerId
            + this._idCommerce
            + auhtorizationResponseBody.purchaseOperationNumber
            + auhtorizationResponseBody.purchaseAmount
            + auhtorizationResponseBody.purchaseCurrencyCode
            + auhtorizationResponseBody.authorizationResult
            + this._secretKey;

        return auhtorizationResponseBody.purchaseVerification === SHA2.sha512(input).toString("hex");
    }

    userCancelledInPass1(body) {
        return (body.authorizationResult && body.authorizationResult == "05" && body.errorCode == "2300");
    }
}

function escapeDecimals(amount) {
    return (amount * 100).toString();
}

function translateCurrencyCode(currencyIsoCode) {
    if (currencyIsoCode === CRC_ISO_CURRENCY_CODE) {
        return AuthorizationRequestDetails.CRC_ALIGNET_CURRENCY_CODE
    } else if (currencyIsoCode === USD_ISO_CURRENCY_CODE) {
        return AuthorizationRequestDetails.USD_ALIGNET_CURRENCY_CODE
    } else {
        throw new Error('invalid currency code: use an ISO currency code ');
    }
}

class AuthorizationRequestDetails {
    constructor(amount, currencyCode, purchaseOperationNumber) {
        this._amount = escapeDecimals(amount);
        this._currencyCode = translateCurrencyCode(currencyCode.toString());
        this._purchaseOperationNumber = purchaseOperationNumber;
    }

    static get CRC_ALIGNET_CURRENCY_CODE() {
        return CRC_ALIGNET_CURRENCY_CODE;
    }

    static get USD_ALIGNET_CURRENCY_CODE() {
        return USD_ALIGNET_CURRENCY_CODE;
    }

    get Amount() {
        return this._amount;
    }

    get CurrencyCode() {
        return this._currencyCode;
    }

    get PurchaseOperationNumber() {
        return this._purchaseOperationNumber;
    }
}

module.exports = {
    AlignetVPOS2Helper: AlignetVPOS2Helper,
    AuthorizationRequestDetails: AuthorizationRequestDetails
}