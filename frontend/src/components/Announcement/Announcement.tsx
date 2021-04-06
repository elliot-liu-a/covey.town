import { Button, Input, useToast } from '@chakra-ui/react';
import React, { useState } from 'react';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';
import useCoveyAppState from '../../hooks/useCoveyAppState';
import '../Chat/ChatPanel.css';


export default function Announcement(): JSX.Element {
    const toast = useToast();
    const { apiClient, currentTownID} = useCoveyAppState();
    const [announcement, setAnnouncement] = useState<string>('');
    const [password, setPassword] = useState<string>('');

    const publishHandler = async () => {
        try {          
         await apiClient.publishAnnouncement({coveyTownID:currentTownID,coveyTownPassword:password, content: announcement});
          toast({
            title: 'Announcement published',
            status: 'success'
          })
        } catch (err) {
          toast({
            title: 'Unable to publish announcement',
            description: err.toString(),
            status: 'error'
          })
        }
      }

    return (
      <div className="Announcement-button">
        <Popup contentStyle={{width: "50%"}} trigger={<Button style = {{color: "green", backgroundColor: "#a3d3ca", border: "1px solid #34aca4"}} value="trigger"> Publish an Announcement</Button>} position="bottom center">
          <div>
            <Input
                  id='Announcement'
                  placeholder="Announcement"
                  name="announcement"
                  type='text'
                  pattern="[^\s]+"
                  value={announcement}
                  onChange={(event => setAnnouncement(event.target.value))}
                />
            <Input
                    id='Password'
                    placeholder="Password"
                    name="password"
                    type='text'
                    value={password}
                    onChange={(event => setPassword(event.target.value))}
                  />
            <Button data-testid='publishbutton'
                    colorScheme="blue"
                    mr={3}
                    value="publish"
                    onClick={publishHandler}>Publish Announcement</Button>
          </div>
        </Popup>
      </div>
    );
  }