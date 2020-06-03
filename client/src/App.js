import React from 'react';

import './App.css';
import Header from './components/header';
import LeftPanel from './components/panels/left';
import RightPanel from './components/panels/right';
import axios from 'axios';


function App() {
    axios.defaults.baseURL = 'http://localhost:5002/';
    const [ebayReceived, setEbayReceived] = React.useState(false);
    const [etsyReceived, setEtsyReceived] = React.useState(false);

    let initialEtsyState =
    {
        userName: '',
        feedbackCount: 0,
        registrationDate: ''
    };

    let initialEbayState =
    {
        userName: '',
        feedbackScore: 0
    };

    const [ebayFeedback, setEbayFeedback] = React.useState(initialEbayState);
    const [etsyFeedback, setEtsyFeedback] = React.useState(initialEtsyState);

    return (
        <div style={{ display: 'absolute', top: '0%' }} className="App">
            <Header></Header>
            <div style={{ marginLeft: '145px', display: 'flex' }}>
                <LeftPanel
                    ebayFeedback={ebayFeedback}
                    ebayDisplay={ebayReceived}
                    etsyFeedback={etsyFeedback}
                    etsyDisplay={etsyReceived}>
                </LeftPanel>
                <RightPanel
                    setEbayReceived={setEbayReceived}
                    setEtsyReceived={setEtsyReceived}
                    setEbayFeedback={setEbayFeedback}
                    setEtsyFeedback={setEtsyFeedback}
                >
                </RightPanel>
            </div>
        </div>
    );
}

export default App;
