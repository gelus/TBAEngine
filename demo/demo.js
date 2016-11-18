var TBAEngine = require("../dist/TBAEngine.js").default;

var G = new TBAEngine();
  var directionMap = {
    "n": "north",
    "s": "south",
    "w": "west",
    "e": "east"
  }

G.addGlobalCommand({command: /^look\s?(.*)/, method(){
  var query = this.regExpMatchs.command[1];
  var target;

  if(query.length) target = this.findTargets(query);
  else target = [this.currentRoom];

  if(!target.length) return "Nothing interesting";
  else return target.map(t => t.detail || t.getDescription()).join(" ");
}});

G.addGlobalCommand({command: /^(go|g)\s(.*)/, method(){
  var direction = this.regExpMatchs.command[2];
  if(/^[nesw]$/.test(direction)) direction = directionMap[direction];

  for (var key in this.currentRoom.exits) {
    if(this.currentRoom.exits.hasOwnProperty(key)) {
      if(this.currentRoom.exits[key].accessor.test(direction)) return this.enterRoom(this.currentRoom.exits[key].room);
    }
  }

  return this.invalidExit;
}});

G.addGlobalCommand({command: /take\s?(.*)/, method(){
  var target = this.findTarget(this.regExpMatchs.command[1]);
  if(!target || !target.getCommand("take")) return "Cannot take that.";
  else if(!target.room) return target.key+" already taken";
}});

G.addGlobalCommand({command: /^drop\s?(.*)/, method(){
  var query = this.regExpMatchs.command[1];
  var target = this.findTarget(query);
  if(!target) {
    if(!query.length) return "Drop what?";
    else return "You're not carrying that.";
  }
  if(!target.getCommand("drop")) {
    if(!this.inventory[target.key]) return "You're not carrying that.";
    else {
      target.drop();
      return target.key + " dropped.";
    }
  }
}});

G.addGlobalCommand({command: /inventory/, method(){
  return this.inventoryList.length? 
    this.inventoryList.map(e=>this.inventory[e].name).join("\n")
    : this.emptyInventory;
}});

G.addCondition({
  failText: "You're dead.",
  check: function(){ return !G.dead; }
});

G.addRoom({
  key: "AllyEnd",
  description: function(){
    var extra = this.items.light.state == "on" ? " The ally is bathed in light.":"";
    return "You're in the closed end of an ally." + extra;
  },
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
  key: "north", 
  room: G.rooms.Ally,
  description: "the ally continues north."
});

G.rooms.Ally.addExit({
  key: "south", 
  room: G.rooms.AllyEnd,
  description: "the ally continues south."
});

G.rooms.AllyEnd.addItem({
  key: "trash",
  accessor: /trash|paper/,
  description: "Trash blows around your feet.",
  detail: function (){
    if (this.game.regExpMatchs.command[1] == "paper") return 'written on it is "The magic word is "XYZ"'
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

G.rooms.Ally.addItem({
  key: "rock",
  description: "A sizeable rock sits on the ground.",
  detail: "It is about the size of two fists.",
  actions: [
    {command: /take/, method: function(){
      if(this.room){
        this.room.takeItem(this);
        return "rock taken";
      }
    }},
    {command: /^throw rock(.*)/, method: function(){
      if(this.room) return "You are not holding the rock.";
      var targetText = this.regExpMatchs.command[1];
      var target = this.game.findTarget(targetText);
      this.drop();
      if(target && target === this.game.currentRoom.items.light){
        this.game.currentRoom.items.light.broken = true;
        return "The rock hits the light. The light shatters.";
      }
      else if(target === demon) {
        return "You throw the rock at the demon. \n"+demon.hitWithRock();
      } 
      else return "You throw the rock."
    }}
  ]
});

var stickDescriptor = {
  key: "sticks",
  name: function (){
    return this.amount > 1? this.amount+" sticks": "A stick";
  },
  accessor: /stick(s?)/,
  description: "There is a pile of sticks in the corner.",
  detail: function(){
    return (this.room? "There are ":"You have ")+this.amount+" sticks.";
  },
  amount: 10,
  actions: [
    {command: /take/, method: function(){
      if(this.room){
        if(!this.game.inventory.sticks) {
          this.game.inventory.sticks = G.createItem(stickDescriptor);
          this.game.inventory.sticks.amount = 0;
        }
        this.amount--;
        this.game.inventory.sticks.amount++;
        if(this.amount <= 0) delete this.room.items.sticks;
        return "You grab a stick.";
      }
    }},
    {command: /drop/, method: function(){
      if(!this.room){
        if(!this.game.currentRoom.items.sticks){
          this.game.currentRoom.addItem(stickDescriptor);
          this.game.currentRoom.items.sticks.amount = 0;
        }
        this.amount--;
        this.game.currentRoom.items.sticks.amount++;
        if(this.amount <= 0) delete this.game.inventory.sticks;
        return "You drop a stick.";
      }
    }}
  ]
}

G.rooms.AllyEnd.addItem(stickDescriptor);

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
    if (this.game.regExpMatchs.command[1] == "moth") return "It is pretty big, but otherwise unremarkable";
    return "It seems to be a moth."
  },
  actions: [
    {command: /kill|smash|squish/, method: function(){
      this.room.removeItem(this.key);
      return "You "+this.regExpMatchs.command[0]+" the "+this.regExpMatchs.target[0]+" between your palms."
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
    elm.appendChild(inp)
  }

  var oup = document.createElement('p');
  oup.innerHTML = output;
  oup.classList.add('output');
  elm.appendChild(oup)

  outputElm.insertBefore(elm, outputElm.firstChild);
  
  console.warn(c);
  console.log(output);
}

input.onkeyup = function(e) {
  if (e.keyCode == 13){
    log(this.value)
    this.select();
  } 
}

log(G.enterRoom(G.rooms.AllyEnd), true);
