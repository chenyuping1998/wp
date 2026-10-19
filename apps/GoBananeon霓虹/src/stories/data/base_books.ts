export default [
  {
    "id": 8,
    "payoutMultiplier": 180,
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
              "name": "W",
              "wild": true,
              "multiplier": 1
            },
            {
              "name": "L5"
            },
            {
              "name": "H4"
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
              "name": "L5"
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
          ],
          [
            {
              "name": "L5"
            },
            {
              "name": "L1"
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
              "name": "H1"
            },
            {
              "name": "H1"
            },
            {
              "name": "H1"
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
              "name": "L1"
            }
          ]
        ],
        "paddingPositions": [
          20,
          194,
          86,
          231,
          216
        ],
        "gameType": "basegame",
        "anticipation": [
          0,
          0,
          0,
          0,
          0
        ]
      },
      {
        "index": 1,
        "type": "winInfo",
        "totalWin": 180,
        "wins": [
          {
            "symbol": "L2",
            "kind": 3,
            "win": 20,
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
                "row": 2
              }
            ],
            "meta": {
              "ways": 1,
              "globalMult": 1,
              "winWithoutMult": 20,
              "symbolMult": 0
            }
          },
          {
            "symbol": "L1",
            "kind": 5,
            "win": 160,
            "positions": [
              {
                "reel": 0,
                "row": 1
              },
              {
                "reel": 1,
                "row": 4
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
              "ways": 1,
              "globalMult": 1,
              "winWithoutMult": 160,
              "symbolMult": 0
            }
          }
        ]
      },
      {
        "index": 2,
        "type": "setWin",
        "amount": 180,
        "winLevel": 3
      },
      {
        "index": 3,
        "type": "setTotalWin",
        "amount": 180
      },
      {
        "index": 4,
        "type": "finalWin",
        "amount": 180
      }
    ],
    "criteria": "basegame",
    "baseGameWins": 1.8,
    "freeGameWins": 0.0
  }
];
