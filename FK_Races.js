var Fenrir = Fenrir || {};
Fenrir.Races = Fenrir.Races || {};

/*:
 * @plugindesc v0.1 Adds races and race-specific properties to RMMV
 * @author FenrirKnight
 *
 * @help
 * ==============================================
 * Introduction
 * ==============================================
 *
 * This plugin adds races and race specific options
 * to RPG Maker MV.
 *
 * This requires you to have some knowledge of the
 * JSON notation, for it requires you to create
 * a file called Races.json in your game's
 * data folder.
 *
 *  The automatic states for races will only work if you
 * have Yanfly's Auto Passive States plugin installed
 * ABOVE this plugin.
 *
 *
 * ==============================================
 * Note tags
 * ==============================================
 *
 * Actors, Enemies
 * ----------------------------------------------
 * <Race: x>
 * ----------------------------------------------
 * Where 'x' is the race's key, as you entered it in Races.json
 * This will set the actor or enemy's (default) race.
 *
 *
 * ==============================================
 * Message characters
 * ==============================================
 *
 * ----------------------------------------------
 * \ar[x,y]
 * ----------------------------------------------
 *  Replace 'x' with the actor ID as it is stated in the database,
 * and replace 'y' with either 'N' for Noun, 'P' for Plural or
 * 'A' for Adjective.
 *  This will draw the given actor's appropriate race word.
 *
 * ----------------------------------------------
 * \arl[x,y]
 * ----------------------------------------------
 *  Replace 'x' with the actor ID as it is stated in the database,
 * and replace 'y' with either 'N' for Noun, 'P' for Plural or
 * 'A' for Adjective.
 *  This will draw the given actor's appropriate race word in
 * LOWER CASE.
 *
 * ----------------------------------------------
 * \pr[x,y]
 * ----------------------------------------------
 *  Replace 'x' with the index of the given party member (0 is the leader)
 * and replace 'y' with either 'N' for Noun, 'P' for Plural or
 * 'A' for Adjective.
 *  This will draw the given actor's appropriate race word.
 *
 * ----------------------------------------------
 * \prl[x,y]
 * ----------------------------------------------
 *  Replace 'x' with the index of the given party member (0 is the leader)
 * and replace 'y' with either 'N' for Noun, 'P' for Plural or
 * 'A' for Adjective.
 *  This will draw the given actor's appropriate race word in
 * LOWER CASE.
 *
 *
 * ==============================================
 * Added methods
 * ==============================================
 *  Use these to check for actors' races in things like conditional
 * events.
 *
 * ----------------------------------------------
 * actor.raceName()
 * ----------------------------------------------
 * Returns the actor's race name(key) as specified in RAces.json
 *
 * Examples:   $gameParty.members()[0].raceName() === "drow"
 *             $gameActors.actor(1).raceName() !== "orc"
 */

var $dataRaces = null;

DataManager._databaseFiles.push(
  { name: "$dataRaces", src: "Races.json" }
);



Fenrir.Races.DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
/**
 * Further loads the database
 */
DataManager.isDatabaseLoaded = function() {
  if(!Fenrir.Races.DataManager_isDatabaseLoaded.call(this)) return false;
  this.processFenrirRacesNotetags1($dataActors);
  this.processFenrirRacesNotetags1($dataEnemies);
  return true;
};

/**
 * Processes the notetags to set initial actors
 */
DataManager.processFenrirRacesNotetags1 = function(group) {
  var note1 = /<(?:RACE\:[ ](.+))>/i;

  for(var a = 1;a < group.length;a++) {
    var obj = group[a];
    var notedata = obj.note.split(/[\n\r]+/);

    obj._race = "";

    for(var b = 0;b < notedata.length;b++) {
      var line = notedata[b];
      if(line.match(note1)) {
        obj._race = RegExp.$1;
      }
    }
  }
};


/**
 * Window_Base
 */
Fenrir.Races.Window_Base_convertEscapeCharacters = Window_Base.prototype.convertEscapeCharacters;
/**
 * Converts escape characters.
 * @param (string) text - The text to parse
 * @return (string) The parsed text
 */
Window_Base.prototype.convertEscapeCharacters = function(text) {
  var text = Fenrir.Races.Window_Base_convertEscapeCharacters.call(this, text);
  text = text.replace(/\x1bAR\[(\d+)\,([ANP])\]/gi, function() {
    return this.actorRaceText(parseInt(arguments[1]), arguments[2], false);
  }.bind(this));
  text = text.replace(/\x1bARL\[(\d+)\,([ANP])\]/gi, function() {
    return this.actorRaceText(parseInt(arguments[1]), arguments[2], true);
  }.bind(this));
  text = text.replace(/\x1bPR\[(\d+)\,([ANP])\]/gi, function() {
    return this.partyMemberRaceText(parseInt(arguments[1]), arguments[2], false);
  }.bind(this));
  text = text.replace(/\x1bPRL\[(\d+)\,([ANP])\]/gi, function() {
    return this.partyMemberRaceText(parseInt(arguments[1]), arguments[2], true);
  }.bind(this));
  return text;
};

/**
 * Escapes an actor's race text
 * @param (number) actorId - The actor's ID as in the database
 * @param (string) element - Either 'N' for Noun, 'P' for Plural or 'A' for Adjective
 * @param (boolean) toLowerCase - Whether to convert the bit of text to lower case
 * @return (string) The escaped bit of text
 */
Window_Base.prototype.actorRaceText = function(actorId, element, toLowerCase) {
  var race = $gameActors.actor(actorId).race();
  var raceKey = "";
  if(race && race.key) raceKey = race.key;
  var str = this.getRaceText(raceKey, element);
  if(toLowerCase) str = str.toLowerCase();
  return str;
};

/**
 * Escapes a party member's race text
 * @param (number) index - The party member's index in the party
 * @param (string) element - Either 'N' for Noun, 'P' for Plural or 'A' for Adjective
 * @param (boolean) toLowerCase - Whether to convert the bit of text to lower case
 * @return (string) The escaped bit of text
 */
Window_Base.prototype.partyMemberRaceText = function(index, element, toLowerCase) {
  var actor = $gameParty.members()[index];
  var race = $dataRaces[0];
  if(actor && actor.race()) race = actor.race();
  var raceKey = "";
  if(race && race.key) raceKey = race.key;
  var str = this.getRaceText(raceKey, element);
  if(toLowerCase) str = str.toLowerCase();
  return str;
};

/**
 * Returns a text value from a race
 * @param (string) key - The race's key
 * @param (string) element - Either 'N' for Noun, 'P' for Plural or 'A' for Adjective
 * @return (string) The text value
 */
Window_Base.prototype.getRaceText = function(key, element) {
  var elem = "noun";
  if(element.toLowerCase() === "p") elem = "plural";
  if(element.toLowerCase() === "a") elem = "adjective";
  for(var a = 0;a < $dataRaces.length;a++) {
    var obj = $dataRaces[a];
    if(obj.key == key && obj.text[elem]) return obj.text[elem];
  }
  return "";
};


Fenrir.Races.Game_Battler_initMembers = Game_Battler.prototype.initMembers;
/**
 * Initializes this object's member variables
 */
Game_Battler.prototype.initMembers = function() {
  Fenrir.Races.Game_Battler_initMembers.call(this);
  this._race = "";
};

/**
 * Returns this battler's race name
 */
Game_Battler.prototype.raceName = function() {
  return this._race;
};

/**
 * Returns this battler's race object
 */
Game_Battler.prototype.race = function() {
  for(var a = 0;a < $dataRaces.length;a++) {
    // console.log(this._race);
    if($dataRaces[a].key == this.raceName()) {
      return $dataRaces[a];
    }
  }
  return null;
};

/**
 * Sets this battler's race
 * @param (string) raceKey - The key (as per Races.json) of the race to change to
 */
Game_Battler.prototype.setRace = function(raceKey) {
  this._race = raceKey;
  this.refresh();
};


/**
 * Game_Actor
 */

Fenrir.Races.Game_Actor_setup = Game_Actor.prototype.setup;
/**
 * Sets up the actor
 */
Game_Actor.prototype.setup = function(actorId) {
  Fenrir.Races.Game_Actor_setup.call(this, actorId);
  if(this.actor()._race !== "") this.setRace(this.actor()._race);
};


/**
 * Game_Enemy
 */

Fenrir.Races.Game_Enemy_setup = Game_Enemy.prototype.setup;
/**
 * Sets up the enemy
 */
Game_Enemy.prototype.setup = function(enemyId, x, y) {
  Fenrir.Races.Game_Enemy_setup.call(this, enemyId, x, y);
  if(this.enemy()._race !== "") this.setRace(this.enemy()._race);
};



if(Imported && Imported.YEP_AutoPassiveStates) {
  Fenrir.Races.Game_Actor_passiveStatesRaw = Game_Actor.prototype.passiveStatesRaw;
  /**
   * passiveStatesRaw
   */
  Game_Actor.prototype.passiveStatesRaw = function() {
    var arr = Fenrir.Races.Game_Actor_passiveStatesRaw.call(this);
    var race = this.race();
    if(race) arr = arr.concat(race.states);
    return arr;
  }

  Fenrir.Races.Game_Enemy_passiveStatesRaw = Game_Enemy.prototype.passiveStatesRaw;
  /**
   * passiveStatesRaw
   */
  Game_Enemy.prototype.passiveStatesRaw = function() {
    var arr = Fenrir.Races.Game_Enemy_passiveStatesRaw.call(this);
    var race = this.race();
    if(race) arr = arr.concat(race.states);
    return arr;
  }
}
