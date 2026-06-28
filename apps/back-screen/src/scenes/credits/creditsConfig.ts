interface CreditEntry {
  title?: string
  message?: string
  items?: string[]
}

export interface CreditSection {
  heading: string
  entries: CreditEntry[]
}

export const SCROLL_SPEED_PX_PER_SEC = 60
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
          "Merci au groupe Dance With The Dead de nous avoir permis d'utiliser leurs musiques :",
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
        items: [
          "BlackHole (swirl, portal) — MisterPrada (Shadertoy)",
          "Matrix rain shader — raja (Shadertoy)",
        ],
      },
      {
        title: "Modèles 3D",
        items: [
          "Jedi Holocron — Greggory_Fisher (CC BY 4.0 - Sketchfab)",
          "blnk-100 concept hovering car — DEDROX (CC BY 4.0 - Sketchfab)",
        ],
      },
      {
        title: "Polices",
        items: ["Rajdhani", "Share Tech Mono", "Orbitron"],
      },
    ],
  },
  {
    heading: "Réflexion & conception",
    entries: [
      { title: "Game design, game logic & système de combat", items: [MAX, ARTHUR, ARNAUD] },
      { title: "Architecture logicielle & monorepo", items: [MAX, ARNAUD] },
      { title: "Personnages, Boss & ultimes", items: [ARTHUR, MAX, ARNAUD, LOUIS] },
      { title: "Lore & univers", items: [ARTHUR, MAX] },
    ],
  },
  {
    heading: "Développement",
    entries: [
      { title: "Gestion de projet", items: [ARNAUD, ARTHUR, MAX] },
      { title: "Front screen, physique (Rapier) & game feel", items: [ARTHUR] },
      { title: "Back screen, menu, crédits", items: [ARTHUR, ALEXIS] },
      { title: "DMD (Dot Matrix Display)", items: [MAX] },
      { title: "Backend, WebSocket, bases de données & déploiement", items: [ARNAUD] },
      { title: "CI / CD", items: [ARNAUD, MAX] },
      { title: "Tests unitaires & documentation", items: [ALL] },
    ],
  },
  {
    heading: "Direction artistique",
    entries: [
      { title: "Identité visuelle", items: [MAX, ARTHUR, ALEXIS] },
      { title: "Modélisation 3D, textures & éclairage", items: [MAX] },
      { title: "VFX & shaders", items: [ARTHUR, MAX] },
      { title: "Sound design, intégration audio", items: [ARTHUR] },
    ],
  },
  {
    heading: "Hardware & borne",
    entries: [
      { title: "Installation électronique - boutons, écrans, soudure, câblage", items: [LOUIS] },
      { title: "Montage du PC hôte de la borne", items: [MAX, ARTHUR] },
      { title: "IoT & MQTT, déploiement", items: [LOUIS, ARNAUD] },
    ],
  },
  {
    heading: "Mentions spéciales",
    entries: [
      { message: "Merci à Hetic de nous avoir donné la chance de réaliser ce beau projet !" },
      { title: "Encadrement", items: ["Sion Genders", "Dany Siriphol", "Brontis Guilloux"] },
      {
        title: "Inspirations",
        items: ["Tron", "Cyberpunk 2077", "Blade Runner", "Portal", "Final Fantasy XIV"],
      },
      { title: "Soutien moral", items: ["Nos familles et nos proches", "La caféine"] },
      {
        message:
          "Merci à l'agent de sécurité du Campus Cluster Paris Innovation, qui nous a gentiment laissés rester à des heures tardives pour tester le déploiement !",
      },
    ],
  },
]
