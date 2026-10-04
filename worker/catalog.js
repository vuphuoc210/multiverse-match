const image = (slug) => "https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/" + slug + ".jpg";

export const characters = [
  [1,"A-Bomb","Rick Jones","1-a-bomb"],[4,"Abomination","Emil Blonsky","4-abomination"],[31,"Ant-Man","Scott Lang","31-ant-man-ii"],
  [106,"Black Panther","T'Challa","106-black-panther"],[107,"Black Widow","Natasha Romanoff","107-black-widow"],[149,"Captain America","Steve Rogers","149-captain-america"],
  [157,"Captain Marvel","Carol Danvers","157-captain-marvel-ii"],[196,"Cyclops","Scott Summers","196-cyclops"],[201,"Daredevil","Matt Murdock","201-daredevil"],
  [213,"Deadpool","Wade Wilson","213-deadpool"],[222,"Doctor Doom","Victor von Doom","222-doctor-doom"],[226,"Doctor Strange","Stephen Strange","226-doctor-strange"],
  [251,"Falcon","Sam Wilson","251-falcon"],[275,"Gamora","Gamora Zen Whoberi","275-gamora"],[280,"Ghost Rider","Johnny Blaze","280-ghost-rider"],
  [299,"Green Goblin","Norman Osborn","299-green-goblin"],[313,"Hawkeye","Clint Barton","313-hawkeye"],[332,"Hulk","Bruce Banner","332-hulk"],
  [344,"Human Torch","Johnny Storm","344-human-torch"],[345,"Iron Fist","Danny Rand","345-iron-fist"],[346,"Iron Man","Tony Stark","346-iron-man"],
  [356,"Jean Grey","Jean Grey","356-jean-grey"],[361,"Jessica Jones","Jessica Jones","361-jessica-jones"],[373,"Juggernaut","Cain Marko","373-juggernaut"],
  [391,"Kingpin","Wilson Fisk","391-kingpin"],[414,"Loki","Loki Laufeyson","414-loki"],[416,"Luke Cage","Luke Cage","416-luke-cage"],
  [423,"Magneto","Erik Lehnsherr","423-magneto"],[470,"Moon Knight","Marc Spector","470-moon-knight"],[480,"Mystique","Raven Darkholme","480-mystique"],
  [489,"Nightcrawler","Kurt Wagner","489-nightcrawler"],[498,"Mister Fantastic","Reed Richards","498-mister-fantastic"],[527,"Professor X","Charles Xavier","527-professor-x"],
  [530,"Punisher","Frank Castle","530-punisher"],[567,"Rogue","Anna Marie","567-rogue"],[570,"Sabretooth","Victor Creed","570-sabretooth"],
  [579,"Scarlet Witch","Wanda Maximoff","579-scarlet-witch"],[601,"Silver Surfer","Norrin Radd","601-silver-surfer"],[620,"Spider-Man","Peter Parker","620-spider-man"],
  [638,"Storm","Ororo Munroe","638-storm"],[655,"Thanos","Thanos","655-thanos"],[658,"Thing","Ben Grimm","658-thing"],
  [659,"Thor","Thor Odinson","659-thor"],[680,"Ultron","Ultron","680-ultron"],[687,"Venom","Eddie Brock","687-venom"],
  [697,"Vision","Vision","697-vision"],[708,"Wasp","Janet van Dyne","708-wasp"],[714,"Winter Soldier","Bucky Barnes","714-winter-soldier"],
  [717,"Wolverine","Logan","717-wolverine"]
].map(([id,name,realName,slug]) => ({ id, name, realName, image: image(slug) }));

export const characterIds = new Set(characters.map((character) => character.id));
