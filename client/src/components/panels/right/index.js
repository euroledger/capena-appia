import React from 'react';
import './right.css'
import logo from './bonanza2.png';
import Button from '../../button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import axios from 'axios';
import QRcode from 'qrcode.react';



function RightPanel({ setEbayReceived, setEtsyReceived, setEbayFeedback, setEtsyFeedback }) {
    const [qr_open, setQROpen] = React.useState(false);
    // const [qr_hasClosed, setQRHasClosed] = React.useState(false);
    const [connected, setConnected] = React.useState(false);
    const [invite_url, setInviteUrl] = React.useState('');
    const [awaiting_ebay, setAwaitingEbay] = React.useState(false);
    const [awaiting_etsy, setAwaitingEtsy] = React.useState(false);


    const buttonHandler = () => {
        getInviteConnection();
    }

    const linkHandler = (platform) => {
        console.log("LinkHandler platform = ", platform)
        if (platform === "ebay") {
            sendeBayProofRequest();
        } else if (platform === "etsy") {
            sendEtsyProofRequest();
        }
    }

    const getInviteConnection = async () => {
        // get the intitial invite from streetcred (Alice) agent
        const response = await axios.post('/api/connect', null);

        console.log(response);
        setInviteUrl("https://web.cloud.streetcred.id/link/?c_i=" + response.data.invite_url);

        // open the QR Code dialog
        setQROpen(true);

        // wait for the connection webhook to come in from streetcred
        await axios.post('/api/connected', null);

        setQROpen(false);
        setConnected(true);
    }

    const sendeBayProofRequest = async () => {
        setAwaitingEbay(true);
        console.log("sending ebay verification...");
        const response = await axios.post('/api/sendebayverification', null);

        // wait for the verification webhook to come in from streetcred
        const record = await axios.get('/api/verificationreceived');

        setEbayFeedback(prevState => {
            return {
                ...prevState,
                userName: record.data.userName,
                feedbackScore: record.data.feedbackScore
            }
        });
        setEbayReceived(true);
        setAwaitingEbay(false);
    }

    const sendEtsyProofRequest = async () => {
        setAwaitingEtsy(true);
        const response = await axios.post('/api/sendetsyverification', null);

        // wait for the verification webhook to come in from streetcred
        const record = await axios.get('/api/verificationreceived');

        console.log("etsy record = ", record);
        setEtsyFeedback(prevState => {
            return {
                ...prevState,
                userName: record.data.userName,
                feedbackCount: record.data.feedbackCount,
                registrationDate: record.data.registrationDate
            }
        });
        setEtsyReceived(true);
        setAwaitingEtsy(false);
    }

    const closeQR = () => {
        setQROpen(false);
        // setQRHasClosed(true);
    }

    const getQRCodeLabel = () => {
        return "Scan this QR code to Connect to MikeR1126's Agent"
    }

    const getLinkDisplay = () => {
        return connected ? 'block' : 'none';
    }

    const getEbayDisplay = () => {
        if (awaiting_ebay === false) {
            return (<a href="#" onClick={() => linkHandler("ebay")}>
                Import my feedback from Ebay
            </a>);
        } else {
            return (<p style={{ color: '#cc0000' }}>Awaiting Ebay Credential Verification...</p>)
        }
    }
    const getEtsyDisplay = () => {
        if (awaiting_etsy === false) {
            return (<a href="#" onClick={() => linkHandler("etsy")}>
                Import my feedback from Etsy
            </a>);
        } else {
            return (<p style={{ color: '#cc0000' }}>Awaiting Etsy Credential Verification...</p>)
        }
    }

    return <div className="right">
        <img src={logo} className="right-logo" alt="logo" />
        <div className="textbox">MikeR1126 doesn't have any 5-star feedback for sales on Bonanza.</div>
        <hr className="textborder"></hr>
        <div className="btnpanel">
            <Button buttonHandler={buttonHandler} connected={connected}></Button>
        </div>

        <p style={{ display: getLinkDisplay() }}>
            {getEbayDisplay()}
        </p>
        <p style={{ display: getLinkDisplay() }}>
            {getEtsyDisplay()}
        </p>
        <Dialog open={qr_open} onClose={closeQR}>
            <DialogTitle style={{ width: "300px" }}>{getQRCodeLabel()}</DialogTitle>
            <QRcode size="200" value={invite_url} style={{ margin: "0 auto", padding: "10px" }} />
        </Dialog>
    </div>
}
export default RightPanel;