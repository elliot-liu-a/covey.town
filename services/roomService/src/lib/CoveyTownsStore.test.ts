import {nanoid} from 'nanoid';
import CoveyTownsStore from './CoveyTownsStore';
import CoveyTownListener from '../types/CoveyTownListener';
import Player from '../types/Player';
import {NotificationRequest} from '../types/NotificationRequest';

const mockCoveyListenerTownDestroyed = jest.fn();
const mockCoveyListenerOtherFns = jest.fn();

function mockCoveyListener(): CoveyTownListener {
  return {
    onMessageNotify(notificationRequest: NotificationRequest): void {
      mockCoveyListenerOtherFns(notificationRequest);
    },
    onPlayerDisconnected(removedPlayer: Player): void {
      mockCoveyListenerOtherFns(removedPlayer);
    },
    onPlayerMoved(movedPlayer: Player): void {
      mockCoveyListenerOtherFns(movedPlayer);
    },
    onTownDestroyed() {
      mockCoveyListenerTownDestroyed();
    },
    onPlayerJoined(newPlayer: Player) {
      mockCoveyListenerOtherFns(newPlayer);
    },
  };
}

function createTownForTesting(friendlyNameToUse?: string, isPublic = false) {
  const friendlyName = friendlyNameToUse !== undefined ? friendlyNameToUse :
    `${isPublic ? 'Public' : 'Private'}TestingTown=${nanoid()}`;
  return CoveyTownsStore.getInstance()
    .createTown(friendlyName, isPublic);
}

describe('CoveyTownsStore', () => {
  beforeEach(() => {
    mockCoveyListenerTownDestroyed.mockClear();
    mockCoveyListenerOtherFns.mockClear();
  });
  it('should be a singleton', () => {
    const store1 = CoveyTownsStore.getInstance();
    const store2 = CoveyTownsStore.getInstance();
    expect(store1)
      .toBe(store2);
  });

  describe('createTown', () => {
    it('Should allow multiple towns with the same friendlyName', () => {
      const firstTown = createTownForTesting();
      const secondTown = createTownForTesting(firstTown.friendlyName);
      expect(firstTown)
        .not
        .toBe(secondTown);
      expect(firstTown.friendlyName)
        .toBe(secondTown.friendlyName);
      expect(firstTown.coveyTownID)
        .not
        .toBe(secondTown.coveyTownID);
    });
  });

  describe('getControllerForTown', () => {
    it('Should return the same controller on repeated calls', async () => {
      const firstTown = createTownForTesting();
      expect(firstTown)
        .toBe(CoveyTownsStore.getInstance()
          .getControllerForTown(firstTown.coveyTownID));
      expect(firstTown)
        .toBe(CoveyTownsStore.getInstance()
          .getControllerForTown(firstTown.coveyTownID));
    });
  });

  describe('updateTown', () => {
    it('Should check the password before updating any value', () => {
      const town = createTownForTesting();
      const {friendlyName} = town;
      const res = CoveyTownsStore.getInstance()
        .updateTown(town.coveyTownID, 'abcd', 'newName', true);
      expect(res)
        .toBe(false);
      expect(town.friendlyName)
        .toBe(friendlyName);
      expect(town.isPubliclyListed)
        .toBe(false);

    });
    it('Should fail if the townID does not exist', async () => {
      const town = createTownForTesting();
      const {friendlyName} = town;

      const res = CoveyTownsStore.getInstance()
        .updateTown('abcdef', town.townUpdatePassword, 'newName', true);
      expect(res)
        .toBe(false);
      expect(town.friendlyName)
        .toBe(friendlyName);
      expect(town.isPubliclyListed)
        .toBe(false);

    });
    it('Should update the town parameters', async () => {

      // First try with just a visiblity change
      const town = createTownForTesting();
      const {friendlyName} = town;
      const res = CoveyTownsStore.getInstance()
        .updateTown(town.coveyTownID, town.townUpdatePassword, undefined, true);
      expect(res)
        .toBe(true);
      expect(town.isPubliclyListed)
        .toBe(true);
      expect(town.friendlyName)
        .toBe(friendlyName);

      // Now try with just a name change
      const newFriendlyName = nanoid();
      const res2 = CoveyTownsStore.getInstance()
        .updateTown(town.coveyTownID, town.townUpdatePassword, newFriendlyName, undefined);
      expect(res2)
        .toBe(true);
      expect(town.isPubliclyListed)
        .toBe(true);
      expect(town.friendlyName)
        .toBe(newFriendlyName);

      // Now try to change both
      const res3 = CoveyTownsStore.getInstance()
        .updateTown(town.coveyTownID, town.townUpdatePassword, friendlyName, false);
      expect(res3)
        .toBe(true);
      expect(town.isPubliclyListed)
        .toBe(false);
      expect(town.friendlyName)
        .toBe(friendlyName);
    });
  });

  describe('deleteTown', () => {
    it('Should check the password before deleting the town', () => {
      const town = createTownForTesting();
      const res = CoveyTownsStore.getInstance()
        .deleteTown(town.coveyTownID, `${town.townUpdatePassword}*`);
      expect(res)
        .toBe(false);
    });
    it('Should fail if the townID does not exist', async () => {
      const res = CoveyTownsStore.getInstance()
        .deleteTown('abcdef', 'efg');
      expect(res)
        .toBe(false);
    });
    it('Should disconnect all players', async () => {
      const town = createTownForTesting();
      town.addTownListener(mockCoveyListener());
      town.addTownListener(mockCoveyListener());
      town.addTownListener(mockCoveyListener());
      town.addTownListener(mockCoveyListener());
      town.disconnectAllPlayers();

      expect(mockCoveyListenerOtherFns.mock.calls.length)
        .toBe(0);
      expect(mockCoveyListenerTownDestroyed.mock.calls.length)
        .toBe(4);
    });
  });

  describe('listTowns', () => {
    it('Should include public towns', async () => {
      const town = createTownForTesting(undefined, true);
      const towns = CoveyTownsStore.getInstance()
        .getTowns();
      const entry = towns.filter(townInfo => townInfo.coveyTownID === town.coveyTownID);
      expect(entry.length)
        .toBe(1);
      expect(entry[0].friendlyName)
        .toBe(town.friendlyName);
      expect(entry[0].coveyTownID)
        .toBe(town.coveyTownID);
    });
    it('Should include each CoveyTownID if there are multiple towns with the same friendlyName', async () => {
      const town = createTownForTesting(undefined, true);
      const secondTown = createTownForTesting(town.friendlyName, true);
      const towns = CoveyTownsStore.getInstance()
        .getTowns()
        .filter(townInfo => townInfo.friendlyName === town.friendlyName);
      expect(towns.length)
        .toBe(2);
      expect(towns[0].friendlyName)
        .toBe(town.friendlyName);
      expect(towns[1].friendlyName)
        .toBe(town.friendlyName);

      if (towns[0].coveyTownID === town.coveyTownID) {
        expect(towns[1].coveyTownID)
          .toBe(secondTown.coveyTownID);
      } else if (towns[1].coveyTownID === town.coveyTownID) {
        expect(towns[0].coveyTownID)
          .toBe(town.coveyTownID);
      } else {
        fail('Expected the coveyTownIDs to match the towns that were created');
      }

    });
    it('Should not include private towns', async () => {
      const town = createTownForTesting(undefined, false);
      const towns = CoveyTownsStore.getInstance()
        .getTowns()
        .filter(townInfo => townInfo.friendlyName === town.friendlyName || townInfo.coveyTownID === town.coveyTownID);
      expect(towns.length)
        .toBe(0);
    });
    it('Should not include private towns, even if there is a public town of same name', async () => {
      const town = createTownForTesting(undefined, false);
      const town2 = createTownForTesting(town.friendlyName, true);
      const towns = CoveyTownsStore.getInstance()
        .getTowns()
        .filter(townInfo => townInfo.friendlyName === town.friendlyName || townInfo.coveyTownID === town.coveyTownID);
      expect(towns.length)
        .toBe(1);
      expect(towns[0].coveyTownID)
        .toBe(town2.coveyTownID);
      expect(towns[0].friendlyName)
        .toBe(town2.friendlyName);
    });
    it('Should not include deleted towns', async () => {
      const town = createTownForTesting(undefined, true);
      const towns = CoveyTownsStore.getInstance()
        .getTowns()
        .filter(townInfo => townInfo.friendlyName === town.friendlyName || townInfo.coveyTownID === town.coveyTownID);
      expect(towns.length)
        .toBe(1);
      const res = CoveyTownsStore.getInstance()
        .deleteTown(town.coveyTownID, town.townUpdatePassword);
      expect(res)
        .toBe(true);
      const townsPostDelete = CoveyTownsStore.getInstance()
        .getTowns()
        .filter(townInfo => townInfo.friendlyName === town.friendlyName || townInfo.coveyTownID === town.coveyTownID);
      expect(townsPostDelete.length)
        .toBe(0);
    });
  });

  // Newly added test for createAnnouncement function
  describe('createAnnouncement', () => {
    it('Should check the password before publishing any announcement', () => {
      const town = createTownForTesting();
      const {friendlyName} = town;
      const res1 = CoveyTownsStore.getInstance()
        .createAnnouncement(town.coveyTownID, nanoid(), 'newAnnouncement');
      const res2 = CoveyTownsStore.getInstance()
        .createAnnouncement(town.coveyTownID, town.townUpdatePassword, 'newAnnouncement');
      expect(res1)
        .toBe(false);
      expect(res2)
        .toBe(true);
      expect(town.friendlyName)
        .toBe(friendlyName);
    });
    it('Should send announcement to all listeners', async () => {
      const town = createTownForTesting();
      const newAnnouncement1 = {
        coveyTownID: town.coveyTownID,
        content:'testAnnoucement1',
        receiverID: 'Everyone',
      };
      const newAnnouncement2 = {
        coveyTownID: town.coveyTownID,
        content:'testAnnoucement2',
        receiverID: 'Everyone',
      };
      town.addTownListener(mockCoveyListener());
      town.addTownListener(mockCoveyListener());
      town.addTownListener(mockCoveyListener());
      town.addTownListener(mockCoveyListener());
      town.notificationToPlayers(newAnnouncement1);
      town.notificationToPlayers(newAnnouncement2);

      expect(mockCoveyListenerOtherFns.mock.calls.length)
        .toBe(8);
      expect(mockCoveyListenerTownDestroyed.mock.calls.length)
        .toBe(0);
    });
    it('Should send announcements with correct contents', async () => {
      const town = createTownForTesting();
      const newAnnouncement1 = {
        coveyTownID: town.coveyTownID,
        content:'testAnnoucement1',
        receiverID: 'Everyone',
      };
      const newAnnouncement2 = {
        coveyTownID: town.coveyTownID,
        content:'testAnnoucement2',
        receiverID: 'Everyone',
      };
      town.addTownListener(mockCoveyListener());
      town.notificationToPlayers(newAnnouncement1);
      town.notificationToPlayers(newAnnouncement2);
      expect(mockCoveyListenerOtherFns.mock.calls[0][0])
        .toBe(newAnnouncement1);
      expect(mockCoveyListenerOtherFns.mock.calls[1][0])
        .toBe(newAnnouncement2);
    });
  });


  // Newly added test for createNotification function
  describe('createNotification', () => {
    it('Should send notification to all listeners', async () => {
      const town = createTownForTesting();
      const newMessage1 = {
        senderName: 'testSender1',
        senderID: `senderID-${nanoid()}`,
        receiverName: 'testReceiver1',
        receiverID: `receiverID-${nanoid()}`,
        roomName: 'testRoom',
        roomID: town.coveyTownID,
        content: 'Hello',
        time: 'Sun Apr 04 2021 18:25:57',
      };
      const newMessage2 = {
        senderName: 'testSender2',
        senderID: `senderID-${nanoid()}`,
        receiverName: 'testReceiver2',
        receiverID: `receiverID-${nanoid()}`,
        roomName: 'testRoom',
        roomID: town.coveyTownID,
        content: 'Hello',
        time: 'Sun Apr 04 2021 18:25:57',
      };
      town.addTownListener(mockCoveyListener());
      town.addTownListener(mockCoveyListener());
      town.addTownListener(mockCoveyListener());
      town.addTownListener(mockCoveyListener());
      CoveyTownsStore.getInstance()
        .createNotification(newMessage1);
      CoveyTownsStore.getInstance()
        .createNotification(newMessage2);
      expect(mockCoveyListenerOtherFns.mock.calls.length)
        .toBe(8);
      expect(mockCoveyListenerTownDestroyed.mock.calls.length)
        .toBe(0);
    });
    it('Should send notification with correct contents and receiverID', async () => {
      const town = createTownForTesting();
      const newMessage1 = {
        senderName: 'testSender1',
        senderID: `senderID-${nanoid()}`,
        receiverName: 'testReceiver1',
        receiverID: 'Everyone',
        roomName: 'testRoom',
        roomID: town.coveyTownID,
        content: 'Hello to every one!',
        time: 'Sun Apr 04 2021 18:25:57',
      };
      const newMessage2 = {
        senderName: 'testSender2',
        senderID: `senderID-${nanoid()}`,
        receiverName: 'testReceiver2',
        receiverID: 'receiver-123',
        roomName: 'testRoom',
        roomID: town.coveyTownID,
        content: 'Hello to receiver-123',
        time: 'Sun Apr 04 2021 18:25:57',
      };
      const newNotification1 = {
        coveyTownID: town.coveyTownID,
        content:'Notification: testSender1 send you a public message',
        receiverID: 'Everyone',
      };
      const newNotification2  = {
        coveyTownID: town.coveyTownID,
        content:'Notification: testSender2 send you a private message',
        receiverID: 'receiver-123',
      };
      town.addTownListener(mockCoveyListener());
      CoveyTownsStore.getInstance()
        .createNotification(newMessage1);
      CoveyTownsStore.getInstance()
        .createNotification(newMessage2);
      expect(mockCoveyListenerOtherFns.mock.calls[0][0])
        .toStrictEqual(newNotification1);
      expect(mockCoveyListenerOtherFns.mock.calls[1][0])
        .toStrictEqual(newNotification2);
    });
  });
});

