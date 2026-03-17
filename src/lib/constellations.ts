/**
 * Constellation descriptions and metadata for the info card.
 */
export interface ConstellationInfo {
  description: string;
  mythology: string;
  brightestStar: string;
  zodiac: boolean;
}

export const CONSTELLATION_DESCRIPTIONS: Record<string, ConstellationInfo> = {
  UMa: {
    description: "One of the largest constellations, containing the famous Big Dipper asterism. Visible year-round in the Northern Hemisphere.",
    mythology: "In Greek mythology, Zeus placed the nymph Callisto in the sky as a bear after she was transformed by Hera.",
    brightestStar: "Alioth (Epsilon Ursae Majoris)",
    zodiac: false,
  },
  Ori: {
    description: "One of the most recognizable constellations, dominated by the three belt stars. Contains the Orion Nebula (M42), a stellar nursery visible to the naked eye.",
    mythology: "Named after a giant huntsman in Greek mythology placed in the sky by Zeus. He eternally chases the Pleiades across the heavens.",
    brightestStar: "Rigel (Beta Orionis)",
    zodiac: false,
  },
  Cas: {
    description: "A distinctive W-shaped constellation in the northern sky, circumpolar from most northern latitudes. Lies in a rich part of the Milky Way.",
    mythology: "Named after Queen Cassiopeia of Ethiopia in Greek mythology, who boasted of her unrivaled beauty and was placed in the sky by Poseidon.",
    brightestStar: "Schedar (Alpha Cassiopeiae)",
    zodiac: false,
  },
  Cyg: {
    description: "The Northern Cross, one of the most prominent summer constellations. Its brightest star Deneb forms part of the Summer Triangle.",
    mythology: "Represents a swan in Greek mythology. Zeus disguised himself as a swan to seduce Leda, Queen of Sparta.",
    brightestStar: "Deneb (Alpha Cygni)",
    zodiac: false,
  },
  Leo: {
    description: "A zodiac constellation best seen in spring. Its brightest star Regulus sits almost exactly on the ecliptic. The Sickle asterism forms the lion's head.",
    mythology: "Represents the Nemean Lion slain by Hercules as the first of his twelve labors. Its hide was impervious to weapons.",
    brightestStar: "Regulus (Alpha Leonis)",
    zodiac: true,
  },
  Sco: {
    description: "A zodiac constellation with a distinctive fishhook shape. Its red supergiant Antares (rival of Mars) marks the scorpion's heart. Rich in deep-sky objects.",
    mythology: "The scorpion sent by Gaia to kill Orion. They were placed on opposite sides of the sky so they are never visible at the same time.",
    brightestStar: "Antares (Alpha Scorpii)",
    zodiac: true,
  },
  Gem: {
    description: "A zodiac constellation representing twins, best seen in winter. Home to the Geminid meteor shower in December.",
    mythology: "Represents the twins Castor and Pollux from Greek mythology. Pollux asked Zeus to share his immortality with his mortal brother.",
    brightestStar: "Pollux (Beta Geminorum)",
    zodiac: true,
  },
  Crx: {
    description: "The smallest of all 88 constellations but one of the most distinctive. Visible only from southern latitudes, it serves as a key navigational aid pointing to the south celestial pole.",
    mythology: "Not known to ancient Greeks due to precession. Used by navigators and explorers in the Southern Hemisphere for centuries.",
    brightestStar: "Acrux (Alpha Crucis)",
    zodiac: false,
  },
  CMa: {
    description: "Home to Sirius, the brightest star in the night sky at magnitude -1.46. Represents one of Orion's hunting dogs.",
    mythology: "One of Orion's faithful hunting dogs. Sirius was associated with the 'dog days' of summer by the ancient Greeks and Egyptians.",
    brightestStar: "Sirius (Alpha Canis Majoris)",
    zodiac: false,
  },
  Lyr: {
    description: "A small but prominent constellation. Its brightest star Vega is the fifth brightest in the sky and part of the Summer Triangle.",
    mythology: "Represents the lyre of Orpheus, whose music could charm all living things. After his death, Zeus placed the lyre among the stars.",
    brightestStar: "Vega (Alpha Lyrae)",
    zodiac: false,
  },
  Aql: {
    description: "An equatorial constellation. Its brightest star Altair completes the Summer Triangle with Vega and Deneb.",
    mythology: "Represents the eagle that carried Zeus's thunderbolts, or the eagle that carried Ganymede to Mount Olympus.",
    brightestStar: "Altair (Alpha Aquilae)",
    zodiac: false,
  },
  Tau: {
    description: "A zodiac constellation containing the Pleiades (M45) and Hyades star clusters, both visible to the naked eye. Best seen in winter.",
    mythology: "Represents the bull form taken by Zeus to abduct Europa. Only the front half of the bull is depicted in the sky.",
    brightestStar: "Aldebaran (Alpha Tauri)",
    zodiac: true,
  },
};
