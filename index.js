const http = require('http');
const parser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { createTerminus } = require('@godaddy/terminus');
const express = require('express');
const ngrok = require('ngrok');
const cache = require('./model');
const utils = require('./utils');

require('dotenv').config();
const { AgencyServiceClient, Credentials } = require("@streetcred.id/service-clients");

console.log("SERVER = ", process.env.SERVER);

let client;
if (process.env.SERVER === "CGC") {
    // console.log("ACCESSTOK FOR CLEAN GREEN COMPARE = ", process.env.CG_ACCESSTOK);
    // console.log("SUBKEY FOR CLEAN GREEN COMPARE = ", process.env.CG_SUBKEY);
    client = new AgencyServiceClient(new Credentials(process.env.CG_ACCESSTOK, process.env.CG_SUBKEY));
} else {
    // console.log("ACCESSTOK FOR BONANZA = ", process.env.ACCESSTOK);
    client = new AgencyServiceClient(new Credentials(process.env.ACCESSTOK, process.env.SUBKEY));
}


var app = express();
app.use(cors());
app.use(parser.json());

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '/build/index.html'));
});

console.log("SERVER PORT = ", process.env.SERVERPORT);


let connected = false;
let connectionId;
let verificationAccepted = false;
let platform = "";
let verifyRecord;

// WEBHOOK ENDPOINT
app.post('/webhook', async function (req, res) {
    try {
        console.log("got webhook" + req + "   type: " + req.body.message_type);
        if (req.body.message_type === 'new_connection') {
            connected = true;
            connectionId = req.body.object_id;
        }
        else if (req.body.message_type === 'verification') {
            console.log("cred verificatation notif");

            console.log("Getting verification attributes with verification id of ", req.body.object_id);

            let proof = await client.getVerification(req.body.object_id);

            // const data = proof["proof"]["eBay Seller Proof"]["attributes"];

            // TODO package this stuff up into platform-specific modules
            console.log("Got it! proof data = ", proof["proof"]);

            if (platform === "uber") {
                const data = proof["proof"]["uber proof"]["attributes"];
                verifyRecord = {
                    ...verifyRecord,
                    driverName: data["Driver Name"],
                    driverRating: data["Driver Rating"],
                    activationStatus: data["Activation Status"],
                    tripCount: data["Trip Count"]
                };
            } else if (platform === "ebay") {
                const data = proof["proof"]["eBay Seller Proof"]["attributes"];
                verifyRecord = {
                    ...verifyRecord,
                    userName: data["User Name"],
                    feedbackScore: data["Feedback Score"]
                };
            } else if (platform === "etsy") {
                const data = proof["proof"]["etsy proof"]["attributes"];
                verifyRecord = {
                    ...verifyRecord,
                    userName: data["User Name"],
                    feedbackCount: data["Feedback Count"],
                    registrationDate: data["Registration Date"],
                    PositiveFeedbackPercent: data["Positive Feedback Count"]
                };
            }



            // the full verification record...
            // {
            //     "connectionId": "fab2bff3-702c-41f5-91b5-a012d55e572d",
            //     "verificationId": "604e8149-cc5e-4e3b-99f5-986179fce190",
            //     "state": "Accepted",
            //     "createdAtUtc": "2020-06-16T06:54:43.3524115",
            //     "updatedAtUtc": "2020-06-16T06:54:58.4218379",
            //     "isValid": true,
            //     "verifiedAtUtc": "2020-06-16T06:54:58",
            //     "proof": {
            //       "uber proof": {
            //         "attributes": {
            //           "Driver Name": "Alice Richardson",
            //           "Activation Status": "Active",
            //           "Trip Count": "19876",
            //           "Driver Rating": "4.87"
            //         },
            //         "revealed": false,
            //         "selfAttested": false,
            //         "conditional": false
            //       }
            //     },
            //     "policy": {
            //       "name": "uber proof",
            //       "version": "1.0",
            //       "attributes": [
            //         {
            //           "policyName": "uber proof",
            //           "attributeNames": [
            //             "Driver Name",
            //             "Driver Rating",
            //             "Activation Status",
            //             "Trip Count"
            //           ]
            //         }
            //       ],
            //       "predicates": []
            //     }
            //   }
            verificationAccepted = true;

            console.log(verifyRecord);

        } else {
            console.log("WEBHOOK message_type = ", req.body.message_type);
            console.log("body = ", req.body);
        }
    }
    catch (e) {
        console.log("/webhook error: ", e.message || e.toString());
    }
});

app.post('/api/connect', cors(), async function (req, res) {
    const invite = await getInvite(req.body.passcode);
    const attribs = JSON.stringify(req.body);
    console.log("invite= ", invite);
    cache.add(invite.connectionId, attribs);
    res.status(200).send({ invite_url: invite.invitation });
});

app.post('/api/connected', cors(), async function (req, res) {
    console.log("Waiting for connection...");
    await utils.until(_ => connected === true);
    res.status(200).send();
});

app.post('/api/sendebayverification', cors(), async function (req, res) {
    platform = "ebay";
    verificationAccepted = false;

    const params =
    {
        verificationPolicyParameters: {
            "name": "eBay Seller Proof",
            "version": "1.0",
            "attributes": [
                {
                    "policyName": "eBay Seller Proof",
                    "attributeNames": [
                        "Platform",
                        "User Name",
                        "Feedback Score",
                        "Registration Date",
                        "Negative Feedback Count",
                        "Positive Feedback Count",
                        "Positive Feedback Percent"
                    ]
                }
            ],
            "predicates": []
        }
    }
    const resp = await client.sendVerificationFromParameters(connectionId, params);
    res.status(200).send();
});

app.post('/api/sendetsyverification', cors(), async function (req, res) {

    platform = "etsy";
    verificationAccepted = false;
    const params =
    {
        verificationPolicyParameters: {
            "name": "etsy proof",
            "version": "1.0",
            "attributes": [
                {
                    "policyName": "etsy proof",
                    "attributeNames": [
                        "User Name",
                        "Feedback Count",
                        "Registration Date",
                        "Positive Feedback Percent"
                    ],
                    "restrictions": null
                }
            ],
            "predicates": [],
            "revocationRequirement": null
        }
    }
    console.log("send etsy verification request, connectionId = ", connectionId, "; params = ", params);
    const resp = await client.sendVerificationFromParameters(connectionId, params);
    // const resp = await client.createVerification();

    res.status(200).send();
});

app.post('/api/senduberverification', cors(), async function (req, res) {

    platform = "uber";
    verificationAccepted = false;
    const params =
    {
        verificationPolicyParameters: {
            "name": "uber proof",
            "version": "1.0",
            "attributes": [
                {
                    "policyName": "uber proof",
                    "attributeNames": [
                        "Driver Name",
                        "Driver Rating",
                        "Activation Status",
                        "Trip Count"
                    ],
                    "restrictions": null
                }
            ],
            "predicates": [],
            "revocationRequirement": null
        }
    }
    console.log("send etsy verification request, connectionId = ", connectionId, "; params = ", params);
    const resp = await client.sendVerificationFromParameters(connectionId, params);
    // const resp = await client.createVerification();

    res.status(200).send();
});

app.get('/api/verificationreceived', cors(), async function (req, res) {
    console.log("Waiting for verification...");
    await utils.until(_ => verificationAccepted === true);

    res.status(200).send(verifyRecord);
});

const getInvite = async (id) => {
    try {
        var result = await client.createConnection({
            connectionInvitationParameters: {
                connectionId: id,
                multiParty: false
            }
        });
        return result;
    } catch (e) {
        console.log(e.message || e.toString());
    }
}

var server = http.createServer(app);
async function onSignal() {
    var webhookId = cache.get("webhookId");
    const p1 = await client.removeWebhook(webhookId);
    return Promise.all([p1]);
}
createTerminus(server, {
    signals: ['SIGINT', 'SIGTERM'],
    healthChecks: {},
    onSignal
});

// const PORT = process.env.PORT || 5002;
var server = server.listen(process.env.SERVERPORT, async function () {
    const url_val = await ngrok.connect(process.env.SERVERPORT);

    // the assigned public url for your tunnel

    // const url_val = "https://excuso.serveo.net";

    // const url_val = "https://cazenove01.pagekite.me/";


    // const url_val = "http://4301e127dcf6.ngrok.io";

    console.log("============= \n\n" + url_val + "\n\n =========");

    // const url_val = process.env.NGROK_URL + "/webhook";
    console.log("Using webhook url of ", url_val);
    var response = await client.createWebhook({
        webhookParameters: {
            url: url_val + "/webhook",
            type: "Notification"
        }
    });

    cache.add("webhookId", response.id);
    console.log('Listening on port %d', server.address().port);
});
