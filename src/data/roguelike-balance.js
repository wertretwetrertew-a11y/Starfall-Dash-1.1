// AUTO-GENERATED FROM config/roguelike-balance.json
var STARFALL_BALANCE = {
  "version": 1,
  "notes": "Developer-only balance source for Roguelike. Edit through tools/balance-editor.mjs.",
  "rogue": {
    "spawn": {
      "minIntervalFrames": 45,
      "pressureIntervalFrames": 45,
      "pressureMaxPerTick": 2
    },
    "stages": {
      "arden": [
        {
          "spawnInterval": 82,
          "maxAlive": 5,
          "minAlive": 3,
          "speedMult": 0.9,
          "hpMult": 1,
          "objective": {
            "kind": "coreFragments",
            "target": 3
          },
          "pool": [
            "normal"
          ]
        },
        {
          "spawnInterval": 78,
          "maxAlive": 5,
          "minAlive": 3,
          "speedMult": 0.98,
          "hpMult": 1.02,
          "objective": {
            "kind": "time",
            "target": 60
          },
          "pool": [
            "normal",
            "spider"
          ]
        },
        {
          "spawnInterval": 72,
          "maxAlive": 6,
          "minAlive": 4,
          "speedMult": 1.04,
          "hpMult": 1.06,
          "objective": {
            "kind": "kills",
            "target": 15
          },
          "pool": [
            "normal",
            "ghost",
            "spider"
          ]
        },
        {
          "spawnInterval": 68,
          "maxAlive": 2,
          "minAlive": 1,
          "speedMult": 0.8,
          "hpMult": 1.12,
          "objective": {
            "kind": "strongKills",
            "target": 6
          },
          "pool": [
            "laser"
          ]
        }
      ],
      "nivara": [
        {
          "spawnInterval": 76,
          "maxAlive": 5,
          "minAlive": 3,
          "speedMult": 1.08,
          "hpMult": 1.08,
          "objective": {
            "kind": "distance",
            "target": 15000
          },
          "pool": [
            "hunter",
            "ice"
          ]
        },
        {
          "spawnInterval": 70,
          "maxAlive": 5,
          "minAlive": 3,
          "speedMult": 1.12,
          "hpMult": 1.12,
          "objective": {
            "kind": "kills",
            "target": 30
          },
          "pool": [
            "snake",
            "bomber",
            "spider"
          ]
        },
        {
          "spawnInterval": 68,
          "maxAlive": 5,
          "minAlive": 3,
          "speedMult": 1.16,
          "hpMult": 1.16,
          "objective": {
            "kind": "time",
            "target": 90
          },
          "pool": [
            "star",
            "crystal",
            "teleporter"
          ]
        },
        {
          "spawnInterval": 65,
          "maxAlive": 5,
          "minAlive": 4,
          "speedMult": 1.2,
          "hpMult": 1.2,
          "objective": {
            "kind": "strongKills",
            "target": 7
          },
          "pool": [
            "barrier",
            "magnet_enemy",
            "doppel"
          ]
        }
      ],
      "exor": [
        {
          "spawnInterval": 63,
          "maxAlive": 5,
          "minAlive": 4,
          "speedMult": 1.22,
          "hpMult": 1.2,
          "objective": {
            "kind": "distance",
            "target": 18000
          },
          "pool": [
            "star",
            "crystal",
            "teleporter"
          ]
        },
        {
          "spawnInterval": 60,
          "maxAlive": 5,
          "minAlive": 4,
          "speedMult": 1.26,
          "hpMult": 1.24,
          "objective": {
            "kind": "kills",
            "target": 35
          },
          "pool": [
            "magnet_enemy",
            "doppel",
            "laser"
          ]
        },
        {
          "spawnInterval": 58,
          "maxAlive": 6,
          "minAlive": 4,
          "speedMult": 1.3,
          "hpMult": 1.3,
          "objective": {
            "kind": "strongKills",
            "target": 7
          },
          "pool": [
            "barrier",
            "teleporter",
            "laser"
          ]
        },
        {
          "spawnInterval": 55,
          "maxAlive": 6,
          "minAlive": 4,
          "speedMult": 1.36,
          "hpMult": 1.34,
          "objective": {
            "kind": "time",
            "target": 90
          },
          "pool": [
            "magnet_enemy",
            "doppel",
            "laser"
          ]
        }
      ]
    },
    "enemies": {
      "normal": {
        "hp": 20,
        "speed": 2.5,
        "size": 25
      },
      "flyer": {
        "hp": 3,
        "speed": 3,
        "size": 24
      },
      "zigzag": {
        "hp": 3,
        "speed": 4,
        "size": 24
      },
      "ghost": {
        "hp": 12,
        "speed": 2,
        "size": 26
      },
      "hunter": {
        "hp": 4,
        "speed": 3,
        "size": 22
      },
      "snake": {
        "hp": 4,
        "speed": 3.8,
        "size": 26
      },
      "bomber": {
        "hp": 4,
        "speed": 2.8,
        "size": 28
      },
      "splitter": {
        "hp": 5,
        "speed": 2.6,
        "size": 30
      },
      "spider": {
        "hp": 10,
        "speed": 2.4,
        "size": 26
      },
      "ice": {
        "hp": 4,
        "speed": 3,
        "size": 26
      },
      "star": {
        "hp": 5,
        "speed": 2.8,
        "size": 26
      },
      "miniboss": {
        "hp": 12,
        "speed": 2,
        "size": 44
      },
      "crystal": {
        "hp": 6,
        "speed": 0.6,
        "size": 32
      },
      "barrier": {
        "hp": 7,
        "speed": 2.5,
        "size": 24
      },
      "teleporter": {
        "hp": 6,
        "speed": 0.3,
        "size": 26
      },
      "magnet_enemy": {
        "hp": 6,
        "speed": 2,
        "size": 28
      },
      "doppel": {
        "hp": 6,
        "speed": 0,
        "size": 26
      },
      "laser": {
        "hp": 15,
        "speed": 1.5,
        "size": 32
      }
    },
    "bosses": {
      "dragon": {
        "hp": 35,
        "size": 80,
        "rewardGold": 1500,
        "rewardCrystals": 10
      },
      "titan": {
        "hp": 40,
        "size": 90,
        "rewardGold": 1000,
        "rewardCrystals": 10
      },
      "devourer": {
        "hp": 60,
        "size": 100,
        "rewardGold": 2000,
        "rewardCrystals": 15
      }
    },
    "modifiers": {
      "elite": {
        "hpMult": 1.35,
        "speedMult": 1.12
      },
      "ambush": {
        "hpMult": 1.12,
        "speedMult": 1.16
      },
      "finaltrial": {
        "hpMult": 1.28,
        "speedMult": 1.18
      }
    }
  },
  "gameVersion": "3.3.16"
};
function sfBalance(){return (typeof STARFALL_BALANCE==='object'&&STARFALL_BALANCE)?STARFALL_BALANCE:null;}
function sfRogueBalance(){var b=sfBalance();return b&&b.rogue?b.rogue:null;}
function sfRogueStageBalance(planetKey,stageIndex){var b=sfRogueBalance();var list=b&&b.stages&&b.stages[planetKey];return list&&list[stageIndex]?list[stageIndex]:null;}
function sfGetEnemyBalance(typeKey){var b=sfRogueBalance();return b&&b.enemies&&b.enemies[typeKey]?b.enemies[typeKey]:null;}
function sfGetBossBalance(bossKey){var b=sfRogueBalance();return b&&b.bosses&&b.bosses[bossKey]?b.bosses[bossKey]:null;}
