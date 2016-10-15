(function(){


  window.TBAEngine = function TBAEngine(){

    this.currentRoom = null;
    this.rooms = {};
    this.invalidCommand = "Invalid Command";

  }

  TBAEngine.prototype = {

    input(input) {
      var ret = [];
      var input = input.toLocaleLowerCase();
      var globalCommand = this.globalCommands[this.globalCommands.findIndex(e=>e.command.test(input))];
      var target = this.findTarget(input);
      var targetCommand = target? target.actions[target.actions.findIndex(e=>e.command.test(input))]:undefined;

      if(globalCommand) ret.push(globalCommand.method.call(this, target));
      if(targetCommand) ret.push(targetCommand.method.call(target, this));

      if(ret.length) return ret.join(" ");
      else return this.invalidCommand;
      
    },

    addRoom(descriptor) {
      this.rooms[descriptor.title] = new Room(descriptor);
    },

    findTarget(input) {
      var targetKey = this.currentRoom.itemList[this.currentRoom.itemList.findIndex(function(e){
        return this.items[e].regEx.test(input);
      }.bind(this.currentRoom))];
     
      return this.currentRoom.items[targetKey];
    },

    globalCommands : [
      {command: /look/, method(target=this.currentRoom){
        return target.detail || target.getDescription();
      }}
    ]

  };



  // Room construction -------------

  function Room(descriptor) {
    Object.assign(this, descriptor);
    this.items = {};
  }

  Room.prototype = {

    addItem(descriptor) {
      this.items[descriptor.key] = new Item(descriptor)
    },

    getDescription(){
        return this.description +" "+this.itemList.map(x=>this.items[x].description).join(" ");
    }

  };

  Object.defineProperty(Room.prototype, 'itemList', {
    get(){ return Object.keys(this.items); }
  });


  // Object construction --------------

  function Item(descriptor) {
    Object.assign(this, descriptor);
    this.regEx = new RegExp(descriptor.key);
    this.actions = this.actions || [];

    
    if (typeof this.detail === 'function') Object.defineProperty(this, 'detail', {get:this.detail});
    if (typeof this.description === 'function') Object.defineProperty(this, 'description', {get:this.description});
  }

  Item.prototype = {

    getDescription(){
      return this.description;
    }

  }

})();
