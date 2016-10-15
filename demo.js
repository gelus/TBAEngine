var G = new TBAEngine();

G.addRoom({
  title: "AllyEnd",
  description: "You're in the closed end of an ally."
});

G.rooms.AllyEnd.addItem({
  key: "trash",
  description: "Trash blows around your feet.",
  detail: "It's just some paper",
});

G.rooms.AllyEnd.addItem({
  key: "light",
  description: "A light is mounted on the wall.",
  detail: function(){ return "The light is "+ this.state+"."},
  state: "off",
  actions: [
    {command: /look/, method: function(game){
      console.info("Adding bug");
      game.currentRoom.addItem(bug);
      this.actions.pop();
      return "A bug is flying near by."
    }}
  ]
});

G.rooms.AllyEnd.addItem({
  key: "switch",
  description: "There is a switch below the light.",
  detail: "It probably controls the light.",
  actions: [
    {command: /flip|turn|hit/, method: function(game){
      game.currentRoom.items.light.state = game.currentRoom.items.light.state === "on"? "off":"on";
      return "You flip the switch. The light turns " + game.currentRoom.items.light.state +".";
    }},
  ]
});

var bug = {
  key: "bug",
  description: "A bug is flying around.",
  detail: "It seems to be a moth."
}

G.currentRoom = G.rooms.AllyEnd;

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
  oup.textContent = output;
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

log(G.currentRoom.getDescription(), true);

