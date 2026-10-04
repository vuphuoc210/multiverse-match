const imageSources = (slug) => [
  "https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/" + slug + ".jpg",
  "https://akabab.github.io/superhero-api/api/images/md/" + slug + ".jpg",
  "https://raw.githubusercontent.com/akabab/superhero-api/0.3.0/api/images/md/" + slug + ".jpg",
];

export const characters = [
  [1,"A-Bomb","Rick Jones","1-a-bomb"],[4,"Abomination","Emil Blonsky","4-abomination"],[31,"Ant-Man","Scott Lang","31-ant-man-ii"],
  [96,"Black Bolt","Blackagar Boltagon","96-black-bolt"],[106,"Black Panther","T'Challa","106-black-panther"],[107,"Black Widow","Natasha Romanoff","107-black-widow"],[149,"Captain America","Steve Rogers","149-captain-america"],
  [157,"Captain Marvel","Carol Danvers","157-captain-marvel"],[196,"Cyclops","Scott Summers","196-cyclops"],[201,"Daredevil","Matt Murdock","201-daredevil"],
  [213,"Deadpool","Wade Wilson","213-deadpool"],[222,"Doctor Doom","Victor von Doom","222-doctor-doom"],[226,"Doctor Strange","Stephen Strange","226-doctor-strange"],
  [234,"Drax the Destroyer","Arthur Douglas","234-drax-the-destroyer"],[251,"Falcon","Sam Wilson","251-falcon"],[275,"Gamora","Gamora Zen Whoberi","275-gamora"],[280,"Ghost Rider","Johnny Blaze","280-ghost-rider"],
  [299,"Green Goblin","Norman Osborn","299-green-goblin"],[303,"Groot","Groot","303-groot"],[313,"Hawkeye","Clint Barton","313-hawkeye"],[332,"Hulk","Bruce Banner","332-hulk"],
  [333,"Human Torch","Johnny Storm","333-human-torch"],[344,"Invisible Woman","Susan Storm Richards","344-invisible-woman"],[345,"Iron Fist","Danny Rand","345-iron-fist"],[346,"Iron Man","Tony Stark","346-iron-man"],
  [356,"Jean Grey","Jean Grey","356-jean-grey"],[361,"Jessica Jones","Jessica Jones","361-jessica-jones"],[374,"Juggernaut","Cain Marko","374-juggernaut"],
  [391,"Kingpin","Wilson Fisk","391-kingpin"],[414,"Loki","Loki Laufeyson","414-loki"],[416,"Luke Cage","Luke Cage","416-luke-cage"],
  [423,"Magneto","Erik Lehnsherr","423-magneto"],[431,"Mantis","Mantis","431-mantis"],[456,"Mister Fantastic","Reed Richards","456-mister-fantastic"],[470,"Moon Knight","Marc Spector","470-moon-knight"],[480,"Mystique","Raven Darkholme","480-mystique"],
  [487,"Nebula","Nebula","487-nebula"],[490,"Nightcrawler","Kurt Wagner","490-nightcrawler"],[527,"Professor X","Charles Xavier","527-professor-x"],
  [530,"Punisher","Frank Castle","530-punisher"],[566,"Rocket Raccoon","Rocket Raccoon","566-rocket-raccoon"],[567,"Rogue","Anna Marie","567-rogue"],[570,"Sabretooth","Victor Creed","570-sabretooth"],
  [579,"Scarlet Witch","Wanda Maximoff","579-scarlet-witch"],[589,"She-Hulk","Jennifer Walters","589-she-hulk"],[598,"Silver Surfer","Norrin Radd","598-silver-surfer"],[620,"Spider-Man","Peter Parker","620-spider-man"],
  [630,"Star-Lord","Peter Quill","630-star-lord"],[638,"Storm","Ororo Munroe","638-storm"],[655,"Thanos","Thanos","655-thanos"],[658,"Thing","Ben Grimm","658-thing"],
  [659,"Thor","Thor Odinson","659-thor"],[680,"Ultron","Ultron","680-ultron"],[687,"Venom","Eddie Brock","687-venom"],
  [697,"Vision","Vision","697-vision"],[708,"Wasp","Janet van Dyne","708-wasp"],[714,"Winter Soldier","Bucky Barnes","714-winter-soldier"],
  [717,"Wolverine","Logan","717-wolverine"]
].map(([id,name,realName,slug]) => {
  const images = imageSources(slug);
  return { id, name, realName, image: images[0], imageFallbacks: images.slice(1) };
});

export const characterIds = new Set(characters.map((character) => character.id));
