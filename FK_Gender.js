var Fenrir = Fenrir || {};
Fenrir.Gender = Fenrir.Gender || {};

/*:
 * @plugindesc v0.1 Adds genders to the game's data
 * @author FenrirKnight
 *
 * @param Male states
 * @desc The state(s) to put on male characters, separated with spaces (" ")
 * @default
 *
 * @param Female states
 * @desc The state(s) to put on female characters, separated with spaces (" ")
 * @default
 *
 * @help
 * ==============================================
 * Introduction
 * ==============================================
 *
 * Adds genders with optional passive states for each gender.
 * Passive states requires Yanfly's Auto Passive States.
 *
 *  The automatic states for genders will only work if you
 * have Yanfly's Auto Passive States plugin installed
 * ABOVE this plugin.
 *
 *
 * ==============================================
 * Note tags
 * ==============================================
 *
 * Actors, Enemies
 * <Gender: x>
 * <Gender: x, x>
 * Where 'x' is either 'male' or 'female' (without quotes).
 * If multiple values are entered, the actor or enemy will
 * start out as a random pick.
 *
 *
 * ==============================================
 * Message characters
 * ==============================================
 *
 * ----------------------------------------------
 * \actgen[x,y,z]
 * ----------------------------------------------
 *  Replace 'x' with the actor ID as it is stated in the database,
 * 'y' with the male variant and 'z' with the female variant.
 *  This will draw the appropriate term for the actor's gender.
 *
 * Examples: \actgen[1,gentleman,lady]  - will draw 'gentleman' if
 *                                        actor 1 is male, or
 *                                        'lady' if female.
 *
 *           \actgen[4,Bastard,Bitch]   - will draw 'Bastard' if
 *                                        actor 4 is male, or
 *                                        'Bitch' if female.
 *
 * ----------------------------------------------
 * \pargen[x,y,z]
 * ----------------------------------------------
 *  Replace 'x' with the index of the wanted party member in the party.
 * 0 is the party leader, 1 is the second member, etc.
 * Replace 'y' with the male variant and 'z' with the female variant.
 *  This will draw the appropriate term for the actor's gender.
 *
 * Examples: \pargen[0,gentleman,lady]  - will draw 'gentleman' if
 *                                        the party leader is male,
 *                                        or 'lady' if female.
 *
 *           \pargen[2,Bastard,Bitch]   - will draw 'Bastard' if
 *                                        the third member is male,
 *                                        or 'Bitch' if female.
 *
 *
 * ==============================================
 * Added methods
 * ==============================================
 *  Use these to check for actors' genders in things like conditional
 * events.
 *
 * ----------------------------------------------
 * actor.isMale()
 * ----------------------------------------------
 *  Returns true if the given actor is male.
 *
 * Examples:   $gameParty.members()[0].isMale()
 *
 * ----------------------------------------------
 * actor.isFemale()
 * ----------------------------------------------
 *  Returns true if the given actor is female.
 *
 * Examples:   $gameActors.actor(3).isFemale()
 */


var temp = PluginManager.parameters("FK_Gender");

Fenrir.Gender.maleStates = temp["Male states"].split(" ");
Fenrir.Gender.maleStates.forEach(function(a, b, arr) {arr[b] = Number(a);});

Fenrir.Gender.femaleStates = temp["Female states"].split(" ");
Fenrir.Gender.femaleStates.forEach(function(a, b, arr) {arr[b] = Number(a);});

delete temp;


Fenrir.Gender.DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
/**
 * Further loads the database
 */
DataManager.isDatabaseLoaded = function() {
  if(!Fenrir.Gender.DataManager_isDatabaseLoaded.call(this)) return false;
  this.processFenrirGenderNotetags1($dataActors);
  this.processFenrirGenderNotetags1($dataEnemies);
  return true;
};

/**
 * Processes the notetags to set initial actors
 */
DataManager.processFenrirGenderNotetags1 = function(group) {
  var note1 = /<(?:GENDER\:[ ](.+))>/i;

  for(var a = 1;a < group.length;a++) {
    var obj = group[a];
    var notedata = obj.note.split(/[\n\r]+/);

    obj._possibleGenders = [];

    for(var b = 0;b < notedata.length;b++) {
      var line = notedata[b];
      if(line.match(note1)) {
        obj._possibleGenders = RegExp.$1.split(/[, ]+/);
      }
    }
  }
};


Fenrir.Gender.Game_Battler_initMembers = Game_Battler.prototype.initMembers;
/**
 * Initializes this batlter's member variables
 */
Game_Battler.prototype.initMembers = function() {
  Fenrir.Gender.Game_Battler_initMembers.call(this);
  this._gender = "";
};

/**
 * Sets this battler's gender
 * @param (string) gender - Battler's new gender
 */
Game_Battler.prototype.setGender = function(gender) {
  this._gender = gender;
  this.refresh();
};

/**
 * Returns this battler's gender
 * @return (string) Battler's gender
 */
Game_Battler.prototype.gender = function() {
  return this._gender;
};

/**
 * Returns whether this battler is male
 * @return (boolean) Whether male
 */
Game_Battler.prototype.isMale = function() {
  return this.gender() === "male";
};

/**
 * Returns whether this battler is female
 * @return (boolean) Whether female
 */
Game_Battler.prototype.isFemale = function() {
  return this.gender() === "female";
};

/**
 * Returns whether this battler is genderless
 * @return (boolean) Whether genderless
 */
Game_Battler.prototype.isGenderless = function() {
  return this.gender() === "";
};


/**
 * Game_Actor
 */

Fenrir.Gender.Game_Actor_setup = Game_Actor.prototype.setup;
/**
 * Sets up the actor
 */
Game_Actor.prototype.setup = function(actorId) {
  Fenrir.Gender.Game_Actor_setup.call(this, actorId);
  var arr = this.actor()._possibleGenders;
  if(arr.length > 0) this.setGender(arr[Math.floor(Math.random() * arr.length)]);
};


/**
 * Game_Enemy
 */

Fenrir.Gender.Game_Enemy_setup = Game_Enemy.prototype.setup;
/**
 * Sets up the actor
 */
Game_Enemy.prototype.setup = function(enemyId, x, y) {
  Fenrir.Gender.Game_Enemy_setup.call(this, enemyId, x, y);
  var arr = this.enemy()._possibleGenders;
  if(arr.length > 0) this.setGender(arr[Math.floor(Math.random() * arr.length)]);
};



if(Imported && Imported.YEP_AutoPassiveStates) {
  Fenrir.Gender.Game_Actor_passiveStatesRaw = Game_Actor.prototype.passiveStatesRaw;
  /**
   * passiveStatesRaw
   */
  Game_Actor.prototype.passiveStatesRaw = function() {
    var arr = Fenrir.Gender.Game_Actor_passiveStatesRaw.call(this);
    if(this.isMale()) {
      arr = arr.concat(Fenrir.Gender.maleStates);
    } else if(this.isFemale()) {
      arr = arr.concat(Fenrir.Gender.femaleStates);
    }
    return arr;
  }

  Fenrir.Gender.Game_Enemy_passiveStatesRaw = Game_Enemy.prototype.passiveStatesRaw;
  /**
   * passiveStatesRaw
   */
  Game_Enemy.prototype.passiveStatesRaw = function() {
    var arr = Fenrir.Gender.Game_Enemy_passiveStatesRaw.call(this);
    if(this.isMale()) {
      arr = arr.concat(Fenrir.Gender.maleStates);
    } else if(this.isFemale()) {
      arr = arr.concat(Fenrir.Gender.femaleStates);
    }
    return arr;
  }
}


/**
 * Window_Base
 */
Fenrir.Gender.Window_Base_convertEscapeCharacters = Window_Base.prototype.convertEscapeCharacters;
/**
 * Converts escape characters.
 * @param (string) text - The text to parse
 * @return (string) The parsed text
 */
Window_Base.prototype.convertEscapeCharacters = function(text) {
  var text = Fenrir.Gender.Window_Base_convertEscapeCharacters.call(this, text);
  text = text.replace(/\x1bACTGEN\[(\d+)\,(.+)\,(.+)\]/gi, function() {
    return this.actorGenderText(parseInt(arguments[1]), arguments[2], arguments[3]);
  }.bind(this));
  text = text.replace(/\x1bPARGEN\[(\d+)\,(.+)\,(.+)\]/gi, function() {
    return this.partyMemberGenderText(parseInt(arguments[1]), arguments[2], arguments[3]);
  }.bind(this));
  return text;
};

/**
 * Returns a term based on gender
 * @param (number) actorId - The actor's ID as stated in the database
 * @param (string) maleTerm - The term returned if male
 * @param (string) femaleTerm - The term returned if female
 */
Window_Base.prototype.actorGenderText = function(actorId, maleTerm, femaleTerm) {
  var actor = $gameActors.actor(actorId);
  if(actor.isMale()) return maleTerm;
  return femaleTerm;
};

/**
 * Returns a term based on gender
 * @param (number) index - The party member's index in the party
 * @param (string) maleTerm - The term returned if male
 * @param (string) femaleTerm - The term returned if female
 */
Window_Base.prototype.partyMemberGenderText = function(index, maleTerm, femaleTerm) {
  var actor = $gameParty.members()[index];
  if(actor) {
    if(actor.isMale()) return maleTerm;
    return femaleTerm;
  }
  return "";
};
