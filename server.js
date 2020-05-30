const http = require('http');
const parser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { createTerminus } = require('@godaddy/terminus');
const express = require('express');
const ngrok = require('ngrok');
const cache = require('./model');
const utils = require('./utils');


var fs = require('fs');
var https = require('https');

require('dotenv').config();
const { AgencyServiceClient, Credentials } = require("@streetcred.id/service-clients");

console.log("ACCESSTOK = ", process.env.ACCESSTOK);
const client = new AgencyServiceClient(new Credentials(process.env.ACCESSTOK, process.env.SUBKEY));

var certOptions = {
    key: fs.readFileSync(path.resolve('./cert/server.key')),
    cert: fs.readFileSync(path.resolve('./cert/server.crt'))
}

var app = express();
app.use(cors());
app.use(parser.json());
app.use(express.static(path.join(__dirname, 'build')))

// add in routes from the two platforms eBay and Etsy
require('./routes/ebay')(app)
require('./routes/etsy')(app);

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '/build/index.html'));
});



let credentialId;
let connectionId;
let connected = true;
let registered = false;
let credentialAccepted = false;
let verificationAccepted = false;

// WEBHOOK ENDPOINT
app.post('/webhook', async function (req, res) {
    try {
        console.log("got webhook" + req + "   type: " + req.body.message_type);
        if (req.body.message_type === 'new_connection') {
            registered = true;
            connectionId = req.body.object_id;

            // if we want the name of the connection for registration id front end...do here
            // console.log("-----------f----> new connection: ", req.body);
            // try {
            //     connectionContract = await getConnectionWithTimeout(connectionId);
            // } catch (e) {
            //     console.log(e.message || e.toString());
            //     return
            // }
            console.log("new connection notif, connectionId = ", connectionId);

            const attribs = cache.get(req.body.object_id);
            console.log("attribs from cache = ", attribs);
            var param_obj = JSON.parse(attribs);
            var params =
            {
                credentialOfferParameters: {
                    definitionId: process.env.CRED_DEF_ID_USER_DETAILS,
                    connectionId: req.body.object_id,
                    credentialValues: {
                        'First Name': param_obj["firstname"],
                        'Last Name': param_obj["lastname"],
                        'Email Address': param_obj["email"],
                        'Country': param_obj["country"],
                        'Passcode': param_obj["passcode"]
                    }
                }
            }
            console.log(">>>>>>>>>>>>> Creating credential with params ", params);
            await client.createCredential(params);
            console.log("CREDENTIAL CREATED user details!");
        }
        else if (req.body.message_type === 'credential_request') {
            console.log("cred request notif");
            // if (connected) {
            credentialId = req.body.object_id;
            console.log("Issuing credential to ledger, id = ", credentialId);
            await client.issueCredential(credentialId);
            console.log("Credential Issue -> DONE");
            credentialAccepted = true;
            // }
        }
        else if (req.body.message_type === 'verification') {
            console.log("cred verificatation notif");
            verificationAccepted = true;
            console.log(req.body);
        } else {
            console.log("WEBHOOK message_type = ", req.body.message_type);
            console.log("body = ", req.body);
        }
    }
    catch (e) {
        console.log("/webhook error: ", e.message || e.toString());
    }
});

//FRONTEND ENDPOINTS

app.post('/api/issue', cors(), async function (req, res) {
    console.log("IN /api/issue");
    if (connectionId) {
        console.log("issue params = ", req.body);
        var params =
        {
            credentialOfferParameters: {
                definitionId: process.env.CRED_DEF_ID_EBAY,
                connectionId: connectionId,
                credentialValues: {
                    "User Name": req.body["name"],
                    "Feedback Score": req.body["feedbackscore"],
                    "Registration Date": req.body["registrationdate"],
                    "Negative Feedback Count": req.body["negfeedbackcount"],
                    "Positive Feedback Count": req.body["posfeedbackcount"],
                    "Positive Feedback Percent": req.body["posfeedbackpercent"],
                }
            }
        }
        await client.createCredential(params);
        console.log("----------------------> CREDENTIAL CREATED!");
        res.status(200).send();
    } else {
        res.status(500).send("Not connected");
    }
});

app.post('/api/etsy/issue', cors(), async function (req, res) {
    console.log("IN /api/etsy/issue");
    if (connectionId) {
        console.log("issue params = ", req.body);
        var params =
        {
            credentialOfferParameters: {
                definitionId: process.env.CRED_DEF_ID_ETSY,
                connectionId: connectionId,
                credentialValues: {
                    "User Name": req.body["name"],
                    "Feedback Count": req.body["feedbackcount"],
                    "Registration Date": req.body["registrationdate"],
                    "Positive Feedback Percent": req.body["posfeedbackpercent"],
                }
            }
        }
        await client.createCredential(params);
        console.log("----------------------> CREDENTIAL CREATED!");
        res.status(200).send();
    } else {
        res.status(500).send("Not connected");
    }
});

async function findClientConnection(connectionId) {
    return await client.getConnection(connectionId);
}

async function getConnectionWithTimeout(connectionId) {
    let timeoutId;

    const delay = new Promise(function (resolve, reject) {
        timeoutId = setTimeout(function () {
            reject(new Error('timeout'));
        }, 3000);
    });

    // overall timeout
    return Promise.race([delay, findClientConnection(connectionId)])
        .then((res) => {
            clearTimeout(timeoutId);
            return res;
        });
}


app.post('/api/login', cors(), async function (req, res) {
    console.log("Retrieving connection record for id ", req.body);
    connectionId = req.body.passcode;

    // verify that the connection record exists for this id
    let connectionContract;
    try {
        connectionContract = await getConnectionWithTimeout(connectionId);
    } catch (e) {
        console.log(e.message || e.toString());
        res.status(500).send("connection record not found for id " + connectionId);
    }

    if (connectionContract) {
        console.log("connectionContract = ", connectionContract);
        res.status(200).send(connectionContract);
    } else {
        console.log("connection record not found for id ", connectionId);
        res.status(500);
    }
});

app.post('/api/register', cors(), async function (req, res) {
    console.log("Getting invite...")
    console.log("Invite params = ", req.body);
    const invite = await getInvite(req.body.passcode);
    const attribs = JSON.stringify(req.body);
    console.log("invite= ", invite);
    cache.add(invite.connectionId, attribs);
    res.status(200).send({ invite_url: invite.invitation });
});

app.post('/api/revoke', cors(), async function (req, res) {
    console.log("revoking credential, id = ", credentialId);
    await client.revokeCredential(credentialId);
    console.log("Credential revoked!");
    res.status(200).send();
});

app.post('/api/connected', cors(), async function (req, res) {
    console.log("Waiting for connection...");
    await utils.until(_ => registered === true);
    res.status(200).send();
});




app.post('/api/credential_accepted', cors(), async function (req, res) {
    console.log("Waiting for credential to be accepted...");
    await utils.until(_ => credentialAccepted === true);
    credentialAccepted = false;
    res.status(200).send();
});

app.post('/api/verification_accepted', cors(), async function (req, res) {
    console.log("Waiting for proof request (verification) to be accepted...");
    await utils.until(_ => verificationAccepted === true);
    verificationAccepted = false;
    res.status(200).send();
});



app.post('/api/sendkeyverification', cors(), async function (req, res) {

    // need to call client.sendVerificationFromParameters
    // use VerificationPolicyParameters for params

    const params =
    {
        verificationPolicyParameters: {
            "name": "ebay2",
            "version": "1.0",
            "attributes": [
                {
                    "policyName": "ebay May 20 (2)",
                    "attributeNames": [
                        "User Name",
                        "Feedback Score"
                    ],
                    "restrictions": null
                }
            ],
            "predicates": [],
            "revocationRequirement": null
        }
    }
    console.log("send verification request, connectionId = ", connectionId, "; params = ", params);
    const resp = await client.sendVerificationFromParameters(connectionId, params);
    res.status(200).send();
});

const getInvite = async (id) => {
    try {
        var result = await client.createConnection({
            connectionInvitationParameters: {
                connectionId: id,
                multiParty: false
            }
        });
        console.log(">>>>>>>>>>>> INVITE = ", result);
        return result;
    } catch (e) {
        console.log(e.message || e.toString());
    }
}

// for graceful closing
// var server = https.createServer(certOptions, app);
var server = https.createServer(certOptions, app);
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

const PORT = process.env.PORT || 3002;
var server = server.listen(PORT, async function () {
    // const url_val = await ngrok.connect(PORT);
    // console.log("============= \n\n" + url_val + "\n\n =========");

    const url_val = process.env.NGROK_URL + "/webhook";
    console.log("Using ngrok (webhook) url of ", url_val);
    var response = await client.createWebhook({
        webhookParameters: {
            url: url_val,  // process.env.NGROK_URL
            type: "Notification"
        }
    });

    cache.add("webhookId", response.id);
    console.log('Listening on port %d', server.address().port);
});

