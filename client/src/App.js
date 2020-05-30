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
    const [ebayScore, setEbayScore] = React.useState(0);
    const [ebayUser, setEbayUser] = React.useState('georicha1336');
    const [etsyScore, setEtsyScore] = React.useState(0);

    return (
        <div style={{ display: 'absolute', top: '0%' }} className="App">
            <Header></Header>
            <div style={{marginLeft: '145px', display: 'flex'}}>
                <LeftPanel 
                    ebayScore={ebayScore} 
                    ebayDisplay={ebayReceived}
                    ebayUser={ebayUser} 
                    etsyScore={etsyScore} 
                    etsyDisplay={etsyReceived}>
                </LeftPanel>
                <RightPanel 
                    setEbayReceived={setEbayReceived} 
                    setEtsyReceived={setEtsyReceived}
                    setEbayScore={setEbayScore}
                    setEbayUser={setEbayUser}
                    setEtsyScore={setEtsyScore}
                >
                </RightPanel>
            </div>
        </div>
    );
}

export default App;
