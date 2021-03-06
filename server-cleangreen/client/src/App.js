import React from 'react';
import './App.css';
import Header from './components/header';
import { TextField } from "@material-ui/core";
import axios from 'axios';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import QRcode from 'qrcode.react';
import GlobalCss from './components/style/fullsize';


function App() {
    axios.defaults.baseURL = 'http://localhost:4002/';
    const [uberReceived, setUberReceived] = React.useState(false);
    const [qr_open, setQROpen] = React.useState(false);
    const [connected, setConnected] = React.useState(false);
    const [invite_url, setInviteUrl] = React.useState('');
    const [awaiting_uber, setAwaitingUber] = React.useState(false);


    const buttonHandler = () => {
        connectAndRequestUberProof();
    }

    const connectAndRequestUberProof = async() => {
        await getInviteConnection();
        await sendUberProofRequest();
    }
    
    const getInviteConnection = async () => {
        // get the intitial invite from streetcred (Alice) agent
        console.log("...Getting Invitation")
        const response = await axios.post('/api/connect', null);

        console.log(response);
        setInviteUrl("https://web.cloud.streetcred.id/link/?c_i=" + response.data.invite_url);

        // open the QR Code dialog
        setQROpen(true);

        // wait for the connection webhook to come in from streetcred
        await axios.get('/api/connected', null);

        setQROpen(false);
        setConnected(true);
    }

    const sendUberProofRequest = async () => {
        setAwaitingUber(true);
        console.log("sending uber verification...");
        const response = await axios.post('/api/senduberverification', null);

        // wait for the verification webhook to come in from streetcred
        const record = await axios.get('/api/verificationreceived');

        if (record) {
            console.log("QUACK got a verification record: ", record)
            setUberFeedback(prevState => {
                return {
                    ...prevState,
                    driverRating: record.data.driverRating,
                    tripCount: record.data.tripCount
                }
            });
            getUberDiscount();
            setUberReceived(true);
            setAwaitingUber(false);
        }
    }


    const closeQR = () => {
        setQROpen(false);
    }

    const getQRCodeLabel = () => {
        return "Scan this QR code to Connect to Alice's Agent"
    }

    const getLinkDisplay = () => {
        return connected ? 'block' : 'none';
    }

    let initialUberState =
    {
        driverRating: '',
        tripCount: '',
        premium: ''
    };

    const getUberDiscount = () => {
        console.log("BARK in getUberDiscount")
        if (uberReceived === false) { 
            setUberFeedback(prevState => ({
                ...prevState,
                premium: '' }
            ));
        }
        if (uberFeedback.tripCount < 1000) {
            setUberFeedback(prevState => ({
                ...prevState,
                premium: '0' }
            ));
        }
        if (uberFeedback.driverRating < 4.0) {
            setUberFeedback(prevState => ({
                ...prevState,
                premium: '0' }
            ));
        }
        if (uberFeedback.driverRating <4.5) {
            setUberFeedback(prevState => ({
                ...prevState,
                premium: '10%' }
            ));
        }
        setUberFeedback(prevState => ({
            ...prevState,
            premium: '20%' }
        ));
    }

    const [uberFeedback, setUberFeedback] = React.useState(initialUberState);

    return (
        <div style={{ display: 'absolute', top: '0%' }} className="App">
            <GlobalCss></GlobalCss>
            <Header></Header>
            <div>
                <div style={{ display: 'block', flexDirection: 'column', marginLeft: 'auto', marginRight: 'auto', marginTop: '-24px' }}>
                    <div style={{ margin: '0 auto', marginLeft: '31.4%', display: 'flex' }}>
                        <div>
                            <TextField
                                style={{ width: '24vw', height: '3.0rem', marginBottom: '14px' }}
                                id="driverRating"
                                label="Driver Rating"
                                variant="filled"
                                color="#505253"
                                value={uberFeedback["driverRating"]}
                            />
                        </div>
                        <div>
                            <button disabled={connected} className="greybtn" type="button" onClick={buttonHandler}>Get Uber Ratings </button>
                        </div>
                    </div>
                    <div>
                        <TextField
                            style={{ width: '37vw', height: '3.0rem', marginLeft: '3px', marginBottom: '14px' }}
                            id="tripCount"
                            label="Trip Count"
                            variant="filled"
                            color="#505253"
                            value={uberFeedback["tripCount"]}
                        />
                    </div>
                    <div>
                        <TextField
                            style={{ width: '37vw', height: '3.0rem', marginBottom: '14px', marginLeft: '3px' }}
                            id="uberdiscount"
                            label="Premium Discount for Uber Drivers"
                            variant="filled"
                            color="#505253"
                            value = {uberFeedback["premium"]}
                        />
                    </div>
                    <div style={{ marginBottom: '100px' }}>
                        <button className="greenbtn">Submit</button>
                    </div>
                </div>
            </div>
            <Dialog open={qr_open} onClose={closeQR}>
                <DialogTitle style={{ width: "300px" }}>{getQRCodeLabel()}</DialogTitle>
                <QRcode size="200" value={invite_url} style={{ margin: "0 auto", padding: "10px" }} />
            </Dialog>
        </div>

    );
}

export default App;
