const http = require('http');
const parser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { createTerminus } = require('@godaddy/terminus');
const express = require('express');
const ngrok = require('ngrok');
const cache = require('./model');
const utils = require('./utils');
const localtunnel = require('localtunnel');

require('dotenv').config();
const { AgencyServiceClient, Credentials } = require("@streetcred.id/service-clients");

console.log("ACCESSTOK = ", process.env.ACCESSTOK);
const client = new AgencyServiceClient(new Credentials(process.env.ACCESSTOK, process.env.SUBKEY));

var app = express();
app.use(cors());
app.use(parser.json());

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '/build/index.html'));
});

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
            verificationAccepted = true;
            verifyRecord = req.body;

            // HACK TO FILL IN ATTRIBUTES WHILE WE WAIT FOR STREETCRED FIX FOR PROOF REQUEST BUG
            if (platform === "ebay") {
                verifyRecord = { ...verifyRecord, userName: 'georicha1336', feedbackScore: 2 };
            } else if (platform === "etsy") {
                verifyRecord = { ...verifyRecord, userName: 'gdvwb7of', feedbackCount: 0, registrationDate: "2018-03-31", PositiveFeedbackPercent: 0 };
            } else if (platform === "uber") {
                verifyRecord = { ...verifyRecord, driverName: 'Alice Richardson', driverRating: 4.87, AactivationStatus: "active", tripCount: 19876 };
            } 
            console.log(verifyRecord);

            // TBD possiby use websocket notification push -> send event containing credential to front end

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



    // const resp = await client.createVerification();

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
var server = server.listen(4002, async function () {
    const url_val = await ngrok.connect(4002);

    // const tunnel = await localtunnel({ port: PORT });

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
