# Design

## New Application Architecture
![High Level Architecture](docs/NewHighLevelArchitecture-2.png)

## UI changes
* User will be able to publish an announcement, send message, and view chat history. <br/>

* When user enter the town, on the right side of world map, user should be able to see the chat history, a message content input, a user name dropdown, a 'Publish an Announcement' button and a 'send' button. <br/>

* If user click 'Publish an Announcement' button, a popup component should come out. The popup component should be consist of a content input, a password input and a 'Publish Announcement' button. Once user type in input, password, and click the button, all the user in the same town should be able to see a toast 'Announcement: ...' with the announcement content, and the current user should also see a toast saying 'Announcement published'. <br/>

* If user type in message content, select a receiver name, and click the 'send' button, the user should see a toast saying 'Message sent'. And the user should be able to see the message in the chat history. The corresponding receiver should see a toast saying '... send you a private/ public message'. If the receiver select the sender name in the dropdown, the message content should be shown in the chat history. <br/>

* The chat history will be automatically updated every 1 second. The message content will be marked orange if current user is sender, and blue if not. <br/>

## TownsServiceClient API 
* publishAnnouncement(requestData: TownAnnouncementRequest):
  #### send a POST request to '/annouoncement' to send an announcement to backend server <br/>
* sendMessage(requestData: TownSendMessageRequest): 
  #### send a POST request to '/messages' to send a message to  backend server <br/>
* getChatHistory(requestData: TownChatHistoryRequest): 
  #### send a GET request to '/towns/${townID}/messages' to get all the message history in the selected town

## web socket
To enable user receive toast as announcement/ message notification, the socket will listen on 'sendingAnnouncement' and 'playerSendMessage'. Once it was triggered, it will dispatch corresponding actions. 

## appStateReducer
* For 'playerSendAnnouncement' action, send toast to corresponding user in town with announcement content.

## Rationale for code change
#### To enable chat between users, there are 3 options: <br/>
* the first one is sender send message to server, then server distribute announcement/ notification to receiver, both way through socket; <br/>
* the second one is sender send message to server by calling api, then follow option 1 procedure to notify receiver; <br/>
* the third one is sender send message to server by calling api, then server distribute announcement/ notification to receiver through socket. <br/>

![Code Change Rationale](docs/CodeChangeRationale.png)

#### Here we decide to implement the third option. 
* The first option use socket on both way, but is not safe for private message: if malicious user listen to the socket, the private message will be leaked. Also, we want to show the user their chat history, so we make POST/ GET request to server to store/ fetch data in backend, thus we prefer option 2 and 3. <br/>
* The second option might be redundant: after storing message in database, server could directly distribute the notification to receiver. There is no need for the sender to send message to server again. <br/>
* Also, the third option could reuse the code for 'playerSendAnnouncement action' to notify the receiver. <br/>

## Backend
1. Added MongoDB to store chat history for each room.
2. Added services for sending announcements and chat messages.

#### Method to access data using MongoDB Compass
![MongoDB Compass](MongoDBCompass.PNG)

Connection String: `mongodb+srv://yichangliumongodb:123456qaz@cluster0-ozaxq.mongodb.net/test?authSource=admin&replicaSet=Cluster0-shard-0&readPreference=primary&appname=MongoDB%20Compass&ssl=true`

#### Added Restful Endpoints
1. Create a new message for an exisiting room.
   - Method: `Post`
   - Endpoint: `https://cs5500-project.herokuapp.com/messages`
   - Request Body: \
        senderName: `senderName`\
        senderID: `senderID`\
        receiverName: `receiverName`\
        receiverID: `receiverID`\
        roomName: `roomName`\
        roomID: `roomID`\
        content: `content`\
        time: `time`
 2. Retrieve the chat history for a specific town.
     - Method : `Get`
     - Endpoint: `https://cs5500-project.herokuapp.com/towns/:townID/messages`
 3. Create a new announcement for an exisiting room.
     - Method : `Post`
     - Endpoint: `https://cs5500-project.herokuapp.com/announcement`
     - Request Body: \
        coveyTownID: `coveyTownID`\
        coveyTownPassword: `coveyTownPassword`\
        content: `content`
       
#### Added Socket Event Listeners
1. `onMessageAnnounce(notificationRequest :NotificationRequest)` : notify all listeners the new announcement or the new message is sent.

