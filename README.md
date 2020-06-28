# capena-appia Quickstart

This is the Capena-APPIA demo application which allows users to import reputation data from eBay and Etsy (with more to follow)
and then to have those credentials issued as digitally signed transactions on the Hyperledger Indy ledger. Users' data are then stored in their digital wallets allowing for reuse (transferrence) of those credentials to downstream verifiers.

The Capena-APPIA demo shows the interaction between the users and those downstream platforms.

This application, the downtream APPIA plugin, consists of two React front end clients, and an expressjs server.

The Aries SSI agent communication uses the Trinsic API.

# ExpressJS Server

The server has routes for webhooks to process connection and proof request confirmations and routes for connecting and requesting credential verifications.

Currently the platforms supported in terms of requesting credential verifications are - Ebay  
 - Etsy - Uber

Proof requests are passed back to the client in the VerifyRecord.

# Install and Run serveo

TO run both servers start serveo tunneling service twice, once for each. Make sure the service is started for port 5002 (bonanza) first.

ssh -R 80:localhost:5002 serveo.net

You should see:

Forwarding HTTP traffic from https://letatio.serveousercontent.com

ssh -R 80:localhost:3002 serveo.net

You should see:

Forwarding HTTP traffic from https://increpo.serveousercontent.com

Make sure these two URLs are the same as in the .env file:

BONANZA_SERVEO_ADDRESS='https://letatio.serveousercontent.com'
CGC_SERVEO_ADDRESS='https://increpo.serveousercontent.com'



### Android

1.  If you are using Android, download the app "Streetcred identity wallet" from Play Store

### See Capena-Delega for how to run that application and issue credentials to the Trinsic mobile wallet app.

# Bonanza Client

### Requesting Credential Verification: Bonanza

<img src="assets/bonanzamainscreen.png"
        alt="Organizations"
        style="padding-top: 20px; padding-bottom: 20px" 
        width="600"
        height="400"/>


Connect to Capena.

This is a connection invitation. Webhooks will automatically issue the User Details credential once this is scanned

-   Accept the connetion

Click on "connect to capena" and scan the QR Code.

Once the import buttons appear you can import credentials from eBay or Etsy. Accept the proof request on the phone. If more than one credential is availale, select the one that applies (the most recent). If the credentials are revoked then "REVOKED" will appear across the credentials to notify the user.

### Requesting Credential Verification: CleanGreenCompar

# GreenCleanCompare Client

<img src="assets/cleangreenmainscreen.png"
        alt="Organizations"
        style="padding-top: 20px; padding-bottom: 20px" 
        width="600"
        height="400"/>

Click on "Get Uber Ratings".

Once the QR Code appears, scan the code. A proof request appears at the phone. Select the most recent one and hit accept.

The Uber driver ratings will be displayed on the form along with a possible insurance premium discount.
