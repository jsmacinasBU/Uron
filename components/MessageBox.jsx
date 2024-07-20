import React, { useState } from "react";
import { format } from "date-fns";
import "../app/globals.css";

const MessageBox = ({ message, currentUser }) => {
  const [visible, setVisible] = useState(false);

  const showMessage = () => setVisible(true);
  const hideMessage = () => setVisible(false);

  return message?.sender?._id !== currentUser._id ? (
    <div className="message-box">
      <img src={message?.sender?.profileImage || "/assets/person.jpg"} alt="profile photo" className="message-profilePhoto" />
      <div className="message-info">
        <p className="text-small-bold">
          {message?.sender?.username} &#160; &#183; &#160; {format(new Date(message?.createdAt), "p")}
        </p>

        {message?.text ? (
          <div
            className="message-overlay"
            onMouseDown={showMessage}
            onMouseUp={hideMessage}
            onMouseLeave={hideMessage}
          >
            <span className={`message-text ${visible ? 'visible' : ''}`}>
              {message?.text}
            </span>
          </div>
        ) : (
          <img src={message?.photo} alt="message" className="message-photo" />
        )}
      </div>
    </div>
  ) : (
    <div className="message-box justify-end">
      <div className="message-info items-end">
        <p className="text-small-bold">
          {format(new Date(message?.createdAt), "p")}
        </p>

        {message?.text ? (
          <div
            className="message-overlay"
            onMouseDown={showMessage}
            onMouseUp={hideMessage}
            onMouseLeave={hideMessage}
          >
            <span className={`message-text-sender ${visible ? 'visible' : ''}`}>
              {message?.text}
            </span>
          </div>
        ) : (
          <img src={message?.photo} alt="message" className="message-photo" />
        )}
      </div>
    </div>
  )
}

export default MessageBox;