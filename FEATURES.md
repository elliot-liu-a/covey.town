# New Features

### Backend
1. Added MongoDB to store chat history for each room.
2. Added services for sending announcements and chat messages.

### Frontend
1. Added a chat panel to the right side of the map for user to have public and private chat with other players.
2. Added an button for user to publish announcement to all players in the room.

## How to Interact
### To Publish Announcement
The owner of the room or anyone that has the room's password can now publish announcements.
The announcement will immediately pop up in every player's screen after publishing.  
To publish an announcement, please follow these steps:
1. With the password of the room, click on the green button "Publish An Announcement" below the chat 
panel to open the announcement panel.
2. Enter the announcement and room password.
3. Click on "Publish Announcement" to send announcement.
4. The player including the publisher will see a toast with the announcement content pop up.

### To Send Public Message
A common player can now send public message to all the players in the room.   
To send public message, please follow these steps:
1. The drop down menu in the chat panel is used to set receiver, set it to "Everyone".
2. Enter a message in the input box and press "Send" button to send the message.
3. The message will show up in the chat panel as history.

### To Send Private Message
A common player can now send private message to another player in the room.   
To send private message, please follow these steps:
1. The drop down menu in the chat panel is used to set receiver, set it to the target user's name.
2. Enter a message in the input box and press "Send" button to send the message.
3. The user will see a pop up window that shows you sent a message, 
and the message will show up in the private chat history with this user.
