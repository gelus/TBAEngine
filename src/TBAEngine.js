(function(){
  var directionMap = {
    "n": "north",
    "s": "south",
    "w": "west",
    "e": "east"
  }

  window.TBAEngine = function TBAEngine(){

    this.currentRoom = null;
    this.rooms = {};
    this.inventory = {};
    this.invalidCommand = "Invalid Command";
    this.emptyInventory = "Empy inventory";
    this.regExpMatchs = {};
    this.conditions = [];

  }

  TBAEngine.prototype = {

    input(input) {
      var ret = [];
      var output;

      for (var i = 0, l = this.conditions.length; i < l; i++) {
        var condition = this.conditions[i];
        if(!condition.check.call(this)) ret.push(condition.failText);
      }
      if(ret.length) return ret.join(" ");


      var input = input.toLocaleLowerCase();
      var globalCommand = this.globalCommands[this.globalCommands.findIndex(e=>e.command.test(input))];
      var roomCommand = this.currentRoom.actions? this.currentRoom.actions[this.currentRoom.actions.findIndex(e=>e.command.test(input))]:undefined;
      var target = this.findTarget(input);
      var targetCommand = target && target.getCommand(input);

      this.regExpMatchs.globalCommand = globalCommand? globalCommand.command.exec(input):null;
      this.regExpMatchs.roomCommand = roomCommand? roomCommand.command.exec(input):null;
      this.regExpMatchs.target = target? target.accessor.exec(input):null;
      this.regExpMatchs.targetCommand = targetCommand? targetCommand.command.exec(input):null;

      if(globalCommand) ret.push(globalCommand.method.call(this, target));
      if(roomCommand) ret.push(roomCommand.method.call(this.currentRoom));
      if(targetCommand) ret.push(targetCommand.method.call(target));

      var output = ret.filter(function(n){ return !!n }).join(" ");
      return output.length? output:this.invalidCommand;
    },

    addCondition(condition) {
      this.conditions.push(condition);
    },

    addRoom(descriptor) {
      this.rooms[descriptor.title] = new Room(descriptor, this);
    },

    findTarget(input) {
      var targetKey = this.currentRoom.itemList[this.currentRoom.itemList.findIndex(function(e){
        return this.items[e].accessor.test(input);
      }.bind(this.currentRoom))];

      if(targetKey) return this.currentRoom.items[targetKey];

      var targetKey = this.inventoryList[this.inventoryList.findIndex(function(e){
        return this.inventory[e].accessor.test(input);
      }.bind(this))];
      return this.inventory[targetKey];
    },

    enterRoom(room){
      this.currentRoom = room;
      return room.getDescription();
    },

    dropItem(item){
      if(this.inventory[item.key]){
        this.currentRoom.addItem(item);
        delete this.inventory[item.key]; 
      }
    },

    globalCommands : [
      {command: /^look(.*)/, method(target){
        if(!target) {
          var query = this.regExpMatchs.globalCommand[1].trim();
          if(query.length) return "Nothing interesting";
          else target = this.currentRoom;
        }
        return target.detail || target.getDescription();
      }},
      {command: /^(go|g)\s(.*)/, method(){
        var direction = this.regExpMatchs.globalCommand[2];
        if(/^[nesw]$/.test(direction)) direction = directionMap[direction];

        for (var key in this.currentRoom.exits) {
          if(this.currentRoom.exits.hasOwnProperty(key)) {
            if(this.currentRoom.exits[key].accessor.test(direction)) return this.enterRoom(this.currentRoom.exits[key].room);
          }
        }

        return "Cannot go there.";
      }},
      {command: /take/, method(target){
        if(!target || !target.getCommand("take")) return "Cannot take that.";
        if(this.inventory[target.key]) return target.key+" already taken";
      }},
      {command: /^drop(.*)/, method(target){
        if(!target) {
          var query = this.regExpMatchs[1].trim();
          if(!query.length) return "Drop what?";
          else return "You're not carrying that.";
        }
        if(!target.getCommand("drop")) {
          if(!this.inventory[target.key]) return "You're not carrying that.";
          else {
            this.dropItem(target);
            return target.key + " dropped.";
          }
        }
      }},
      {command: /inventory/, method(){
        return this.inventoryList.length? this.inventoryList.join("\n"): this.emptyInventory;
      }}
    ]

  };

  Object.defineProperty(TBAEngine.prototype, "inventoryList", {
    get(){return Object.keys(this.inventory)}
  });



  // Room construction -------------

  function Room(descriptor, game) {
    Object.assign(this, descriptor);
    this.items = {};
    this.exits = {};
    this.game = game || null;
  }

  Room.prototype = {

    addItem(descriptor) {
      this.items[descriptor.key] = descriptor instanceof Item? descriptor:new Item(descriptor, this, this.game);
      this.items[descriptor.key].room = this;
      if(descriptor.init) descriptor.init.call(this.items[descriptor.key]);
    },

    addExit(discriptor) {
      var key = discriptor.direction.toLocaleLowerCase()
      this.exits[key] = discriptor;
      this.exits[key].accessor = this.exits[key].accessor || new RegExp(key);
    },

    takeItem(item) {
      this.game.inventory[item.key] = item;
      delete item.room;
      this.removeItem(item.key);
    },

    removeItem(key) {
      delete this.items[key];
    },

    getDescription(){
      var ret = [this.description];
      ret = ret.concat(this.itemList.map(x=>this.items[x].description));
      ret = ret.concat(this.exitList.map(x=>this.exits[x].description));
      return ret.join(" ");
    }

  };

  Object.defineProperty(Room.prototype, 'itemList', {
    get(){ return Object.keys(this.items); }
  });

  Object.defineProperty(Room.prototype, 'exitList', {
    get(){ return Object.keys(this.exits); }
  });


  // Object construction --------------

  function Item(descriptor, room, game) {
    Object.assign(this, descriptor);

    this.actions = this.actions || [];
    this.accessor = this.accessor || new RegExp(this.key);
    this.game = game || null;
    this.room = room || null;

    for (var i = 0, l = this.validGetters.length; i < l; i++) {
      var e = this.validGetters[i];
      if (typeof this[e] === 'function') Object.defineProperty(this, e, {get:this[e]});
    }
  }

  Item.prototype = {

    validGetters: ['detail', 'description', 'accessor'],

    getDescription(){
      return this.description;
    },

    getCommand(input){
      return this.actions[this.actions.findIndex(e=>e.command.test(input))];
    }

  }

})();
