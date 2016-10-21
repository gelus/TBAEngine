"use strict";

(function () {

  var directionMap = {
    "n": "north",
    "s": "south",
    "w": "west",
    "e": "east"
  };

  var validGetters = ['detail', 'description', 'accessor'];

  window.TBAEngine = function TBAEngine() {

    this.currentRoom = null;
    this.rooms = {};
    this.inventory = {};
    this.invalidCommand = "Invalid Command";
    this.emptyInventory = "Empy inventory";
    this.regExpMatchs = {};
    this.conditions = [];
  };

  TBAEngine.prototype = {
    input: function input(input) {
      var ret = [];
      var output;

      for (var i = 0, l = this.conditions.length; i < l; i++) {
        var condition = this.conditions[i];
        if (!condition.check.call(this)) ret.push(condition.failText);
      }
      if (ret.length) return ret.join(" ");

      var input = input.toLocaleLowerCase();
      var globalCommand = this.globalCommands[this.globalCommands.findIndex(function (e) {
        return e.command.test(input);
      })];
      var roomCommand = this.currentRoom.actions ? this.currentRoom.actions[this.currentRoom.actions.findIndex(function (e) {
        return e.command.test(input);
      })] : undefined;
      var target = this.findTarget(input);
      var targetCommand = target && target.getCommand(input);

      this.regExpMatchs.globalCommand = globalCommand ? globalCommand.command.exec(input) : null;
      this.regExpMatchs.roomCommand = roomCommand ? roomCommand.command.exec(input) : null;
      this.regExpMatchs.target = target ? target.accessor.exec(input) : null;
      this.regExpMatchs.targetCommand = targetCommand ? targetCommand.command.exec(input) : null;

      if (globalCommand) ret.push(globalCommand.method.call(this, target));
      if (roomCommand) ret.push(roomCommand.method.call(this.currentRoom));
      if (targetCommand) ret.push(targetCommand.method.call(target));

      var output = ret.filter(function (n) {
        return !!n;
      }).join(" ");
      return output.length ? output : this.invalidCommand;
    },
    addCondition: function addCondition(condition) {
      this.conditions.push(condition);
    },
    addRoom: function addRoom(descriptor) {
      this.rooms[descriptor.key] = new Room(descriptor, this);
    },
    createItem: function createItem(descriptor) {
      return new Item(descriptor, null, this);
    },
    findTarget: function findTarget(input) {
      var _this = this;

      var targets = this.currentRoom.itemList.filter(function (e) {
        return _this.currentRoom.items[e].accessor.test(input);
      }).map(function (e) {
        return _this.currentRoom.items[e];
      }).concat(this.inventoryList.filter(function (e) {
        return _this.inventory[e].accessor.test(input);
      }).map(function (e) {
        return _this.inventory[e];
      }));

      if (targets.length > 1) targets = targets.filter(function (e) {
        return !!e.getCommand(input);
      });

      return targets[0];
    },
    enterRoom: function enterRoom(room) {
      this.currentRoom = room;
      return room.getDescription();
    },


    globalCommands: [{ command: /^look(.*)/, method: function method(target) {
        if (!target) {
          var query = this.regExpMatchs.globalCommand[1].trim();
          if (query.length) return "Nothing interesting";else target = this.currentRoom;
        }
        return target.detail || target.getDescription();
      }
    }, { command: /^(go|g)\s(.*)/, method: function method() {
        var direction = this.regExpMatchs.globalCommand[2];
        if (/^[nesw]$/.test(direction)) direction = directionMap[direction];

        for (var key in this.currentRoom.exits) {
          if (this.currentRoom.exits.hasOwnProperty(key)) {
            if (this.currentRoom.exits[key].accessor.test(direction)) return this.enterRoom(this.currentRoom.exits[key].room);
          }
        }

        return "Cannot go there.";
      }
    }, { command: /take/, method: function method(target) {
        if (!target || !target.getCommand("take")) return "Cannot take that.";
        if (this.inventory[target.key]) return target.key + " already taken";
      }
    }, { command: /^drop(.*)/, method: function method(target) {
        if (!target) {
          var query = this.regExpMatchs[1].trim();
          if (!query.length) return "Drop what?";else return "You're not carrying that.";
        }
        if (!target.getCommand("drop")) {
          if (!this.inventory[target.key]) return "You're not carrying that.";else {
            this.dropItem(target);
            return target.key + " dropped.";
          }
        }
      }
    }, { command: /inventory/, method: function method() {
        return this.inventoryList.length ? this.inventoryList.join("\n") : this.emptyInventory;
      }
    }]

  };

  Object.defineProperty(TBAEngine.prototype, "inventoryList", {
    get: function get() {
      return Object.keys(this.inventory);
    }
  });

  // Room construction -------------

  function Room(descriptor, game) {
    Object.assign(this, descriptor);
    this.items = {};
    this.exits = {};
    this.game = game || null;

    for (var i = 0, l = validGetters.length; i < l; i++) {
      var e = validGetters[i];
      if (typeof this[e] === 'function') Object.defineProperty(this, e, { get: this[e] });
    }
  }

  Room.prototype = {
    addItem: function addItem(descriptor) {
      this.items[descriptor.key] = descriptor instanceof Item ? descriptor : new Item(descriptor, this, this.game);
      this.items[descriptor.key].room = this;
      if (descriptor.init) descriptor.init.call(this.items[descriptor.key]);
    },
    addExit: function addExit(discriptor) {
      var key = discriptor.direction.toLocaleLowerCase();
      this.exits[key] = discriptor;
      this.exits[key].accessor = this.exits[key].accessor || new RegExp(key);
    },
    takeItem: function takeItem(item) {
      this.game.inventory[item.key] = item;
      delete item.room;
      this.removeItem(item.key);
    },
    removeItem: function removeItem(key) {
      delete this.items[key];
    },
    getDescription: function getDescription() {
      var _this2 = this;

      var ret = [this.description];
      ret = ret.concat(this.itemList.map(function (x) {
        return _this2.items[x].description;
      }));
      ret = ret.concat(this.exitList.map(function (x) {
        return _this2.exits[x].description;
      }));
      return ret.join(" ");
    }
  };

  Object.defineProperty(Room.prototype, 'itemList', {
    get: function get() {
      return Object.keys(this.items);
    }
  });

  Object.defineProperty(Room.prototype, 'exitList', {
    get: function get() {
      return Object.keys(this.exits);
    }
  });

  // Object construction --------------

  function Item(descriptor, room, game) {
    Object.assign(this, descriptor);

    this.actions = this.actions || [];
    this.accessor = this.accessor || new RegExp(this.key);
    this.game = game || null;
    this.room = room || null;

    for (var i = 0, l = validGetters.length; i < l; i++) {
      var e = validGetters[i];
      if (typeof this[e] === 'function') Object.defineProperty(this, e, { get: this[e] });
    }
  }

  Item.prototype = {
    getDescription: function getDescription() {
      return this.description;
    },
    getCommand: function getCommand(input) {
      return this.actions[this.actions.findIndex(function (e) {
        return e.command.test(input);
      })];
    },
    drop: function drop() {
      if (this.game.inventory[this.key]) {
        this.game.currentRoom.addItem(this);
        delete this.game.inventory[this.key];
      }
    }
  };
})();

//# sourceMappingURL=TBAEngine.js.map