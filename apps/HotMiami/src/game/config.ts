// Generated from math-sdk games/hot_miami/library/configs/config_fe_hot_miami.json
// Regenerate with design/sync_math_config.py after re-running the math.
export default {
	"providerName": "igs",
	"gameName": "hot_miami",
	"gameID": "HotMiami",
	"rtp": 0.94,
	"numReels": 5,
	"numRows": [
		4,
		4,
		4,
		4,
		4
	],
	"betModes": {
		"base": {
			"cost": 1.0,
			"feature": true,
			"buyBonus": false,
			"rtp": 0.94,
			"max_win": 20000.0
		},
		"bonus": {
			"cost": 100.0,
			"feature": false,
			"buyBonus": true,
			"rtp": 0.94,
			"max_win": 20000.0
		},
		"bonus_hits": {
			"cost": 250.0,
			"feature": false,
			"buyBonus": true,
			"rtp": 0.94,
			"max_win": 20000.0
		},
		"bonus_epic": {
			"cost": 500.0,
			"feature": false,
			"buyBonus": true,
			"rtp": 0.94,
			"max_win": 20000.0
		}
	},
	"paylines": {
		"1": [
			0,
			0,
			0,
			0,
			0
		],
		"2": [
			1,
			1,
			1,
			1,
			1
		],
		"3": [
			2,
			2,
			2,
			2,
			2
		],
		"4": [
			3,
			3,
			3,
			3,
			3
		],
		"5": [
			0,
			1,
			2,
			1,
			0
		],
		"6": [
			1,
			2,
			3,
			2,
			1
		],
		"7": [
			3,
			2,
			1,
			2,
			3
		],
		"8": [
			2,
			1,
			0,
			1,
			2
		],
		"9": [
			0,
			1,
			1,
			1,
			0
		],
		"10": [
			1,
			2,
			2,
			2,
			1
		],
		"11": [
			2,
			1,
			1,
			1,
			2
		],
		"12": [
			3,
			2,
			2,
			2,
			3
		],
		"13": [
			0,
			1,
			0,
			1,
			0
		],
		"14": [
			3,
			2,
			3,
			2,
			3
		]
	},
	"symbols": {
		"W": {
			"paytable": [
				{
					"5": 400
				}
			],
			"special_properties": [
				"wild"
			]
		},
		"S": {
			"paytable": null,
			"special_properties": [
				"scatter"
			]
		},
		"C": {
			"paytable": null,
			"special_properties": [
				"collector"
			]
		},
		"H1": {
			"paytable": [
				{
					"5": 400
				},
				{
					"4": 100
				},
				{
					"3": 40
				}
			]
		},
		"H2": {
			"paytable": [
				{
					"5": 200
				},
				{
					"4": 60
				},
				{
					"3": 20
				}
			]
		},
		"H3": {
			"paytable": [
				{
					"5": 50
				},
				{
					"4": 20
				},
				{
					"3": 4
				}
			]
		},
		"H4": {
			"paytable": [
				{
					"5": 30
				},
				{
					"4": 10
				},
				{
					"3": 2
				}
			]
		},
		"H5": {
			"paytable": [
				{
					"5": 10
				},
				{
					"4": 4
				},
				{
					"3": 1
				}
			]
		},
		"L1": {
			"paytable": [
				{
					"5": 2.0
				},
				{
					"4": 1.0
				},
				{
					"3": 0.4
				}
			]
		},
		"L2": {
			"paytable": [
				{
					"5": 2.0
				},
				{
					"4": 1.0
				},
				{
					"3": 0.4
				}
			]
		},
		"L3": {
			"paytable": [
				{
					"5": 2.0
				},
				{
					"4": 1.0
				},
				{
					"3": 0.4
				}
			]
		},
		"L4": {
			"paytable": [
				{
					"5": 2.0
				},
				{
					"4": 1.0
				},
				{
					"3": 0.4
				}
			]
		}
	},
	"paddingReels": {
		"basegame": [
			[
				{
					"name": "L1"
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
					"name": "H2"
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
					"name": "H5"
				},
				{
					"name": "H4"
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
					"name": "H5"
				},
				{
					"name": "L1"
				},
				{
					"name": "S"
				},
				{
					"name": "L3"
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
					"name": "H4"
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
					"name": "H2"
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
					"name": "L1"
				},
				{
					"name": "H5"
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
					"name": "H2"
				},
				{
					"name": "S"
				},
				{
					"name": "L2"
				},
				{
					"name": "C"
				},
				{
					"name": "H4"
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
					"name": "L1"
				},
				{
					"name": "L3"
				},
				{
					"name": "L4"
				},
				{
					"name": "H1"
				},
				{
					"name": "H3"
				},
				{
					"name": "L2"
				},
				{
					"name": "H3"
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
					"name": "L2"
				},
				{
					"name": "L4"
				},
				{
					"name": "H5"
				},
				{
					"name": "H3"
				},
				{
					"name": "H1"
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
					"name": "L1"
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
					"name": "S"
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
					"name": "H2"
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
					"name": "H4"
				},
				{
					"name": "H5"
				},
				{
					"name": "W"
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
				},
				{
					"name": "H3"
				},
				{
					"name": "H5"
				},
				{
					"name": "L4"
				},
				{
					"name": "W"
				},
				{
					"name": "H2"
				},
				{
					"name": "H3"
				},
				{
					"name": "L2"
				},
				{
					"name": "H4"
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
					"name": "H4"
				},
				{
					"name": "L2"
				},
				{
					"name": "H4"
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
					"name": "H3"
				},
				{
					"name": "L1"
				},
				{
					"name": "H2"
				},
				{
					"name": "C"
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
				},
				{
					"name": "H3"
				},
				{
					"name": "L3"
				},
				{
					"name": "H2"
				},
				{
					"name": "H5"
				},
				{
					"name": "L1"
				},
				{
					"name": "S"
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
				},
				{
					"name": "H1"
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
					"name": "L1"
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
					"name": "S"
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
					"name": "H4"
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
					"name": "L3"
				},
				{
					"name": "L1"
				},
				{
					"name": "H4"
				},
				{
					"name": "H5"
				},
				{
					"name": "H1"
				},
				{
					"name": "L2"
				},
				{
					"name": "L3"
				},
				{
					"name": "H2"
				},
				{
					"name": "L3"
				},
				{
					"name": "H1"
				},
				{
					"name": "L4"
				},
				{
					"name": "L2"
				},
				{
					"name": "S"
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
					"name": "L3"
				},
				{
					"name": "L1"
				},
				{
					"name": "H4"
				},
				{
					"name": "H5"
				},
				{
					"name": "H1"
				},
				{
					"name": "C"
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
				},
				{
					"name": "H4"
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
					"name": "H2"
				},
				{
					"name": "L2"
				},
				{
					"name": "H3"
				},
				{
					"name": "H5"
				},
				{
					"name": "H2"
				},
				{
					"name": "W"
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
					"name": "H5"
				},
				{
					"name": "W"
				},
				{
					"name": "H5"
				},
				{
					"name": "H3"
				},
				{
					"name": "L2"
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
					"name": "L1"
				},
				{
					"name": "L3"
				},
				{
					"name": "H5"
				},
				{
					"name": "H3"
				},
				{
					"name": "W"
				},
				{
					"name": "H3"
				},
				{
					"name": "L4"
				},
				{
					"name": "H1"
				},
				{
					"name": "H2"
				},
				{
					"name": "L2"
				},
				{
					"name": "H4"
				},
				{
					"name": "C"
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
				},
				{
					"name": "S"
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
					"name": "H3"
				},
				{
					"name": "H1"
				},
				{
					"name": "H4"
				},
				{
					"name": "L1"
				},
				{
					"name": "W"
				},
				{
					"name": "H5"
				},
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
					"name": "H4"
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
					"name": "H3"
				},
				{
					"name": "H2"
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
					"name": "H4"
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
					"name": "H5"
				},
				{
					"name": "L1"
				},
				{
					"name": "H4"
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
				},
				{
					"name": "L3"
				},
				{
					"name": "L1"
				},
				{
					"name": "S"
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
					"name": "H2"
				},
				{
					"name": "C"
				},
				{
					"name": "H4"
				},
				{
					"name": "W"
				},
				{
					"name": "L4"
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
					"name": "H3"
				},
				{
					"name": "H1"
				},
				{
					"name": "H5"
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
					"name": "H5"
				},
				{
					"name": "H3"
				},
				{
					"name": "S"
				},
				{
					"name": "H4"
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
					"name": "H4"
				},
				{
					"name": "L2"
				},
				{
					"name": "H2"
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
					"name": "H2"
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
					"name": "H5"
				},
				{
					"name": "L1"
				},
				{
					"name": "H1"
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
					"name": "L3"
				},
				{
					"name": "L2"
				},
				{
					"name": "W"
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
					"name": "H5"
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
					"name": "H2"
				},
				{
					"name": "L2"
				},
				{
					"name": "H3"
				},
				{
					"name": "S"
				},
				{
					"name": "H4"
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
				}
			]
		],
		"freegame": [
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
					"name": "H1"
				},
				{
					"name": "L2"
				},
				{
					"name": "S"
				},
				{
					"name": "H2"
				},
				{
					"name": "L1"
				},
				{
					"name": "H3"
				},
				{
					"name": "H5"
				},
				{
					"name": "W"
				},
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
					"name": "H3"
				},
				{
					"name": "L4"
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
					"name": "L2"
				},
				{
					"name": "W"
				},
				{
					"name": "H5"
				},
				{
					"name": "H1"
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
					"name": "H5"
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
					"name": "H3"
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
					"name": "L4"
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
					"name": "H4"
				},
				{
					"name": "H5"
				},
				{
					"name": "H2"
				},
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
					"name": "L2"
				},
				{
					"name": "W"
				},
				{
					"name": "L2"
				},
				{
					"name": "L3"
				},
				{
					"name": "H2"
				},
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
					"name": "H2"
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
					"name": "L2"
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
					"name": "H4"
				},
				{
					"name": "H1"
				},
				{
					"name": "W"
				},
				{
					"name": "H2"
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
					"name": "L1"
				},
				{
					"name": "L4"
				},
				{
					"name": "H3"
				},
				{
					"name": "H2"
				},
				{
					"name": "L4"
				},
				{
					"name": "H3"
				},
				{
					"name": "H4"
				},
				{
					"name": "H5"
				},
				{
					"name": "H4"
				},
				{
					"name": "L3"
				},
				{
					"name": "H2"
				},
				{
					"name": "W"
				},
				{
					"name": "H2"
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
					"name": "H1"
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
					"name": "H5"
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
					"name": "L1"
				},
				{
					"name": "H1"
				},
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
					"name": "L4"
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
					"name": "L4"
				},
				{
					"name": "W"
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
					"name": "L1"
				},
				{
					"name": "H1"
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
					"name": "L2"
				},
				{
					"name": "L3"
				},
				{
					"name": "S"
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
					"name": "L1"
				},
				{
					"name": "H1"
				},
				{
					"name": "H5"
				},
				{
					"name": "L2"
				},
				{
					"name": "W"
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
					"name": "H2"
				},
				{
					"name": "H5"
				},
				{
					"name": "H1"
				},
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
					"name": "L3"
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
				},
				{
					"name": "H1"
				},
				{
					"name": "H4"
				},
				{
					"name": "W"
				},
				{
					"name": "H5"
				},
				{
					"name": "L3"
				},
				{
					"name": "H2"
				},
				{
					"name": "W"
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
					"name": "L4"
				},
				{
					"name": "H3"
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
				},
				{
					"name": "L4"
				},
				{
					"name": "H2"
				},
				{
					"name": "C"
				},
				{
					"name": "L3"
				},
				{
					"name": "H2"
				},
				{
					"name": "H1"
				},
				{
					"name": "H2"
				},
				{
					"name": "H3"
				},
				{
					"name": "H4"
				},
				{
					"name": "S"
				},
				{
					"name": "L1"
				},
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
					"name": "L2"
				},
				{
					"name": "L4"
				},
				{
					"name": "W"
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
					"name": "H5"
				},
				{
					"name": "C"
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
					"name": "S"
				},
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
					"name": "H3"
				},
				{
					"name": "L3"
				},
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
					"name": "H5"
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
					"name": "L1"
				},
				{
					"name": "H4"
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
					"name": "H2"
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
					"name": "H2"
				},
				{
					"name": "L4"
				},
				{
					"name": "L3"
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
					"name": "W"
				},
				{
					"name": "H1"
				},
				{
					"name": "L2"
				},
				{
					"name": "W"
				},
				{
					"name": "H1"
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
					"name": "H2"
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
					"name": "L1"
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
					"name": "L2"
				},
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
					"name": "W"
				},
				{
					"name": "H3"
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
					"name": "H5"
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
					"name": "W"
				},
				{
					"name": "L2"
				},
				{
					"name": "L1"
				},
				{
					"name": "H1"
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
					"name": "H1"
				},
				{
					"name": "L1"
				},
				{
					"name": "H1"
				},
				{
					"name": "H2"
				},
				{
					"name": "L4"
				},
				{
					"name": "H5"
				},
				{
					"name": "H1"
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
					"name": "L4"
				},
				{
					"name": "H2"
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
					"name": "W"
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
					"name": "W"
				},
				{
					"name": "S"
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
					"name": "L4"
				},
				{
					"name": "L2"
				},
				{
					"name": "H2"
				}
			]
		]
	}
} as const;
