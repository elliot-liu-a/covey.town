import CoveyTownController from './CoveyTownController';
import { CoveyTownList } from '../CoveyTypes';

export interface TownPostMessageRequest {
  senderName: string,
  senderID: string,
  receiverName: string,
  receiverID: string,
  roomName: string,
  roomID: string,
  content: string,
  time: string,
}

function passwordMatches(provided: string, expected: string): boolean {
  if (provided === expected) {
    return true;
  }
  if (process.env.MASTER_TOWN_PASSWORD && process.env.MASTER_TOWN_PASWORD === provided) {
    return true;
  }
  return false;
}

export default class CoveyTownsStore {
  private static _instance: CoveyTownsStore;

  private _towns: CoveyTownController[] = [];

  static getInstance(): CoveyTownsStore {
    if (CoveyTownsStore._instance === undefined) {
      CoveyTownsStore._instance = new CoveyTownsStore();
    }
    return CoveyTownsStore._instance;
  }

  getControllerForTown(coveyTownID: string): CoveyTownController | undefined {
    return this._towns.find(town => town.coveyTownID === coveyTownID);
  }

  getTowns(): CoveyTownList {
    return this._towns.filter(townController => townController.isPubliclyListed)
      .map(townController => ({
        coveyTownID: townController.coveyTownID,
        friendlyName: townController.friendlyName,
        currentOccupancy: townController.occupancy,
        maximumOccupancy: townController.capacity,
      }));
  }

  createTown(friendlyName: string, isPubliclyListed: boolean): CoveyTownController {
    const newTown = new CoveyTownController(friendlyName, isPubliclyListed);
    this._towns.push(newTown);
    return newTown;
  }

  updateTown(coveyTownID: string, coveyTownPassword: string, friendlyName?: string, makePublic?: boolean): boolean {
    const existingTown = this.getControllerForTown(coveyTownID);
    if (existingTown && passwordMatches(coveyTownPassword, existingTown.townUpdatePassword)) {
      if (friendlyName !== undefined) {
        if (friendlyName.length === 0) {
          return false;
        }
        existingTown.friendlyName = friendlyName;
      }
      if (makePublic !== undefined) {
        existingTown.isPubliclyListed = makePublic;
      }
      return true;
    }
    return false;
  }

  deleteTown(coveyTownID: string, coveyTownPassword: string): boolean {
    const existingTown = this.getControllerForTown(coveyTownID);
    if (existingTown && passwordMatches(coveyTownPassword, existingTown.townUpdatePassword)) {
      this._towns = this._towns.filter(town => town !== existingTown);
      existingTown.disconnectAllPlayers();
      return true;
    }
    return false;
  }

  createAnnouncement(coveyTownID: string, coveyTownPassword: string, content: string):boolean {
    const existingTown = this.getControllerForTown(coveyTownID);
    const notificationRequest = {
      coveyTownID,
      content,
      receiverID: 'Everyone',
    };
    if (existingTown && passwordMatches(coveyTownPassword, existingTown.townUpdatePassword)) {
      existingTown.announceToPlayers(notificationRequest);
      return true;
    }
    return false;
  }

  createNotification(message: TownPostMessageRequest ):boolean {
    const existingTown = this.getControllerForTown(message.roomID);
    let content = '';
    if (message.receiverID === 'Everyone') {
      content = `${message.senderName} send you a public message`;
    } else {
      content = `${message.senderName} send you a private message`;
    }
    const notificationRequest = {
      coveyTownID: message.roomID,
      content,
      receiverID: message.receiverID,
    };
    if (existingTown) {
      existingTown.announceToPlayers(notificationRequest);
      return true;
    }
    return false;
  }

}
