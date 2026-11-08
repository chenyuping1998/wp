// Generated from independently verified TreasureMonkey published books by design/sync_story_books.py.
export default [
 {
  "id": 1,
  "mode": "bonus",
  "payoutMultiplier": 2000000,
  "events": [
   {
    "index": 0,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "H3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "H4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      }
     ]
    ],
    "paddingPositions": [
     649,
     245,
     876,
     507,
     302
    ],
    "anticipation": [
     0,
     0,
     0,
     1,
     1
    ],
    "gameType": "basegame"
   },
   {
    "index": 1,
    "type": "setTotalWin",
    "amount": 0
   },
   {
    "index": 2,
    "type": "freeSpinTrigger",
    "totalFs": 10,
    "positions": [
     {
      "reel": 0,
      "row": 2
     },
     {
      "reel": 2,
      "row": 1
     },
     {
      "reel": 4,
      "row": 1
     }
    ]
   },
   {
    "index": 3,
    "type": "bonusTier",
    "tier": "soldier",
    "seedFrames": 1
   },
   {
    "index": 4,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L2"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "L3"
      }
     ]
    ],
    "paddingPositions": [
     900,
     900,
     900,
     900,
     900
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 5,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 1,
      "row": 1,
      "size": 1,
      "mult": 100
     }
    ]
   },
   {
    "index": 6,
    "type": "winInfo",
    "totalWin": 2000000,
    "wins": [
     {
      "symbol": "H1",
      "kind": 5,
      "win": 2000000,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 1
       },
       {
        "reel": 2,
        "row": 1
       },
       {
        "reel": 3,
        "row": 1
       },
       {
        "reel": 4,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 1,
       "multiplier": 100,
       "winWithoutMult": 40000,
       "globalMult": 1,
       "lineMultiplier": 100,
       "uncappedWin": 4000000
      }
     }
    ]
   },
   {
    "index": 7,
    "type": "setWin",
    "amount": 2000000,
    "winLevel": 10
   },
   {
    "index": 8,
    "type": "setTotalWin",
    "amount": 2000000
   },
   {
    "index": 9,
    "type": "wincap",
    "amount": 2000000
   },
   {
    "index": 10,
    "type": "updateFreeSpin",
    "amount": 0,
    "total": 10
   },
   {
    "index": 11,
    "type": "freeSpinEnd",
    "amount": 2000000,
    "winLevel": 10
   },
   {
    "index": 12,
    "type": "finalWin",
    "amount": 2000000
   }
  ],
  "criteria": "cap",
  "basePayout": 0,
  "featurePayout": 2000000,
  "featureTier": "soldier"
 },
 {
  "id": 2,
  "mode": "bonus",
  "payoutMultiplier": 440,
  "events": [
   {
    "index": 0,
    "type": "reveal",
    "board": [
     [
      {
       "name": "H5"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "H4"
      }
     ],
     [
      {
       "name": "H5"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "H5"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "H1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      }
     ]
    ],
    "paddingPositions": [
     459,
     863,
     476,
     488,
     930
    ],
    "anticipation": [
     0,
     0,
     0,
     1,
     2
    ],
    "gameType": "basegame"
   },
   {
    "index": 1,
    "type": "setTotalWin",
    "amount": 0
   },
   {
    "index": 2,
    "type": "freeSpinTrigger",
    "totalFs": 10,
    "positions": [
     {
      "reel": 1,
      "row": 1
     },
     {
      "reel": 2,
      "row": 1
     },
     {
      "reel": 3,
      "row": 2
     }
    ]
   },
   {
    "index": 3,
    "type": "bonusTier",
    "tier": "soldier",
    "seedFrames": 1
   },
   {
    "index": 4,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "H5"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "H4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "H5"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "H4"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "H3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      }
     ]
    ],
    "paddingPositions": [
     97,
     476,
     101,
     294,
     223
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 5,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 4,
      "size": 1,
      "mult": 4
     }
    ]
   },
   {
    "index": 6,
    "type": "winInfo",
    "totalWin": 200,
    "wins": [
     {
      "symbol": "L2",
      "kind": 4,
      "win": 100,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 1
       },
       {
        "reel": 3,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 8,
       "multiplier": 1,
       "winWithoutMult": 100,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 100
      }
     },
     {
      "symbol": "L2",
      "kind": 4,
      "win": 100,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 1
       },
       {
        "reel": 3,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 13,
       "multiplier": 1,
       "winWithoutMult": 100,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 100
      }
     }
    ]
   },
   {
    "index": 7,
    "type": "setWin",
    "amount": 200,
    "winLevel": 4
   },
   {
    "index": 8,
    "type": "setTotalWin",
    "amount": 200
   },
   {
    "index": 9,
    "type": "updateFreeSpin",
    "amount": 0,
    "total": 10
   },
   {
    "index": 10,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L4"
      },
      {
       "name": "H5"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "H4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "SW"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "H5"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "W",
       "wild": true
      }
     ]
    ],
    "paddingPositions": [
     329,
     852,
     132,
     574,
     746
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 11,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 4,
      "size": 1,
      "mult": 4
     }
    ]
   },
   {
    "index": 12,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 2,
      "row": 2
     }
    ],
    "reels": [
     2
    ]
   },
   {
    "index": 13,
    "type": "winInfo",
    "totalWin": 160,
    "wins": [
     {
      "symbol": "L1",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 2
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 4
       }
      ],
      "meta": {
       "lineIndex": 6,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L4",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 8,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L1",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 2
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 10,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L4",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 11,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     }
    ]
   },
   {
    "index": 14,
    "type": "setWin",
    "amount": 160,
    "winLevel": 3
   },
   {
    "index": 15,
    "type": "setTotalWin",
    "amount": 360
   },
   {
    "index": 16,
    "type": "updateFreeSpin",
    "amount": 1,
    "total": 10
   },
   {
    "index": 17,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L4"
      },
      {
       "name": "H1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "SW"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "H5"
      },
      {
       "name": "H4"
      }
     ],
     [
      {
       "name": "H4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "SW"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "SW"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      }
     ]
    ],
    "paddingPositions": [
     845,
     311,
     660,
     427,
     114
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 18,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 4,
      "size": 1,
      "mult": 3
     }
    ]
   },
   {
    "index": 19,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 3,
      "row": 2
     }
    ],
    "reels": [
     3
    ]
   },
   {
    "index": 20,
    "type": "setTotalWin",
    "amount": 360
   },
   {
    "index": 21,
    "type": "updateFreeSpin",
    "amount": 2,
    "total": 10
   },
   {
    "index": 22,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "W",
       "wild": true
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "H4"
      },
      {
       "name": "L4"
      },
      {
       "name": "H5"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "H3"
      },
      {
       "name": "H3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "H1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      }
     ]
    ],
    "paddingPositions": [
     872,
     736,
     403,
     801,
     468
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 23,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 4,
      "size": 1,
      "mult": 3
     },
     {
      "reel": 0,
      "row": 2,
      "size": 1,
      "mult": 2
     }
    ]
   },
   {
    "index": 24,
    "type": "newFrames",
    "frames": [
     {
      "reel": 0,
      "row": 2,
      "size": 1,
      "mult": 2
     }
    ]
   },
   {
    "index": 25,
    "type": "setTotalWin",
    "amount": 360
   },
   {
    "index": 26,
    "type": "updateFreeSpin",
    "amount": 3,
    "total": 10
   },
   {
    "index": 27,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L3"
      },
      {
       "name": "H5"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "H5"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "H5"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "H5"
      },
      {
       "name": "H5"
      },
      {
       "name": "H5"
      }
     ]
    ],
    "paddingPositions": [
     345,
     1012,
     36,
     32,
     209
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 28,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 4,
      "size": 1,
      "mult": 2
     },
     {
      "reel": 0,
      "row": 2,
      "size": 1,
      "mult": 4
     }
    ]
   },
   {
    "index": 29,
    "type": "setTotalWin",
    "amount": 360
   },
   {
    "index": 30,
    "type": "updateFreeSpin",
    "amount": 4,
    "total": 10
   },
   {
    "index": 31,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L4"
      },
      {
       "name": "H5"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "H5"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "S",
       "scatter": true
      }
     ],
     [
      {
       "name": "H3"
      },
      {
       "name": "L4"
      },
      {
       "name": "H3"
      },
      {
       "name": "L4"
      },
      {
       "name": "H4"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "H2"
      },
      {
       "name": "L1"
      },
      {
       "name": "SW"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      }
     ]
    ],
    "paddingPositions": [
     329,
     926,
     44,
     306,
     940
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 32,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 4,
      "size": 1,
      "mult": 2
     },
     {
      "reel": 0,
      "row": 2,
      "size": 1,
      "mult": 3
     }
    ]
   },
   {
    "index": 33,
    "type": "setTotalWin",
    "amount": 360
   },
   {
    "index": 34,
    "type": "updateFreeSpin",
    "amount": 5,
    "total": 10
   },
   {
    "index": 35,
    "type": "reveal",
    "board": [
     [
      {
       "name": "W",
       "wild": true
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "H4"
      },
      {
       "name": "H4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      }
     ]
    ],
    "paddingPositions": [
     702,
     91,
     379,
     145,
     245
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 36,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 4,
      "size": 1,
      "mult": 9
     },
     {
      "reel": 0,
      "row": 2,
      "size": 1,
      "mult": 10
     }
    ]
   },
   {
    "index": 37,
    "type": "winInfo",
    "totalWin": 40,
    "wins": [
     {
      "symbol": "L2",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 1
       },
       {
        "reel": 2,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 1,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     }
    ]
   },
   {
    "index": 38,
    "type": "setWin",
    "amount": 40,
    "winLevel": 2
   },
   {
    "index": 39,
    "type": "setTotalWin",
    "amount": 400
   },
   {
    "index": 40,
    "type": "updateFreeSpin",
    "amount": 6,
    "total": 10
   },
   {
    "index": 41,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "H4"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "SW"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "H5"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      }
     ]
    ],
    "paddingPositions": [
     624,
     733,
     285,
     603,
     393
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 42,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 4,
      "size": 1,
      "mult": 2
     },
     {
      "reel": 0,
      "row": 2,
      "size": 1,
      "mult": 7
     }
    ]
   },
   {
    "index": 43,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 3,
      "row": 3
     }
    ],
    "reels": [
     3
    ]
   },
   {
    "index": 44,
    "type": "setTotalWin",
    "amount": 400
   },
   {
    "index": 45,
    "type": "updateFreeSpin",
    "amount": 7,
    "total": 10
   },
   {
    "index": 46,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "H5"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "H5"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      }
     ]
    ],
    "paddingPositions": [
     111,
     207,
     283,
     152,
     41
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 47,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 4,
      "size": 1,
      "mult": 2
     },
     {
      "reel": 0,
      "row": 2,
      "size": 1,
      "mult": 4
     }
    ]
   },
   {
    "index": 48,
    "type": "winInfo",
    "totalWin": 40,
    "wins": [
     {
      "symbol": "L3",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 8,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     }
    ]
   },
   {
    "index": 49,
    "type": "setWin",
    "amount": 40,
    "winLevel": 2
   },
   {
    "index": 50,
    "type": "setTotalWin",
    "amount": 440
   },
   {
    "index": 51,
    "type": "updateFreeSpin",
    "amount": 8,
    "total": 10
   },
   {
    "index": 52,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "H3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "H4"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "H3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "H5"
      },
      {
       "name": "H5"
      },
      {
       "name": "H5"
      }
     ]
    ],
    "paddingPositions": [
     384,
     753,
     974,
     1003,
     209
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 53,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 4,
      "size": 1,
      "mult": 2
     },
     {
      "reel": 0,
      "row": 2,
      "size": 1,
      "mult": 5
     },
     {
      "reel": 3,
      "row": 1,
      "size": 1,
      "mult": 50
     }
    ]
   },
   {
    "index": 54,
    "type": "newFrames",
    "frames": [
     {
      "reel": 3,
      "row": 1,
      "size": 1,
      "mult": 50
     }
    ]
   },
   {
    "index": 55,
    "type": "setTotalWin",
    "amount": 440
   },
   {
    "index": 56,
    "type": "updateFreeSpin",
    "amount": 9,
    "total": 10
   },
   {
    "index": 57,
    "type": "freeSpinEnd",
    "amount": 440,
    "winLevel": 2
   },
   {
    "index": 58,
    "type": "finalWin",
    "amount": 440
   }
  ],
  "criteria": "ordinary",
  "basePayout": 0,
  "featurePayout": 440,
  "featureTier": "soldier"
 },
 {
  "id": 3,
  "mode": "bonus",
  "payoutMultiplier": 2160,
  "events": [
   {
    "index": 0,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L4"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "H3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      }
     ]
    ],
    "paddingPositions": [
     250,
     511,
     676,
     686,
     640
    ],
    "anticipation": [
     0,
     0,
     0,
     1,
     2
    ],
    "gameType": "basegame"
   },
   {
    "index": 1,
    "type": "setTotalWin",
    "amount": 0
   },
   {
    "index": 2,
    "type": "freeSpinTrigger",
    "totalFs": 10,
    "positions": [
     {
      "reel": 0,
      "row": 1
     },
     {
      "reel": 2,
      "row": 1
     },
     {
      "reel": 3,
      "row": 4
     }
    ]
   },
   {
    "index": 3,
    "type": "bonusTier",
    "tier": "soldier",
    "seedFrames": 1
   },
   {
    "index": 4,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "H5"
      },
      {
       "name": "H3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "H1"
      },
      {
       "name": "L4"
      },
      {
       "name": "H3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      }
     ]
    ],
    "paddingPositions": [
     61,
     404,
     767,
     825,
     233
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 5,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 0,
      "row": 1,
      "size": 1,
      "mult": 2
     },
     {
      "reel": 0,
      "row": 3,
      "size": 2,
      "mult": 7
     }
    ]
   },
   {
    "index": 6,
    "type": "newFrames",
    "frames": [
     {
      "reel": 0,
      "row": 3,
      "size": 2,
      "mult": 7
     }
    ]
   },
   {
    "index": 7,
    "type": "setTotalWin",
    "amount": 0
   },
   {
    "index": 8,
    "type": "updateFreeSpin",
    "amount": 0,
    "total": 10
   },
   {
    "index": 9,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "H1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "H3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "H5"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      }
     ]
    ],
    "paddingPositions": [
     143,
     990,
     552,
     354,
     75
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 10,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 0,
      "row": 1,
      "size": 1,
      "mult": 3
     },
     {
      "reel": 0,
      "row": 3,
      "size": 2,
      "mult": 3
     }
    ]
   },
   {
    "index": 11,
    "type": "winInfo",
    "totalWin": 120,
    "wins": [
     {
      "symbol": "L4",
      "kind": 3,
      "win": 120,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 1
       },
       {
        "reel": 2,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 1,
       "multiplier": 3,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 3,
       "uncappedWin": 120
      }
     }
    ]
   },
   {
    "index": 12,
    "type": "setWin",
    "amount": 120,
    "winLevel": 3
   },
   {
    "index": 13,
    "type": "setTotalWin",
    "amount": 120
   },
   {
    "index": 14,
    "type": "updateFreeSpin",
    "amount": 1,
    "total": 10
   },
   {
    "index": 15,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "H4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "H3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "H5"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "H1"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "H1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      }
     ]
    ],
    "paddingPositions": [
     625,
     683,
     353,
     528,
     465
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 16,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 0,
      "row": 1,
      "size": 1,
      "mult": 3
     },
     {
      "reel": 0,
      "row": 3,
      "size": 2,
      "mult": 10
     }
    ]
   },
   {
    "index": 17,
    "type": "winInfo",
    "totalWin": 800,
    "wins": [
     {
      "symbol": "L1",
      "kind": 3,
      "win": 800,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 4
       },
       {
        "reel": 2,
        "row": 4
       }
      ],
      "meta": {
       "lineIndex": 4,
       "multiplier": 20,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 20,
       "uncappedWin": 800
      }
     }
    ]
   },
   {
    "index": 18,
    "type": "setWin",
    "amount": 800,
    "winLevel": 5
   },
   {
    "index": 19,
    "type": "setTotalWin",
    "amount": 920
   },
   {
    "index": 20,
    "type": "updateFreeSpin",
    "amount": 2,
    "total": 10
   },
   {
    "index": 21,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "H5"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "H2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "H4"
      },
      {
       "name": "L1"
      },
      {
       "name": "H1"
      }
     ]
    ],
    "paddingPositions": [
     500,
     182,
     318,
     446,
     347
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 22,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 0,
      "row": 1,
      "size": 1,
      "mult": 10
     },
     {
      "reel": 0,
      "row": 3,
      "size": 2,
      "mult": 5
     }
    ]
   },
   {
    "index": 23,
    "type": "winInfo",
    "totalWin": 400,
    "wins": [
     {
      "symbol": "L2",
      "kind": 3,
      "win": 400,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 4
       },
       {
        "reel": 2,
        "row": 4
       }
      ],
      "meta": {
       "lineIndex": 4,
       "multiplier": 10,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 10,
       "uncappedWin": 400
      }
     }
    ]
   },
   {
    "index": 24,
    "type": "setWin",
    "amount": 400,
    "winLevel": 4
   },
   {
    "index": 25,
    "type": "setTotalWin",
    "amount": 1320
   },
   {
    "index": 26,
    "type": "updateFreeSpin",
    "amount": 3,
    "total": 10
   },
   {
    "index": 27,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L2"
      },
      {
       "name": "H4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "H4"
      }
     ],
     [
      {
       "name": "H4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "H4"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "H5"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "H1"
      },
      {
       "name": "H5"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "H5"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "H5"
      },
      {
       "name": "H4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      }
     ]
    ],
    "paddingPositions": [
     680,
     20,
     264,
     165,
     303
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 28,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 0,
      "row": 1,
      "size": 1,
      "mult": 6
     },
     {
      "reel": 0,
      "row": 3,
      "size": 2,
      "mult": 2
     }
    ]
   },
   {
    "index": 29,
    "type": "setTotalWin",
    "amount": 1320
   },
   {
    "index": 30,
    "type": "updateFreeSpin",
    "amount": 4,
    "total": 10
   },
   {
    "index": 31,
    "type": "reveal",
    "board": [
     [
      {
       "name": "H5"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "H2"
      },
      {
       "name": "H5"
      },
      {
       "name": "H4"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "H4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "H3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      }
     ]
    ],
    "paddingPositions": [
     779,
     535,
     812,
     336,
     715
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 32,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 0,
      "row": 1,
      "size": 1,
      "mult": 4
     },
     {
      "reel": 0,
      "row": 3,
      "size": 2,
      "mult": 2
     },
     {
      "reel": 4,
      "row": 2,
      "size": 1,
      "mult": 100
     }
    ]
   },
   {
    "index": 33,
    "type": "newFrames",
    "frames": [
     {
      "reel": 4,
      "row": 2,
      "size": 1,
      "mult": 100
     }
    ]
   },
   {
    "index": 34,
    "type": "winInfo",
    "totalWin": 480,
    "wins": [
     {
      "symbol": "L1",
      "kind": 3,
      "win": 80,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 8,
       "multiplier": 2,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 2,
       "uncappedWin": 80
      }
     },
     {
      "symbol": "L1",
      "kind": 3,
      "win": 160,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 9,
       "multiplier": 4,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 4,
       "uncappedWin": 160
      }
     },
     {
      "symbol": "L1",
      "kind": 3,
      "win": 80,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 11,
       "multiplier": 2,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 2,
       "uncappedWin": 80
      }
     },
     {
      "symbol": "L1",
      "kind": 3,
      "win": 160,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 13,
       "multiplier": 4,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 4,
       "uncappedWin": 160
      }
     }
    ]
   },
   {
    "index": 35,
    "type": "setWin",
    "amount": 480,
    "winLevel": 4
   },
   {
    "index": 36,
    "type": "setTotalWin",
    "amount": 1800
   },
   {
    "index": 37,
    "type": "updateFreeSpin",
    "amount": 5,
    "total": 10
   },
   {
    "index": 38,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "H3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "H5"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "H5"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "H3"
      },
      {
       "name": "L1"
      },
      {
       "name": "H2"
      },
      {
       "name": "L2"
      },
      {
       "name": "H5"
      },
      {
       "name": "L2"
      }
     ]
    ],
    "paddingPositions": [
     322,
     827,
     737,
     10,
     482
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 39,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 0,
      "row": 1,
      "size": 1,
      "mult": 4
     },
     {
      "reel": 0,
      "row": 3,
      "size": 2,
      "mult": 4
     },
     {
      "reel": 4,
      "row": 2,
      "size": 1,
      "mult": 6
     },
     {
      "reel": 3,
      "row": 3,
      "size": 2,
      "mult": 9
     }
    ]
   },
   {
    "index": 40,
    "type": "newFrames",
    "frames": [
     {
      "reel": 3,
      "row": 3,
      "size": 2,
      "mult": 9
     }
    ]
   },
   {
    "index": 41,
    "type": "winInfo",
    "totalWin": 320,
    "wins": [
     {
      "symbol": "L1",
      "kind": 3,
      "win": 320,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 3,
       "multiplier": 8,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 8,
       "uncappedWin": 320
      }
     }
    ]
   },
   {
    "index": 42,
    "type": "setWin",
    "amount": 320,
    "winLevel": 4
   },
   {
    "index": 43,
    "type": "setTotalWin",
    "amount": 2120
   },
   {
    "index": 44,
    "type": "updateFreeSpin",
    "amount": 6,
    "total": 10
   },
   {
    "index": 45,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "H5"
      },
      {
       "name": "H5"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "H3"
      },
      {
       "name": "H1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "H1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      }
     ]
    ],
    "paddingPositions": [
     704,
     853,
     165,
     834,
     936
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 46,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 0,
      "row": 1,
      "size": 1,
      "mult": 4
     },
     {
      "reel": 0,
      "row": 3,
      "size": 2,
      "mult": 8
     },
     {
      "reel": 4,
      "row": 2,
      "size": 1,
      "mult": 5
     },
     {
      "reel": 3,
      "row": 3,
      "size": 2,
      "mult": 6
     }
    ]
   },
   {
    "index": 47,
    "type": "setTotalWin",
    "amount": 2120
   },
   {
    "index": 48,
    "type": "updateFreeSpin",
    "amount": 7,
    "total": 10
   },
   {
    "index": 49,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L4"
      },
      {
       "name": "H5"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "S",
       "scatter": true
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "H4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "H4"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "H4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "H5"
      },
      {
       "name": "L4"
      }
     ]
    ],
    "paddingPositions": [
     246,
     19,
     234,
     739,
     126
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 50,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 0,
      "row": 1,
      "size": 1,
      "mult": 3
     },
     {
      "reel": 0,
      "row": 3,
      "size": 2,
      "mult": 5
     },
     {
      "reel": 4,
      "row": 2,
      "size": 1,
      "mult": 10
     },
     {
      "reel": 3,
      "row": 3,
      "size": 2,
      "mult": 9
     }
    ]
   },
   {
    "index": 51,
    "type": "winInfo",
    "totalWin": 40,
    "wins": [
     {
      "symbol": "L3",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 2
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 2,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     }
    ]
   },
   {
    "index": 52,
    "type": "setWin",
    "amount": 40,
    "winLevel": 2
   },
   {
    "index": 53,
    "type": "setTotalWin",
    "amount": 2160
   },
   {
    "index": 54,
    "type": "updateFreeSpin",
    "amount": 8,
    "total": 10
   },
   {
    "index": 55,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "H4"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "H4"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      }
     ]
    ],
    "paddingPositions": [
     743,
     187,
     449,
     399,
     899
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 56,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 0,
      "row": 1,
      "size": 1,
      "mult": 3
     },
     {
      "reel": 0,
      "row": 3,
      "size": 2,
      "mult": 3
     },
     {
      "reel": 4,
      "row": 2,
      "size": 1,
      "mult": 2
     },
     {
      "reel": 3,
      "row": 3,
      "size": 2,
      "mult": 5
     }
    ]
   },
   {
    "index": 57,
    "type": "setTotalWin",
    "amount": 2160
   },
   {
    "index": 58,
    "type": "updateFreeSpin",
    "amount": 9,
    "total": 10
   },
   {
    "index": 59,
    "type": "freeSpinEnd",
    "amount": 2160,
    "winLevel": 5
   },
   {
    "index": 60,
    "type": "finalWin",
    "amount": 2160
   }
  ],
  "criteria": "ordinary",
  "basePayout": 0,
  "featurePayout": 2160,
  "featureTier": "soldier"
 },
 {
  "id": 9,
  "mode": "bonus",
  "payoutMultiplier": 700,
  "events": [
   {
    "index": 0,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      }
     ]
    ],
    "paddingPositions": [
     594,
     261,
     875,
     429,
     302
    ],
    "anticipation": [
     0,
     0,
     0,
     1,
     1
    ],
    "gameType": "basegame"
   },
   {
    "index": 1,
    "type": "setTotalWin",
    "amount": 0
   },
   {
    "index": 2,
    "type": "freeSpinTrigger",
    "totalFs": 10,
    "positions": [
     {
      "reel": 1,
      "row": 3
     },
     {
      "reel": 2,
      "row": 2
     },
     {
      "reel": 4,
      "row": 1
     }
    ]
   },
   {
    "index": 3,
    "type": "bonusTier",
    "tier": "soldier",
    "seedFrames": 1
   },
   {
    "index": 4,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "SW"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "H5"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "H5"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      }
     ]
    ],
    "paddingPositions": [
     801,
     780,
     674,
     515,
     571
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 5,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 3,
      "size": 1,
      "mult": 4
     }
    ]
   },
   {
    "index": 6,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 1,
      "row": 3
     }
    ],
    "reels": [
     1
    ]
   },
   {
    "index": 7,
    "type": "winInfo",
    "totalWin": 80,
    "wins": [
     {
      "symbol": "L2",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 1
       },
       {
        "reel": 2,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 1,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L2",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 13,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     }
    ]
   },
   {
    "index": 8,
    "type": "setWin",
    "amount": 80,
    "winLevel": 2
   },
   {
    "index": 9,
    "type": "setTotalWin",
    "amount": 80
   },
   {
    "index": 10,
    "type": "updateFreeSpin",
    "amount": 0,
    "total": 10
   },
   {
    "index": 11,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "H5"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "H4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      }
     ]
    ],
    "paddingPositions": [
     471,
     380,
     979,
     420,
     503
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 12,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 3,
      "size": 1,
      "mult": 4
     }
    ]
   },
   {
    "index": 13,
    "type": "winInfo",
    "totalWin": 80,
    "wins": [
     {
      "symbol": "L2",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 5,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L2",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 9,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     }
    ]
   },
   {
    "index": 14,
    "type": "setWin",
    "amount": 80,
    "winLevel": 2
   },
   {
    "index": 15,
    "type": "setTotalWin",
    "amount": 160
   },
   {
    "index": 16,
    "type": "updateFreeSpin",
    "amount": 1,
    "total": 10
   },
   {
    "index": 17,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "H1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "H1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "H3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "H5"
      },
      {
       "name": "L4"
      },
      {
       "name": "H3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      }
     ]
    ],
    "paddingPositions": [
     215,
     644,
     297,
     195,
     111
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 18,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 3,
      "size": 1,
      "mult": 4
     },
     {
      "reel": 4,
      "row": 4,
      "size": 1,
      "mult": 5
     }
    ]
   },
   {
    "index": 19,
    "type": "newFrames",
    "frames": [
     {
      "reel": 4,
      "row": 4,
      "size": 1,
      "mult": 5
     }
    ]
   },
   {
    "index": 20,
    "type": "setTotalWin",
    "amount": 160
   },
   {
    "index": 21,
    "type": "updateFreeSpin",
    "amount": 2,
    "total": 10
   },
   {
    "index": 22,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "H2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "H4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "H3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "H5"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      }
     ]
    ],
    "paddingPositions": [
     370,
     17,
     867,
     508,
     542
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 23,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 3,
      "size": 1,
      "mult": 3
     },
     {
      "reel": 4,
      "row": 4,
      "size": 1,
      "mult": 10
     }
    ]
   },
   {
    "index": 24,
    "type": "setTotalWin",
    "amount": 160
   },
   {
    "index": 25,
    "type": "updateFreeSpin",
    "amount": 3,
    "total": 10
   },
   {
    "index": 26,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "H4"
      },
      {
       "name": "SW"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "H4"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "H4"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "H5"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      }
     ]
    ],
    "paddingPositions": [
     259,
     15,
     673,
     455,
     177
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 27,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 3,
      "size": 1,
      "mult": 2
     },
     {
      "reel": 4,
      "row": 4,
      "size": 1,
      "mult": 5
     }
    ]
   },
   {
    "index": 28,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 1,
      "row": 1
     }
    ],
    "reels": [
     1
    ]
   },
   {
    "index": 29,
    "type": "winInfo",
    "totalWin": 40,
    "wins": [
     {
      "symbol": "L2",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 11,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     }
    ]
   },
   {
    "index": 30,
    "type": "setWin",
    "amount": 40,
    "winLevel": 2
   },
   {
    "index": 31,
    "type": "setTotalWin",
    "amount": 200
   },
   {
    "index": 32,
    "type": "updateFreeSpin",
    "amount": 4,
    "total": 10
   },
   {
    "index": 33,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "H3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "H3"
      }
     ]
    ],
    "paddingPositions": [
     366,
     272,
     875,
     887,
     965
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     1
    ],
    "gameType": "freegame"
   },
   {
    "index": 34,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 3,
      "size": 1,
      "mult": 3
     },
     {
      "reel": 4,
      "row": 4,
      "size": 1,
      "mult": 2
     }
    ]
   },
   {
    "index": 35,
    "type": "setTotalWin",
    "amount": 200
   },
   {
    "index": 36,
    "type": "freeSpinRetrigger",
    "totalFs": 12,
    "positions": [
     {
      "reel": 2,
      "row": 2
     },
     {
      "reel": 3,
      "row": 3
     }
    ]
   },
   {
    "index": 37,
    "type": "updateFreeSpin",
    "amount": 5,
    "total": 12
   },
   {
    "index": 38,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "H2"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "H5"
      },
      {
       "name": "H5"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "H3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "H5"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "H2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "H3"
      }
     ]
    ],
    "paddingPositions": [
     368,
     699,
     167,
     691,
     66
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 39,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 3,
      "size": 1,
      "mult": 3
     },
     {
      "reel": 4,
      "row": 4,
      "size": 1,
      "mult": 3
     }
    ]
   },
   {
    "index": 40,
    "type": "winInfo",
    "totalWin": 100,
    "wins": [
     {
      "symbol": "L1",
      "kind": 4,
      "win": 100,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 3
       },
       {
        "reel": 3,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 5,
       "multiplier": 1,
       "winWithoutMult": 100,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 100
      }
     }
    ]
   },
   {
    "index": 41,
    "type": "setWin",
    "amount": 100,
    "winLevel": 3
   },
   {
    "index": 42,
    "type": "setTotalWin",
    "amount": 300
   },
   {
    "index": 43,
    "type": "updateFreeSpin",
    "amount": 6,
    "total": 12
   },
   {
    "index": 44,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L4"
      },
      {
       "name": "H5"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "W",
       "wild": true
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "H5"
      },
      {
       "name": "H4"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "H4"
      },
      {
       "name": "H4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "H4"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "H3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      }
     ]
    ],
    "paddingPositions": [
     697,
     312,
     380,
     728,
     910
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 45,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 3,
      "size": 1,
      "mult": 2
     },
     {
      "reel": 4,
      "row": 4,
      "size": 1,
      "mult": 3
     },
     {
      "reel": 4,
      "row": 2,
      "size": 1,
      "mult": 4
     }
    ]
   },
   {
    "index": 46,
    "type": "newFrames",
    "frames": [
     {
      "reel": 4,
      "row": 2,
      "size": 1,
      "mult": 4
     }
    ]
   },
   {
    "index": 47,
    "type": "setTotalWin",
    "amount": 300
   },
   {
    "index": 48,
    "type": "updateFreeSpin",
    "amount": 7,
    "total": 12
   },
   {
    "index": 49,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "SW"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "SW"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "H4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      }
     ]
    ],
    "paddingPositions": [
     971,
     426,
     223,
     252,
     111
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 50,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 3,
      "size": 1,
      "mult": 4
     },
     {
      "reel": 4,
      "row": 4,
      "size": 1,
      "mult": 8
     },
     {
      "reel": 4,
      "row": 2,
      "size": 1,
      "mult": 4
     }
    ]
   },
   {
    "index": 51,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 1,
      "row": 3
     }
    ],
    "reels": [
     1
    ]
   },
   {
    "index": 52,
    "type": "winInfo",
    "totalWin": 160,
    "wins": [
     {
      "symbol": "L3",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 1
       },
       {
        "reel": 2,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 1,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L3",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 5,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L3",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 9,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L3",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 13,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     }
    ]
   },
   {
    "index": 53,
    "type": "setWin",
    "amount": 160,
    "winLevel": 3
   },
   {
    "index": 54,
    "type": "setTotalWin",
    "amount": 460
   },
   {
    "index": 55,
    "type": "updateFreeSpin",
    "amount": 8,
    "total": 12
   },
   {
    "index": 56,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "H3"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "H4"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "H5"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "H5"
      }
     ]
    ],
    "paddingPositions": [
     125,
     657,
     84,
     86,
     645
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 57,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 3,
      "size": 1,
      "mult": 7
     },
     {
      "reel": 4,
      "row": 4,
      "size": 1,
      "mult": 6
     },
     {
      "reel": 4,
      "row": 2,
      "size": 1,
      "mult": 2
     }
    ]
   },
   {
    "index": 58,
    "type": "winInfo",
    "totalWin": 40,
    "wins": [
     {
      "symbol": "L1",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 7,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     }
    ]
   },
   {
    "index": 59,
    "type": "setWin",
    "amount": 40,
    "winLevel": 2
   },
   {
    "index": 60,
    "type": "setTotalWin",
    "amount": 500
   },
   {
    "index": 61,
    "type": "updateFreeSpin",
    "amount": 9,
    "total": 12
   },
   {
    "index": 62,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "SW"
      },
      {
       "name": "H3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "H3"
      },
      {
       "name": "H3"
      },
      {
       "name": "L1"
      },
      {
       "name": "SW"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "SW"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "H4"
      },
      {
       "name": "L2"
      }
     ]
    ],
    "paddingPositions": [
     258,
     606,
     190,
     15,
     34
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 63,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 3,
      "size": 1,
      "mult": 3
     },
     {
      "reel": 4,
      "row": 4,
      "size": 1,
      "mult": 10
     },
     {
      "reel": 4,
      "row": 2,
      "size": 1,
      "mult": 7
     }
    ]
   },
   {
    "index": 64,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 2,
      "row": 3
     },
     {
      "reel": 3,
      "row": 1
     }
    ],
    "reels": [
     2,
     3
    ]
   },
   {
    "index": 65,
    "type": "winInfo",
    "totalWin": 200,
    "wins": [
     {
      "symbol": "L4",
      "kind": 4,
      "win": 100,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 1
       },
       {
        "reel": 3,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 8,
       "multiplier": 1,
       "winWithoutMult": 100,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 100
      }
     },
     {
      "symbol": "L4",
      "kind": 4,
      "win": 100,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       },
       {
        "reel": 3,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 11,
       "multiplier": 1,
       "winWithoutMult": 100,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 100
      }
     }
    ]
   },
   {
    "index": 66,
    "type": "setWin",
    "amount": 200,
    "winLevel": 4
   },
   {
    "index": 67,
    "type": "setTotalWin",
    "amount": 700
   },
   {
    "index": 68,
    "type": "updateFreeSpin",
    "amount": 10,
    "total": 12
   },
   {
    "index": 69,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L3"
      },
      {
       "name": "H5"
      },
      {
       "name": "L4"
      },
      {
       "name": "H4"
      },
      {
       "name": "L3"
      },
      {
       "name": "H5"
      }
     ],
     [
      {
       "name": "H4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "H5"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "H2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "H5"
      },
      {
       "name": "L4"
      },
      {
       "name": "H5"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "H5"
      },
      {
       "name": "L3"
      },
      {
       "name": "H5"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      }
     ]
    ],
    "paddingPositions": [
     71,
     924,
     22,
     587,
     559
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 70,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 3,
      "size": 1,
      "mult": 50
     },
     {
      "reel": 4,
      "row": 4,
      "size": 1,
      "mult": 4
     },
     {
      "reel": 4,
      "row": 2,
      "size": 1,
      "mult": 100
     }
    ]
   },
   {
    "index": 71,
    "type": "setTotalWin",
    "amount": 700
   },
   {
    "index": 72,
    "type": "updateFreeSpin",
    "amount": 11,
    "total": 12
   },
   {
    "index": 73,
    "type": "freeSpinEnd",
    "amount": 700,
    "winLevel": 3
   },
   {
    "index": 74,
    "type": "finalWin",
    "amount": 700
   }
  ],
  "criteria": "ordinary",
  "basePayout": 0,
  "featurePayout": 700,
  "featureTier": "soldier"
 },
 {
  "id": 1,
  "mode": "bonus_hits",
  "payoutMultiplier": 2000000,
  "events": [
   {
    "index": 0,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "H5"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      }
     ]
    ],
    "paddingPositions": [
     848,
     263,
     959,
     486,
     101
    ],
    "anticipation": [
     0,
     0,
     1,
     1,
     2
    ],
    "gameType": "basegame"
   },
   {
    "index": 1,
    "type": "setTotalWin",
    "amount": 0
   },
   {
    "index": 2,
    "type": "freeSpinTrigger",
    "totalFs": 10,
    "positions": [
     {
      "reel": 0,
      "row": 3
     },
     {
      "reel": 1,
      "row": 1
     },
     {
      "reel": 3,
      "row": 4
     },
     {
      "reel": 4,
      "row": 2
     }
    ]
   },
   {
    "index": 3,
    "type": "bonusTier",
    "tier": "capo",
    "seedFrames": 3
   },
   {
    "index": 4,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L2"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "L3"
      }
     ]
    ],
    "paddingPositions": [
     900,
     900,
     900,
     900,
     900
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 5,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 2,
      "row": 4,
      "size": 1,
      "mult": 100
     },
     {
      "reel": 0,
      "row": 1,
      "size": 2,
      "mult": 10
     },
     {
      "reel": 4,
      "row": 1,
      "size": 1,
      "mult": 100
     }
    ]
   },
   {
    "index": 6,
    "type": "winInfo",
    "totalWin": 2000000,
    "wins": [
     {
      "symbol": "H1",
      "kind": 5,
      "win": 2000000,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 1
       },
       {
        "reel": 2,
        "row": 1
       },
       {
        "reel": 3,
        "row": 1
       },
       {
        "reel": 4,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 1,
       "multiplier": 120,
       "winWithoutMult": 40000,
       "globalMult": 1,
       "lineMultiplier": 120,
       "uncappedWin": 4800000
      }
     }
    ]
   },
   {
    "index": 7,
    "type": "setWin",
    "amount": 2000000,
    "winLevel": 10
   },
   {
    "index": 8,
    "type": "setTotalWin",
    "amount": 2000000
   },
   {
    "index": 9,
    "type": "wincap",
    "amount": 2000000
   },
   {
    "index": 10,
    "type": "updateFreeSpin",
    "amount": 0,
    "total": 10
   },
   {
    "index": 11,
    "type": "freeSpinEnd",
    "amount": 2000000,
    "winLevel": 10
   },
   {
    "index": 12,
    "type": "finalWin",
    "amount": 2000000
   }
  ],
  "criteria": "cap",
  "basePayout": 0,
  "featurePayout": 2000000,
  "featureTier": "capo"
 },
 {
  "id": 2,
  "mode": "bonus_hits",
  "payoutMultiplier": 480,
  "events": [
   {
    "index": 0,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "H3"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "H5"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "H1"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "H1"
      },
      {
       "name": "SW"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      }
     ]
    ],
    "paddingPositions": [
     807,
     463,
     927,
     928,
     102
    ],
    "anticipation": [
     0,
     0,
     0,
     1,
     2
    ],
    "gameType": "basegame"
   },
   {
    "index": 1,
    "type": "setTotalWin",
    "amount": 0
   },
   {
    "index": 2,
    "type": "freeSpinTrigger",
    "totalFs": 10,
    "positions": [
     {
      "reel": 1,
      "row": 1
     },
     {
      "reel": 2,
      "row": 4
     },
     {
      "reel": 3,
      "row": 3
     },
     {
      "reel": 4,
      "row": 1
     }
    ]
   },
   {
    "index": 3,
    "type": "bonusTier",
    "tier": "capo",
    "seedFrames": 3
   },
   {
    "index": 4,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "H4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "H4"
      }
     ],
     [
      {
       "name": "H5"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "H5"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "H3"
      },
      {
       "name": "H4"
      },
      {
       "name": "L1"
      }
     ]
    ],
    "paddingPositions": [
     470,
     19,
     498,
     712,
     275
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 5,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 2,
      "size": 1,
      "mult": 7
     },
     {
      "reel": 3,
      "row": 4,
      "size": 1,
      "mult": 2
     },
     {
      "reel": 2,
      "row": 2,
      "size": 1,
      "mult": 4
     }
    ]
   },
   {
    "index": 6,
    "type": "winInfo",
    "totalWin": 40,
    "wins": [
     {
      "symbol": "L3",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 8,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     }
    ]
   },
   {
    "index": 7,
    "type": "setWin",
    "amount": 40,
    "winLevel": 2
   },
   {
    "index": 8,
    "type": "setTotalWin",
    "amount": 40
   },
   {
    "index": 9,
    "type": "updateFreeSpin",
    "amount": 0,
    "total": 10
   },
   {
    "index": 10,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "H5"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "H2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "H3"
      },
      {
       "name": "H3"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "H4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      }
     ]
    ],
    "paddingPositions": [
     720,
     858,
     19,
     800,
     719
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 11,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 2,
      "size": 1,
      "mult": 7
     },
     {
      "reel": 3,
      "row": 4,
      "size": 1,
      "mult": 2
     },
     {
      "reel": 2,
      "row": 2,
      "size": 1,
      "mult": 4
     }
    ]
   },
   {
    "index": 12,
    "type": "setTotalWin",
    "amount": 40
   },
   {
    "index": 13,
    "type": "updateFreeSpin",
    "amount": 1,
    "total": 10
   },
   {
    "index": 14,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "H2"
      },
      {
       "name": "H3"
      },
      {
       "name": "H3"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "H5"
      },
      {
       "name": "L3"
      },
      {
       "name": "H4"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "H4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "H3"
      },
      {
       "name": "H3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "H5"
      }
     ]
    ],
    "paddingPositions": [
     1017,
     688,
     529,
     263,
     985
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 15,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 2,
      "size": 1,
      "mult": 7
     },
     {
      "reel": 3,
      "row": 4,
      "size": 1,
      "mult": 2
     },
     {
      "reel": 2,
      "row": 2,
      "size": 1,
      "mult": 4
     }
    ]
   },
   {
    "index": 16,
    "type": "setTotalWin",
    "amount": 40
   },
   {
    "index": 17,
    "type": "updateFreeSpin",
    "amount": 2,
    "total": 10
   },
   {
    "index": 18,
    "type": "reveal",
    "board": [
     [
      {
       "name": "H5"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "H5"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "H5"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "H3"
      },
      {
       "name": "L4"
      },
      {
       "name": "H3"
      },
      {
       "name": "L4"
      },
      {
       "name": "H4"
      }
     ],
     [
      {
       "name": "H5"
      },
      {
       "name": "H3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "H3"
      }
     ]
    ],
    "paddingPositions": [
     102,
     819,
     43,
     948,
     582
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 19,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 2,
      "size": 1,
      "mult": 7
     },
     {
      "reel": 3,
      "row": 4,
      "size": 1,
      "mult": 2
     },
     {
      "reel": 2,
      "row": 2,
      "size": 1,
      "mult": 4
     },
     {
      "reel": 0,
      "row": 2,
      "size": 1,
      "mult": 3
     }
    ]
   },
   {
    "index": 20,
    "type": "newFrames",
    "frames": [
     {
      "reel": 0,
      "row": 2,
      "size": 1,
      "mult": 3
     }
    ]
   },
   {
    "index": 21,
    "type": "setTotalWin",
    "amount": 40
   },
   {
    "index": 22,
    "type": "updateFreeSpin",
    "amount": 3,
    "total": 10
   },
   {
    "index": 23,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "H4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "H3"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      }
     ]
    ],
    "paddingPositions": [
     596,
     273,
     316,
     422,
     245
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 24,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 2,
      "size": 1,
      "mult": 7
     },
     {
      "reel": 3,
      "row": 4,
      "size": 1,
      "mult": 2
     },
     {
      "reel": 2,
      "row": 2,
      "size": 1,
      "mult": 4
     },
     {
      "reel": 0,
      "row": 2,
      "size": 1,
      "mult": 3
     }
    ]
   },
   {
    "index": 25,
    "type": "setTotalWin",
    "amount": 40
   },
   {
    "index": 26,
    "type": "updateFreeSpin",
    "amount": 4,
    "total": 10
   },
   {
    "index": 27,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "H5"
      },
      {
       "name": "H4"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "W",
       "wild": true
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      }
     ]
    ],
    "paddingPositions": [
     1005,
     402,
     641,
     1009,
     111
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 28,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 2,
      "size": 1,
      "mult": 7
     },
     {
      "reel": 3,
      "row": 4,
      "size": 1,
      "mult": 2
     },
     {
      "reel": 2,
      "row": 2,
      "size": 1,
      "mult": 4
     },
     {
      "reel": 0,
      "row": 2,
      "size": 1,
      "mult": 3
     }
    ]
   },
   {
    "index": 29,
    "type": "winInfo",
    "totalWin": 40,
    "wins": [
     {
      "symbol": "L3",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 8,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     }
    ]
   },
   {
    "index": 30,
    "type": "setWin",
    "amount": 40,
    "winLevel": 2
   },
   {
    "index": 31,
    "type": "setTotalWin",
    "amount": 80
   },
   {
    "index": 32,
    "type": "updateFreeSpin",
    "amount": 5,
    "total": 10
   },
   {
    "index": 33,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "H5"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "H4"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "H4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "H5"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      }
     ]
    ],
    "paddingPositions": [
     427,
     125,
     151,
     457,
     136
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 34,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 2,
      "size": 1,
      "mult": 7
     },
     {
      "reel": 3,
      "row": 4,
      "size": 1,
      "mult": 2
     },
     {
      "reel": 2,
      "row": 2,
      "size": 1,
      "mult": 4
     },
     {
      "reel": 0,
      "row": 2,
      "size": 1,
      "mult": 3
     }
    ]
   },
   {
    "index": 35,
    "type": "winInfo",
    "totalWin": 260,
    "wins": [
     {
      "symbol": "L1",
      "kind": 4,
      "win": 100,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 3
       },
       {
        "reel": 3,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 5,
       "multiplier": 1,
       "winWithoutMult": 100,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 100
      }
     },
     {
      "symbol": "L3",
      "kind": 3,
      "win": 160,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 7,
       "multiplier": 4,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 4,
       "uncappedWin": 160
      }
     }
    ]
   },
   {
    "index": 36,
    "type": "setWin",
    "amount": 260,
    "winLevel": 4
   },
   {
    "index": 37,
    "type": "setTotalWin",
    "amount": 340
   },
   {
    "index": 38,
    "type": "frameDoubling",
    "frames": [
     {
      "reel": 2,
      "row": 2,
      "size": 1,
      "mult": 8
     }
    ]
   },
   {
    "index": 39,
    "type": "updateFreeSpin",
    "amount": 6,
    "total": 10
   },
   {
    "index": 40,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "H5"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "H5"
      },
      {
       "name": "L2"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "H4"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      }
     ]
    ],
    "paddingPositions": [
     959,
     581,
     261,
     286,
     389
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 41,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 2,
      "size": 1,
      "mult": 7
     },
     {
      "reel": 3,
      "row": 4,
      "size": 1,
      "mult": 2
     },
     {
      "reel": 2,
      "row": 2,
      "size": 1,
      "mult": 8
     },
     {
      "reel": 0,
      "row": 2,
      "size": 1,
      "mult": 3
     }
    ]
   },
   {
    "index": 42,
    "type": "setTotalWin",
    "amount": 340
   },
   {
    "index": 43,
    "type": "updateFreeSpin",
    "amount": 7,
    "total": 10
   },
   {
    "index": 44,
    "type": "reveal",
    "board": [
     [
      {
       "name": "H4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "H1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "W",
       "wild": true
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "H3"
      },
      {
       "name": "H3"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "H5"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "H5"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      }
     ]
    ],
    "paddingPositions": [
     602,
     117,
     187,
     725,
     853
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 45,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 2,
      "size": 1,
      "mult": 7
     },
     {
      "reel": 3,
      "row": 4,
      "size": 1,
      "mult": 2
     },
     {
      "reel": 2,
      "row": 2,
      "size": 1,
      "mult": 8
     },
     {
      "reel": 0,
      "row": 2,
      "size": 1,
      "mult": 3
     }
    ]
   },
   {
    "index": 46,
    "type": "setTotalWin",
    "amount": 340
   },
   {
    "index": 47,
    "type": "updateFreeSpin",
    "amount": 8,
    "total": 10
   },
   {
    "index": 48,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "H1"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      }
     ]
    ],
    "paddingPositions": [
     14,
     1003,
     910,
     998,
     1012
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 49,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 2,
      "size": 1,
      "mult": 7
     },
     {
      "reel": 3,
      "row": 4,
      "size": 1,
      "mult": 2
     },
     {
      "reel": 2,
      "row": 2,
      "size": 1,
      "mult": 8
     },
     {
      "reel": 0,
      "row": 2,
      "size": 1,
      "mult": 3
     }
    ]
   },
   {
    "index": 50,
    "type": "winInfo",
    "totalWin": 140,
    "wins": [
     {
      "symbol": "L3",
      "kind": 4,
      "win": 100,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 1
       },
       {
        "reel": 2,
        "row": 1
       },
       {
        "reel": 3,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 1,
       "multiplier": 1,
       "winWithoutMult": 100,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 100
      }
     },
     {
      "symbol": "L3",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 13,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     }
    ]
   },
   {
    "index": 51,
    "type": "setWin",
    "amount": 140,
    "winLevel": 3
   },
   {
    "index": 52,
    "type": "setTotalWin",
    "amount": 480
   },
   {
    "index": 53,
    "type": "updateFreeSpin",
    "amount": 9,
    "total": 10
   },
   {
    "index": 54,
    "type": "freeSpinEnd",
    "amount": 480,
    "winLevel": 2
   },
   {
    "index": 55,
    "type": "finalWin",
    "amount": 480
   }
  ],
  "criteria": "ordinary",
  "basePayout": 0,
  "featurePayout": 480,
  "featureTier": "capo"
 },
 {
  "id": 3,
  "mode": "bonus_hits",
  "payoutMultiplier": 10140,
  "events": [
   {
    "index": 0,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "H3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "H5"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      }
     ]
    ],
    "paddingPositions": [
     649,
     460,
     787,
     687,
     302
    ],
    "anticipation": [
     0,
     0,
     1,
     1,
     2
    ],
    "gameType": "basegame"
   },
   {
    "index": 1,
    "type": "setTotalWin",
    "amount": 0
   },
   {
    "index": 2,
    "type": "freeSpinTrigger",
    "totalFs": 10,
    "positions": [
     {
      "reel": 0,
      "row": 2
     },
     {
      "reel": 1,
      "row": 4
     },
     {
      "reel": 3,
      "row": 3
     },
     {
      "reel": 4,
      "row": 1
     }
    ]
   },
   {
    "index": 3,
    "type": "bonusTier",
    "tier": "capo",
    "seedFrames": 3
   },
   {
    "index": 4,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "H5"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "H5"
      },
      {
       "name": "L1"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L1"
      },
      {
       "name": "H5"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "H4"
      },
      {
       "name": "L3"
      },
      {
       "name": "H5"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "H3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      }
     ]
    ],
    "paddingPositions": [
     142,
     541,
     74,
     770,
     313
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 5,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 3,
      "row": 2,
      "size": 2,
      "mult": 3
     },
     {
      "reel": 0,
      "row": 2,
      "size": 3,
      "mult": 5
     },
     {
      "reel": 2,
      "row": 1,
      "size": 1,
      "mult": 6
     }
    ]
   },
   {
    "index": 6,
    "type": "setTotalWin",
    "amount": 0
   },
   {
    "index": 7,
    "type": "updateFreeSpin",
    "amount": 0,
    "total": 10
   },
   {
    "index": 8,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L1"
      },
      {
       "name": "H4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "H2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "H2"
      },
      {
       "name": "H5"
      },
      {
       "name": "H4"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "H5"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      }
     ]
    ],
    "paddingPositions": [
     165,
     181,
     812,
     400,
     183
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 9,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 3,
      "row": 2,
      "size": 2,
      "mult": 3
     },
     {
      "reel": 0,
      "row": 2,
      "size": 3,
      "mult": 5
     },
     {
      "reel": 2,
      "row": 1,
      "size": 1,
      "mult": 6
     },
     {
      "reel": 4,
      "row": 1,
      "size": 1,
      "mult": 6
     }
    ]
   },
   {
    "index": 10,
    "type": "newFrames",
    "frames": [
     {
      "reel": 4,
      "row": 1,
      "size": 1,
      "mult": 6
     }
    ]
   },
   {
    "index": 11,
    "type": "winInfo",
    "totalWin": 600,
    "wins": [
     {
      "symbol": "L1",
      "kind": 3,
      "win": 600,
      "positions": [
       {
        "reel": 0,
        "row": 2
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 2,
       "multiplier": 15,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 15,
       "uncappedWin": 600
      }
     }
    ]
   },
   {
    "index": 12,
    "type": "setWin",
    "amount": 600,
    "winLevel": 5
   },
   {
    "index": 13,
    "type": "setTotalWin",
    "amount": 600
   },
   {
    "index": 14,
    "type": "frameDoubling",
    "frames": [
     {
      "reel": 0,
      "row": 2,
      "size": 3,
      "mult": 10
     }
    ]
   },
   {
    "index": 15,
    "type": "updateFreeSpin",
    "amount": 1,
    "total": 10
   },
   {
    "index": 16,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "SW"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "H5"
      },
      {
       "name": "H5"
      }
     ],
     [
      {
       "name": "H4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "H5"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      }
     ]
    ],
    "paddingPositions": [
     603,
     428,
     259,
     341,
     116
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 17,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 3,
      "row": 2,
      "size": 2,
      "mult": 3
     },
     {
      "reel": 0,
      "row": 2,
      "size": 3,
      "mult": 10
     },
     {
      "reel": 2,
      "row": 1,
      "size": 1,
      "mult": 6
     },
     {
      "reel": 4,
      "row": 1,
      "size": 1,
      "mult": 6
     }
    ]
   },
   {
    "index": 18,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 1,
      "row": 1
     }
    ],
    "reels": [
     1
    ]
   },
   {
    "index": 19,
    "type": "winInfo",
    "totalWin": 9540,
    "wins": [
     {
      "symbol": "L2",
      "kind": 5,
      "win": 2400,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 1
       },
       {
        "reel": 2,
        "row": 1
       },
       {
        "reel": 3,
        "row": 1
       },
       {
        "reel": 4,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 1,
       "multiplier": 12,
       "winWithoutMult": 200,
       "globalMult": 1,
       "lineMultiplier": 12,
       "uncappedWin": 2400
      }
     },
     {
      "symbol": "L3",
      "kind": 3,
      "win": 1200,
      "positions": [
       {
        "reel": 0,
        "row": 2
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 2,
       "multiplier": 30,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 30,
       "uncappedWin": 1200
      }
     },
     {
      "symbol": "L2",
      "kind": 3,
      "win": 800,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 5,
       "multiplier": 20,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 20,
       "uncappedWin": 800
      }
     },
     {
      "symbol": "L3",
      "kind": 4,
      "win": 3300,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 2
       },
       {
        "reel": 3,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 7,
       "multiplier": 33,
       "winWithoutMult": 100,
       "globalMult": 1,
       "lineMultiplier": 33,
       "uncappedWin": 3300
      }
     },
     {
      "symbol": "L3",
      "kind": 3,
      "win": 1200,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 11,
       "multiplier": 30,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 30,
       "uncappedWin": 1200
      }
     },
     {
      "symbol": "L2",
      "kind": 3,
      "win": 640,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 13,
       "multiplier": 16,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 16,
       "uncappedWin": 640
      }
     }
    ]
   },
   {
    "index": 20,
    "type": "setWin",
    "amount": 9540,
    "winLevel": 8
   },
   {
    "index": 21,
    "type": "setTotalWin",
    "amount": 10140
   },
   {
    "index": 22,
    "type": "frameDoubling",
    "frames": [
     {
      "reel": 3,
      "row": 2,
      "size": 2,
      "mult": 6
     },
     {
      "reel": 0,
      "row": 2,
      "size": 3,
      "mult": 20
     },
     {
      "reel": 2,
      "row": 1,
      "size": 1,
      "mult": 12
     },
     {
      "reel": 4,
      "row": 1,
      "size": 1,
      "mult": 12
     }
    ]
   },
   {
    "index": 23,
    "type": "updateFreeSpin",
    "amount": 2,
    "total": 10
   },
   {
    "index": 24,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L3"
      },
      {
       "name": "H5"
      },
      {
       "name": "L2"
      },
      {
       "name": "H3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "H5"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "W",
       "wild": true
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      }
     ]
    ],
    "paddingPositions": [
     887,
     207,
     78,
     138,
     942
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 25,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 3,
      "row": 2,
      "size": 2,
      "mult": 6
     },
     {
      "reel": 0,
      "row": 2,
      "size": 3,
      "mult": 20
     },
     {
      "reel": 2,
      "row": 1,
      "size": 1,
      "mult": 12
     },
     {
      "reel": 4,
      "row": 1,
      "size": 1,
      "mult": 12
     }
    ]
   },
   {
    "index": 26,
    "type": "setTotalWin",
    "amount": 10140
   },
   {
    "index": 27,
    "type": "updateFreeSpin",
    "amount": 3,
    "total": 10
   },
   {
    "index": 28,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "H3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "H5"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "H5"
      },
      {
       "name": "H4"
      },
      {
       "name": "L4"
      },
      {
       "name": "H5"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      }
     ]
    ],
    "paddingPositions": [
     257,
     50,
     54,
     117,
     21
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 29,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 3,
      "row": 2,
      "size": 2,
      "mult": 6
     },
     {
      "reel": 0,
      "row": 2,
      "size": 3,
      "mult": 20
     },
     {
      "reel": 2,
      "row": 1,
      "size": 1,
      "mult": 12
     },
     {
      "reel": 4,
      "row": 1,
      "size": 1,
      "mult": 12
     }
    ]
   },
   {
    "index": 30,
    "type": "setTotalWin",
    "amount": 10140
   },
   {
    "index": 31,
    "type": "updateFreeSpin",
    "amount": 4,
    "total": 10
   },
   {
    "index": 32,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "H4"
      },
      {
       "name": "H4"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "H4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "H5"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "H5"
      },
      {
       "name": "H4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      }
     ]
    ],
    "paddingPositions": [
     1023,
     890,
     944,
     874,
     304
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 33,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 3,
      "row": 2,
      "size": 2,
      "mult": 6
     },
     {
      "reel": 0,
      "row": 2,
      "size": 3,
      "mult": 20
     },
     {
      "reel": 2,
      "row": 1,
      "size": 1,
      "mult": 12
     },
     {
      "reel": 4,
      "row": 1,
      "size": 1,
      "mult": 12
     }
    ]
   },
   {
    "index": 34,
    "type": "setTotalWin",
    "amount": 10140
   },
   {
    "index": 35,
    "type": "updateFreeSpin",
    "amount": 5,
    "total": 10
   },
   {
    "index": 36,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L3"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "H5"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "H5"
      },
      {
       "name": "L4"
      },
      {
       "name": "H3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "H4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "H5"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      }
     ]
    ],
    "paddingPositions": [
     250,
     975,
     647,
     347,
     765
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 37,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 3,
      "row": 2,
      "size": 2,
      "mult": 6
     },
     {
      "reel": 0,
      "row": 2,
      "size": 3,
      "mult": 20
     },
     {
      "reel": 2,
      "row": 1,
      "size": 1,
      "mult": 12
     },
     {
      "reel": 4,
      "row": 1,
      "size": 1,
      "mult": 12
     }
    ]
   },
   {
    "index": 38,
    "type": "setTotalWin",
    "amount": 10140
   },
   {
    "index": 39,
    "type": "updateFreeSpin",
    "amount": 6,
    "total": 10
   },
   {
    "index": 40,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "H5"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "H3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "W",
       "wild": true
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "H5"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      }
     ]
    ],
    "paddingPositions": [
     629,
     294,
     874,
     90,
     758
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 41,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 3,
      "row": 2,
      "size": 2,
      "mult": 6
     },
     {
      "reel": 0,
      "row": 2,
      "size": 3,
      "mult": 20
     },
     {
      "reel": 2,
      "row": 1,
      "size": 1,
      "mult": 12
     },
     {
      "reel": 4,
      "row": 1,
      "size": 1,
      "mult": 12
     }
    ]
   },
   {
    "index": 42,
    "type": "setTotalWin",
    "amount": 10140
   },
   {
    "index": 43,
    "type": "updateFreeSpin",
    "amount": 7,
    "total": 10
   },
   {
    "index": 44,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "H3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "H4"
      },
      {
       "name": "H3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "H5"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      }
     ]
    ],
    "paddingPositions": [
     396,
     40,
     208,
     94,
     800
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 45,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 3,
      "row": 2,
      "size": 2,
      "mult": 6
     },
     {
      "reel": 0,
      "row": 2,
      "size": 3,
      "mult": 20
     },
     {
      "reel": 2,
      "row": 1,
      "size": 1,
      "mult": 12
     },
     {
      "reel": 4,
      "row": 1,
      "size": 1,
      "mult": 12
     }
    ]
   },
   {
    "index": 46,
    "type": "setTotalWin",
    "amount": 10140
   },
   {
    "index": 47,
    "type": "updateFreeSpin",
    "amount": 8,
    "total": 10
   },
   {
    "index": 48,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "H5"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "H4"
      },
      {
       "name": "L2"
      },
      {
       "name": "H3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "H4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      }
     ]
    ],
    "paddingPositions": [
     722,
     98,
     684,
     299,
     684
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 49,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 3,
      "row": 2,
      "size": 2,
      "mult": 6
     },
     {
      "reel": 0,
      "row": 2,
      "size": 3,
      "mult": 20
     },
     {
      "reel": 2,
      "row": 1,
      "size": 1,
      "mult": 12
     },
     {
      "reel": 4,
      "row": 1,
      "size": 1,
      "mult": 12
     },
     {
      "reel": 4,
      "row": 4,
      "size": 1,
      "mult": 3
     }
    ]
   },
   {
    "index": 50,
    "type": "newFrames",
    "frames": [
     {
      "reel": 4,
      "row": 4,
      "size": 1,
      "mult": 3
     }
    ]
   },
   {
    "index": 51,
    "type": "setTotalWin",
    "amount": 10140
   },
   {
    "index": 52,
    "type": "updateFreeSpin",
    "amount": 9,
    "total": 10
   },
   {
    "index": 53,
    "type": "freeSpinEnd",
    "amount": 10140,
    "winLevel": 7
   },
   {
    "index": 54,
    "type": "finalWin",
    "amount": 10140
   }
  ],
  "criteria": "ordinary",
  "basePayout": 0,
  "featurePayout": 10140,
  "featureTier": "capo"
 },
 {
  "id": 11,
  "mode": "bonus_hits",
  "payoutMultiplier": 5900,
  "events": [
   {
    "index": 0,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "H3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "H4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "H2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L2"
      }
     ]
    ],
    "paddingPositions": [
     649,
     861,
     276,
     389,
     299
    ],
    "anticipation": [
     0,
     0,
     1,
     2,
     2
    ],
    "gameType": "basegame"
   },
   {
    "index": 1,
    "type": "setTotalWin",
    "amount": 0
   },
   {
    "index": 2,
    "type": "freeSpinTrigger",
    "totalFs": 10,
    "positions": [
     {
      "reel": 0,
      "row": 2
     },
     {
      "reel": 1,
      "row": 3
     },
     {
      "reel": 2,
      "row": 1
     },
     {
      "reel": 4,
      "row": 4
     }
    ]
   },
   {
    "index": 3,
    "type": "bonusTier",
    "tier": "capo",
    "seedFrames": 3
   },
   {
    "index": 4,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "H4"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "SW"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "SW"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "H5"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "H5"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      }
     ]
    ],
    "paddingPositions": [
     162,
     132,
     782,
     236,
     538
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 5,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 2,
      "row": 3,
      "size": 2,
      "mult": 3
     },
     {
      "reel": 0,
      "row": 2,
      "size": 1,
      "mult": 3
     },
     {
      "reel": 1,
      "row": 4,
      "size": 1,
      "mult": 2
     }
    ]
   },
   {
    "index": 6,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 1,
      "row": 2
     },
     {
      "reel": 2,
      "row": 1
     }
    ],
    "reels": [
     1,
     2
    ]
   },
   {
    "index": 7,
    "type": "winInfo",
    "totalWin": 3440,
    "wins": [
     {
      "symbol": "L4",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 1
       },
       {
        "reel": 2,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 1,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L1",
      "kind": 3,
      "win": 120,
      "positions": [
       {
        "reel": 0,
        "row": 2
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 2,
       "multiplier": 3,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 3,
       "uncappedWin": 120
      }
     },
     {
      "symbol": "L1",
      "kind": 3,
      "win": 120,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 3,
       "multiplier": 3,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 3,
       "uncappedWin": 120
      }
     },
     {
      "symbol": "H4",
      "kind": 3,
      "win": 1000,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 4
       },
       {
        "reel": 2,
        "row": 4
       }
      ],
      "meta": {
       "lineIndex": 4,
       "multiplier": 5,
       "winWithoutMult": 200,
       "globalMult": 1,
       "lineMultiplier": 5,
       "uncappedWin": 1000
      }
     },
     {
      "symbol": "L4",
      "kind": 3,
      "win": 120,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 5,
       "multiplier": 3,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 3,
       "uncappedWin": 120
      }
     },
     {
      "symbol": "L1",
      "kind": 3,
      "win": 240,
      "positions": [
       {
        "reel": 0,
        "row": 2
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 4
       }
      ],
      "meta": {
       "lineIndex": 6,
       "multiplier": 6,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 6,
       "uncappedWin": 240
      }
     },
     {
      "symbol": "H4",
      "kind": 3,
      "win": 200,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 7,
       "multiplier": 1,
       "winWithoutMult": 200,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 200
      }
     },
     {
      "symbol": "L1",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 8,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L4",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 9,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L1",
      "kind": 3,
      "win": 240,
      "positions": [
       {
        "reel": 0,
        "row": 2
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 10,
       "multiplier": 6,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 6,
       "uncappedWin": 240
      }
     },
     {
      "symbol": "L1",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 11,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "H4",
      "kind": 3,
      "win": 600,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 12,
       "multiplier": 3,
       "winWithoutMult": 200,
       "globalMult": 1,
       "lineMultiplier": 3,
       "uncappedWin": 600
      }
     },
     {
      "symbol": "L4",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 13,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "H4",
      "kind": 3,
      "win": 600,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 4
       }
      ],
      "meta": {
       "lineIndex": 14,
       "multiplier": 3,
       "winWithoutMult": 200,
       "globalMult": 1,
       "lineMultiplier": 3,
       "uncappedWin": 600
      }
     }
    ]
   },
   {
    "index": 8,
    "type": "setWin",
    "amount": 3440,
    "winLevel": 7
   },
   {
    "index": 9,
    "type": "setTotalWin",
    "amount": 3440
   },
   {
    "index": 10,
    "type": "frameDoubling",
    "frames": [
     {
      "reel": 2,
      "row": 3,
      "size": 2,
      "mult": 6
     },
     {
      "reel": 0,
      "row": 2,
      "size": 1,
      "mult": 6
     },
     {
      "reel": 1,
      "row": 4,
      "size": 1,
      "mult": 4
     }
    ]
   },
   {
    "index": 11,
    "type": "updateFreeSpin",
    "amount": 0,
    "total": 10
   },
   {
    "index": 12,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L1"
      },
      {
       "name": "H5"
      },
      {
       "name": "L3"
      },
      {
       "name": "W",
       "wild": true
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "H3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "H5"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "H2"
      },
      {
       "name": "H5"
      },
      {
       "name": "H4"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      }
     ]
    ],
    "paddingPositions": [
     362,
     214,
     813,
     175,
     532
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 13,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 2,
      "row": 3,
      "size": 2,
      "mult": 6
     },
     {
      "reel": 0,
      "row": 2,
      "size": 1,
      "mult": 6
     },
     {
      "reel": 1,
      "row": 4,
      "size": 1,
      "mult": 4
     }
    ]
   },
   {
    "index": 14,
    "type": "winInfo",
    "totalWin": 100,
    "wins": [
     {
      "symbol": "L1",
      "kind": 4,
      "win": 100,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 1
       },
       {
        "reel": 3,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 8,
       "multiplier": 1,
       "winWithoutMult": 100,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 100
      }
     }
    ]
   },
   {
    "index": 15,
    "type": "setWin",
    "amount": 100,
    "winLevel": 3
   },
   {
    "index": 16,
    "type": "setTotalWin",
    "amount": 3540
   },
   {
    "index": 17,
    "type": "updateFreeSpin",
    "amount": 1,
    "total": 10
   },
   {
    "index": 18,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "H2"
      },
      {
       "name": "L3"
      },
      {
       "name": "H3"
      }
     ]
    ],
    "paddingPositions": [
     982,
     577,
     626,
     655,
     260
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 19,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 2,
      "row": 3,
      "size": 2,
      "mult": 6
     },
     {
      "reel": 0,
      "row": 2,
      "size": 1,
      "mult": 6
     },
     {
      "reel": 1,
      "row": 4,
      "size": 1,
      "mult": 4
     }
    ]
   },
   {
    "index": 20,
    "type": "winInfo",
    "totalWin": 120,
    "wins": [
     {
      "symbol": "L3",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 1
       },
       {
        "reel": 2,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 1,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L3",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 9,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L3",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 13,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     }
    ]
   },
   {
    "index": 21,
    "type": "setWin",
    "amount": 120,
    "winLevel": 3
   },
   {
    "index": 22,
    "type": "setTotalWin",
    "amount": 3660
   },
   {
    "index": 23,
    "type": "updateFreeSpin",
    "amount": 2,
    "total": 10
   },
   {
    "index": 24,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "SW"
      },
      {
       "name": "H1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "H1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "H5"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "H5"
      },
      {
       "name": "H4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      }
     ]
    ],
    "paddingPositions": [
     428,
     915,
     918,
     406,
     304
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 25,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 2,
      "row": 3,
      "size": 2,
      "mult": 6
     },
     {
      "reel": 0,
      "row": 2,
      "size": 1,
      "mult": 6
     },
     {
      "reel": 1,
      "row": 4,
      "size": 1,
      "mult": 4
     }
    ]
   },
   {
    "index": 26,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 1,
      "row": 2
     }
    ],
    "reels": [
     1
    ]
   },
   {
    "index": 27,
    "type": "winInfo",
    "totalWin": 1200,
    "wins": [
     {
      "symbol": "L3",
      "kind": 3,
      "win": 240,
      "positions": [
       {
        "reel": 0,
        "row": 2
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 2,
       "multiplier": 6,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 6,
       "uncappedWin": 240
      }
     },
     {
      "symbol": "L2",
      "kind": 3,
      "win": 400,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 4
       },
       {
        "reel": 2,
        "row": 4
       }
      ],
      "meta": {
       "lineIndex": 4,
       "multiplier": 10,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 10,
       "uncappedWin": 400
      }
     },
     {
      "symbol": "L3",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 8,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L3",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 11,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L2",
      "kind": 3,
      "win": 240,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 12,
       "multiplier": 6,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 6,
       "uncappedWin": 240
      }
     },
     {
      "symbol": "L2",
      "kind": 3,
      "win": 240,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 4
       }
      ],
      "meta": {
       "lineIndex": 14,
       "multiplier": 6,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 6,
       "uncappedWin": 240
      }
     }
    ]
   },
   {
    "index": 28,
    "type": "setWin",
    "amount": 1200,
    "winLevel": 5
   },
   {
    "index": 29,
    "type": "setTotalWin",
    "amount": 4860
   },
   {
    "index": 30,
    "type": "frameDoubling",
    "frames": [
     {
      "reel": 2,
      "row": 3,
      "size": 2,
      "mult": 12
     },
     {
      "reel": 0,
      "row": 2,
      "size": 1,
      "mult": 12
     },
     {
      "reel": 1,
      "row": 4,
      "size": 1,
      "mult": 8
     }
    ]
   },
   {
    "index": 31,
    "type": "updateFreeSpin",
    "amount": 3,
    "total": 10
   },
   {
    "index": 32,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "H3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "H5"
      },
      {
       "name": "L2"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "H4"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "H5"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      }
     ]
    ],
    "paddingPositions": [
     839,
     997,
     275,
     287,
     139
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     1
    ],
    "gameType": "freegame"
   },
   {
    "index": 33,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 2,
      "row": 3,
      "size": 2,
      "mult": 12
     },
     {
      "reel": 0,
      "row": 2,
      "size": 1,
      "mult": 12
     },
     {
      "reel": 1,
      "row": 4,
      "size": 1,
      "mult": 8
     }
    ]
   },
   {
    "index": 34,
    "type": "winInfo",
    "totalWin": 480,
    "wins": [
     {
      "symbol": "L3",
      "kind": 3,
      "win": 480,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 3,
       "multiplier": 12,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 12,
       "uncappedWin": 480
      }
     }
    ]
   },
   {
    "index": 35,
    "type": "setWin",
    "amount": 480,
    "winLevel": 4
   },
   {
    "index": 36,
    "type": "setTotalWin",
    "amount": 5340
   },
   {
    "index": 37,
    "type": "frameDoubling",
    "frames": [
     {
      "reel": 2,
      "row": 3,
      "size": 2,
      "mult": 24
     }
    ]
   },
   {
    "index": 38,
    "type": "freeSpinRetrigger",
    "totalFs": 12,
    "positions": [
     {
      "reel": 2,
      "row": 2
     },
     {
      "reel": 3,
      "row": 3
     }
    ]
   },
   {
    "index": 39,
    "type": "updateFreeSpin",
    "amount": 4,
    "total": 12
   },
   {
    "index": 40,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "H5"
      },
      {
       "name": "H3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "H3"
      },
      {
       "name": "L3"
      },
      {
       "name": "H3"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "H4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      }
     ]
    ],
    "paddingPositions": [
     466,
     983,
     594,
     936,
     786
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 41,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 2,
      "row": 3,
      "size": 2,
      "mult": 24
     },
     {
      "reel": 0,
      "row": 2,
      "size": 1,
      "mult": 12
     },
     {
      "reel": 1,
      "row": 4,
      "size": 1,
      "mult": 8
     }
    ]
   },
   {
    "index": 42,
    "type": "setTotalWin",
    "amount": 5340
   },
   {
    "index": 43,
    "type": "updateFreeSpin",
    "amount": 5,
    "total": 12
   },
   {
    "index": 44,
    "type": "reveal",
    "board": [
     [
      {
       "name": "H5"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "H1"
      },
      {
       "name": "L3"
      },
      {
       "name": "H2"
      },
      {
       "name": "H4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "H5"
      },
      {
       "name": "H5"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "H4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "H3"
      },
      {
       "name": "L4"
      }
     ]
    ],
    "paddingPositions": [
     502,
     904,
     149,
     291,
     703
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 45,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 2,
      "row": 3,
      "size": 2,
      "mult": 24
     },
     {
      "reel": 0,
      "row": 2,
      "size": 1,
      "mult": 12
     },
     {
      "reel": 1,
      "row": 4,
      "size": 1,
      "mult": 8
     }
    ]
   },
   {
    "index": 46,
    "type": "setTotalWin",
    "amount": 5340
   },
   {
    "index": 47,
    "type": "updateFreeSpin",
    "amount": 6,
    "total": 12
   },
   {
    "index": 48,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L3"
      },
      {
       "name": "H5"
      },
      {
       "name": "L2"
      },
      {
       "name": "H3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "H3"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "SW"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "H4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      }
     ]
    ],
    "paddingPositions": [
     887,
     681,
     192,
     67,
     182
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 49,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 2,
      "row": 3,
      "size": 2,
      "mult": 24
     },
     {
      "reel": 0,
      "row": 2,
      "size": 1,
      "mult": 12
     },
     {
      "reel": 1,
      "row": 4,
      "size": 1,
      "mult": 8
     }
    ]
   },
   {
    "index": 50,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 2,
      "row": 1
     }
    ],
    "reels": [
     2
    ]
   },
   {
    "index": 51,
    "type": "winInfo",
    "totalWin": 480,
    "wins": [
     {
      "symbol": "L2",
      "kind": 3,
      "win": 480,
      "positions": [
       {
        "reel": 0,
        "row": 2
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 2,
       "multiplier": 12,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 12,
       "uncappedWin": 480
      }
     }
    ]
   },
   {
    "index": 52,
    "type": "setWin",
    "amount": 480,
    "winLevel": 4
   },
   {
    "index": 53,
    "type": "setTotalWin",
    "amount": 5820
   },
   {
    "index": 54,
    "type": "frameDoubling",
    "frames": [
     {
      "reel": 0,
      "row": 2,
      "size": 1,
      "mult": 24
     }
    ]
   },
   {
    "index": 55,
    "type": "updateFreeSpin",
    "amount": 7,
    "total": 12
   },
   {
    "index": 56,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L4"
      },
      {
       "name": "H2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "H1"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "H1"
      },
      {
       "name": "SW"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "H5"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "H5"
      },
      {
       "name": "L4"
      }
     ]
    ],
    "paddingPositions": [
     560,
     409,
     932,
     217,
     867
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 57,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 2,
      "row": 3,
      "size": 2,
      "mult": 24
     },
     {
      "reel": 0,
      "row": 2,
      "size": 1,
      "mult": 24
     },
     {
      "reel": 1,
      "row": 4,
      "size": 1,
      "mult": 8
     }
    ]
   },
   {
    "index": 58,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 2,
      "row": 1
     }
    ],
    "reels": [
     2
    ]
   },
   {
    "index": 59,
    "type": "winInfo",
    "totalWin": 80,
    "wins": [
     {
      "symbol": "L1",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 8,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L1",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 11,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     }
    ]
   },
   {
    "index": 60,
    "type": "setWin",
    "amount": 80,
    "winLevel": 2
   },
   {
    "index": 61,
    "type": "setTotalWin",
    "amount": 5900
   },
   {
    "index": 62,
    "type": "updateFreeSpin",
    "amount": 8,
    "total": 12
   },
   {
    "index": 63,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "H3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "H5"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "H5"
      }
     ]
    ],
    "paddingPositions": [
     866,
     833,
     351,
     567,
     788
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 64,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 2,
      "row": 3,
      "size": 2,
      "mult": 24
     },
     {
      "reel": 0,
      "row": 2,
      "size": 1,
      "mult": 24
     },
     {
      "reel": 1,
      "row": 4,
      "size": 1,
      "mult": 8
     }
    ]
   },
   {
    "index": 65,
    "type": "setTotalWin",
    "amount": 5900
   },
   {
    "index": 66,
    "type": "updateFreeSpin",
    "amount": 9,
    "total": 12
   },
   {
    "index": 67,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "W",
       "wild": true
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "H4"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      }
     ]
    ],
    "paddingPositions": [
     984,
     320,
     900,
     906,
     32
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 68,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 2,
      "row": 3,
      "size": 2,
      "mult": 24
     },
     {
      "reel": 0,
      "row": 2,
      "size": 1,
      "mult": 24
     },
     {
      "reel": 1,
      "row": 4,
      "size": 1,
      "mult": 8
     }
    ]
   },
   {
    "index": 69,
    "type": "setTotalWin",
    "amount": 5900
   },
   {
    "index": 70,
    "type": "updateFreeSpin",
    "amount": 10,
    "total": 12
   },
   {
    "index": 71,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "H5"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "H5"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      }
     ]
    ],
    "paddingPositions": [
     275,
     340,
     506,
     651,
     8
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 72,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 2,
      "row": 3,
      "size": 2,
      "mult": 24
     },
     {
      "reel": 0,
      "row": 2,
      "size": 1,
      "mult": 24
     },
     {
      "reel": 1,
      "row": 4,
      "size": 1,
      "mult": 8
     }
    ]
   },
   {
    "index": 73,
    "type": "setTotalWin",
    "amount": 5900
   },
   {
    "index": 74,
    "type": "updateFreeSpin",
    "amount": 11,
    "total": 12
   },
   {
    "index": 75,
    "type": "freeSpinEnd",
    "amount": 5900,
    "winLevel": 6
   },
   {
    "index": 76,
    "type": "finalWin",
    "amount": 5900
   }
  ],
  "criteria": "ordinary",
  "basePayout": 0,
  "featurePayout": 5900,
  "featureTier": "capo"
 },
 {
  "id": 13,
  "mode": "bonus_hits",
  "payoutMultiplier": 67220,
  "events": [
   {
    "index": 0,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L4"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "H1"
      },
      {
       "name": "SW"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L2"
      },
      {
       "name": "H5"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "H5"
      },
      {
       "name": "L4"
      },
      {
       "name": "H5"
      },
      {
       "name": "L2"
      },
      {
       "name": "H5"
      }
     ]
    ],
    "paddingPositions": [
     250,
     928,
     75,
     889,
     278
    ],
    "anticipation": [
     0,
     0,
     1,
     2,
     2
    ],
    "gameType": "basegame"
   },
   {
    "index": 1,
    "type": "setTotalWin",
    "amount": 0
   },
   {
    "index": 2,
    "type": "freeSpinTrigger",
    "totalFs": 10,
    "positions": [
     {
      "reel": 0,
      "row": 1
     },
     {
      "reel": 1,
      "row": 3
     },
     {
      "reel": 2,
      "row": 2
     },
     {
      "reel": 3,
      "row": 1
     }
    ]
   },
   {
    "index": 3,
    "type": "bonusTier",
    "tier": "capo",
    "seedFrames": 3
   },
   {
    "index": 4,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "H5"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "H5"
      },
      {
       "name": "H5"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "SW"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      }
     ]
    ],
    "paddingPositions": [
     641,
     88,
     761,
     369,
     381
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 5,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 1,
      "row": 3,
      "size": 1,
      "mult": 7
     },
     {
      "reel": 0,
      "row": 4,
      "size": 1,
      "mult": 5
     },
     {
      "reel": 2,
      "row": 3,
      "size": 2,
      "mult": 4
     }
    ]
   },
   {
    "index": 6,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 3,
      "row": 1
     }
    ],
    "reels": [
     3
    ]
   },
   {
    "index": 7,
    "type": "setTotalWin",
    "amount": 0
   },
   {
    "index": 8,
    "type": "updateFreeSpin",
    "amount": 0,
    "total": 10
   },
   {
    "index": 9,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "H3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "SW"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "H4"
      }
     ],
     [
      {
       "name": "H3"
      },
      {
       "name": "H4"
      },
      {
       "name": "L1"
      },
      {
       "name": "H3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      }
     ]
    ],
    "paddingPositions": [
     946,
     832,
     609,
     933,
     278
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 10,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 1,
      "row": 3,
      "size": 1,
      "mult": 7
     },
     {
      "reel": 0,
      "row": 4,
      "size": 1,
      "mult": 5
     },
     {
      "reel": 2,
      "row": 3,
      "size": 2,
      "mult": 4
     }
    ]
   },
   {
    "index": 11,
    "type": "setTotalWin",
    "amount": 0
   },
   {
    "index": 12,
    "type": "updateFreeSpin",
    "amount": 1,
    "total": 10
   },
   {
    "index": 13,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "SW"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "H2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      }
     ]
    ],
    "paddingPositions": [
     815,
     535,
     838,
     68,
     656
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 14,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 1,
      "row": 3,
      "size": 1,
      "mult": 7
     },
     {
      "reel": 0,
      "row": 4,
      "size": 1,
      "mult": 5
     },
     {
      "reel": 2,
      "row": 3,
      "size": 2,
      "mult": 4
     },
     {
      "reel": 0,
      "row": 1,
      "size": 2,
      "mult": 4
     }
    ]
   },
   {
    "index": 15,
    "type": "newFrames",
    "frames": [
     {
      "reel": 0,
      "row": 1,
      "size": 2,
      "mult": 4
     }
    ]
   },
   {
    "index": 16,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 2,
      "row": 4
     }
    ],
    "reels": [
     2
    ]
   },
   {
    "index": 17,
    "type": "winInfo",
    "totalWin": 5240,
    "wins": [
     {
      "symbol": "L1",
      "kind": 3,
      "win": 320,
      "positions": [
       {
        "reel": 0,
        "row": 2
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 2,
       "multiplier": 8,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 8,
       "uncappedWin": 320
      }
     },
     {
      "symbol": "L1",
      "kind": 3,
      "win": 480,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 5,
       "multiplier": 12,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 12,
       "uncappedWin": 480
      }
     },
     {
      "symbol": "L1",
      "kind": 4,
      "win": 1900,
      "positions": [
       {
        "reel": 0,
        "row": 2
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 4
       },
       {
        "reel": 3,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 6,
       "multiplier": 19,
       "winWithoutMult": 100,
       "globalMult": 1,
       "lineMultiplier": 19,
       "uncappedWin": 1900
      }
     },
     {
      "symbol": "L1",
      "kind": 3,
      "win": 320,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 9,
       "multiplier": 8,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 8,
       "uncappedWin": 320
      }
     },
     {
      "symbol": "L1",
      "kind": 4,
      "win": 1900,
      "positions": [
       {
        "reel": 0,
        "row": 2
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 3
       },
       {
        "reel": 3,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 10,
       "multiplier": 19,
       "winWithoutMult": 100,
       "globalMult": 1,
       "lineMultiplier": 19,
       "uncappedWin": 1900
      }
     },
     {
      "symbol": "L1",
      "kind": 3,
      "win": 320,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 13,
       "multiplier": 8,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 8,
       "uncappedWin": 320
      }
     }
    ]
   },
   {
    "index": 18,
    "type": "setWin",
    "amount": 5240,
    "winLevel": 8
   },
   {
    "index": 19,
    "type": "setTotalWin",
    "amount": 5240
   },
   {
    "index": 20,
    "type": "frameDoubling",
    "frames": [
     {
      "reel": 1,
      "row": 3,
      "size": 1,
      "mult": 14
     },
     {
      "reel": 2,
      "row": 3,
      "size": 2,
      "mult": 8
     },
     {
      "reel": 0,
      "row": 1,
      "size": 2,
      "mult": 8
     }
    ]
   },
   {
    "index": 21,
    "type": "updateFreeSpin",
    "amount": 2,
    "total": 10
   },
   {
    "index": 22,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L2"
      },
      {
       "name": "H4"
      },
      {
       "name": "H1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      }
     ]
    ],
    "paddingPositions": [
     924,
     730,
     466,
     103,
     339
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 23,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 1,
      "row": 3,
      "size": 1,
      "mult": 14
     },
     {
      "reel": 0,
      "row": 4,
      "size": 1,
      "mult": 5
     },
     {
      "reel": 2,
      "row": 3,
      "size": 2,
      "mult": 8
     },
     {
      "reel": 0,
      "row": 1,
      "size": 2,
      "mult": 8
     }
    ]
   },
   {
    "index": 24,
    "type": "setTotalWin",
    "amount": 5240
   },
   {
    "index": 25,
    "type": "updateFreeSpin",
    "amount": 3,
    "total": 10
   },
   {
    "index": 26,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "H1"
      },
      {
       "name": "SW"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "H3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "H5"
      },
      {
       "name": "L4"
      },
      {
       "name": "H4"
      },
      {
       "name": "L3"
      },
      {
       "name": "H5"
      },
      {
       "name": "L1"
      }
     ]
    ],
    "paddingPositions": [
     645,
     608,
     932,
     322,
     271
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 27,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 1,
      "row": 3,
      "size": 1,
      "mult": 14
     },
     {
      "reel": 0,
      "row": 4,
      "size": 1,
      "mult": 5
     },
     {
      "reel": 2,
      "row": 3,
      "size": 2,
      "mult": 8
     },
     {
      "reel": 0,
      "row": 1,
      "size": 2,
      "mult": 8
     },
     {
      "reel": 3,
      "row": 1,
      "size": 1,
      "mult": 3
     }
    ]
   },
   {
    "index": 28,
    "type": "newFrames",
    "frames": [
     {
      "reel": 3,
      "row": 1,
      "size": 1,
      "mult": 3
     }
    ]
   },
   {
    "index": 29,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 2,
      "row": 1
     }
    ],
    "reels": [
     2
    ]
   },
   {
    "index": 30,
    "type": "winInfo",
    "totalWin": 4520,
    "wins": [
     {
      "symbol": "L4",
      "kind": 3,
      "win": 760,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 7,
       "multiplier": 19,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 19,
       "uncappedWin": 760
      }
     },
     {
      "symbol": "L1",
      "kind": 4,
      "win": 800,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 1
       },
       {
        "reel": 3,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 8,
       "multiplier": 8,
       "winWithoutMult": 100,
       "globalMult": 1,
       "lineMultiplier": 8,
       "uncappedWin": 800
      }
     },
     {
      "symbol": "L1",
      "kind": 4,
      "win": 800,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       },
       {
        "reel": 3,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 11,
       "multiplier": 8,
       "winWithoutMult": 100,
       "globalMult": 1,
       "lineMultiplier": 8,
       "uncappedWin": 800
      }
     },
     {
      "symbol": "L4",
      "kind": 3,
      "win": 1080,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 12,
       "multiplier": 27,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 27,
       "uncappedWin": 1080
      }
     },
     {
      "symbol": "L4",
      "kind": 3,
      "win": 1080,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 4
       }
      ],
      "meta": {
       "lineIndex": 14,
       "multiplier": 27,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 27,
       "uncappedWin": 1080
      }
     }
    ]
   },
   {
    "index": 31,
    "type": "setWin",
    "amount": 4520,
    "winLevel": 7
   },
   {
    "index": 32,
    "type": "setTotalWin",
    "amount": 9760
   },
   {
    "index": 33,
    "type": "frameDoubling",
    "frames": [
     {
      "reel": 1,
      "row": 3,
      "size": 1,
      "mult": 28
     },
     {
      "reel": 0,
      "row": 4,
      "size": 1,
      "mult": 10
     },
     {
      "reel": 2,
      "row": 3,
      "size": 2,
      "mult": 16
     },
     {
      "reel": 0,
      "row": 1,
      "size": 2,
      "mult": 16
     }
    ]
   },
   {
    "index": 34,
    "type": "updateFreeSpin",
    "amount": 4,
    "total": 10
   },
   {
    "index": 35,
    "type": "reveal",
    "board": [
     [
      {
       "name": "W",
       "wild": true
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "H5"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "H5"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "H4"
      },
      {
       "name": "L2"
      },
      {
       "name": "H3"
      }
     ]
    ],
    "paddingPositions": [
     875,
     321,
     279,
     329,
     881
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 36,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 1,
      "row": 3,
      "size": 1,
      "mult": 28
     },
     {
      "reel": 0,
      "row": 4,
      "size": 1,
      "mult": 10
     },
     {
      "reel": 2,
      "row": 3,
      "size": 2,
      "mult": 16
     },
     {
      "reel": 0,
      "row": 1,
      "size": 2,
      "mult": 16
     },
     {
      "reel": 3,
      "row": 1,
      "size": 1,
      "mult": 3
     }
    ]
   },
   {
    "index": 37,
    "type": "setTotalWin",
    "amount": 9760
   },
   {
    "index": 38,
    "type": "updateFreeSpin",
    "amount": 5,
    "total": 10
   },
   {
    "index": 39,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "SW"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "H5"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "H4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      }
     ]
    ],
    "paddingPositions": [
     853,
     310,
     316,
     380,
     285
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 40,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 1,
      "row": 3,
      "size": 1,
      "mult": 28
     },
     {
      "reel": 0,
      "row": 4,
      "size": 1,
      "mult": 10
     },
     {
      "reel": 2,
      "row": 3,
      "size": 2,
      "mult": 16
     },
     {
      "reel": 0,
      "row": 1,
      "size": 2,
      "mult": 16
     },
     {
      "reel": 3,
      "row": 1,
      "size": 1,
      "mult": 3
     }
    ]
   },
   {
    "index": 41,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 1,
      "row": 1
     }
    ],
    "reels": [
     1
    ]
   },
   {
    "index": 42,
    "type": "winInfo",
    "totalWin": 13320,
    "wins": [
     {
      "symbol": "L3",
      "kind": 3,
      "win": 1040,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 4
       },
       {
        "reel": 2,
        "row": 4
       }
      ],
      "meta": {
       "lineIndex": 4,
       "multiplier": 26,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 26,
       "uncappedWin": 1040
      }
     },
     {
      "symbol": "L3",
      "kind": 4,
      "win": 1600,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 1
       },
       {
        "reel": 3,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 8,
       "multiplier": 16,
       "winWithoutMult": 100,
       "globalMult": 1,
       "lineMultiplier": 16,
       "uncappedWin": 1600
      }
     },
     {
      "symbol": "L1",
      "kind": 3,
      "win": 1280,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 9,
       "multiplier": 32,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 32,
       "uncappedWin": 1280
      }
     },
     {
      "symbol": "L4",
      "kind": 3,
      "win": 2400,
      "positions": [
       {
        "reel": 0,
        "row": 2
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 10,
       "multiplier": 60,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 60,
       "uncappedWin": 2400
      }
     },
     {
      "symbol": "L3",
      "kind": 4,
      "win": 7000,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 4
       },
       {
        "reel": 3,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 14,
       "multiplier": 70,
       "winWithoutMult": 100,
       "globalMult": 1,
       "lineMultiplier": 70,
       "uncappedWin": 7000
      }
     }
    ]
   },
   {
    "index": 43,
    "type": "setWin",
    "amount": 13320,
    "winLevel": 9
   },
   {
    "index": 44,
    "type": "setTotalWin",
    "amount": 23080
   },
   {
    "index": 45,
    "type": "frameDoubling",
    "frames": [
     {
      "reel": 1,
      "row": 3,
      "size": 1,
      "mult": 56
     },
     {
      "reel": 0,
      "row": 4,
      "size": 1,
      "mult": 20
     },
     {
      "reel": 2,
      "row": 3,
      "size": 2,
      "mult": 32
     },
     {
      "reel": 0,
      "row": 1,
      "size": 2,
      "mult": 32
     }
    ]
   },
   {
    "index": 46,
    "type": "updateFreeSpin",
    "amount": 6,
    "total": 10
   },
   {
    "index": 47,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "H3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "H5"
      },
      {
       "name": "L1"
      },
      {
       "name": "SW"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      }
     ]
    ],
    "paddingPositions": [
     59,
     271,
     31,
     542,
     603
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 48,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 1,
      "row": 3,
      "size": 1,
      "mult": 56
     },
     {
      "reel": 0,
      "row": 4,
      "size": 1,
      "mult": 20
     },
     {
      "reel": 2,
      "row": 3,
      "size": 2,
      "mult": 32
     },
     {
      "reel": 0,
      "row": 1,
      "size": 2,
      "mult": 32
     },
     {
      "reel": 3,
      "row": 1,
      "size": 1,
      "mult": 3
     },
     {
      "reel": 4,
      "row": 4,
      "size": 1,
      "mult": 6
     }
    ]
   },
   {
    "index": 49,
    "type": "newFrames",
    "frames": [
     {
      "reel": 4,
      "row": 4,
      "size": 1,
      "mult": 6
     }
    ]
   },
   {
    "index": 50,
    "type": "winInfo",
    "totalWin": 3200,
    "wins": [
     {
      "symbol": "L1",
      "kind": 4,
      "win": 3200,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 1
       },
       {
        "reel": 3,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 8,
       "multiplier": 32,
       "winWithoutMult": 100,
       "globalMult": 1,
       "lineMultiplier": 32,
       "uncappedWin": 3200
      }
     }
    ]
   },
   {
    "index": 51,
    "type": "setWin",
    "amount": 3200,
    "winLevel": 7
   },
   {
    "index": 52,
    "type": "setTotalWin",
    "amount": 26280
   },
   {
    "index": 53,
    "type": "frameDoubling",
    "frames": [
     {
      "reel": 0,
      "row": 1,
      "size": 2,
      "mult": 64
     }
    ]
   },
   {
    "index": 54,
    "type": "updateFreeSpin",
    "amount": 7,
    "total": 10
   },
   {
    "index": 55,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "H3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "H1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      }
     ]
    ],
    "paddingPositions": [
     270,
     985,
     414,
     608,
     738
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 56,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 1,
      "row": 3,
      "size": 1,
      "mult": 56
     },
     {
      "reel": 0,
      "row": 4,
      "size": 1,
      "mult": 20
     },
     {
      "reel": 2,
      "row": 3,
      "size": 2,
      "mult": 32
     },
     {
      "reel": 0,
      "row": 1,
      "size": 2,
      "mult": 64
     },
     {
      "reel": 3,
      "row": 1,
      "size": 1,
      "mult": 3
     },
     {
      "reel": 4,
      "row": 4,
      "size": 1,
      "mult": 6
     }
    ]
   },
   {
    "index": 57,
    "type": "winInfo",
    "totalWin": 15040,
    "wins": [
     {
      "symbol": "L4",
      "kind": 4,
      "win": 6400,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 1
       },
       {
        "reel": 3,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 8,
       "multiplier": 64,
       "winWithoutMult": 100,
       "globalMult": 1,
       "lineMultiplier": 64,
       "uncappedWin": 6400
      }
     },
     {
      "symbol": "L3",
      "kind": 3,
      "win": 4320,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 12,
       "multiplier": 108,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 108,
       "uncappedWin": 4320
      }
     },
     {
      "symbol": "L3",
      "kind": 3,
      "win": 4320,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 4
       }
      ],
      "meta": {
       "lineIndex": 14,
       "multiplier": 108,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 108,
       "uncappedWin": 4320
      }
     }
    ]
   },
   {
    "index": 58,
    "type": "setWin",
    "amount": 15040,
    "winLevel": 9
   },
   {
    "index": 59,
    "type": "setTotalWin",
    "amount": 41320
   },
   {
    "index": 60,
    "type": "frameDoubling",
    "frames": [
     {
      "reel": 1,
      "row": 3,
      "size": 1,
      "mult": 112
     },
     {
      "reel": 0,
      "row": 4,
      "size": 1,
      "mult": 40
     },
     {
      "reel": 2,
      "row": 3,
      "size": 2,
      "mult": 64
     },
     {
      "reel": 0,
      "row": 1,
      "size": 2,
      "mult": 128
     }
    ]
   },
   {
    "index": 61,
    "type": "updateFreeSpin",
    "amount": 8,
    "total": 10
   },
   {
    "index": 62,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "H3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      }
     ]
    ],
    "paddingPositions": [
     321,
     825,
     214,
     961,
     508
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 63,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 1,
      "row": 3,
      "size": 1,
      "mult": 112
     },
     {
      "reel": 0,
      "row": 4,
      "size": 1,
      "mult": 40
     },
     {
      "reel": 2,
      "row": 3,
      "size": 2,
      "mult": 64
     },
     {
      "reel": 0,
      "row": 1,
      "size": 2,
      "mult": 128
     },
     {
      "reel": 3,
      "row": 1,
      "size": 1,
      "mult": 3
     },
     {
      "reel": 4,
      "row": 4,
      "size": 1,
      "mult": 6
     }
    ]
   },
   {
    "index": 64,
    "type": "winInfo",
    "totalWin": 25900,
    "wins": [
     {
      "symbol": "L1",
      "kind": 4,
      "win": 25900,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 1
       },
       {
        "reel": 2,
        "row": 1
       },
       {
        "reel": 3,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 1,
       "multiplier": 259,
       "winWithoutMult": 100,
       "globalMult": 1,
       "lineMultiplier": 259,
       "uncappedWin": 25900
      }
     }
    ]
   },
   {
    "index": 65,
    "type": "setWin",
    "amount": 25900,
    "winLevel": 9
   },
   {
    "index": 66,
    "type": "setTotalWin",
    "amount": 67220
   },
   {
    "index": 67,
    "type": "frameDoubling",
    "frames": [
     {
      "reel": 0,
      "row": 1,
      "size": 2,
      "mult": 256
     },
     {
      "reel": 3,
      "row": 1,
      "size": 1,
      "mult": 6
     }
    ]
   },
   {
    "index": 68,
    "type": "updateFreeSpin",
    "amount": 9,
    "total": 10
   },
   {
    "index": 69,
    "type": "freeSpinEnd",
    "amount": 67220,
    "winLevel": 8
   },
   {
    "index": 70,
    "type": "finalWin",
    "amount": 67220
   }
  ],
  "criteria": "ordinary",
  "basePayout": 0,
  "featurePayout": 67220,
  "featureTier": "capo"
 },
 {
  "id": 1,
  "mode": "bonus_epic",
  "payoutMultiplier": 2000000,
  "events": [
   {
    "index": 0,
    "type": "reveal",
    "board": [
     [
      {
       "name": "H5"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "H3"
      },
      {
       "name": "L3"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "H2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "H1"
      },
      {
       "name": "SW"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "H1"
      },
      {
       "name": "L4"
      }
     ]
    ],
    "paddingPositions": [
     50,
     61,
     73,
     930,
     500
    ],
    "anticipation": [
     0,
     0,
     1,
     2,
     2
    ],
    "gameType": "basegame"
   },
   {
    "index": 1,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 3,
      "row": 3
     }
    ],
    "reels": [
     3
    ]
   },
   {
    "index": 2,
    "type": "setTotalWin",
    "amount": 0
   },
   {
    "index": 3,
    "type": "freeSpinTrigger",
    "totalFs": 10,
    "positions": [
     {
      "reel": 0,
      "row": 1
     },
     {
      "reel": 1,
      "row": 3
     },
     {
      "reel": 2,
      "row": 4
     },
     {
      "reel": 3,
      "row": 1
     },
     {
      "reel": 4,
      "row": 3
     }
    ]
   },
   {
    "index": 4,
    "type": "bonusTier",
    "tier": "don",
    "seedFrames": 3
   },
   {
    "index": 5,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L2"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "SW"
      },
      {
       "name": "H1"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "L3"
      }
     ]
    ],
    "paddingPositions": [
     900,
     914,
     900,
     900,
     900
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 6,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 2,
      "row": 2,
      "size": 2,
      "mult": 10
     },
     {
      "reel": 3,
      "row": 4,
      "size": 1,
      "mult": 100
     },
     {
      "reel": 1,
      "row": 2,
      "size": 1,
      "mult": 100
     }
    ]
   },
   {
    "index": 7,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 1,
      "row": 3
     }
    ],
    "reels": [
     1
    ]
   },
   {
    "index": 8,
    "type": "winInfo",
    "totalWin": 2000000,
    "wins": [
     {
      "symbol": "H1",
      "kind": 5,
      "win": 40000,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 1
       },
       {
        "reel": 2,
        "row": 1
       },
       {
        "reel": 3,
        "row": 1
       },
       {
        "reel": 4,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 1,
       "multiplier": 1,
       "winWithoutMult": 40000,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40000
      }
     },
     {
      "symbol": "H1",
      "kind": 5,
      "win": 1960000,
      "positions": [
       {
        "reel": 0,
        "row": 2
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       },
       {
        "reel": 3,
        "row": 2
       },
       {
        "reel": 4,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 2,
       "multiplier": 120,
       "winWithoutMult": 40000,
       "globalMult": 1,
       "lineMultiplier": 120,
       "uncappedWin": 4800000
      }
     }
    ]
   },
   {
    "index": 9,
    "type": "setWin",
    "amount": 2000000,
    "winLevel": 10
   },
   {
    "index": 10,
    "type": "setTotalWin",
    "amount": 2000000
   },
   {
    "index": 11,
    "type": "wincap",
    "amount": 2000000
   },
   {
    "index": 12,
    "type": "updateFreeSpin",
    "amount": 0,
    "total": 10
   },
   {
    "index": 13,
    "type": "freeSpinEnd",
    "amount": 2000000,
    "winLevel": 10
   },
   {
    "index": 14,
    "type": "finalWin",
    "amount": 2000000
   }
  ],
  "criteria": "cap",
  "basePayout": 0,
  "featurePayout": 2000000,
  "featureTier": "don"
 },
 {
  "id": 2,
  "mode": "bonus_epic",
  "payoutMultiplier": 7220,
  "events": [
   {
    "index": 0,
    "type": "reveal",
    "board": [
     [
      {
       "name": "H5"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "H5"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L2"
      }
     ]
    ],
    "paddingPositions": [
     50,
     461,
     674,
     486,
     99
    ],
    "anticipation": [
     0,
     0,
     1,
     2,
     2
    ],
    "gameType": "basegame"
   },
   {
    "index": 1,
    "type": "setTotalWin",
    "amount": 0
   },
   {
    "index": 2,
    "type": "freeSpinTrigger",
    "totalFs": 10,
    "positions": [
     {
      "reel": 0,
      "row": 1
     },
     {
      "reel": 1,
      "row": 3
     },
     {
      "reel": 2,
      "row": 3
     },
     {
      "reel": 3,
      "row": 4
     },
     {
      "reel": 4,
      "row": 4
     }
    ]
   },
   {
    "index": 3,
    "type": "bonusTier",
    "tier": "don",
    "seedFrames": 3
   },
   {
    "index": 4,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "H3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "H2"
      },
      {
       "name": "SW"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "H4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "H5"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      }
     ]
    ],
    "paddingPositions": [
     800,
     591,
     395,
     838,
     375
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 5,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 1,
      "size": 1,
      "mult": 3
     },
     {
      "reel": 2,
      "row": 3,
      "size": 1,
      "mult": 2
     },
     {
      "reel": 4,
      "row": 3,
      "size": 1,
      "mult": 5
     }
    ]
   },
   {
    "index": 6,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 3,
      "row": 4
     }
    ],
    "reels": [
     3
    ]
   },
   {
    "index": 7,
    "type": "setTotalWin",
    "amount": 0
   },
   {
    "index": 8,
    "type": "updateFreeSpin",
    "amount": 0,
    "total": 10
   },
   {
    "index": 9,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "SW"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "H3"
      },
      {
       "name": "H1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      }
     ]
    ],
    "paddingPositions": [
     254,
     405,
     308,
     835,
     75
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 10,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 1,
      "size": 1,
      "mult": 3
     },
     {
      "reel": 2,
      "row": 3,
      "size": 1,
      "mult": 2
     },
     {
      "reel": 4,
      "row": 3,
      "size": 1,
      "mult": 5
     }
    ]
   },
   {
    "index": 11,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 2,
      "row": 3
     }
    ],
    "reels": [
     2
    ]
   },
   {
    "index": 12,
    "type": "winInfo",
    "totalWin": 160,
    "wins": [
     {
      "symbol": "L4",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 1
       },
       {
        "reel": 2,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 1,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L2",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 2
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 2,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L2",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 8,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L2",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 11,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     }
    ]
   },
   {
    "index": 13,
    "type": "setWin",
    "amount": 160,
    "winLevel": 3
   },
   {
    "index": 14,
    "type": "setTotalWin",
    "amount": 160
   },
   {
    "index": 15,
    "type": "updateFreeSpin",
    "amount": 1,
    "total": 10
   },
   {
    "index": 16,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "H5"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "H5"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "H3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "H2"
      },
      {
       "name": "L4"
      },
      {
       "name": "SW"
      },
      {
       "name": "H4"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "H5"
      },
      {
       "name": "H4"
      },
      {
       "name": "L4"
      }
     ]
    ],
    "paddingPositions": [
     732,
     96,
     535,
     189,
     18
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 17,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 1,
      "size": 1,
      "mult": 3
     },
     {
      "reel": 2,
      "row": 3,
      "size": 1,
      "mult": 2
     },
     {
      "reel": 4,
      "row": 3,
      "size": 1,
      "mult": 5
     }
    ]
   },
   {
    "index": 18,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 3,
      "row": 4
     }
    ],
    "reels": [
     3
    ]
   },
   {
    "index": 19,
    "type": "setTotalWin",
    "amount": 160
   },
   {
    "index": 20,
    "type": "updateFreeSpin",
    "amount": 2,
    "total": 10
   },
   {
    "index": 21,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "SW"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "H4"
      },
      {
       "name": "L2"
      }
     ]
    ],
    "paddingPositions": [
     767,
     102,
     876,
     425,
     771
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 22,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 1,
      "size": 1,
      "mult": 3
     },
     {
      "reel": 2,
      "row": 3,
      "size": 1,
      "mult": 2
     },
     {
      "reel": 4,
      "row": 3,
      "size": 1,
      "mult": 5
     }
    ]
   },
   {
    "index": 23,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 3,
      "row": 4
     }
    ],
    "reels": [
     3
    ]
   },
   {
    "index": 24,
    "type": "winInfo",
    "totalWin": 200,
    "wins": [
     {
      "symbol": "L3",
      "kind": 4,
      "win": 200,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 3
       },
       {
        "reel": 3,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 3,
       "multiplier": 2,
       "winWithoutMult": 100,
       "globalMult": 1,
       "lineMultiplier": 2,
       "uncappedWin": 200
      }
     }
    ]
   },
   {
    "index": 25,
    "type": "setWin",
    "amount": 200,
    "winLevel": 4
   },
   {
    "index": 26,
    "type": "setTotalWin",
    "amount": 360
   },
   {
    "index": 27,
    "type": "frameDoubling",
    "frames": [
     {
      "reel": 2,
      "row": 3,
      "size": 1,
      "mult": 4
     }
    ]
   },
   {
    "index": 28,
    "type": "updateFreeSpin",
    "amount": 3,
    "total": 10
   },
   {
    "index": 29,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "SW"
      },
      {
       "name": "H1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      }
     ]
    ],
    "paddingPositions": [
     6,
     915,
     90,
     463,
     458
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 30,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 1,
      "size": 1,
      "mult": 3
     },
     {
      "reel": 2,
      "row": 3,
      "size": 1,
      "mult": 4
     },
     {
      "reel": 4,
      "row": 3,
      "size": 1,
      "mult": 5
     }
    ]
   },
   {
    "index": 31,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 1,
      "row": 2
     }
    ],
    "reels": [
     1
    ]
   },
   {
    "index": 32,
    "type": "winInfo",
    "totalWin": 2500,
    "wins": [
     {
      "symbol": "L1",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 1
       },
       {
        "reel": 2,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 1,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L1",
      "kind": 3,
      "win": 160,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 3,
       "multiplier": 4,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 4,
       "uncappedWin": 160
      }
     },
     {
      "symbol": "L1",
      "kind": 5,
      "win": 1400,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 3
       },
       {
        "reel": 3,
        "row": 2
       },
       {
        "reel": 4,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 5,
       "multiplier": 7,
       "winWithoutMult": 200,
       "globalMult": 1,
       "lineMultiplier": 7,
       "uncappedWin": 1400
      }
     },
     {
      "symbol": "L3",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 2
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 4
       }
      ],
      "meta": {
       "lineIndex": 6,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L1",
      "kind": 4,
      "win": 100,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 1
       },
       {
        "reel": 3,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 8,
       "multiplier": 1,
       "winWithoutMult": 100,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 100
      }
     },
     {
      "symbol": "L1",
      "kind": 3,
      "win": 160,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 12,
       "multiplier": 4,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 4,
       "uncappedWin": 160
      }
     },
     {
      "symbol": "L1",
      "kind": 5,
      "win": 600,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 1
       },
       {
        "reel": 3,
        "row": 2
       },
       {
        "reel": 4,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 13,
       "multiplier": 3,
       "winWithoutMult": 200,
       "globalMult": 1,
       "lineMultiplier": 3,
       "uncappedWin": 600
      }
     }
    ]
   },
   {
    "index": 33,
    "type": "setWin",
    "amount": 2500,
    "winLevel": 6
   },
   {
    "index": 34,
    "type": "setTotalWin",
    "amount": 2860
   },
   {
    "index": 35,
    "type": "frameDoubling",
    "frames": [
     {
      "reel": 4,
      "row": 1,
      "size": 1,
      "mult": 6
     },
     {
      "reel": 2,
      "row": 3,
      "size": 1,
      "mult": 8
     }
    ]
   },
   {
    "index": 36,
    "type": "updateFreeSpin",
    "amount": 4,
    "total": 10
   },
   {
    "index": 37,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "SW"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "H5"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "H3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      }
     ]
    ],
    "paddingPositions": [
     942,
     280,
     782,
     17,
     222
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 38,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 1,
      "size": 1,
      "mult": 6
     },
     {
      "reel": 2,
      "row": 3,
      "size": 1,
      "mult": 8
     },
     {
      "reel": 4,
      "row": 3,
      "size": 1,
      "mult": 5
     }
    ]
   },
   {
    "index": 39,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 2,
      "row": 1
     }
    ],
    "reels": [
     2
    ]
   },
   {
    "index": 40,
    "type": "winInfo",
    "totalWin": 840,
    "wins": [
     {
      "symbol": "L3",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 4
       },
       {
        "reel": 2,
        "row": 4
       }
      ],
      "meta": {
       "lineIndex": 4,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L1",
      "kind": 3,
      "win": 320,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 5,
       "multiplier": 8,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 8,
       "uncappedWin": 320
      }
     },
     {
      "symbol": "L3",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 7,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L1",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 9,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L3",
      "kind": 3,
      "win": 320,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 12,
       "multiplier": 8,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 8,
       "uncappedWin": 320
      }
     },
     {
      "symbol": "L1",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 13,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L3",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 4
       }
      ],
      "meta": {
       "lineIndex": 14,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     }
    ]
   },
   {
    "index": 41,
    "type": "setWin",
    "amount": 840,
    "winLevel": 5
   },
   {
    "index": 42,
    "type": "setTotalWin",
    "amount": 3700
   },
   {
    "index": 43,
    "type": "frameDoubling",
    "frames": [
     {
      "reel": 2,
      "row": 3,
      "size": 1,
      "mult": 16
     }
    ]
   },
   {
    "index": 44,
    "type": "updateFreeSpin",
    "amount": 5,
    "total": 10
   },
   {
    "index": 45,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "H4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "SW"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "H3"
      }
     ]
    ],
    "paddingPositions": [
     449,
     150,
     285,
     664,
     965
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 46,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 1,
      "size": 1,
      "mult": 6
     },
     {
      "reel": 2,
      "row": 3,
      "size": 1,
      "mult": 16
     },
     {
      "reel": 4,
      "row": 3,
      "size": 1,
      "mult": 5
     }
    ]
   },
   {
    "index": 47,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 3,
      "row": 1
     }
    ],
    "reels": [
     3
    ]
   },
   {
    "index": 48,
    "type": "setTotalWin",
    "amount": 3700
   },
   {
    "index": 49,
    "type": "updateFreeSpin",
    "amount": 6,
    "total": 10
   },
   {
    "index": 50,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "H2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "SW"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "H5"
      },
      {
       "name": "L3"
      }
     ]
    ],
    "paddingPositions": [
     869,
     944,
     839,
     570,
     540
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 51,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 1,
      "size": 1,
      "mult": 6
     },
     {
      "reel": 2,
      "row": 3,
      "size": 1,
      "mult": 16
     },
     {
      "reel": 4,
      "row": 3,
      "size": 1,
      "mult": 5
     }
    ]
   },
   {
    "index": 52,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 2,
      "row": 3
     }
    ],
    "reels": [
     2
    ]
   },
   {
    "index": 53,
    "type": "winInfo",
    "totalWin": 40,
    "wins": [
     {
      "symbol": "L3",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 1
       },
       {
        "reel": 2,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 1,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     }
    ]
   },
   {
    "index": 54,
    "type": "setWin",
    "amount": 40,
    "winLevel": 2
   },
   {
    "index": 55,
    "type": "setTotalWin",
    "amount": 3740
   },
   {
    "index": 56,
    "type": "updateFreeSpin",
    "amount": 7,
    "total": 10
   },
   {
    "index": 57,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "W",
       "wild": true
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "SW"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "H5"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "H5"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      }
     ]
    ],
    "paddingPositions": [
     872,
     988,
     428,
     675,
     541
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 58,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 1,
      "size": 1,
      "mult": 6
     },
     {
      "reel": 2,
      "row": 3,
      "size": 1,
      "mult": 16
     },
     {
      "reel": 4,
      "row": 3,
      "size": 1,
      "mult": 5
     }
    ]
   },
   {
    "index": 59,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 2,
      "row": 1
     }
    ],
    "reels": [
     2
    ]
   },
   {
    "index": 60,
    "type": "winInfo",
    "totalWin": 2120,
    "wins": [
     {
      "symbol": "L4",
      "kind": 3,
      "win": 640,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 3,
       "multiplier": 16,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 16,
       "uncappedWin": 640
      }
     },
     {
      "symbol": "L3",
      "kind": 3,
      "win": 640,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 5,
       "multiplier": 16,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 16,
       "uncappedWin": 640
      }
     },
     {
      "symbol": "L4",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 2
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 4
       }
      ],
      "meta": {
       "lineIndex": 6,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L3",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 8,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L3",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 9,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L4",
      "kind": 3,
      "win": 640,
      "positions": [
       {
        "reel": 0,
        "row": 2
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 10,
       "multiplier": 16,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 16,
       "uncappedWin": 640
      }
     },
     {
      "symbol": "L3",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 11,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L3",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 13,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     }
    ]
   },
   {
    "index": 61,
    "type": "setWin",
    "amount": 2120,
    "winLevel": 6
   },
   {
    "index": 62,
    "type": "setTotalWin",
    "amount": 5860
   },
   {
    "index": 63,
    "type": "frameDoubling",
    "frames": [
     {
      "reel": 2,
      "row": 3,
      "size": 1,
      "mult": 32
     }
    ]
   },
   {
    "index": 64,
    "type": "updateFreeSpin",
    "amount": 8,
    "total": 10
   },
   {
    "index": 65,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "H2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "H5"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "SW"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "H5"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      }
     ]
    ],
    "paddingPositions": [
     155,
     567,
     308,
     467,
     643
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 66,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 4,
      "row": 1,
      "size": 1,
      "mult": 6
     },
     {
      "reel": 2,
      "row": 3,
      "size": 1,
      "mult": 32
     },
     {
      "reel": 4,
      "row": 3,
      "size": 1,
      "mult": 5
     }
    ]
   },
   {
    "index": 67,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 2,
      "row": 3
     }
    ],
    "reels": [
     2
    ]
   },
   {
    "index": 68,
    "type": "winInfo",
    "totalWin": 1360,
    "wins": [
     {
      "symbol": "L2",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 7,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L2",
      "kind": 3,
      "win": 1280,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 12,
       "multiplier": 32,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 32,
       "uncappedWin": 1280
      }
     },
     {
      "symbol": "L2",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 4
       }
      ],
      "meta": {
       "lineIndex": 14,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     }
    ]
   },
   {
    "index": 69,
    "type": "setWin",
    "amount": 1360,
    "winLevel": 5
   },
   {
    "index": 70,
    "type": "setTotalWin",
    "amount": 7220
   },
   {
    "index": 71,
    "type": "frameDoubling",
    "frames": [
     {
      "reel": 2,
      "row": 3,
      "size": 1,
      "mult": 64
     }
    ]
   },
   {
    "index": 72,
    "type": "updateFreeSpin",
    "amount": 9,
    "total": 10
   },
   {
    "index": 73,
    "type": "freeSpinEnd",
    "amount": 7220,
    "winLevel": 6
   },
   {
    "index": 74,
    "type": "finalWin",
    "amount": 7220
   }
  ],
  "criteria": "ordinary",
  "basePayout": 0,
  "featurePayout": 7220,
  "featureTier": "don"
 },
 {
  "id": 3,
  "mode": "bonus_epic",
  "payoutMultiplier": 15540,
  "events": [
   {
    "index": 0,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "H1"
      },
      {
       "name": "L4"
      }
     ]
    ],
    "paddingPositions": [
     849,
     463,
     873,
     688,
     500
    ],
    "anticipation": [
     0,
     0,
     1,
     2,
     2
    ],
    "gameType": "basegame"
   },
   {
    "index": 1,
    "type": "setTotalWin",
    "amount": 0
   },
   {
    "index": 2,
    "type": "freeSpinTrigger",
    "totalFs": 10,
    "positions": [
     {
      "reel": 0,
      "row": 2
     },
     {
      "reel": 1,
      "row": 1
     },
     {
      "reel": 2,
      "row": 4
     },
     {
      "reel": 3,
      "row": 2
     },
     {
      "reel": 4,
      "row": 3
     }
    ]
   },
   {
    "index": 3,
    "type": "bonusTier",
    "tier": "don",
    "seedFrames": 3
   },
   {
    "index": 4,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "H4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "H5"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "H5"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "SW"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "H1"
      },
      {
       "name": "L3"
      }
     ]
    ],
    "paddingPositions": [
     52,
     371,
     477,
     427,
     972
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 5,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 2,
      "row": 1,
      "size": 1,
      "mult": 6
     },
     {
      "reel": 3,
      "row": 4,
      "size": 1,
      "mult": 3
     },
     {
      "reel": 3,
      "row": 3,
      "size": 1,
      "mult": 2
     }
    ]
   },
   {
    "index": 6,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 3,
      "row": 2
     }
    ],
    "reels": [
     3
    ]
   },
   {
    "index": 7,
    "type": "winInfo",
    "totalWin": 500,
    "wins": [
     {
      "symbol": "L3",
      "kind": 5,
      "win": 200,
      "positions": [
       {
        "reel": 0,
        "row": 2
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       },
       {
        "reel": 3,
        "row": 2
       },
       {
        "reel": 4,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 2,
       "multiplier": 1,
       "winWithoutMult": 200,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 200
      }
     },
     {
      "symbol": "L1",
      "kind": 4,
      "win": 300,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 4
       },
       {
        "reel": 2,
        "row": 4
       },
       {
        "reel": 3,
        "row": 4
       }
      ],
      "meta": {
       "lineIndex": 4,
       "multiplier": 3,
       "winWithoutMult": 100,
       "globalMult": 1,
       "lineMultiplier": 3,
       "uncappedWin": 300
      }
     }
    ]
   },
   {
    "index": 8,
    "type": "setWin",
    "amount": 500,
    "winLevel": 5
   },
   {
    "index": 9,
    "type": "setTotalWin",
    "amount": 500
   },
   {
    "index": 10,
    "type": "frameDoubling",
    "frames": [
     {
      "reel": 3,
      "row": 4,
      "size": 1,
      "mult": 6
     }
    ]
   },
   {
    "index": 11,
    "type": "updateFreeSpin",
    "amount": 0,
    "total": 10
   },
   {
    "index": 12,
    "type": "reveal",
    "board": [
     [
      {
       "name": "H4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "S",
       "scatter": true
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "H4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "SW"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      }
     ]
    ],
    "paddingPositions": [
     446,
     865,
     480,
     661,
     863
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 13,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 2,
      "row": 1,
      "size": 1,
      "mult": 6
     },
     {
      "reel": 3,
      "row": 4,
      "size": 1,
      "mult": 6
     },
     {
      "reel": 3,
      "row": 3,
      "size": 1,
      "mult": 2
     },
     {
      "reel": 0,
      "row": 1,
      "size": 2,
      "mult": 5
     }
    ]
   },
   {
    "index": 14,
    "type": "newFrames",
    "frames": [
     {
      "reel": 0,
      "row": 1,
      "size": 2,
      "mult": 5
     }
    ]
   },
   {
    "index": 15,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 3,
      "row": 4
     }
    ],
    "reels": [
     3
    ]
   },
   {
    "index": 16,
    "type": "winInfo",
    "totalWin": 1400,
    "wins": [
     {
      "symbol": "L2",
      "kind": 5,
      "win": 1400,
      "positions": [
       {
        "reel": 0,
        "row": 2
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 4
       },
       {
        "reel": 3,
        "row": 3
       },
       {
        "reel": 4,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 6,
       "multiplier": 7,
       "winWithoutMult": 200,
       "globalMult": 1,
       "lineMultiplier": 7,
       "uncappedWin": 1400
      }
     }
    ]
   },
   {
    "index": 17,
    "type": "setWin",
    "amount": 1400,
    "winLevel": 5
   },
   {
    "index": 18,
    "type": "setTotalWin",
    "amount": 1900
   },
   {
    "index": 19,
    "type": "frameDoubling",
    "frames": [
     {
      "reel": 3,
      "row": 3,
      "size": 1,
      "mult": 4
     },
     {
      "reel": 0,
      "row": 1,
      "size": 2,
      "mult": 10
     }
    ]
   },
   {
    "index": 20,
    "type": "updateFreeSpin",
    "amount": 1,
    "total": 10
   },
   {
    "index": 21,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "H1"
      },
      {
       "name": "H4"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "SW"
      },
      {
       "name": "L3"
      },
      {
       "name": "W",
       "wild": true
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      }
     ]
    ],
    "paddingPositions": [
     562,
     777,
     723,
     108,
     600
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 22,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 2,
      "row": 1,
      "size": 1,
      "mult": 6
     },
     {
      "reel": 3,
      "row": 4,
      "size": 1,
      "mult": 6
     },
     {
      "reel": 3,
      "row": 3,
      "size": 1,
      "mult": 4
     },
     {
      "reel": 0,
      "row": 1,
      "size": 2,
      "mult": 10
     }
    ]
   },
   {
    "index": 23,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 2,
      "row": 1
     }
    ],
    "reels": [
     2
    ]
   },
   {
    "index": 24,
    "type": "setTotalWin",
    "amount": 1900
   },
   {
    "index": 25,
    "type": "updateFreeSpin",
    "amount": 2,
    "total": 10
   },
   {
    "index": 26,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "H5"
      },
      {
       "name": "H3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "H2"
      },
      {
       "name": "SW"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "H5"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      }
     ]
    ],
    "paddingPositions": [
     194,
     980,
     37,
     840,
     189
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 27,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 2,
      "row": 1,
      "size": 1,
      "mult": 6
     },
     {
      "reel": 3,
      "row": 4,
      "size": 1,
      "mult": 6
     },
     {
      "reel": 3,
      "row": 3,
      "size": 1,
      "mult": 4
     },
     {
      "reel": 0,
      "row": 1,
      "size": 2,
      "mult": 10
     }
    ]
   },
   {
    "index": 28,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 3,
      "row": 2
     }
    ],
    "reels": [
     3
    ]
   },
   {
    "index": 29,
    "type": "setTotalWin",
    "amount": 1900
   },
   {
    "index": 30,
    "type": "updateFreeSpin",
    "amount": 3,
    "total": 10
   },
   {
    "index": 31,
    "type": "reveal",
    "board": [
     [
      {
       "name": "W",
       "wild": true
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "SW"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "SW"
      },
      {
       "name": "L3"
      },
      {
       "name": "W",
       "wild": true
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "H5"
      },
      {
       "name": "L4"
      },
      {
       "name": "H4"
      },
      {
       "name": "L3"
      },
      {
       "name": "H3"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "H5"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      }
     ]
    ],
    "paddingPositions": [
     365,
     722,
     724,
     633,
     151
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 32,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 2,
      "row": 1,
      "size": 1,
      "mult": 6
     },
     {
      "reel": 3,
      "row": 4,
      "size": 1,
      "mult": 6
     },
     {
      "reel": 3,
      "row": 3,
      "size": 1,
      "mult": 4
     },
     {
      "reel": 0,
      "row": 1,
      "size": 2,
      "mult": 10
     }
    ]
   },
   {
    "index": 33,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 1,
      "row": 2
     }
    ],
    "reels": [
     1
    ]
   },
   {
    "index": 34,
    "type": "winInfo",
    "totalWin": 2200,
    "wins": [
     {
      "symbol": "L3",
      "kind": 3,
      "win": 800,
      "positions": [
       {
        "reel": 0,
        "row": 2
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 2,
       "multiplier": 20,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 20,
       "uncappedWin": 800
      }
     },
     {
      "symbol": "L1",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 3,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L1",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 4
       },
       {
        "reel": 2,
        "row": 4
       }
      ],
      "meta": {
       "lineIndex": 4,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L1",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 7,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L4",
      "kind": 3,
      "win": 800,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 9,
       "multiplier": 20,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 20,
       "uncappedWin": 800
      }
     },
     {
      "symbol": "L1",
      "kind": 3,
      "win": 400,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 11,
       "multiplier": 10,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 10,
       "uncappedWin": 400
      }
     },
     {
      "symbol": "L1",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 12,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L1",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 4
       }
      ],
      "meta": {
       "lineIndex": 14,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     }
    ]
   },
   {
    "index": 35,
    "type": "setWin",
    "amount": 2200,
    "winLevel": 6
   },
   {
    "index": 36,
    "type": "setTotalWin",
    "amount": 4100
   },
   {
    "index": 37,
    "type": "frameDoubling",
    "frames": [
     {
      "reel": 0,
      "row": 1,
      "size": 2,
      "mult": 20
     }
    ]
   },
   {
    "index": 38,
    "type": "updateFreeSpin",
    "amount": 4,
    "total": 10
   },
   {
    "index": 39,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "H1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "H5"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "SW"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      }
     ]
    ],
    "paddingPositions": [
     216,
     142,
     543,
     56,
     940
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 40,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 2,
      "row": 1,
      "size": 1,
      "mult": 6
     },
     {
      "reel": 3,
      "row": 4,
      "size": 1,
      "mult": 6
     },
     {
      "reel": 3,
      "row": 3,
      "size": 1,
      "mult": 4
     },
     {
      "reel": 0,
      "row": 1,
      "size": 2,
      "mult": 20
     }
    ]
   },
   {
    "index": 41,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 2,
      "row": 4
     }
    ],
    "reels": [
     2
    ]
   },
   {
    "index": 42,
    "type": "winInfo",
    "totalWin": 5040,
    "wins": [
     {
      "symbol": "L3",
      "kind": 3,
      "win": 1600,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 5,
       "multiplier": 40,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 40,
       "uncappedWin": 1600
      }
     },
     {
      "symbol": "L3",
      "kind": 3,
      "win": 1600,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 9,
       "multiplier": 40,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 40,
       "uncappedWin": 1600
      }
     },
     {
      "symbol": "L3",
      "kind": 3,
      "win": 1840,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 13,
       "multiplier": 46,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 46,
       "uncappedWin": 1840
      }
     }
    ]
   },
   {
    "index": 43,
    "type": "setWin",
    "amount": 5040,
    "winLevel": 8
   },
   {
    "index": 44,
    "type": "setTotalWin",
    "amount": 9140
   },
   {
    "index": 45,
    "type": "frameDoubling",
    "frames": [
     {
      "reel": 2,
      "row": 1,
      "size": 1,
      "mult": 12
     },
     {
      "reel": 0,
      "row": 1,
      "size": 2,
      "mult": 40
     }
    ]
   },
   {
    "index": 46,
    "type": "updateFreeSpin",
    "amount": 5,
    "total": 10
   },
   {
    "index": 47,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "H2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "H3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "S",
       "scatter": true
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "SW"
      },
      {
       "name": "H5"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      }
     ]
    ],
    "paddingPositions": [
     516,
     440,
     872,
     720,
     179
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 48,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 2,
      "row": 1,
      "size": 1,
      "mult": 12
     },
     {
      "reel": 3,
      "row": 4,
      "size": 1,
      "mult": 6
     },
     {
      "reel": 3,
      "row": 3,
      "size": 1,
      "mult": 4
     },
     {
      "reel": 0,
      "row": 1,
      "size": 2,
      "mult": 40
     }
    ]
   },
   {
    "index": 49,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 3,
      "row": 4
     }
    ],
    "reels": [
     3
    ]
   },
   {
    "index": 50,
    "type": "setTotalWin",
    "amount": 9140
   },
   {
    "index": 51,
    "type": "updateFreeSpin",
    "amount": 6,
    "total": 10
   },
   {
    "index": 52,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "SW"
      },
      {
       "name": "H1"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "SW"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "H5"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      }
     ]
    ],
    "paddingPositions": [
     334,
     588,
     914,
     546,
     927
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 53,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 2,
      "row": 1,
      "size": 1,
      "mult": 12
     },
     {
      "reel": 3,
      "row": 4,
      "size": 1,
      "mult": 6
     },
     {
      "reel": 3,
      "row": 3,
      "size": 1,
      "mult": 4
     },
     {
      "reel": 0,
      "row": 1,
      "size": 2,
      "mult": 40
     }
    ]
   },
   {
    "index": 54,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 2,
      "row": 3
     },
     {
      "reel": 3,
      "row": 1
     }
    ],
    "reels": [
     2,
     3
    ]
   },
   {
    "index": 55,
    "type": "winInfo",
    "totalWin": 1200,
    "wins": [
     {
      "symbol": "L4",
      "kind": 4,
      "win": 400,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 2
       },
       {
        "reel": 3,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 7,
       "multiplier": 4,
       "winWithoutMult": 100,
       "globalMult": 1,
       "lineMultiplier": 4,
       "uncappedWin": 400
      }
     },
     {
      "symbol": "L4",
      "kind": 4,
      "win": 400,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 3
       },
       {
        "reel": 3,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 12,
       "multiplier": 4,
       "winWithoutMult": 100,
       "globalMult": 1,
       "lineMultiplier": 4,
       "uncappedWin": 400
      }
     },
     {
      "symbol": "L4",
      "kind": 4,
      "win": 400,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 4
       },
       {
        "reel": 3,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 14,
       "multiplier": 4,
       "winWithoutMult": 100,
       "globalMult": 1,
       "lineMultiplier": 4,
       "uncappedWin": 400
      }
     }
    ]
   },
   {
    "index": 56,
    "type": "setWin",
    "amount": 1200,
    "winLevel": 5
   },
   {
    "index": 57,
    "type": "setTotalWin",
    "amount": 10340
   },
   {
    "index": 58,
    "type": "frameDoubling",
    "frames": [
     {
      "reel": 3,
      "row": 3,
      "size": 1,
      "mult": 8
     }
    ]
   },
   {
    "index": 59,
    "type": "updateFreeSpin",
    "amount": 7,
    "total": 10
   },
   {
    "index": 60,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "H5"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "SW"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "H1"
      },
      {
       "name": "H1"
      },
      {
       "name": "SW"
      },
      {
       "name": "H1"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "H3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      }
     ]
    ],
    "paddingPositions": [
     866,
     523,
     311,
     914,
     848
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 61,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 2,
      "row": 1,
      "size": 1,
      "mult": 12
     },
     {
      "reel": 3,
      "row": 4,
      "size": 1,
      "mult": 6
     },
     {
      "reel": 3,
      "row": 3,
      "size": 1,
      "mult": 8
     },
     {
      "reel": 0,
      "row": 1,
      "size": 2,
      "mult": 40
     }
    ]
   },
   {
    "index": 62,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 3,
      "row": 3
     }
    ],
    "reels": [
     3
    ]
   },
   {
    "index": 63,
    "type": "winInfo",
    "totalWin": 4800,
    "wins": [
     {
      "symbol": "L4",
      "kind": 4,
      "win": 4800,
      "positions": [
       {
        "reel": 0,
        "row": 2
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 4
       },
       {
        "reel": 3,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 6,
       "multiplier": 48,
       "winWithoutMult": 100,
       "globalMult": 1,
       "lineMultiplier": 48,
       "uncappedWin": 4800
      }
     }
    ]
   },
   {
    "index": 64,
    "type": "setWin",
    "amount": 4800,
    "winLevel": 7
   },
   {
    "index": 65,
    "type": "setTotalWin",
    "amount": 15140
   },
   {
    "index": 66,
    "type": "frameDoubling",
    "frames": [
     {
      "reel": 3,
      "row": 3,
      "size": 1,
      "mult": 16
     },
     {
      "reel": 0,
      "row": 1,
      "size": 2,
      "mult": 80
     }
    ]
   },
   {
    "index": 67,
    "type": "updateFreeSpin",
    "amount": 8,
    "total": 10
   },
   {
    "index": 68,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L3"
      },
      {
       "name": "H4"
      },
      {
       "name": "L1"
      },
      {
       "name": "H3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "H3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "SW"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      }
     ]
    ],
    "paddingPositions": [
     81,
     962,
     426,
     324,
     865
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 69,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 2,
      "row": 1,
      "size": 1,
      "mult": 12
     },
     {
      "reel": 3,
      "row": 4,
      "size": 1,
      "mult": 6
     },
     {
      "reel": 3,
      "row": 3,
      "size": 1,
      "mult": 16
     },
     {
      "reel": 0,
      "row": 1,
      "size": 2,
      "mult": 80
     },
     {
      "reel": 3,
      "row": 2,
      "size": 1,
      "mult": 2
     }
    ]
   },
   {
    "index": 70,
    "type": "newFrames",
    "frames": [
     {
      "reel": 3,
      "row": 2,
      "size": 1,
      "mult": 2
     }
    ]
   },
   {
    "index": 71,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 2,
      "row": 3
     }
    ],
    "reels": [
     2
    ]
   },
   {
    "index": 72,
    "type": "winInfo",
    "totalWin": 400,
    "wins": [
     {
      "symbol": "H3",
      "kind": 3,
      "win": 400,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 3,
       "multiplier": 1,
       "winWithoutMult": 400,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 400
      }
     }
    ]
   },
   {
    "index": 73,
    "type": "setWin",
    "amount": 400,
    "winLevel": 4
   },
   {
    "index": 74,
    "type": "setTotalWin",
    "amount": 15540
   },
   {
    "index": 75,
    "type": "updateFreeSpin",
    "amount": 9,
    "total": 10
   },
   {
    "index": 76,
    "type": "freeSpinEnd",
    "amount": 15540,
    "winLevel": 7
   },
   {
    "index": 77,
    "type": "finalWin",
    "amount": 15540
   }
  ],
  "criteria": "ordinary",
  "basePayout": 0,
  "featurePayout": 15540,
  "featureTier": "don"
 },
 {
  "id": 23,
  "mode": "bonus_epic",
  "payoutMultiplier": 738860,
  "events": [
   {
    "index": 0,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      }
     ]
    ],
    "paddingPositions": [
     647,
     862,
     74,
     286,
     102
    ],
    "anticipation": [
     0,
     0,
     1,
     2,
     2
    ],
    "gameType": "basegame"
   },
   {
    "index": 1,
    "type": "setTotalWin",
    "amount": 0
   },
   {
    "index": 2,
    "type": "freeSpinTrigger",
    "totalFs": 10,
    "positions": [
     {
      "reel": 0,
      "row": 4
     },
     {
      "reel": 1,
      "row": 2
     },
     {
      "reel": 2,
      "row": 3
     },
     {
      "reel": 3,
      "row": 4
     },
     {
      "reel": 4,
      "row": 1
     }
    ]
   },
   {
    "index": 3,
    "type": "bonusTier",
    "tier": "don",
    "seedFrames": 3
   },
   {
    "index": 4,
    "type": "reveal",
    "board": [
     [
      {
       "name": "H3"
      },
      {
       "name": "L3"
      },
      {
       "name": "H3"
      },
      {
       "name": "L4"
      },
      {
       "name": "H4"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "SW"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "H5"
      },
      {
       "name": "L1"
      },
      {
       "name": "H5"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      }
     ]
    ],
    "paddingPositions": [
     292,
     307,
     142,
     405,
     579
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 5,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 1,
      "row": 1,
      "size": 2,
      "mult": 3
     },
     {
      "reel": 4,
      "row": 4,
      "size": 1,
      "mult": 3
     },
     {
      "reel": 3,
      "row": 1,
      "size": 1,
      "mult": 2
     }
    ]
   },
   {
    "index": 6,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 1,
      "row": 4
     }
    ],
    "reels": [
     1
    ]
   },
   {
    "index": 7,
    "type": "winInfo",
    "totalWin": 280,
    "wins": [
     {
      "symbol": "L4",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 3,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L3",
      "kind": 3,
      "win": 240,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 9,
       "multiplier": 6,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 6,
       "uncappedWin": 240
      }
     }
    ]
   },
   {
    "index": 8,
    "type": "setWin",
    "amount": 280,
    "winLevel": 4
   },
   {
    "index": 9,
    "type": "setTotalWin",
    "amount": 280
   },
   {
    "index": 10,
    "type": "frameDoubling",
    "frames": [
     {
      "reel": 1,
      "row": 1,
      "size": 2,
      "mult": 6
     }
    ]
   },
   {
    "index": 11,
    "type": "updateFreeSpin",
    "amount": 0,
    "total": 10
   },
   {
    "index": 12,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "SW"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "H5"
      }
     ],
     [
      {
       "name": "H5"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      }
     ]
    ],
    "paddingPositions": [
     126,
     427,
     971,
     380,
     513
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 13,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 1,
      "row": 1,
      "size": 2,
      "mult": 6
     },
     {
      "reel": 4,
      "row": 4,
      "size": 1,
      "mult": 3
     },
     {
      "reel": 3,
      "row": 1,
      "size": 1,
      "mult": 2
     }
    ]
   },
   {
    "index": 14,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 1,
      "row": 2
     }
    ],
    "reels": [
     1
    ]
   },
   {
    "index": 15,
    "type": "winInfo",
    "totalWin": 960,
    "wins": [
     {
      "symbol": "L1",
      "kind": 3,
      "win": 480,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 8,
       "multiplier": 12,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 12,
       "uncappedWin": 480
      }
     },
     {
      "symbol": "L1",
      "kind": 3,
      "win": 480,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 11,
       "multiplier": 12,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 12,
       "uncappedWin": 480
      }
     }
    ]
   },
   {
    "index": 16,
    "type": "setWin",
    "amount": 960,
    "winLevel": 5
   },
   {
    "index": 17,
    "type": "setTotalWin",
    "amount": 1240
   },
   {
    "index": 18,
    "type": "frameDoubling",
    "frames": [
     {
      "reel": 1,
      "row": 1,
      "size": 2,
      "mult": 12
     }
    ]
   },
   {
    "index": 19,
    "type": "updateFreeSpin",
    "amount": 1,
    "total": 10
   },
   {
    "index": 20,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "H5"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "SW"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "H4"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "H3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "H2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      }
     ]
    ],
    "paddingPositions": [
     770,
     782,
     394,
     759,
     105
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 21,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 1,
      "row": 1,
      "size": 2,
      "mult": 12
     },
     {
      "reel": 4,
      "row": 4,
      "size": 1,
      "mult": 3
     },
     {
      "reel": 3,
      "row": 1,
      "size": 1,
      "mult": 2
     }
    ]
   },
   {
    "index": 22,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 1,
      "row": 1
     }
    ],
    "reels": [
     1
    ]
   },
   {
    "index": 23,
    "type": "winInfo",
    "totalWin": 1960,
    "wins": [
     {
      "symbol": "L3",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 2
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 4
       }
      ],
      "meta": {
       "lineIndex": 6,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L4",
      "kind": 3,
      "win": 960,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 8,
       "multiplier": 24,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 24,
       "uncappedWin": 960
      }
     },
     {
      "symbol": "L2",
      "kind": 3,
      "win": 960,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 9,
       "multiplier": 24,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 24,
       "uncappedWin": 960
      }
     }
    ]
   },
   {
    "index": 24,
    "type": "setWin",
    "amount": 1960,
    "winLevel": 6
   },
   {
    "index": 25,
    "type": "setTotalWin",
    "amount": 3200
   },
   {
    "index": 26,
    "type": "frameDoubling",
    "frames": [
     {
      "reel": 1,
      "row": 1,
      "size": 2,
      "mult": 24
     }
    ]
   },
   {
    "index": 27,
    "type": "updateFreeSpin",
    "amount": 2,
    "total": 10
   },
   {
    "index": 28,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "H2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "H5"
      },
      {
       "name": "L1"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L1"
      },
      {
       "name": "H5"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "H2"
      },
      {
       "name": "L4"
      },
      {
       "name": "SW"
      },
      {
       "name": "H4"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      }
     ]
    ],
    "paddingPositions": [
     44,
     501,
     75,
     189,
     923
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 29,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 1,
      "row": 1,
      "size": 2,
      "mult": 24
     },
     {
      "reel": 4,
      "row": 4,
      "size": 1,
      "mult": 3
     },
     {
      "reel": 3,
      "row": 1,
      "size": 1,
      "mult": 2
     }
    ]
   },
   {
    "index": 30,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 3,
      "row": 4
     }
    ],
    "reels": [
     3
    ]
   },
   {
    "index": 31,
    "type": "winInfo",
    "totalWin": 200,
    "wins": [
     {
      "symbol": "L1",
      "kind": 5,
      "win": 200,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 3
       },
       {
        "reel": 3,
        "row": 3
       },
       {
        "reel": 4,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 3,
       "multiplier": 1,
       "winWithoutMult": 200,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 200
      }
     }
    ]
   },
   {
    "index": 32,
    "type": "setWin",
    "amount": 200,
    "winLevel": 4
   },
   {
    "index": 33,
    "type": "setTotalWin",
    "amount": 3400
   },
   {
    "index": 34,
    "type": "updateFreeSpin",
    "amount": 3,
    "total": 10
   },
   {
    "index": 35,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "H4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "SW"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "H1"
      },
      {
       "name": "SW"
      },
      {
       "name": "H1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "H5"
      },
      {
       "name": "L2"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "H4"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "H2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      }
     ]
    ],
    "paddingPositions": [
     596,
     131,
     916,
     287,
     658
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 36,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 1,
      "row": 1,
      "size": 2,
      "mult": 24
     },
     {
      "reel": 4,
      "row": 4,
      "size": 1,
      "mult": 3
     },
     {
      "reel": 3,
      "row": 1,
      "size": 1,
      "mult": 2
     }
    ]
   },
   {
    "index": 37,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 1,
      "row": 3
     },
     {
      "reel": 2,
      "row": 1
     }
    ],
    "reels": [
     1,
     2
    ]
   },
   {
    "index": 38,
    "type": "winInfo",
    "totalWin": 36400,
    "wins": [
     {
      "symbol": "L2",
      "kind": 3,
      "win": 1920,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 1
       },
       {
        "reel": 2,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 1,
       "multiplier": 48,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 48,
       "uncappedWin": 1920
      }
     },
     {
      "symbol": "L1",
      "kind": 3,
      "win": 1920,
      "positions": [
       {
        "reel": 0,
        "row": 2
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 2,
       "multiplier": 48,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 48,
       "uncappedWin": 1920
      }
     },
     {
      "symbol": "H4",
      "kind": 3,
      "win": 200,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 3,
       "multiplier": 1,
       "winWithoutMult": 200,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 200
      }
     },
     {
      "symbol": "L4",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 4
       },
       {
        "reel": 2,
        "row": 4
       }
      ],
      "meta": {
       "lineIndex": 4,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L2",
      "kind": 4,
      "win": 2400,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 3
       },
       {
        "reel": 3,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 5,
       "multiplier": 24,
       "winWithoutMult": 100,
       "globalMult": 1,
       "lineMultiplier": 24,
       "uncappedWin": 2400
      }
     },
     {
      "symbol": "L1",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 2
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 4
       }
      ],
      "meta": {
       "lineIndex": 6,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L4",
      "kind": 3,
      "win": 960,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 7,
       "multiplier": 24,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 24,
       "uncappedWin": 960
      }
     },
     {
      "symbol": "H4",
      "kind": 3,
      "win": 9600,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 8,
       "multiplier": 48,
       "winWithoutMult": 200,
       "globalMult": 1,
       "lineMultiplier": 48,
       "uncappedWin": 9600
      }
     },
     {
      "symbol": "L2",
      "kind": 4,
      "win": 4800,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       },
       {
        "reel": 3,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 9,
       "multiplier": 48,
       "winWithoutMult": 100,
       "globalMult": 1,
       "lineMultiplier": 48,
       "uncappedWin": 4800
      }
     },
     {
      "symbol": "L1",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 2
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 10,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "H4",
      "kind": 3,
      "win": 9600,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 11,
       "multiplier": 48,
       "winWithoutMult": 200,
       "globalMult": 1,
       "lineMultiplier": 48,
       "uncappedWin": 9600
      }
     },
     {
      "symbol": "L4",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 12,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L2",
      "kind": 4,
      "win": 4800,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 1
       },
       {
        "reel": 3,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 13,
       "multiplier": 48,
       "winWithoutMult": 100,
       "globalMult": 1,
       "lineMultiplier": 48,
       "uncappedWin": 4800
      }
     },
     {
      "symbol": "L4",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 4
       }
      ],
      "meta": {
       "lineIndex": 14,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     }
    ]
   },
   {
    "index": 39,
    "type": "setWin",
    "amount": 36400,
    "winLevel": 9
   },
   {
    "index": 40,
    "type": "setTotalWin",
    "amount": 39800
   },
   {
    "index": 41,
    "type": "frameDoubling",
    "frames": [
     {
      "reel": 1,
      "row": 1,
      "size": 2,
      "mult": 48
     }
    ]
   },
   {
    "index": 42,
    "type": "updateFreeSpin",
    "amount": 4,
    "total": 10
   },
   {
    "index": 43,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "H4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "H1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "SW"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "H5"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "H3"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      }
     ]
    ],
    "paddingPositions": [
     662,
     644,
     309,
     356,
     959
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 44,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 1,
      "row": 1,
      "size": 2,
      "mult": 48
     },
     {
      "reel": 4,
      "row": 4,
      "size": 1,
      "mult": 3
     },
     {
      "reel": 3,
      "row": 1,
      "size": 1,
      "mult": 2
     }
    ]
   },
   {
    "index": 45,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 2,
      "row": 2
     }
    ],
    "reels": [
     2
    ]
   },
   {
    "index": 46,
    "type": "winInfo",
    "totalWin": 3840,
    "wins": [
     {
      "symbol": "L4",
      "kind": 3,
      "win": 3840,
      "positions": [
       {
        "reel": 0,
        "row": 2
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 2,
       "multiplier": 96,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 96,
       "uncappedWin": 3840
      }
     }
    ]
   },
   {
    "index": 47,
    "type": "setWin",
    "amount": 3840,
    "winLevel": 7
   },
   {
    "index": 48,
    "type": "setTotalWin",
    "amount": 43640
   },
   {
    "index": 49,
    "type": "frameDoubling",
    "frames": [
     {
      "reel": 1,
      "row": 1,
      "size": 2,
      "mult": 96
     }
    ]
   },
   {
    "index": 50,
    "type": "updateFreeSpin",
    "amount": 5,
    "total": 10
   },
   {
    "index": 51,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L4"
      },
      {
       "name": "H3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "SW"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "H4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "SW"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "H5"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      }
     ]
    ],
    "paddingPositions": [
     27,
     723,
     660,
     327,
     963
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 52,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 1,
      "row": 1,
      "size": 2,
      "mult": 96
     },
     {
      "reel": 4,
      "row": 4,
      "size": 1,
      "mult": 3
     },
     {
      "reel": 3,
      "row": 1,
      "size": 1,
      "mult": 2
     }
    ]
   },
   {
    "index": 53,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 1,
      "row": 1
     }
    ],
    "reels": [
     1
    ]
   },
   {
    "index": 54,
    "type": "winInfo",
    "totalWin": 9680,
    "wins": [
     {
      "symbol": "L3",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 3,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L2",
      "kind": 4,
      "win": 9600,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 2
       },
       {
        "reel": 3,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 7,
       "multiplier": 96,
       "winWithoutMult": 100,
       "globalMult": 1,
       "lineMultiplier": 96,
       "uncappedWin": 9600
      }
     },
     {
      "symbol": "L3",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 2
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 10,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     }
    ]
   },
   {
    "index": 55,
    "type": "setWin",
    "amount": 9680,
    "winLevel": 8
   },
   {
    "index": 56,
    "type": "setTotalWin",
    "amount": 53320
   },
   {
    "index": 57,
    "type": "frameDoubling",
    "frames": [
     {
      "reel": 1,
      "row": 1,
      "size": 2,
      "mult": 192
     }
    ]
   },
   {
    "index": 58,
    "type": "updateFreeSpin",
    "amount": 6,
    "total": 10
   },
   {
    "index": 59,
    "type": "reveal",
    "board": [
     [
      {
       "name": "H5"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "SW"
      },
      {
       "name": "L2"
      },
      {
       "name": "H3"
      },
      {
       "name": "H4"
      },
      {
       "name": "H4"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "H5"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "SW"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "H5"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "H1"
      },
      {
       "name": "L3"
      },
      {
       "name": "W",
       "wild": true
      },
      {
       "name": "L2"
      }
     ]
    ],
    "paddingPositions": [
     502,
     251,
     602,
     280,
     92
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 60,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 1,
      "row": 1,
      "size": 2,
      "mult": 192
     },
     {
      "reel": 4,
      "row": 4,
      "size": 1,
      "mult": 3
     },
     {
      "reel": 3,
      "row": 1,
      "size": 1,
      "mult": 2
     }
    ]
   },
   {
    "index": 61,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 1,
      "row": 1
     },
     {
      "reel": 2,
      "row": 4
     }
    ],
    "reels": [
     1,
     2
    ]
   },
   {
    "index": 62,
    "type": "winInfo",
    "totalWin": 186340,
    "wins": [
     {
      "symbol": "L3",
      "kind": 3,
      "win": 15360,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 1
       },
       {
        "reel": 2,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 1,
       "multiplier": 384,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 384,
       "uncappedWin": 15360
      }
     },
     {
      "symbol": "L2",
      "kind": 3,
      "win": 15360,
      "positions": [
       {
        "reel": 0,
        "row": 2
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 2,
       "multiplier": 384,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 384,
       "uncappedWin": 15360
      }
     },
     {
      "symbol": "L1",
      "kind": 4,
      "win": 100,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 3
       },
       {
        "reel": 3,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 3,
       "multiplier": 1,
       "winWithoutMult": 100,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 100
      }
     },
     {
      "symbol": "L1",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 4
       },
       {
        "reel": 2,
        "row": 4
       }
      ],
      "meta": {
       "lineIndex": 4,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L3",
      "kind": 3,
      "win": 7680,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 5,
       "multiplier": 192,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 192,
       "uncappedWin": 7680
      }
     },
     {
      "symbol": "L2",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 2
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 4
       }
      ],
      "meta": {
       "lineIndex": 6,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L1",
      "kind": 5,
      "win": 39000,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 2
       },
       {
        "reel": 3,
        "row": 3
       },
       {
        "reel": 4,
        "row": 4
       }
      ],
      "meta": {
       "lineIndex": 7,
       "multiplier": 195,
       "winWithoutMult": 200,
       "globalMult": 1,
       "lineMultiplier": 195,
       "uncappedWin": 39000
      }
     },
     {
      "symbol": "L1",
      "kind": 4,
      "win": 38400,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 1
       },
       {
        "reel": 3,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 8,
       "multiplier": 384,
       "winWithoutMult": 100,
       "globalMult": 1,
       "lineMultiplier": 384,
       "uncappedWin": 38400
      }
     },
     {
      "symbol": "L3",
      "kind": 3,
      "win": 15360,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 9,
       "multiplier": 384,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 384,
       "uncappedWin": 15360
      }
     },
     {
      "symbol": "L2",
      "kind": 3,
      "win": 40,
      "positions": [
       {
        "reel": 0,
        "row": 2
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 3
       }
      ],
      "meta": {
       "lineIndex": 10,
       "multiplier": 1,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 1,
       "uncappedWin": 40
      }
     },
     {
      "symbol": "L1",
      "kind": 4,
      "win": 38400,
      "positions": [
       {
        "reel": 0,
        "row": 3
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       },
       {
        "reel": 3,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 11,
       "multiplier": 384,
       "winWithoutMult": 100,
       "globalMult": 1,
       "lineMultiplier": 384,
       "uncappedWin": 38400
      }
     },
     {
      "symbol": "L1",
      "kind": 5,
      "win": 600,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 3
       },
       {
        "reel": 3,
        "row": 3
       },
       {
        "reel": 4,
        "row": 4
       }
      ],
      "meta": {
       "lineIndex": 12,
       "multiplier": 3,
       "winWithoutMult": 200,
       "globalMult": 1,
       "lineMultiplier": 3,
       "uncappedWin": 600
      }
     },
     {
      "symbol": "L3",
      "kind": 3,
      "win": 15360,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 1
       }
      ],
      "meta": {
       "lineIndex": 13,
       "multiplier": 384,
       "winWithoutMult": 40,
       "globalMult": 1,
       "lineMultiplier": 384,
       "uncappedWin": 15360
      }
     },
     {
      "symbol": "L1",
      "kind": 5,
      "win": 600,
      "positions": [
       {
        "reel": 0,
        "row": 4
       },
       {
        "reel": 1,
        "row": 3
       },
       {
        "reel": 2,
        "row": 4
       },
       {
        "reel": 3,
        "row": 3
       },
       {
        "reel": 4,
        "row": 4
       }
      ],
      "meta": {
       "lineIndex": 14,
       "multiplier": 3,
       "winWithoutMult": 200,
       "globalMult": 1,
       "lineMultiplier": 3,
       "uncappedWin": 600
      }
     }
    ]
   },
   {
    "index": 63,
    "type": "setWin",
    "amount": 186340,
    "winLevel": 9
   },
   {
    "index": 64,
    "type": "setTotalWin",
    "amount": 239660
   },
   {
    "index": 65,
    "type": "frameDoubling",
    "frames": [
     {
      "reel": 1,
      "row": 1,
      "size": 2,
      "mult": 384
     },
     {
      "reel": 4,
      "row": 4,
      "size": 1,
      "mult": 6
     }
    ]
   },
   {
    "index": 66,
    "type": "updateFreeSpin",
    "amount": 7,
    "total": 10
   },
   {
    "index": 67,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "H3"
      },
      {
       "name": "L4"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "H5"
      },
      {
       "name": "L1"
      },
      {
       "name": "L3"
      },
      {
       "name": "SW"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "H4"
      },
      {
       "name": "H4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "H4"
      },
      {
       "name": "L3"
      }
     ]
    ],
    "paddingPositions": [
     465,
     662,
     603,
     504,
     371
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 68,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 1,
      "row": 1,
      "size": 2,
      "mult": 384
     },
     {
      "reel": 4,
      "row": 4,
      "size": 1,
      "mult": 6
     },
     {
      "reel": 3,
      "row": 1,
      "size": 1,
      "mult": 2
     },
     {
      "reel": 1,
      "row": 3,
      "size": 1,
      "mult": 4
     }
    ]
   },
   {
    "index": 69,
    "type": "newFrames",
    "frames": [
     {
      "reel": 1,
      "row": 3,
      "size": 1,
      "mult": 4
     }
    ]
   },
   {
    "index": 70,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 2,
      "row": 3
     }
    ],
    "reels": [
     2
    ]
   },
   {
    "index": 71,
    "type": "setTotalWin",
    "amount": 239660
   },
   {
    "index": 72,
    "type": "updateFreeSpin",
    "amount": 8,
    "total": 10
   },
   {
    "index": 73,
    "type": "reveal",
    "board": [
     [
      {
       "name": "H3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "H1"
      },
      {
       "name": "SW"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L1"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "H5"
      },
      {
       "name": "H4"
      }
     ]
    ],
    "paddingPositions": [
     890,
     67,
     930,
     246,
     300
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 74,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 1,
      "row": 1,
      "size": 2,
      "mult": 384
     },
     {
      "reel": 4,
      "row": 4,
      "size": 1,
      "mult": 6
     },
     {
      "reel": 3,
      "row": 1,
      "size": 1,
      "mult": 2
     },
     {
      "reel": 1,
      "row": 3,
      "size": 1,
      "mult": 4
     }
    ]
   },
   {
    "index": 75,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 2,
      "row": 3
     }
    ],
    "reels": [
     2
    ]
   },
   {
    "index": 76,
    "type": "winInfo",
    "totalWin": 115200,
    "wins": [
     {
      "symbol": "L3",
      "kind": 4,
      "win": 38400,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 3
       },
       {
        "reel": 3,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 5,
       "multiplier": 384,
       "winWithoutMult": 100,
       "globalMult": 1,
       "lineMultiplier": 384,
       "uncappedWin": 38400
      }
     },
     {
      "symbol": "L3",
      "kind": 4,
      "win": 76800,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       },
       {
        "reel": 3,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 9,
       "multiplier": 768,
       "winWithoutMult": 100,
       "globalMult": 1,
       "lineMultiplier": 768,
       "uncappedWin": 76800
      }
     }
    ]
   },
   {
    "index": 77,
    "type": "setWin",
    "amount": 115200,
    "winLevel": 9
   },
   {
    "index": 78,
    "type": "setTotalWin",
    "amount": 354860
   },
   {
    "index": 79,
    "type": "frameDoubling",
    "frames": [
     {
      "reel": 1,
      "row": 1,
      "size": 2,
      "mult": 768
     }
    ]
   },
   {
    "index": 80,
    "type": "freeSpinRetrigger",
    "totalFs": 12,
    "positions": [
     {
      "reel": 2,
      "row": 1
     },
     {
      "reel": 4,
      "row": 3
     }
    ]
   },
   {
    "index": 81,
    "type": "updateFreeSpin",
    "amount": 9,
    "total": 12
   },
   {
    "index": 82,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L3"
      },
      {
       "name": "L3"
      },
      {
       "name": "H5"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "H5"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L1"
      }
     ],
     [
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "SW"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "H5"
      },
      {
       "name": "H5"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      }
     ]
    ],
    "paddingPositions": [
     750,
     242,
     838,
     84,
     805
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 83,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 1,
      "row": 1,
      "size": 2,
      "mult": 768
     },
     {
      "reel": 4,
      "row": 4,
      "size": 1,
      "mult": 6
     },
     {
      "reel": 3,
      "row": 1,
      "size": 1,
      "mult": 2
     },
     {
      "reel": 1,
      "row": 3,
      "size": 1,
      "mult": 4
     }
    ]
   },
   {
    "index": 84,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 2,
      "row": 4
     }
    ],
    "reels": [
     2
    ]
   },
   {
    "index": 85,
    "type": "winInfo",
    "totalWin": 384000,
    "wins": [
     {
      "symbol": "L3",
      "kind": 4,
      "win": 76800,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 3
       },
       {
        "reel": 3,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 5,
       "multiplier": 768,
       "winWithoutMult": 100,
       "globalMult": 1,
       "lineMultiplier": 768,
       "uncappedWin": 76800
      }
     },
     {
      "symbol": "L3",
      "kind": 4,
      "win": 153600,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 2
       },
       {
        "reel": 3,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 9,
       "multiplier": 1536,
       "winWithoutMult": 100,
       "globalMult": 1,
       "lineMultiplier": 1536,
       "uncappedWin": 153600
      }
     },
     {
      "symbol": "L3",
      "kind": 4,
      "win": 153600,
      "positions": [
       {
        "reel": 0,
        "row": 1
       },
       {
        "reel": 1,
        "row": 2
       },
       {
        "reel": 2,
        "row": 1
       },
       {
        "reel": 3,
        "row": 2
       }
      ],
      "meta": {
       "lineIndex": 13,
       "multiplier": 1536,
       "winWithoutMult": 100,
       "globalMult": 1,
       "lineMultiplier": 1536,
       "uncappedWin": 153600
      }
     }
    ]
   },
   {
    "index": 86,
    "type": "setWin",
    "amount": 384000,
    "winLevel": 9
   },
   {
    "index": 87,
    "type": "setTotalWin",
    "amount": 738860
   },
   {
    "index": 88,
    "type": "frameDoubling",
    "frames": [
     {
      "reel": 1,
      "row": 1,
      "size": 2,
      "mult": 1536
     }
    ]
   },
   {
    "index": 89,
    "type": "updateFreeSpin",
    "amount": 10,
    "total": 12
   },
   {
    "index": 90,
    "type": "reveal",
    "board": [
     [
      {
       "name": "L2"
      },
      {
       "name": "L1"
      },
      {
       "name": "L4"
      },
      {
       "name": "L4"
      },
      {
       "name": "H5"
      },
      {
       "name": "L3"
      }
     ],
     [
      {
       "name": "L4"
      },
      {
       "name": "S",
       "scatter": true
      },
      {
       "name": "L3"
      },
      {
       "name": "L4"
      },
      {
       "name": "H4"
      },
      {
       "name": "L2"
      }
     ],
     [
      {
       "name": "H4"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "L3"
      },
      {
       "name": "L1"
      },
      {
       "name": "SW"
      }
     ],
     [
      {
       "name": "L1"
      },
      {
       "name": "SW"
      },
      {
       "name": "L1"
      },
      {
       "name": "L2"
      },
      {
       "name": "H2"
      },
      {
       "name": "L4"
      }
     ],
     [
      {
       "name": "H4"
      },
      {
       "name": "L2"
      },
      {
       "name": "L2"
      },
      {
       "name": "L4"
      },
      {
       "name": "L2"
      },
      {
       "name": "H5"
      }
     ]
    ],
    "paddingPositions": [
     243,
     863,
     660,
     310,
     775
    ],
    "anticipation": [
     0,
     0,
     0,
     0,
     0
    ],
    "gameType": "freegame"
   },
   {
    "index": 91,
    "type": "updateFrames",
    "frames": [
     {
      "reel": 1,
      "row": 1,
      "size": 2,
      "mult": 1536
     },
     {
      "reel": 4,
      "row": 4,
      "size": 1,
      "mult": 6
     },
     {
      "reel": 3,
      "row": 1,
      "size": 1,
      "mult": 2
     },
     {
      "reel": 1,
      "row": 3,
      "size": 1,
      "mult": 4
     }
    ]
   },
   {
    "index": 92,
    "type": "wildExpand",
    "wilds": [
     {
      "reel": 3,
      "row": 1
     }
    ],
    "reels": [
     3
    ]
   },
   {
    "index": 93,
    "type": "setTotalWin",
    "amount": 738860
   },
   {
    "index": 94,
    "type": "updateFreeSpin",
    "amount": 11,
    "total": 12
   },
   {
    "index": 95,
    "type": "freeSpinEnd",
    "amount": 738860,
    "winLevel": 9
   },
   {
    "index": 96,
    "type": "finalWin",
    "amount": 738860
   }
  ],
  "criteria": "ordinary",
  "basePayout": 0,
  "featurePayout": 738860,
  "featureTier": "don"
 }
];
