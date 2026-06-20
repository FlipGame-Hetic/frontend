export interface CreditEntry {
  title?: string
  message?: string
  items?: string[]
}

export interface CreditSection {
  heading: string
  entries: CreditEntry[]
}

export const SCROLL_SPEED_PX_PER_SEC = 55
export const START_DELAY_MS = 900

const MAX = "Maxime Bidan"
const ARTHUR = "Arthur Jenck"
const ARNAUD = "Arnaud Fischer"
const LOUIS = "Louis Dondey"
const ALEXIS = "Alexis Gontier"
const ALL = "Toute l'équipe"

export const CREDITS_SECTIONS: CreditSection[] = [
  {
    heading: "Attributions",
    entries: [
      {
        message:
          "Merci à Merci-Michel et Ludovic Jokiel de nous avoir permis d'utiliser certains effets sonores du jeu Ouigo Let's Play!",
      },
      {
        message:
          "Merci au groupe DANCE WITH THE DEAD de nous avoir permis d'utiliser leurs musiques :",
        items: [
          "Invader",
          "Diabolic",
          "Only a Dream",
          "That House",
          "Blind",
          "Thrasher",
          "Cobra",
          "Sunset",
        ],
      },
      {
        title: "Effets sonores additionnels",
        items: ["Divers effets sonores - Pixabay (free use)"],
      },
      {
        title: "Shaders",
        items: ["Effet portail — MisterPrada (Shadertoy, CC BY-NC-SA 3.0)"],
      },
      {
        title: "Polices",
        items: ["Rajdhani", "Share Tech Mono", "Orbitron"],
      },
    ],
  },
  {
    heading: "Remerciements",
    entries: [
      { message: "Merci à Hetic de nous avoir donné la chance de réaliser ce beau projet !" },
      { title: "Encadrement", items: ["Sion Genders", "Dany Siriphol", "Brontis Guilloux"] },
    ],
  },
  {
    heading: "Réflexion & conception",
    entries: [
      { title: "Game design / game logic", items: [MAX, ARTHUR, ARNAUD] },
      { title: "Score, multiplicateurs & combos", items: [ARNAUD] },
      { title: "Design des boss", items: [ARTHUR] },
      { title: "Système de combat", items: [MAX, ARTHUR, ARNAUD] },
      { title: "Personnages & ultimes", items: [ARTHUR, ARNAUD, MAX, LOUIS] },
      { title: "Conception technique & UML", items: [ARNAUD, MAX, ALEXIS] },
      { title: "Architecture logicielle & monorepo", items: [MAX, ARNAUD] },
      { title: "Lore & univers", items: [ARTHUR, MAX] },
    ],
  },
  {
    heading: "Développement",
    entries: [
      { title: "Gestion de projet", items: [ARNAUD, ARTHUR, MAX] },
      { title: "Front screen & physique (Rapier)", items: [ARTHUR] },
      { title: "Communication temps réel (WebSocket)", items: [ARNAUD] },
      { title: "Backend", items: [ARNAUD] },
      { title: "Bases de données", items: [ARNAUD] },
      { title: "Game feel & retours visuels", items: [ARTHUR] },
      { title: "DevOps & déploiement", items: [ARNAUD] },
      { title: "DMD (Dot Matrix Display)", items: [MAX] },
      { title: "CI / CD", items: [ARNAUD, MAX] },
      { title: "Back screen", items: [ARTHUR, ALEXIS] },
      { title: "Tests unitaires", items: [ALL] },
      { title: "Documentation", items: [ALL] },
    ],
  },
  {
    heading: "Hardware & borne",
    entries: [
      { title: "Installation électronique - boutons, écrans, soudure, câblage", items: [LOUIS] },
      { title: "Montage du PC hôte de la borne", items: [MAX, ARTHUR] },
      { title: "IoT & MQTT", items: [LOUIS, ARNAUD] },
      { title: "Référent IoT & déploiement borne", items: [LOUIS] },
    ],
  },
  {
    heading: "Direction artistique",
    entries: [
      { title: "Identité visuelle", items: [MAX, ARTHUR, ALEXIS] },
      { title: "Direction artistique", items: [MAX, ARTHUR] },
      { title: "VFX & shaders", items: [ARTHUR, MAX] },
      { title: "Modélisation 3D, textures & éclairage", items: [MAX] },
      { title: "Character design", items: [ARTHUR] },
      { title: "UI / UX des menus", items: [ALEXIS, ARTHUR] },
      { title: "Design system, palette & typographie", items: [MAX, ALEXIS] },
      { title: "Sound design, intégration audio & vidéos des boss", items: [ARTHUR] },
      { title: "Nom du jeu — S.P.A.M.E.R", items: [MAX, ARNAUD] },
    ],
  },
  {
    heading: "Mentions spéciales",
    entries: [
      {
        title: "Inspirations",
        items: ["Tron", "Cyberpunk 2077", "Blade Runner", "Portal", "Final Fantasy XIV"],
      },
      { title: "Soutien moral", items: ["Nos familles et nos proches", "La caféine"] },
      { title: "Agents IA", items: ["Claude", "Codex"] },
      {
        message:
          "Merci à l'agent de sécurité du Campus Cluster Paris Innovation, qui nous a gentiment laissés rester à des heures tardives pour tester le déploiement !",
      },
    ],
  },
]
