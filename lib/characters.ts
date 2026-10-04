export type Character = {
  id: number;
  name: string;
  realName: string;
  image: string;
};

const image = (slug: string) =>
  `https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/${slug}.jpg`;

export const characters: Character[] = [
  { id: 1, name: "A-Bomb", realName: "Rick Jones", image: image("1-a-bomb") },
  { id: 4, name: "Abomination", realName: "Emil Blonsky", image: image("4-abomination") },
  { id: 31, name: "Ant-Man", realName: "Scott Lang", image: image("31-ant-man-ii") },
  { id: 106, name: "Black Panther", realName: "T'Challa", image: image("106-black-panther") },
  { id: 107, name: "Black Widow", realName: "Natasha Romanoff", image: image("107-black-widow") },
  { id: 149, name: "Captain America", realName: "Steve Rogers", image: image("149-captain-america") },
  { id: 157, name: "Captain Marvel", realName: "Carol Danvers", image: image("157-captain-marvel-ii") },
  { id: 196, name: "Cyclops", realName: "Scott Summers", image: image("196-cyclops") },
  { id: 201, name: "Daredevil", realName: "Matt Murdock", image: image("201-daredevil") },
  { id: 213, name: "Deadpool", realName: "Wade Wilson", image: image("213-deadpool") },
  { id: 222, name: "Doctor Doom", realName: "Victor von Doom", image: image("222-doctor-doom") },
  { id: 226, name: "Doctor Strange", realName: "Stephen Strange", image: image("226-doctor-strange") },
  { id: 251, name: "Falcon", realName: "Sam Wilson", image: image("251-falcon") },
  { id: 275, name: "Gamora", realName: "Gamora Zen Whoberi", image: image("275-gamora") },
  { id: 280, name: "Ghost Rider", realName: "Johnny Blaze", image: image("280-ghost-rider") },
  { id: 299, name: "Green Goblin", realName: "Norman Osborn", image: image("299-green-goblin") },
  { id: 313, name: "Hawkeye", realName: "Clint Barton", image: image("313-hawkeye") },
  { id: 332, name: "Hulk", realName: "Bruce Banner", image: image("332-hulk") },
  { id: 344, name: "Human Torch", realName: "Johnny Storm", image: image("344-human-torch") },
  { id: 345, name: "Iron Fist", realName: "Danny Rand", image: image("345-iron-fist") },
  { id: 346, name: "Iron Man", realName: "Tony Stark", image: image("346-iron-man") },
  { id: 356, name: "Jean Grey", realName: "Jean Grey", image: image("356-jean-grey") },
  { id: 361, name: "Jessica Jones", realName: "Jessica Jones", image: image("361-jessica-jones") },
  { id: 373, name: "Juggernaut", realName: "Cain Marko", image: image("373-juggernaut") },
  { id: 391, name: "Kingpin", realName: "Wilson Fisk", image: image("391-kingpin") },
  { id: 414, name: "Loki", realName: "Loki Laufeyson", image: image("414-loki") },
  { id: 416, name: "Luke Cage", realName: "Luke Cage", image: image("416-luke-cage") },
  { id: 423, name: "Magneto", realName: "Erik Lehnsherr", image: image("423-magneto") },
  { id: 470, name: "Moon Knight", realName: "Marc Spector", image: image("470-moon-knight") },
  { id: 480, name: "Mystique", realName: "Raven Darkholme", image: image("480-mystique") },
  { id: 489, name: "Nightcrawler", realName: "Kurt Wagner", image: image("489-nightcrawler") },
  { id: 498, name: "Mister Fantastic", realName: "Reed Richards", image: image("498-mister-fantastic") },
  { id: 527, name: "Professor X", realName: "Charles Xavier", image: image("527-professor-x") },
  { id: 530, name: "Punisher", realName: "Frank Castle", image: image("530-punisher") },
  { id: 567, name: "Rogue", realName: "Anna Marie", image: image("567-rogue") },
  { id: 570, name: "Sabretooth", realName: "Victor Creed", image: image("570-sabretooth") },
  { id: 579, name: "Scarlet Witch", realName: "Wanda Maximoff", image: image("579-scarlet-witch") },
  { id: 601, name: "Silver Surfer", realName: "Norrin Radd", image: image("601-silver-surfer") },
  { id: 620, name: "Spider-Man", realName: "Peter Parker", image: image("620-spider-man") },
  { id: 638, name: "Storm", realName: "Ororo Munroe", image: image("638-storm") },
  { id: 655, name: "Thanos", realName: "Thanos", image: image("655-thanos") },
  { id: 658, name: "Thing", realName: "Ben Grimm", image: image("658-thing") },
  { id: 659, name: "Thor", realName: "Thor Odinson", image: image("659-thor") },
  { id: 680, name: "Ultron", realName: "Ultron", image: image("680-ultron") },
  { id: 687, name: "Venom", realName: "Eddie Brock", image: image("687-venom") },
  { id: 697, name: "Vision", realName: "Vision", image: image("697-vision") },
  { id: 708, name: "Wasp", realName: "Janet van Dyne", image: image("708-wasp") },
  { id: 714, name: "Winter Soldier", realName: "Bucky Barnes", image: image("714-winter-soldier") },
  { id: 717, name: "Wolverine", realName: "Logan", image: image("717-wolverine") },
];

export const characterById = new Map(characters.map((character) => [character.id, character]));
