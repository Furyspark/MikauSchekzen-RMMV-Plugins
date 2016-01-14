var Fenrir = Fenrir || {};
Fenrir.ActorEventSprites = Fenrir.ActorEventSprites || {};

/*:
 * @plugindesc v0.1 Makes it possible to have events look like actors
 * @author FenrirKnight
 *
 * @help
 * ==============================================
 * Introduction
 * ==============================================
 *
 *  In case you need to dynamically set an event's sprite (or face image)
 * to that of an actor (e.g. cutscenes), this will come in handy.
 *
 *
 *
 * ==============================================
 * Plugin commands
 * ==============================================
 *
 * ----------------------------------------------
 * ActorFace x
 * ----------------------------------------------
 *  Replace 'x' with the actor's ID as stated in RPG Maker's database.
 *  This will have the next message command show that actor's
 * face.
 *
 * ----------------------------------------------
 * PartyFace x
 * ----------------------------------------------
 *  Replace 'x' with the party member's index in the party(0 = leader)
 *  This will have the next message command show that actor's
 * face.
 *
 * ----------------------------------------------
 * ActorImage x y
 * ----------------------------------------------
 *  Replace 'x' with the actor's ID as stated in RPG Maker's database.
 *  This will change the event with ID 'y' on the current map change
 * to that actor's image.
 *  If 'y' isn't specified, this will change the calling event's image.
 *
 * ----------------------------------------------
 * PartyImage x y
 * ----------------------------------------------
 *  Replace 'x' with the party member's index in the party(0 = leader)
 *  This will change the event with ID 'y' on the current map change
 * to that actor's image.
 *  If 'y' isn't specified, this will change the calling event's image.
 *
 *
 * ==============================================
 * Event comments
 * ==============================================
 *
 *  You can place these comments anywhere in the event.
 *  They will however not abide things like conditional events.
 * They ARE page-specific, though.
 *
 * ----------------------------------------------
 * <actor sprite: x>
 * ----------------------------------------------
 *  Replace 'x' with the actor's ID as it is stated in RPG Maker's
 * database. This will make the event look like that actor.
 *
 * ----------------------------------------------
 * <party sprite: x>
 * ----------------------------------------------
 *  Replace 'x' with the index of the party member in the party(0 = leader)
 * This will make the event look like that party member.
 */


Fenrir.ActorEventSprites.Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
/**
 * Fires a plugin command
 * @param (string) cmd - The command name
 * @param (array) args - The arguments of the command
 */
Game_Interpreter.prototype.pluginCommand = function(cmd, args) {
  Fenrir.ActorEventSprites.Game_Interpreter_pluginCommand.call(this, cmd, args);
  if(cmd === "ActorFace") {
    var actorId = Number(args[0]);
    var actor = $gameActors.actor(actorId);
    $gameTemp._actorFace = { value: actor.faceName(), index: actor.faceIndex() };
  } else if(cmd === "PartyFace") {
    var index = Number(args[0]);
    var actor = $gameParty.members()[actorId];
    $gameTemp._actorFace = { value: actor.faceName(), index: actor.faceIndex() };
  } else if(cmd === "ActorImage") {
    var actorId = Number(args[0]);
    var actor = $gameActors.actor(actorId);
    var evId = this._eventId;
    if(args.length > 1) evId = Number(args[1]);
    if(actor) $gameMap.event(evId).setImage(actor.characterName(), actor.characterIndex());
  } else if(cmd === "PartyImage") {
    var index = Number(args[0]);
    var actor = $gameParty.members()[index];
    var evId = this._eventId;
    if(args.length > 1) evId = Number(args[1]);
    if(actor) $gameMap.event(evId).setImage(actor.characterName(), actor.characterIndex());
  }
};


Fenrir.ActorEventSprites.Game_Message_setFaceImage = Game_Message.prototype.setFaceImage;
/**
 * Adjusts the message's face
 * @param (string) faceName - The face's filename
 * @param (number) faceIndex - The index of the face in the file
 */
Game_Message.prototype.setFaceImage = function(faceName, faceIndex) {
  Fenrir.ActorEventSprites.Game_Message_setFaceImage.call(this, faceName, faceIndex);
  if($gameTemp._actorFace) {
    this._faceName = $gameTemp._actorFace.value;
    this._faceIndex = $gameTemp._actorFace.index;
    $gameTemp._actorFace = null;
  }
};


Fenrir.ActorEventSprites.Game_Event_setupPageSettings = Game_Event.prototype.setupPageSettings;
/**
 * Sets up the event's image
 * @param (string) charName - The character filename
 * @param (number) charIndex - The character image's index
 */
Game_Event.prototype.setupPageSettings = function() {
  Fenrir.ActorEventSprites.Game_Event_setupPageSettings.call(this);
  var gfx = {};
  var note1 = /<(?:ACTOR SPRITE:[ ]*(\d+))>/i;
  var note2 = /<(?:PARTY SPRITE:[ ]*(\d+))>/i;
  for(var a = 0;a < this.page().list.length;a++) {
    var elem = this.page().list[a];
    if(elem && elem.code === 108) {
      var note = elem.parameters[0];
      if(note.match(note1)) {
        var actorId = Number(RegExp.$1);
        gfx.value = $gameActors.actor(actorId).characterName();
        gfx.index = $gameActors.actor(actorId).characterIndex();
      } else if(note.match(note2)) {
        var index = Number(RegExp.$1);
        gfx.value = $gameParty.members()[index].characterName();
        gfx.index = $gameParty.members()[index].characterIndex();
      }
    }
  }
  if(gfx.value !== undefined && gfx.index !== undefined) this.setImage(gfx.value, gfx.index);
};
