var App = angular.module('ctrlv', ['ngRoute']).run(['$rootScope', function ($rootScope) {

}]);

App.component('layout', {
    templateUrl: '/static/partials/layout.html',
    transclude: true,
    controller: [function () {

    }]
});

App.component('checkout', {
    templateUrl: '/static/partials/checkout.html',
    controller: ['$http', function ($http) {
        var $ctrl=this;
        this.reservation = {
            "first_name": "",
            "last_name": "",
            "email_address": "",
            "phone_number": "",
            "captcha_response": "",
            "timeslots":
                [
                    {
                        "timeslot_id": "77759",
                        "items": [
                            {
                                "item_id": "229"
                                , "quantity": 1,
                                "extra_quantity": 0
                            }]
                    }
                ], "best_discount_id": "0",
            "discount_promo_code": "",
            "location_id": 14,
            "force_promo_code": false,
            "giftcards": []
        };

        this.pay = function () {

            $http.post('/api/booking/holdItems', this.reservation).then(function (response) {

                updateAlignetHiddenForm(response.data, $ctrl.reservation);

                //For a strange reason they require you to send a different value when calling the openModal() function
                //even though a different javascript is referenced for production and sandbox.
                if(_CntrlVAlignetIntegration.IsProduction){
                    AlignetVPOS2.openModal('');
                } else {
                    AlignetVPOS2.openModal('https://integracion.alignetsac.com/');
                }
            });
        }

        function updateAlignetHiddenForm(signatureData, reservation) {

            document.getElementById('purchaseAmount').value = signatureData.Amount;
            document.getElementById('purchaseCurrencyCode').value = signatureData.CurrencyCode;
            document.getElementById('purchaseOperationNumber').value = signatureData.OrderId;
            document.getElementById('purchaseVerification').value = signatureData.Signature;

            document.getElementById('shippingFirstName').value = reservation.first_name;
            document.getElementById('shippingLastName').value = reservation.last_name;
            document.getElementById('shippingEmail').value = reservation.email_address;
        }
    }]
});