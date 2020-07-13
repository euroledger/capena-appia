
const { v4: uuidv4 } = require('uuid');
const { CredentialsServiceClient, Credentials, WalletServiceClient } = require("@trinsic/service-clients");

const accessToken = 'umV9rMJ-WJ_3rdzLmVmEVefbax1A1hOeKxjpmXWxwfw';
const subscriptionKey = 'b1e0d4a1aee349a6b0ff33a0f9c9f504';

const credentialsClient = new CredentialsServiceClient(
    new Credentials(accessToken, subscriptionKey),
    { noRetryPolicy: true }
);

const walletClient = new WalletServiceClient(
    new Credentials(accessToken, subscriptionKey),
    { noRetryPolicy: true }
);

// Create a wallet
async function createWallet() {
    const walletName = uuidv4();
    return walletClient.createWallet({
        walletParameters: {
            ownerName: walletName
        }
    });
}

// Create a connection
async function createConnection() {
    return credentialsClient.createConnection({
        connectionInvitationParameters: {
            multiParty: false
        }
    });
}

// Accept the connection
async function acceptConnectionInvitation(walletId, invitation) {
    return walletClient.acceptInvitation(walletId, invitation);
}

// Create revocable credential definition
async function createCredentialDefinition(attributeNames) {
    const definitionName = uuidv4();
    const definitionTag = uuidv4();
    return credentialsClient.createCredentialDefinition({
        credentialDefinitionFromSchemaParameters: {
            name: definitionName,
            version: "1.0",
            attributes: attributeNames,
            supportRevocation: true,
            tag: definitionTag
        }
    });
}

// Offer revocable credential
async function createCredential(definitionId, connectionId) {
    const attributeValues = [uuidv4(), uuidv4(), uuidv4()];
    return credentialsClient.createCredential({
        credentialOfferParameters: {
            definitionId: definitionId,
            connectionId: connectionId,
            automaticIssuance: true,
            credentialValues: {
                first: attributeValues[0],
                second: attributeValues[1],
                third: attributeValues[2]
            }
        }
    });
}

// List all offered credentials
async function listCredentials(walletId) {
    return walletClient.listCredentials(walletId);
}

// Accept the offered revocable credentials
async function acceptOfferedCredentials(offeredCredentials, walletId) {
    for (const offeredCredential of offeredCredentials) {
        if (offeredCredential.state === "Offered") {
            await walletClient.acceptCredentialOffer(walletId, offeredCredential.credentialId);
        }
    }
}

// Send verification from parameters
async function sendVerification(connectionId) {
    const verificationName = "My Name";
    const policyName = "My Policy";
    return credentialsClient.sendVerificationFromParameters(connectionId, {
        verificationPolicyParameters: {
            name: verificationName,
            version: "1.0",
            attributes: [
                {
                    policyName: policyName,
                    attributeNames: [
                        'first',
                        'second',
                        'third'
                    ]
                }
            ],
            revocationRequirement: {
                validAt: new Date()
            }
        }
    });
}

// List available verifications
async function listVerifications(walletId) {
    return walletClient.listVerifications(walletId);
}

// Call submitVerificationAutoSelect on each request verification
async function acceptVerificationRequests(availableVerifications, walletId) {
    for (const verificationContract of availableVerifications) {
        if (verificationContract.state === "Requested") {
            await walletClient.submitVerificationAutoSelect(walletId, verificationContract.verificationId);
        }
    }
}

// Get the verification
async function getVerification(verificationId) {
    return credentialsClient.getVerification(verificationId);
}

// Revoke a credential
async function revokeCredential(credentialId) {
    await credentialsClient.revokeCredential(credentialId);
}

// Check that a revocable credential is valid prior to revocation
async function testIsValid() {
    console.log("testIsValid")
    const wallet = await createWallet();

    console.log("wallet created")
    const connection = await createConnection();

    await acceptConnectionInvitation(wallet.walletId, connection.invitation);

    console.log("connection created, id = ", connection.connectionId);

    const attributeNames = ["first", "second", "third"];
    const definition = await createCredentialDefinition(attributeNames);

    const credential = await createCredential(definition.definitionId, connection.connectionId);

    console.log("credential created")
    const offeredCredentials = await listCredentials(wallet.walletId);

    await acceptOfferedCredentials(offeredCredentials, wallet.walletId);

    console.log("...accepted");

    // DO FIRST VERIFICATION (CREDENTIAL NOT REVOKED)
    let verification = await sendVerification(connection.connectionId);
    console.log("verification sent");

    let availableVerification = await listVerifications(wallet.walletId);

    await acceptVerificationRequests(availableVerification, wallet.walletId);

    let verificationUpdate = await getVerification(verification.verificationId);

    console.log("FIRST VERIF");
    console.log(verificationUpdate);

    await revokeCredential(credential.credentialId);

    // DO SECOND VERIFICATION (CREDENTIAL IS REVOKED)
    verification = await sendVerification(connection.connectionId);

    availableVerification = await listVerifications(wallet.walletId);

    await acceptVerificationRequests(availableVerification, wallet.walletId);

    verificationUpdate = await getVerification(verification.verificationId);
    console.log("SECOND VERIF");
    console.log(verificationUpdate);

    if (!verificationUpdate.isValid) {
        console.log('Test Passed\nVerification is invalid');
    } else {
        console.log('Test Failed\nVerification is valid');
    }
}
testIsValid().then();

