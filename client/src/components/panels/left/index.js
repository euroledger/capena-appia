import React from 'react';
import './left.css'
import { faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function LeftPanel({ebayScore, ebayUser, ebayDisplay, etsyScore, etsyDisplay}) {

    const display = (disp) => {
        if (disp) {
            return 'block';
        } else {
            return 'none';
        }
    }

    return <div className="left">
        <div className="square">M</div>
        <div className="usertext1">MikeR11266</div>
        <div className="usertext2">Member Since 2020</div>
        <div className="feedbackicons" style={{ display: 'flex' }}>
            <FontAwesomeIcon color="#facf25" icon={faStar} />
            <FontAwesomeIcon color="#facf25" icon={faStar} />
            <FontAwesomeIcon color="#facf25" icon={faStar} />
            <FontAwesomeIcon color="#facf25" icon={faStar} />
            <FontAwesomeIcon color="#facf25" icon={faStar} />
            <p className="feedbackscore">(0)</p>
        </div>
        <div className="ratingcontainer" >
            <div className="feedbackicons" style={{ display: 'flex' }}>
                <FontAwesomeIcon color="#d9d9d9" icon={faStar} />
                <FontAwesomeIcon color="#d9d9d9" icon={faStar} />
                <FontAwesomeIcon color="#d9d9d9" icon={faStar} />
                <FontAwesomeIcon color="#d9d9d9" icon={faStar} />
                <FontAwesomeIcon color="#d9d9d9" icon={faStar} />
                <p className="feedbackscore">(0)</p>
            </div>
            <div className="usertext3">
                <p>0 private feedback ratings</p>
            </div>
        </div>
        <div className="container1">
            <div style={{display: display(ebayDisplay) }} className="usertext4">eBay Feedback Score: ({ebayScore}) </div>
            <div style={{display: display(ebayDisplay) }} className="usertext4">eBay User: ({ebayUser}) </div>
        </div>
        <div className="container1">
            
            <div style={{display: display(etsyDisplay) }} className="usertext4">Etsy Feedback Score: ({etsyScore}) </div>
        </div>
    </div>
}
export default LeftPanel;
