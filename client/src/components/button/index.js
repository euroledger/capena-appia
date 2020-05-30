import React from 'react';
import './button.css';

function Button({buttonHandler, connected}) {
    return <div>
        <button onClick={buttonHandler} disabled={connected} className="connectbtn">
            Connect To Capena
        </button>
    </div>
}
export default Button;
