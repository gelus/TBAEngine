var G = new TBAEngine();

G.addCondition({
  failText: "You're dead.",
  check: function(){ return !G.dead; }
});

G.addRoom({
  key: "AllyEnd",
  description: "You're in the closed end of an ally.",
  actions: [
    {command: /xyz/, method: function (){
      return "There is a blinding flash.\n" + G.enterRoom(G.rooms.Hell);
    }}
  ]
});

G.addRoom({
  key: "Ally",
  description: "The ally is thin, the exit is blocked."
});

G.addRoom({
  key: "Hell",
  description: "You stand on brimstone and fire.",
  actions: [
    {command: /xyz/, method: function (){
      return "There is a blinding flash.\n" + G.enterRoom(G.rooms.AllyEnd);
    }}
  ]
});

G.rooms.AllyEnd.addExit({
  direction: "north", 
  room: G.rooms.Ally,
  description: "the ally continues north."
});

G.rooms.Ally.addExit({
  direction: "south", 
  room: G.rooms.AllyEnd,
  description: "the ally continues south."
});

G.rooms.AllyEnd.addItem({
  key: "trash",
  accessor: /trash|paper/,
  description: "Trash blows around your feet.",
  detail: function (){
    if (this.game.regExpMatchs.target == "paper") return 'written on it is "The magic word is "XYZ"'
    return "its just some paper.";
  },
  actions: [
    {command: /take/, method: function(){
      if(this.room){
        this.room.takeItem(this);
        return "trash taken";
      }
    }},
    {command: /look/, method: function(){
      console.log(this.room);
    }}
  ]
});

G.rooms.AllyEnd.addItem({
  key: "light",
  description: "A light is mounted on the wall.",
  detail: function(){ return "The light is "+ (this.broken? "broken":this.state)+"." },
  state: "off",
  actions: [
    {command: /look/, method: function(){
      if(this.state == "on" && !this.game.inventory.bug && !this.room.items.bug) {
        this.room.addItem(bug);
        return "A bug is flying near by."
      }
    }}
  ]
});

G.rooms.Ally.addItem({
  key: "switch",
  description: "There is a switch.",
  detail: "It probably controls a light.",
  actions: [
    {command: /use|flip|turn|hit/, method: function(){
      this.game.rooms.AllyEnd.items.light.state = this.game.rooms.AllyEnd.items.light.state === "on"? "off":"on";
      return "You flip the switch " + this.game.rooms.AllyEnd.items.light.state +".";
    }},
  ]
});

G.rooms.AllyEnd.addItem({
  key: "rock",
  description: "A sizeable rock sits on the ground.",
  detail: "It is about the size of two fists.",
  actions: [
    {command: /take/, method: function(){
      if(!this.game.inventory.rock){
        this.room.takeItem(this);
        return "rock taken";
      }
    }},
    {command: /^throw rock(.*)/, method: function(){
      if(this.room) return "You are not holding the rock.";
      var targetText = this.game.regExpMatchs.targetCommand[1];
      var target = this.game.findTarget(targetText);
      this.drop();
      if(target === this.game.currentRoom.items.light){
        this.game.currentRoom.items.light.broken = true;
        return "The rock hits the light. The light shatters.";
      }
      else if(target === demon) {
        return "You throw the rock at the demon. \n"+demon.hitWithRock();
      } 
      else if(targetText.length) return "You throw the rock, and miss.";
      else return "You throw the rock."
    }}
  ]
});

G.rooms.Hell.addItem({
  key: "tablet",
  description: "A tablet juts out of the brimstone.",
  detail: 'The inscriptions reads: "Release it. Like a moth to the flame."'
});

var bug = G.createItem({
  key: "bug",
  accessor: /bug|moth/,
  description: "A bug is flying around.",
  detail: function() {
    if (this.game.regExpMatchs.target[0] == "moth") return "It is pretty big, but otherwise unremarkable";
    return "It seems to be a moth."
  },
  actions: [
    {command: /kill|smash|squish/, method: function(){
      this.room.removeItem(this.key);
      return "You "+this.game.regExpMatchs.targetCommand[0]+" the "+this.game.regExpMatchs.target[0]+" between your palms."
    }},
    {command: /catch|take/, method: function(){
      if(this.room) {
        this.room.takeItem(this);
        return "You catch the bug";
      }
      return "Bug already captured.";
    }},
    {command: /free|release|drop/, method: function(){
      if(!this.game.inventory.bug) return;
      if(this.game.currentRoom === G.rooms.Hell) {
        delete this.game.inventory.bug;
        this.game.currentRoom.addItem(demon);
        return "The moth is drawn to the fire. In a quick flash the moth is burnt up. A demon is drawn to the ashes.";
      }
      this.drop();
      return "You release the bug";
    }}
  ]
});

var demon = G.createItem({
  key: "demon",
  description: "The demon snarls and hisses at you.",
  detail: "It looks dangerous.",
  init: function(){
    var G = this.game;
    this.sneakUpOnYouTimer = setTimeout(function(){
      G.dead = true;
      log("The demon sneaks up behind you and rakes it claws across you throat. It laps up your life blood as it spills from you.", true);
    }, 15000);
  },
  hitWithRock: function(){
    clearTimeout(this.sneakUpOnYouTimer);
    delete this.room.items.demon;
    return "The Demon shrieks and runs away."
  },
  actions: [
    {command: /kill|hit|attack/, method: function(){
      this.game.dead = true;
      return "Your attack fails!\nThe demon jumps on you, clawing your eyes and pulling your throat out with its jaws. It begins eating you before you die.";
    }},
    {command: /take/, method: function(){
      this.game.dead = true;
      return "You tried to <i>take</i> a demon!?\nThe demon snatches your wrist as you reach out and rips your arm from your shoulder.\nThink about what you did while you bleed to death.";
    }},
  ]
});

var input = document.getElementById('Input');
var outputElm = document.getElementById('Output');

function log (c, direct) {
  var output = direct? c:G.input(c)

  var elm = document.createElement('div');

  if (!direct) {
    var inp = document.createElement('p');
    inp.textContent = "> "+c;
    inp.classList.add('input');
    elm.append(inp)
  }

  var oup = document.createElement('p');
  oup.innerHTML = output;
  oup.classList.add('output');
  elm.append(oup)

  outputElm.prepend(elm);
  
  console.warn(c);
  console.log(output);
}

input.onkeyup = function(e){
  if (e.keyCode == 13){
    log(this.value)
    this.select();
  } 
}

log(G.enterRoom(G.rooms.AllyEnd), true);
