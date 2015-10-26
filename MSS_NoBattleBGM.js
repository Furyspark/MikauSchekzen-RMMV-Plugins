var MikauSchekzen = MikauSchekzen || {};
MikauSchekzen.NoBattleBgm = MikauSchekzen.NoBattleBgm || {};

/*:
@plugindesc Allows the user to disable and enable battle BGM
@author MikauSchekzen

@help
Available plugin commands:
EnableBattleBgm
DisableBattleBgm
ToggleBattleBgm
*/

/*
	gameSystem
*/
MikauSchekzen.NoBattleBgm.gameSystem_initialize =
	Game_System.prototype.initialize;
Game_System.prototype.initialize = function() {
	MikauSchekzen.NoBattleBgm.gameSystem_initialize.call(this);
	this._battleBgmEnabled = true;
};


BattleManager.playBattleBgm = function() {
	if($gameSystem._battleBgmEnabled) {
  	AudioManager.playBgm($gameSystem.battleBgm());
  }
  AudioManager.stopBgs();
};

MikauSchekzen.NoBattleBgm.stopAudioOnBattleStart =
	Scene_Map.prototype.stopAudioOnBattleStart;
Scene_Map.prototype.stopAudioOnBattleStart = function() {
    if($gameSystem._battleBgmEnabled) {
    	MikauSchekzen.NoBattleBgm.stopAudioOnBattleStart.call(this);
    }
};

// Adjust Yanfly's Victory Aftermath processNormalVictory
if(Yanfly && Yanfly.VA) {
	BattleManager.processNormalVictory = function() {
	  if (!$gameSystem.skipVictoryMusic() && $gameSystem._battleBgmEnabled) this.playVictoryMe();
	  this.makeRewards();
	  this.startVictoryPhase();
	};
}
// Adjust default processVictory
else {
	BattleManager.processVictory = function() {
    $gameParty.removeBattleStates();
    $gameParty.performVictory();
    if($gameSystem._battleBgmEnabled) {
	    this.playVictoryMe();
	    this.replayBgmAndBgs();
	  }
    this.makeRewards();
    this.displayVictoryMessage();
    this.displayRewards();
    this.gainRewards();
    this.endBattle(0);
	};
}



// Enable plugin commands
MikauSchekzen.NoBattleBgm.Game_Interpreter_pluginCommand =
	Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
	MikauSchekzen.NoBattleBgm.Game_Interpreter_pluginCommand.call(this, command, args);
	if(command === "EnableBattleBgm")	$gameSystem._battleBgmEnabled = true;
	if(command === "DisableBattleBgm")	$gameSystem._battleBgmEnabled = false;
	if(command === "ToggleBattleBgm")	$gameSystem._battleBgmEnabled = !$gameSystem._battleBgmEnabled;
};