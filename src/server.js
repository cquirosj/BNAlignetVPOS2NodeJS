const path = require('path')
const fs = require('fs')
const express = require('express')
const bodyParser = require('body-parser')
const app = express();
const AlignetVPOS2Util = require('./modules/AlignetVPos2Util/src/AlignetVPOS2Helper');

class Server {

  constructor() {
    this.initExpressMiddleware();
    this.initTemplateEngine();
    this.initRoutes();
    this.start();
  }

  start() {
    var certOptions = {
      key: fs.readFileSync(path.resolve('ssl/server.key')),
      cert: fs.readFileSync(path.resolve('ssl/server.crt'))
    }
    require('https').createServer(certOptions, app).listen(443);
  }

  initExpressMiddleware() {
    app.use(express.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use('/static', express.static('wwwroot'))
  }

  initTemplateEngine() {
    app.engine('html', function (filePath, options, callback) {
      fs.readFile(filePath, function (err, content) {
        if (err) return callback(err)
        var rendered = content.toString();

        if (options.bindings) {
          options.bindings.forEach(element => {
            rendered = rendered.replace(element.key, element.value);
          });
        }

        return callback(null, rendered)
      })
    })
    app.set('views', './src/views')
    app.set('view engine', 'html')
  }

  initRoutes() {
    app.get('/', (req, res) => res.sendFile(path.resolve('src/views/index.html')));

    app.get('/ctrlv.html', function (req, res) {
      var alignetSettings = JSON.parse(fs.readFileSync("alignetSettings.json"));

      res.render('ctrlvPOC1', {
        bindings: [
          {
            key: "#AlignetModalJavascript#",
            value: alignetSettings.IsProduction && alignetSettings.ProductionJavascriptURL || alignetSettings.SandboxJavascriptURl
          },
          {
            key: "#IsProduction#",
            value: alignetSettings.IsProduction
          },
          {
            key: "#AcquirerId#",
            value: alignetSettings.AcquirerId
          },
          {
            key: "#IdCommerce#",
            value: alignetSettings.IdCommerce
          }
        ]
      });
    });

    app.post('/api/booking/holdItems', function (req, res) {

      var orderTotal = calculateOrderTotal(req.body);
      var orderNumber = saveOrderDetails(req.body).OrderId;

      var alignetSettings = JSON.parse(fs.readFileSync("alignetSettings.json"));

      var vposHelper =
        new AlignetVPOS2Util.AlignetVPOS2Helper(
          alignetSettings.SecretKey,
          alignetSettings.AcquirerId,
          alignetSettings.IdCommerce);

      var authorizationRequestDetails =
        new AlignetVPOS2Util.AuthorizationRequestDetails(orderTotal, "USD", orderNumber);

      var signedAuthorizationRequest = {
        Signature: vposHelper.sign(authorizationRequestDetails),
        OrderId: orderNumber,
        Amount: authorizationRequestDetails.Amount,
        CurrencyCode: authorizationRequestDetails.CurrencyCode
      }

      res.send(signedAuthorizationRequest);

      function calculateOrderTotal(purchaseOrderRequest) {
        //Here severside, validate the order details and re-calculate the right amount which will be signed in the authorization request
        return 24.75;
      }

      function saveOrderDetails(purchaseOrderRequest) {
        var newOrder = {
          OrderId: simulatedOrderIdConsecutive()
        };

        return newOrder;
      }

       
    });

    app.post('/boleteria/vpos2return', function (req, res) {
      var alignetSettings = JSON.parse(fs.readFileSync("alignetSettings.json"));

      var vposHelper = new AlignetVPOS2Util.AlignetVPOS2Helper(
        alignetSettings.SecretKey,
        alignetSettings.AcquirerId,
        alignetSettings.IdCommerce);

      if (vposHelper.userCancelledInPass1(req.body) || vposHelper.isAuhtorizationResponseValid(req.body)) {

        if (req.body.authorizationResult == "00") {
          //Comfirm charged amount is correct by checking req.body.purchaseAmount
          //Update the status of the order to paid. 
          //Save authorization code and any other field from the authorization result. 
          //Send confirmation e-mail to the customer
        } else {
          //Relese holds
          //Inform the user the authorization didnt go through and to please re-try 
        }

        var allValues = "";

        for (var propt in req.body) {
          allValues += '<div class="form-group"><label class="col-sm-3 control-label">' + propt + '</label><div class="col-sm-9"><input readonly type="text" class="form-control" value="' + req.body[propt] + '"></div></div>'
        }

        res.render('vposReturn', {
          bindings: [
            { key: "#ResultForUser#", value: operationResultForEndUsers(req.body.authorizationResult) },
            { key: "#authorizationResult#", value: req.body.authorizationResult },
            { key: "#errorCode#", value: req.body.errorCode },
            { key: "#errorMessage#", value: req.body.errorMessage },
            { key: "#all-values#", value: allValues }
          ]
        });
      } else {
        res.send('Invalid Transaction. Data tampering detected');
      }

      function operationResultForEndUsers(authorizationResult) {
        return authorizationResult == "00" && "Operación Autorizada"
          || (authorizationResult == "01" && "Operación Denegada")
          || (authorizationResult == "05" && "Operación Rechazada" || "unexpected authorization result");
      }

    });

    //WARNING: For manual integration tests only. Amounts should never be accepted from the client.
    app.post('/api/integrationTests/signAmount', function (req, res) {
      var alignetSettings = JSON.parse(fs.readFileSync("alignetSettings.json"));

      var vposHelper =
        new AlignetVPOS2Util.AlignetVPOS2Helper(
          alignetSettings.SecretKey,
          alignetSettings.AcquirerId,
          alignetSettings.IdCommerce);

      var orderNumber = simulatedOrderIdConsecutive();

      //WARNING: For manual integration tests only. Amounts should never be accepted from the client.
      var orderTotal = req.body.Amount;

      var authorizationRequestDetails =
        new AlignetVPOS2Util.AuthorizationRequestDetails(orderTotal, "CRC", orderNumber);

      var signedAuthorizationRequest = {
        Signature: vposHelper.sign(authorizationRequestDetails),
        OrderId: orderNumber,
        Amount: authorizationRequestDetails.Amount,
        CurrencyCode: authorizationRequestDetails.CurrencyCode
      }

      res.send(signedAuthorizationRequest);
    });

    app.get('/alignetIntegrationTestsApp.html', function (req, res) {
      var alignetSettings = JSON.parse(fs.readFileSync("alignetSettings.json"));

      res.render('alignetIntegrationTestsApp', {
        bindings: [
          {
            key: "#AcquirerId#",
            value: alignetSettings.AcquirerId
          },
          {
            key: "#IdCommerce#",
            value: alignetSettings.IdCommerce
          }
        ]
      });
    });
  }
}

new Server();

function simulatedOrderIdConsecutive() {
  var now = new Date();
  return now.getMonth().toString()
    + now.getDate().toString()
    + now.getMinutes().toString()
    + now.getSeconds().toString();
}


